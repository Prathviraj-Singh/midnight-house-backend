"""Admin registration for the Offer model."""

from django.contrib import admin

from .models import Offer


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    """Custom admin UI for offers."""

    list_display = (
        "title",
        "discount_percentage",
        "coupon_code",
        "valid_from",
        "valid_until",
        "is_active",
    )
    list_filter = ("is_active", "valid_from", "valid_until")
    search_fields = ("title", "coupon_code")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")
    
