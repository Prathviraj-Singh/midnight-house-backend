import uuid
from django.conf import settings
from django.db import models


class Notification(models.Model):
    """A notification to be sent to a user."""

    class NotificationType(models.TextChoices):
        BOOKING = "BOOKING", "Booking"
        ORDER = "ORDER", "Order"
        OFFER = "OFFER", "Offer"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the notification.",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        help_text="Recipient of the notification.",
    )
    title = models.CharField(
        max_length=255,
        help_text="Short title of the notification.",
    )
    message = models.TextField(
        help_text="Full message body of the notification.",
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        help_text="Category of the notification.",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        help_text="Delivery status of the notification.",
    )
    is_read = models.BooleanField(
        default=False,
        help_text="Whether the user has read the notification.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the notification was created.",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the notification was last updated.",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"[{self.notification_type}] {self.title} → {self.user}"
