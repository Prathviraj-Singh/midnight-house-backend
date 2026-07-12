from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for the Review model.

    * `user` is set automatically from the request and is read‑only.
    * `is_approved` is read‑only; can be toggled in admin.
    * `rating` is validated to be between 1 and 5.
    """

    rating = serializers.IntegerField(min_value=1, max_value=5)
    user_name = serializers.SerializerMethodField()
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "user",
            "user_name",
            "menu_item",
            "menu_item_name",
            "rating",
            "comment",
            "is_approved",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "user_name",
            "menu_item_name",
            "is_approved",
            "created_at",
            "updated_at",
        ]

    def get_user_name(self, obj):
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name or obj.user.email