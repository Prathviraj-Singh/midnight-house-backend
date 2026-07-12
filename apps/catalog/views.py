from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Category, SubCategory, MenuItem
from .serializers import CategorySerializer, SubCategorySerializer, MenuItemSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


# ── Categories ────────────────────────────────────────────────────────────────

class CategoryListCreateAPIView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]


class CategoryDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'id'


# ── Menu Items ────────────────────────────────────────────────────────────────

class MenuItemListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = MenuItemSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = MenuItem.objects.select_related('category', 'subcategory').all()
        category = self.request.query_params.get('category')
        available = self.request.query_params.get('available')
        if category:
            qs = qs.filter(category__slug=category)
        if available == 'true':
            qs = qs.filter(is_available=True)
        return qs


class MenuItemDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MenuItem.objects.select_related('category', 'subcategory').all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    lookup_field = 'id'

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)