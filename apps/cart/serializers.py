from rest_framework import serializers
from .models import Cart, CartItem
from apps.catalog.models import MenuItem


class CartItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    menu_item = serializers.PrimaryKeyRelatedField(queryset=MenuItem.objects.all())

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError(
                "Quantity must be at least 1."
            )
        return value

    class Meta:
        model = CartItem
        fields = ['id', 'menu_item', 'quantity', 'added_at', 'line_total']
        read_only_fields = ['id', 'added_at', 'line_total']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'created_at', 'updated_at', 'items', 'subtotal']
        read_only_fields = ['id', 'created_at', 'updated_at', 'items', 'subtotal']
