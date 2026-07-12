from __future__ import annotations

import hashlib
import hmac

import razorpay
from django.conf import settings
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.cart.models import Cart

from apps.notifications.models import Notification
from apps.notifications.views import send_notification_email

from .models import Payment
from .serializers import PaymentSerializer

# --------------------------------------------------------------------------- #
#  Razorpay client (initialised once at module load)
# --------------------------------------------------------------------------- #
razorpay_client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)


# --------------------------------------------------------------------------- #
#  Existing list / detail views  (preserved as-is)
# --------------------------------------------------------------------------- #

class PaymentListView(generics.ListAPIView):
    """GET /payments/ — list all payments belonging to the authenticated user."""

    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user).order_by("-created_at")


class PaymentDetailView(generics.RetrieveAPIView):
    """GET /payments/<id>/ — retrieve a single payment."""

    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)


# --------------------------------------------------------------------------- #
#  POST /payments/create-order/
# --------------------------------------------------------------------------- #

class CreateRazorpayOrderView(APIView):
    """
    Create a Razorpay order and a local Payment record in PENDING state.

    Request body
    ------------
    payment_for   : "ORDER" | "BOOKING"
    payment_type  : "FULL" | "ADVANCE" | "REMAINING" | "REFUND"
    payment_method: "UPI" | "CARD" | "CASH"
    amount        : decimal  (in rupees – we convert to paise for Razorpay)
    order         : <uuid>   (required when payment_for == "ORDER")
    booking       : <uuid>   (required when payment_for == "BOOKING")

    Response
    --------
    razorpay_order_id, amount, currency, key, payment_id
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = PaymentSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated = serializer.validated_data
        payment_for = validated["payment_for"]
        amount_rupees = validated["amount"]

        # Validate linked object belongs to the requesting user
        if payment_for == Payment.PaymentFor.BOOKING:
            booking = validated.get("booking")
            if booking.user != request.user:
                return Response(
                    {"detail": "Booking does not belong to you."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if booking.booking_status != "APPROVED":
                return Response(
                    {"detail": "Booking must be APPROVED before payment."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        elif payment_for == Payment.PaymentFor.ORDER:
            order = validated.get("order")
            if order.user != request.user:
                return Response(
                    {"detail": "Order does not belong to you."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if order.status != "PENDING":
                return Response(
                    {"detail": "Order must be PENDING before payment."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        elif payment_for == Payment.PaymentFor.CELEBRATION:
            celebration_booking = validated.get("celebration_booking")
            if celebration_booking.user != request.user:
                return Response(
                        {"detail": "Celebration booking does not belong to you."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            if celebration_booking.booking_status != "APPROVED":
                return Response(
                    {"detail": "Celebration booking must be APPROVED before payment."},
                    status=status.HTTP_400_BAD_REQUEST,
                    )

        # Create Razorpay order (amount in paise)
        amount_paise = int(amount_rupees * 100)
        try:
            rzp_order = razorpay_client.order.create(
                {
                    "amount": amount_paise,
                    "currency": "INR",
                    "payment_capture": 1,
                }
            )
        except Exception as exc:
            return Response(
                {"detail": f"Razorpay error: {str(exc)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Persist local Payment record
        with transaction.atomic():
            payment = serializer.save(
                user=request.user,
                razorpay_order_id=rzp_order["id"],
                status=Payment.Status.PENDING,
            )

        return Response(
            {
                "payment_id": str(payment.id),
                "razorpay_order_id": rzp_order["id"],
                "amount": amount_paise,
                "currency": "INR",
                "key": settings.RAZORPAY_KEY_ID,
            },
            status=status.HTTP_201_CREATED,
        )


# --------------------------------------------------------------------------- #
#  POST /payments/verify/
# --------------------------------------------------------------------------- #

class VerifyRazorpayPaymentView(APIView):
    """
    Verify a Razorpay payment signature.

    On success
    ----------
    * Payment.status → SUCCESS
    * razorpay_payment_id / razorpay_signature stored
    * If payment_for == BOOKING → Booking.booking_status = CONFIRMED
    * If payment_for == ORDER   → Order.status = CONFIRMED
    * Notification created for the user

    Request body
    ------------
    payment_id          : <local Payment UUID>
    razorpay_order_id   : str
    razorpay_payment_id : str
    razorpay_signature  : str
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        payment_id = request.data.get("payment_id")
        rzp_order_id = request.data.get("razorpay_order_id")
        rzp_payment_id = request.data.get("razorpay_payment_id")
        rzp_signature = request.data.get("razorpay_signature")

        if not all([payment_id, rzp_order_id, rzp_payment_id, rzp_signature]):
            return Response(
                {"detail": "payment_id, razorpay_order_id, razorpay_payment_id and razorpay_signature are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Fetch local payment
        try:
            payment = Payment.objects.select_related("booking", "order").get(
                id=payment_id, user=request.user
            )
        except Payment.DoesNotExist:
            return Response(
                {"detail": "Payment not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if payment.status == Payment.Status.SUCCESS:
            return Response(
                {"detail": "Payment already verified."}, status=status.HTTP_200_OK
            )

        # Verify signature
        expected_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            f"{rzp_order_id}|{rzp_payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, rzp_signature):
            with transaction.atomic():
                payment.status = Payment.Status.FAILED
                payment.save(update_fields=["status", "updated_at"])

                title = "Payment Failed"
                message = (
                    "Your payment could not be verified. If any amount was deducted, "
                    "it will be refunded automatically. Please try again or contact support."
                )
                notification = Notification.objects.create(
                    user=request.user, title=title, message=message,
                    notification_type=Notification.NotificationType.ORDER,
                )
                send_notification_email(request.user.email, title, message, notification)

            return Response(
                {"detail": "Payment verification failed. Invalid signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Signature valid — update records atomically
        with transaction.atomic():
            payment.razorpay_payment_id = rzp_payment_id
            payment.razorpay_signature = rzp_signature
            payment.status = Payment.Status.SUCCESS
            payment.save(
                update_fields=[
                    "razorpay_payment_id",
                    "razorpay_signature",
                    "status",
                    "updated_at",
                ]
            )

            notification_title = ""
            notification_message = ""
            notification_type = ""

            if payment.payment_for == Payment.PaymentFor.BOOKING:
                booking = payment.booking
                booking.booking_status = booking.BookingStatus.CONFIRMED
                booking.save(update_fields=["booking_status", "updated_at"])
                notification_title = "Booking Confirmed"
                notification_message = "Your booking has been confirmed successfully."
                notification_type = Notification.NotificationType.BOOKING

            elif payment.payment_for == Payment.PaymentFor.ORDER:
                order = payment.order
                order.status = order.Status.CONFIRMED
                order.save(update_fields=["status", "updated_at"])
                order.user.cart.items.all().delete()
                notification_title = "Order Confirmed"
                notification_message = "Your order payment was successful."
                notification_type = Notification.NotificationType.ORDER
            elif payment.payment_for == Payment.PaymentFor.CELEBRATION:
                celebration_booking = payment.celebration_booking
                celebration_booking.booking_status = celebration_booking.BookingStatus.CONFIRMED
                celebration_booking.save(update_fields=["booking_status", "updated_at"])
                notification_title = "Celebration Booking Confirmed"
                notification_message = "Your celebration booking has been confirmed successfully."
                notification_type = Notification.NotificationType.BOOKING

                

            # Create notification
            notification = Notification.objects.create(
                user=request.user,
                title=notification_title,
                message=notification_message,
                notification_type=notification_type,
            )
            send_notification_email(request.user.email, notification_title, notification_message, notification)

        return Response(
            {
                "detail": "Payment verified successfully.",
                "payment_id": str(payment.id),
                "status": payment.status,
            },
            status=status.HTTP_200_OK,
        )