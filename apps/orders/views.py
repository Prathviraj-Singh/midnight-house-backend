from decimal import Decimal

from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from apps.cart.models import Cart
from apps.notifications.models import Notification
from apps.notifications.views import send_notification_email
from apps.offers.models import Offer
from .models import Order, OrderItem
from .serializers import OrderSerializer
from .utils import distance_from_cafe_km, MAX_DELIVERY_RADIUS_KM


class OrderListAPIView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items')


class OrderDetailAPIView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items')


class CreateOrderFromCartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)

        if not cart.items.exists():
            return Response({"detail": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        delivery_type = request.data.get("delivery_type", Order.DeliveryType.DINE_IN)
        if delivery_type not in (Order.DeliveryType.DINE_IN, Order.DeliveryType.DELIVERY):
            return Response({"detail": "Invalid delivery_type."}, status=status.HTTP_400_BAD_REQUEST)

        delivery_address = ""
        delivery_lat = None
        delivery_lng = None
        distance_km = None

        if delivery_type == Order.DeliveryType.DELIVERY:
            delivery_address = request.data.get("delivery_address", "").strip()
            lat_raw = request.data.get("delivery_latitude")
            lng_raw = request.data.get("delivery_longitude")

            if not delivery_address or lat_raw is None or lng_raw is None:
                return Response(
                    {"detail": "delivery_address, delivery_latitude and delivery_longitude are required for delivery orders."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                delivery_lat = float(lat_raw)
                delivery_lng = float(lng_raw)
            except (TypeError, ValueError):
                return Response({"detail": "Invalid coordinates."}, status=status.HTTP_400_BAD_REQUEST)

            distance_km = round(distance_from_cafe_km(delivery_lat, delivery_lng), 2)

            if distance_km > MAX_DELIVERY_RADIUS_KM:
                return Response(
                    {"detail": f"Sorry, delivery is only available within {MAX_DELIVERY_RADIUS_KM} KM. Your location is {distance_km} KM away."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # --------------------------------------------------------------- #
        # Coupon validation (DINE_IN only — no DELIVERY offers)
        # --------------------------------------------------------------- #
        coupon_code = request.data.get("coupon_code", "").strip().upper()
        offer = None

        if coupon_code:
            if delivery_type != Order.DeliveryType.DINE_IN:
                return Response(
                    {"detail": "Coupons are only valid for Dine In orders."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            from datetime import date
            today = date.today()
            try:
                offer = Offer.objects.get(
                    coupon_code__iexact=coupon_code,
                    applies_to=Offer.AppliesTo.DINE_IN,
                    is_active=True,
                    valid_from__lte=today,
                    valid_until__gte=today,
                )
            except Offer.DoesNotExist:
                return Response(
                    {"detail": "Invalid or expired coupon code."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        subtotal = Decimal("0.00")

        order = Order.objects.create(
            user=request.user,
            notes=request.data.get("notes", ""),
            delivery_type=delivery_type,
            delivery_address=delivery_address,
            delivery_latitude=delivery_lat,
            delivery_longitude=delivery_lng,
            distance_km=distance_km,
        )

        for cart_item in cart.items.select_related("menu_item"):
            line_total = cart_item.menu_item.price * cart_item.quantity
            subtotal += line_total

            OrderItem.objects.create(
                order=order,
                menu_item=cart_item.menu_item,
                quantity=cart_item.quantity,
                price_at_purchase=cart_item.menu_item.price,
            )

        tax_amount = subtotal * Decimal("0.05")
        pre_discount_total = subtotal + tax_amount

        discount_amount = Decimal("0.00")
        if offer:
            discount_amount = (pre_discount_total * Decimal(offer.discount_percentage) / Decimal("100")).quantize(Decimal("0.01"))

        total_amount = pre_discount_total - discount_amount

        order.subtotal = subtotal
        order.tax_amount = tax_amount
        order.coupon_code = coupon_code if offer else None
        order.discount_amount = discount_amount
        order.total_amount = total_amount
        order.save()

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminOrderListAPIView(generics.ListAPIView):
    """
    GET /orders/admin/all/
    Admin only — all confirmed+ orders for kitchen board.
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return (
            Order.objects.exclude(status=Order.Status.PENDING)
            .exclude(status=Order.Status.CANCELLED)
            .prefetch_related('items')
            .select_related('user')
            .order_by('created_at')
        )


class AdminOrderStatusUpdateAPIView(APIView):
    """
    PATCH /orders/admin/<id>/status/
    Admin only — move order through kitchen pipeline.
    """
    permission_classes = [IsAdminUser]

    ALLOWED_TRANSITIONS = {
        Order.Status.CONFIRMED: [Order.Status.PREPARING, Order.Status.CANCELLED],
        Order.Status.PREPARING: [Order.Status.READY, Order.Status.CANCELLED],
        Order.Status.READY: [Order.Status.COMPLETED],
    }

    STATUS_MESSAGES = {
        Order.Status.PREPARING: (
            "Your Order is Being Prepared",
            "Good news! Our kitchen has started preparing your order.",
        ),
        Order.Status.READY: (
            "Your Order is Ready!",
            "Your order is ready for pickup/serving. Please collect it at your earliest convenience.",
        ),
        Order.Status.COMPLETED: (
            "Order Completed",
            "Your order has been completed. Thank you for choosing Midnight House!",
        ),
        Order.Status.CANCELLED: (
            "Order Cancelled",
            "We're sorry, but your order has been cancelled. Please contact us if you have questions.",
        ),
    }

    def patch(self, request, id):
        order = get_object_or_404(Order, id=id)
        new_status = request.data.get('status')

        if new_status not in Order.Status.values:
            raise ValidationError({"detail": "Invalid status value."})

        allowed = self.ALLOWED_TRANSITIONS.get(order.status, [])
        if new_status not in allowed:
            raise ValidationError({
                "detail": f"Cannot move order from {order.status} to {new_status}."
            })

        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])

        title, message = self.STATUS_MESSAGES.get(
            new_status,
            ("Order Update", f"Your order status is now {new_status}."),
        )
        notification = Notification.objects.create(
            user=order.user, title=title, message=message,
            notification_type=Notification.NotificationType.ORDER,
        )
        send_notification_email(order.user.email, title, message, notification)

        return Response(OrderSerializer(order).data)