import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class Cart(models.Model):
    """A shopping cart belonging to a single user."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Cart'
        verbose_name_plural = 'Carts'
        ordering = ['-created_at']

    def __str__(self):
        return f"Cart of {self.user}"

    @property
    def subtotal(self):
        """Calculate the cart subtotal from all items.

        Returns:
            Decimal: Sum of (menu_item.price * quantity) for each CartItem.
        """
        return sum(item.line_total for item in self.items.select_related('menu_item').all())


class CartItem(models.Model):
    """An item placed in a Cart, linked to a MenuItem."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(
        Cart,
        related_name='items',
        on_delete=models.CASCADE
    )
    menu_item = models.ForeignKey(
        'catalog.MenuItem',
        related_name='cart_items',
        on_delete=models.PROTECT
    )
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'Cart Item'
        verbose_name_plural = 'Cart Items'
        unique_together = ('cart', 'menu_item')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.quantity}× {self.menu_item.name} in {self.cart.user}" 

    @property
    def line_total(self):
        """Total price for this line (price * quantity)."""
        return self.menu_item.price * self.quantity
