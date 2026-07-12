from django.urls import path
from .views import (
    CartDetailView,
    CartItemListCreateView,
    CartItemDetailView,
)

urlpatterns = [
    path('', CartDetailView.as_view(), name='cart-detail'),
    path('items/', CartItemListCreateView.as_view(), name='cart-items'),
    path('items/<uuid:id>/', CartItemDetailView.as_view(), name='cart-item-detail'),
]