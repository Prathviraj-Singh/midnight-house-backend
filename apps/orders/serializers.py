from rest_framework import serializers
from .models import Order, OrderItem
from apps.catalog.models import MenuItem


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    menu_item = serializers.PrimaryKeyRelatedField(
        queryset=MenuItem.objects.all()
    )

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'menu_item',
            'quantity',
            'price_at_purchase',
            'added_at',
            'line_total',
        ]
        read_only_fields = [
            'id',
            'added_at',
            'line_total',
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'status',
            'delivery_type', 'delivery_address', 'distance_km',
            'subtotal', 'tax_amount', 'coupon_code', 'discount_amount', 'total_amount', 'notes',
            'created_at', 'updated_at', 'items',
        ]
        read_only_fields = [
            'id', 'order_number', 'user', 'status',
            'distance_km', 'subtotal', 'tax_amount', 'coupon_code', 'discount_amount', 'total_amount',
            'created_at', 'updated_at', 'items',
        ]