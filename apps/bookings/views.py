from datetime import datetime, timedelta

from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from django.utils import timezone

from .models import Booking, CelebrationBooking
from .serializers import BookingSerializer, CelebrationBookingSerializer
from apps.notifications.models import Notification
from apps.notifications.views import send_notification_email


class BookingListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Booking.objects.filter(user=self.request.user)
            .order_by("-created_at")
            .select_related("user")
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            booking = serializer.save()
        except DjangoValidationError as e:
            raise ValidationError(e.message_dict if hasattr(e, 'message_dict') else {"detail": str(e)})
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class BookingDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

    def patch(self, request, *args, **kwargs):
        booking = self.get_object()

        if set(request.data.keys()) != {"booking_status"}:
            raise PermissionDenied("Only the 'booking_status' field may be modified.")

        new_status = request.data.get("booking_status")
        if new_status != Booking.BookingStatus.CANCELLED:
            raise PermissionDenied("You may only set 'booking_status' to CANCELLED.")

        booking.booking_status = Booking.BookingStatus.CANCELLED
        booking.save()

        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    def delete(self, request, *args, **kwargs):
        booking = self.get_object()
        if booking.booking_status != Booking.BookingStatus.CANCELLED:
            raise ValidationError("Only bookings with status CANCELLED may be deleted.")
        return super().delete(request, *args, **kwargs)


class BookingApproveAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, id):
        booking = get_object_or_404(Booking, id=id)

        if booking.booking_status != Booking.BookingStatus.PENDING:
            raise ValidationError("Only pending bookings can be approved.")

        booking.booking_status = Booking.BookingStatus.APPROVED
        booking.approved_at = timezone.now()
        booking.save(update_fields=['booking_status', 'approved_at'])
    

        title = "Your Booking Has Been Approved!"
        message = (
            f"Great news! Your theater booking for '{booking.movie_name}' on "
            f"{booking.booking_date} ({booking.start_time.strftime('%I:%M %p')} - "
            f"{booking.end_time.strftime('%I:%M %p')}) has been approved. Please log in "
            f"to pay the advance amount of ₹{booking.advance_amount} to confirm your slot."
        )
        notification = Notification.objects.create(
            user=booking.user, title=title, message=message,
            notification_type=Notification.NotificationType.BOOKING,
        )
        send_notification_email(booking.user.email, title, message, notification)

        return Response({
            "message": "Booking approved successfully.",
            "booking": BookingSerializer(booking).data,
        })


class BookingRejectAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, id):
        booking = get_object_or_404(Booking, id=id)

        if booking.booking_status != Booking.BookingStatus.PENDING:
            raise ValidationError("Only pending bookings can be rejected.")

        booking.booking_status = Booking.BookingStatus.REJECTED
        booking.save()

        title = "Booking Request Update"
        message = (
            f"We're sorry, but your theater booking request for "
            f"'{booking.movie_name}' on {booking.booking_date} could not be "
            f"approved at this time. Please try a different date or time."
        )
        notification = Notification.objects.create(
            user=booking.user, title=title, message=message,
            notification_type=Notification.NotificationType.BOOKING,
        )
        send_notification_email(booking.user.email, title, message, notification)

        return Response({
            "message": "Booking rejected successfully.",
            "booking": BookingSerializer(booking).data,
        })
class ExpireUnpaidBookingsAPIView(APIView):
    """
    POST /bookings/admin/expire-unpaid/
    Admin only — cancels approved bookings where payment window has passed.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        cutoff = timezone.now() - timedelta(hours=Booking.ADVANCE_PAYMENT_WINDOW_HOURS)

        expired = list(
            Booking.objects.select_related('user').filter(
                booking_status=Booking.BookingStatus.APPROVED,
                approved_at__lte=cutoff,
            )
        )

        for booking in expired:
            booking.booking_status = Booking.BookingStatus.CANCELLED
            booking.save(update_fields=['booking_status'])

            title = "Booking Expired"
            message = (
                f"Your booking for '{booking.movie_name}' on {booking.booking_date} "
                f"has been cancelled because the advance payment was not made within "
                f"{Booking.ADVANCE_PAYMENT_WINDOW_HOURS} hours of approval."
            )
            notification = Notification.objects.create(
                user=booking.user, title=title, message=message,
                notification_type=Notification.NotificationType.BOOKING,
            )
            send_notification_email(booking.user.email, title, message, notification)

        return Response({
            "detail": f"{len(expired)} unpaid approved booking(s) expired and cancelled."
        })


class BusyTimesAPIView(APIView):
    """
    GET /bookings/busy/?date=YYYY-MM-DD
    Returns existing PENDING/APPROVED/CONFIRMED bookings for a date,
    so the frontend can render a timeline of busy periods.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({"detail": "Query param 'date' is required (YYYY-MM-DD)."}, status=400)

        try:
            query_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=400)

        bookings = Booking.objects.filter(
            booking_date=query_date,
            booking_status__in=[
                Booking.BookingStatus.PENDING,
                Booking.BookingStatus.APPROVED,
                Booking.BookingStatus.CONFIRMED,
            ],
        ).order_by('start_time')

        busy = [
            {"start_time": b.start_time.strftime("%H:%M"), "end_time": b.end_time.strftime("%H:%M")}
            for b in bookings
        ]

        return Response({
            "date": date_str,
            "busy_times": busy,
            "opening_time": Booking.OPENING_TIME.strftime("%H:%M"),
            "closing_time": Booking.CLOSING_TIME.strftime("%H:%M"),
            "min_duration_hours": Booking.MIN_DURATION_HOURS,
            "max_duration_hours": Booking.MAX_DURATION_HOURS,
        })


class AdminBookingListAPIView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = Booking.objects.select_related('user').order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(booking_status=status_filter.upper())
        return qs

class CelebrationBookingListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = CelebrationBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            CelebrationBooking.objects.filter(user=self.request.user)
            .order_by("-created_at")
            .select_related("user")
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            booking = serializer.save()
        except DjangoValidationError as e:
            raise ValidationError(e.message_dict if hasattr(e, 'message_dict') else {"detail": str(e)})
        return Response(CelebrationBookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class CelebrationBookingDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CelebrationBookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return CelebrationBooking.objects.filter(user=self.request.user)

    def patch(self, request, *args, **kwargs):
        booking = self.get_object()

        if set(request.data.keys()) != {"booking_status"}:
            raise PermissionDenied("Only the 'booking_status' field may be modified.")

        new_status = request.data.get("booking_status")
        if new_status != CelebrationBooking.BookingStatus.CANCELLED:
            raise PermissionDenied("You may only set 'booking_status' to CANCELLED.")

        booking.booking_status = CelebrationBooking.BookingStatus.CANCELLED
        booking.save()

        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    def delete(self, request, *args, **kwargs):
        booking = self.get_object()
        if booking.booking_status != CelebrationBooking.BookingStatus.CANCELLED:
            raise ValidationError("Only bookings with status CANCELLED may be deleted.")
        return super().delete(request, *args, **kwargs)


class CelebrationBookingApproveAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, id):
        booking = get_object_or_404(CelebrationBooking, id=id)

        if booking.booking_status != CelebrationBooking.BookingStatus.PENDING:
            raise ValidationError("Only pending bookings can be approved.")

        booking.booking_status = CelebrationBooking.BookingStatus.APPROVED
        booking.approved_at = timezone.now()
        booking.save(update_fields=['booking_status', 'approved_at'])

        title = "Your Celebration Booking Has Been Approved!"
        message = (
            f"Great news! Your {booking.package_type.title()} package booking for "
            f"'{booking.occasion_name}' on {booking.event_date} has been approved. "
            f"Please log in to pay the advance amount of ₹{booking.advance_amount} to confirm."
        )
        notification = Notification.objects.create(
            user=booking.user, title=title, message=message,
            notification_type=Notification.NotificationType.BOOKING,
        )
        send_notification_email(booking.user.email, title, message, notification)

        return Response({
            "message": "Celebration booking approved successfully.",
            "booking": CelebrationBookingSerializer(booking).data,
        })


class CelebrationBookingRejectAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, id):
        booking = get_object_or_404(CelebrationBooking, id=id)

        if booking.booking_status != CelebrationBooking.BookingStatus.PENDING:
            raise ValidationError("Only pending bookings can be rejected.")

        booking.booking_status = CelebrationBooking.BookingStatus.REJECTED
        booking.save()

        title = "Celebration Booking Update"
        message = (
            f"We're sorry, but your celebration booking request for "
            f"'{booking.occasion_name}' on {booking.event_date} could not be "
            f"approved at this time. Please try a different date."
        )
        notification = Notification.objects.create(
            user=booking.user, title=title, message=message,
            notification_type=Notification.NotificationType.BOOKING,
        )
        send_notification_email(booking.user.email, title, message, notification)

        return Response({
            "message": "Celebration booking rejected successfully.",
            "booking": CelebrationBookingSerializer(booking).data,
        })


class AdminCelebrationBookingListAPIView(generics.ListAPIView):
    serializer_class = CelebrationBookingSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = CelebrationBooking.objects.select_related('user').order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(booking_status=status_filter.upper())
        return qs