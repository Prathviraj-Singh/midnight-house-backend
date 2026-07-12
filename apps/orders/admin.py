from django.contrib import admin
from .models import Order, OrderItem


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'order_number',
        'user',
        'status',
        'total_amount',
        'created_at',
    )

    list_filter = (
        'status',
        'created_at',
    )

    search_fields = (
        'order_number',
        'user__email',
    )

    readonly_fields = (
        'order_number',
        'created_at',
        'updated_at',
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        'order',
        'menu_item',
        'quantity',
        'price_at_purchase',
    )

    search_fields = (
        'order__order_number',
        'menu_item__name',
    )