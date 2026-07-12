from django.urls import path
from .views import (
    CategoryListCreateAPIView,
    CategoryDetailAPIView,
    MenuItemListCreateAPIView,
    MenuItemDetailAPIView,
)

urlpatterns = [
    path('categories/', CategoryListCreateAPIView.as_view(), name='category-list-create'),
    path('categories/<int:id>/', CategoryDetailAPIView.as_view(), name='category-detail'),
    path('menu-items/', MenuItemListCreateAPIView.as_view(), name='menuitem-list-create'),
    path('menu-items/<uuid:id>/', MenuItemDetailAPIView.as_view(), name='menuitem-detail'),
]