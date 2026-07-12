import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils import timezone


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        PREPARING = 'PREPARING', 'Preparing'
        READY = 'READY', 'Ready'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=32, unique=True, editable=False)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    coupon_code = models.CharField(max_length=32, blank=True, null=True)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    notes = models.TextField(blank=True)

    class DeliveryType(models.TextChoices):
        DINE_IN = 'DINE_IN', 'Dine In'
        DELIVERY = 'DELIVERY', 'Delivery'

    delivery_type = models.CharField(max_length=10, choices=DeliveryType.choices, default=DeliveryType.DINE_IN)
    delivery_address = models.TextField(blank=True)
    delivery_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    delivery_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    distance_km = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate a short unique string
            self.order_number = uuid.uuid4().hex.upper()[:12]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.order_number} by {self.user}"


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    menu_item = models.ForeignKey('catalog.MenuItem', on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    price_at_purchase = models.DecimalField(max_digits=12, decimal_places=2)
    added_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('order', 'menu_item')
        ordering = ['-added_at']

    @property
    def line_total(self) -> Decimal:
        """Total price for this line (price_at_purchase * quantity)."""
        return self.price_at_purchase * self.quantity

    def __str__(self):
        return f"{self.quantity}× {self.menu_item.name} in order {self.order.order_number}"
