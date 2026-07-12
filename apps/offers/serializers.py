from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import Offer


class OfferSerializer(serializers.ModelSerializer):

    class Meta:
        model = Offer
        fields = [
            "id",
            "title",
            "description",
            "applies_to",
            "discount_percentage",
            "coupon_code",
            "valid_from",
            "valid_until",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        try:
            instance = Offer(**attrs)
            instance.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(
                exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
            )
        return attrs