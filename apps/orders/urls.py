from django.urls import path
from .views import (
    OrderListAPIView,
    OrderDetailAPIView,
    CreateOrderFromCartAPIView,
    AdminOrderListAPIView,
    AdminOrderStatusUpdateAPIView,
)

urlpatterns = [
    path('', OrderListAPIView.as_view(), name='order-list'),
    path('create-from-cart/', CreateOrderFromCartAPIView.as_view(), name='create-order-from-cart'),
    path('admin/all/', AdminOrderListAPIView.as_view(), name='order-admin-list'),
    path('admin/<uuid:id>/status/', AdminOrderStatusUpdateAPIView.as_view(), name='order-admin-status'),
    path('<uuid:id>/', OrderDetailAPIView.as_view(), name='order-detail'),
]