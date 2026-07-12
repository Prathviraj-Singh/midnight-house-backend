import uuid
from django.core.exceptions import ValidationError
from django.db import models


class Offer(models.Model):

    class AppliesTo(models.TextChoices):
        DINE_IN = 'DINE_IN', 'Dine In'
        THEATER = 'THEATER', 'Theater Booking'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    applies_to = models.CharField(
        max_length=10,
        choices=AppliesTo.choices,
        help_text="Whether this offer applies to dine-in orders or theater bookings."
    )
    discount_percentage = models.PositiveIntegerField(
        help_text="Percentage discount (1-100)."
    )
    coupon_code = models.CharField(
        max_length=50,
        unique=True,
        help_text="Coupon code user enters at checkout."
    )
    valid_from = models.DateField()
    valid_until = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def clean(self):
        errors = {}
        if self.valid_until and self.valid_from and self.valid_until < self.valid_from:
            errors["valid_until"] = "valid_until cannot be earlier than valid_from."
        if self.discount_percentage is not None:
            if self.discount_percentage > 100 or self.discount_percentage < 1:
                errors["discount_percentage"] = "Must be between 1 and 100."
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.get_applies_to_display()}) — {self.discount_percentage}%"