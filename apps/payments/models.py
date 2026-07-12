from __future__ import annotations

import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Payment(models.Model):

    class PaymentMethod(models.TextChoices):
        UPI = "UPI", "UPI"
        CARD = "CARD", "Card"
        CASH = "CASH", "Cash"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    class PaymentFor(models.TextChoices):
        BOOKING = "BOOKING", "Booking"
        ORDER = "ORDER", "Order"
        CELEBRATION = "CELEBRATION", "Celebration"

    class PaymentType(models.TextChoices):
        ADVANCE = "ADVANCE", "Advance"
        REMAINING = "REMAINING", "Remaining"
        FULL = "FULL", "Full"
        REFUND = "REFUND", "Refund"

    # ------------------------------------------------------------------ #
    #  Primary key
    # ------------------------------------------------------------------ #
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    # ------------------------------------------------------------------ #
    #  Ownership
    # ------------------------------------------------------------------ #
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments",
    )

    # ------------------------------------------------------------------ #
    #  Payment context
    # ------------------------------------------------------------------ #
    payment_for = models.CharField(
        max_length=15,
        choices=PaymentFor.choices,
    )

    payment_type = models.CharField(
        max_length=15,
        choices=PaymentType.choices,
    )

    # ------------------------------------------------------------------ #
    #  Related objects (mutually exclusive; only one should be set)
    # ------------------------------------------------------------------ #
    booking = models.ForeignKey(
        "bookings.Booking",
        on_delete=models.CASCADE,
        related_name="payments",
        null=True,
        blank=True,
    )

    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.CASCADE,
        related_name="payments",
        null=True,
        blank=True,
    )

    celebration_booking = models.ForeignKey(
        "bookings.CelebrationBooking",
        on_delete=models.CASCADE,
        related_name="payments",
        null=True,
        blank=True,
    )

    # ------------------------------------------------------------------ #
    #  Payment details
    # ------------------------------------------------------------------ #
    payment_method = models.CharField(
        max_length=10,
        choices=PaymentMethod.choices,
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    transaction_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
    )

    # ------------------------------------------------------------------ #
    #  Razorpay fields
    # ------------------------------------------------------------------ #
    razorpay_order_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_index=True,
    )

    razorpay_payment_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    razorpay_signature = models.TextField(
        null=True,
        blank=True,
    )

    # ------------------------------------------------------------------ #
    #  Status & timestamps
    # ------------------------------------------------------------------ #
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ------------------------------------------------------------------ #
    #  Meta
    # ------------------------------------------------------------------ #
    class Meta:
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user"], name="payment_user_idx"),
            models.Index(fields=["status"], name="payment_status_idx"),
            models.Index(fields=["payment_for"], name="payment_for_idx"),
            models.Index(fields=["razorpay_order_id"], name="payment_rzp_order_idx"),
        ]

    # ------------------------------------------------------------------ #
    #  Validation
    # ------------------------------------------------------------------ #
    def clean(self) -> None:
        super().clean()

        if self.payment_for == self.PaymentFor.BOOKING:
            if not self.booking_id:
                raise ValidationError(
                    {"booking": "A booking is required when payment_for is BOOKING."}
                )
            if self.order_id or self.celebration_booking_id:
                raise ValidationError(
                    {"order": "Order and celebration_booking must be empty when payment_for is BOOKING."}
                )

        elif self.payment_for == self.PaymentFor.ORDER:
            if not self.order_id:
                raise ValidationError(
                    {"order": "An order is required when payment_for is ORDER."}
                )
            if self.booking_id or self.celebration_booking_id:
                raise ValidationError(
                    {"booking": "Booking and celebration_booking must be empty when payment_for is ORDER."}
                )

        elif self.payment_for == self.PaymentFor.CELEBRATION:
            if not self.celebration_booking_id:
                raise ValidationError(
                    {"celebration_booking": "A celebration_booking is required when payment_for is CELEBRATION."}
                )
            if self.booking_id or self.order_id:
                raise ValidationError(
                    {"booking": "Booking and order must be empty when payment_for is CELEBRATION."}
                )

    def save(self, *args, **kwargs) -> None:
        self.full_clean()
        super().save(*args, **kwargs)

    # ------------------------------------------------------------------ #
    #  String representation
    # ------------------------------------------------------------------ #
    def __str__(self) -> str:
        if self.payment_for == self.PaymentFor.BOOKING:
            ref = str(self.booking_id)
        elif self.payment_for == self.PaymentFor.CELEBRATION:
            ref = str(self.celebration_booking_id)
        else:
            ref = str(self.order_id)
        return (
            f"Payment [{self.payment_for}] – {self.payment_type} – "
            f"₹{self.amount} – {self.status} (ref: {ref})"
        )
