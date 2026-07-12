from rest_framework import serializers
from .models import Category, SubCategory, MenuItem


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class SubCategorySerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())

    class Meta:
        model = SubCategory
        fields = ['id', 'name', 'slug', 'category']


class MenuItemSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    subcategory = serializers.PrimaryKeyRelatedField(queryset=SubCategory.objects.all(), allow_null=True, required=False)
    is_available = serializers.BooleanField(default=True, required=False)  # yeh add karo

    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'description', 'price', 'image',
            'is_available', 'is_featured',
            'category', 'subcategory', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
