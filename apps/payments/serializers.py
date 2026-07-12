from __future__ import annotations

from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Payment
        fields = [
            "id",
            "user",
            "payment_for",
            "payment_type",
            "booking",
            "order",
            "celebration_booking",
            "payment_method",
            "amount",
            "transaction_id",
            "razorpay_order_id",
            "razorpay_payment_id",
            "razorpay_signature",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "status",
            "transaction_id",
            "razorpay_order_id",
            "razorpay_payment_id",
            "razorpay_signature",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs: dict) -> dict:
        payment_for = attrs.get("payment_for") or (
            self.instance.payment_for if self.instance else None
        )
        booking = attrs.get("booking") or (
            self.instance.booking if self.instance else None
        )
        order = attrs.get("order") or (
            self.instance.order if self.instance else None
        )
        celebration_booking = attrs.get("celebration_booking") or (
            self.instance.celebration_booking if self.instance else None
        )

        if payment_for == Payment.PaymentFor.BOOKING:
            if not booking:
                raise serializers.ValidationError(
                    {"booking": "A booking is required when payment_for is BOOKING."}
                )
            if order or celebration_booking:
                raise serializers.ValidationError(
                    {"order": "Order and celebration_booking must be empty when payment_for is BOOKING."}
                )

        elif payment_for == Payment.PaymentFor.ORDER:
            if not order:
                raise serializers.ValidationError(
                    {"order": "An order is required when payment_for is ORDER."}
                )
            if booking or celebration_booking:
                raise serializers.ValidationError(
                    {"booking": "Booking and celebration_booking must be empty when payment_for is ORDER."}
                )

        elif payment_for == Payment.PaymentFor.CELEBRATION:
            if not celebration_booking:
                raise serializers.ValidationError(
                    {"celebration_booking": "A celebration_booking is required when payment_for is CELEBRATION."}
                )
            if booking or order:
                raise serializers.ValidationError(
                    {"booking": "Booking and order must be empty when payment_for is CELEBRATION."}
                )

        return attrs