from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "title",
            "message",
            "notification_type",
            "status",
            "is_read",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "user", "status", "created_at", "updated_at")
