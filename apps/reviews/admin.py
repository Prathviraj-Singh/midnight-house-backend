from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Admin interface for the Review model."""

    list_display = (
        "id",
        "user",
        "menu_item",
        "rating",
        "is_approved",
        "created_at",
    )
    list_filter = (
        "is_approved",
        "rating",
        "created_at",
    )
    search_fields = (
        "user__email",
        "menu_item__name",
        "comment",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)
