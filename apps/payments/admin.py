from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "payment_for",
        "payment_type",
        "status",
        "amount",
        "razorpay_order_id",
        "razorpay_payment_id",
        "created_at",
    )
    list_filter = (
        "status",
        "payment_for",
        "payment_type",
        "payment_method",
        "created_at",
    )
    search_fields = (
        "user__email",
        "razorpay_order_id",
        "razorpay_payment_id",
        "transaction_id",
    )
    readonly_fields = (
        "id",
        "razorpay_order_id",
        "razorpay_payment_id",
        "razorpay_signature",
        "created_at",
        "updated_at",
    )
    ordering = ("-created_at",)
    date_hierarchy = "created_at"
