from django.contrib import admin
from .models import Category, SubCategory, MenuItem

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'category')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'category__name')
    list_filter = ('category',)

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'subcategory', 'price', 'is_available', 'is_featured', 'created_at')
    list_filter = ('is_available', 'is_featured', 'category', 'subcategory')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at',)
