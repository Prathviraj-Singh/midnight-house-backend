from datetime import date

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from apps.notifications.models import Notification
from apps.notifications.views import send_notification_email
from .models import Offer
from .serializers import OfferSerializer

User = get_user_model()


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


def broadcast_offer_notification(offer):
    """Send in-app notification + email to all non-staff users about a newly published offer."""
    title = "New Offer Just Dropped!"
    message = (
        f"'{offer.title}' is now live — get {offer.discount_percentage}% off "
        f"using code {offer.coupon_code}. Valid until {offer.valid_until}."
    )
    customers = User.objects.filter(is_staff=False)
    for customer in customers:
        notification = Notification.objects.create(
            user=customer, title=title, message=message,
            notification_type=Notification.NotificationType.OFFER,
        )
        send_notification_email(customer.email, title, message, notification)


class OfferListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = OfferSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        today = date.today()
        # Admin sees all offers, users see only active ones
        if self.request.user and self.request.user.is_staff:
            return Offer.objects.all()
        return Offer.objects.filter(
            is_active=True,
            valid_from__lte=today,
            valid_until__gte=today,
        )

    def perform_create(self, serializer):
        offer = serializer.save()
        if offer.is_active:
            broadcast_offer_notification(offer)


class OfferDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OfferSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'id'

    def get_queryset(self):
        if self.request.user and self.request.user.is_staff:
            return Offer.objects.all()
        today = date.today()
        return Offer.objects.filter(
            is_active=True,
            valid_from__lte=today,
            valid_until__gte=today,
        )

    def perform_update(self, serializer):
        was_active = serializer.instance.is_active
        offer = serializer.save()
        if not was_active and offer.is_active:
            broadcast_offer_notification(offer)


class ValidateCouponAPIView(APIView):
    """
    POST /offers/validate/
    Body: { "coupon_code": "WEEKEND20", "applies_to": "DINE_IN" or "THEATER" }
    Returns discount percentage if valid, error if not.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('coupon_code', '').strip().upper()
        applies_to = request.data.get('applies_to', '').strip()

        if not code:
            raise ValidationError({"detail": "coupon_code is required."})

        if applies_to not in (Offer.AppliesTo.DINE_IN, Offer.AppliesTo.THEATER):
            raise ValidationError({"detail": "applies_to must be DINE_IN or THEATER."})

        today = date.today()
        try:
            offer = Offer.objects.get(
                coupon_code__iexact=code,
                applies_to=applies_to,
                is_active=True,
                valid_from__lte=today,
                valid_until__gte=today,
            )
        except Offer.DoesNotExist:
            raise ValidationError({"detail": "Invalid or expired coupon code."})

        return Response({
            "valid": True,
            "title": offer.title,
            "discount_percentage": offer.discount_percentage,
            "applies_to": offer.applies_to,
        })