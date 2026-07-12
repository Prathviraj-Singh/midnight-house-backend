from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile

class UserProfileInline(admin.StackedInline):
    """Inline profile editor inside UserAdmin dashboard page."""
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile Details'
    fk_name = 'user'

class UserAdmin(BaseUserAdmin):
    """Custom UserAdmin configuration for Django Admin dashboard."""
    ordering = ('email',)
    list_display = ('email', 'first_name', 'last_name', 'phone_number', 'is_student_verified', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'is_student_verified')
    inlines = (UserProfileInline,)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'phone_number', 'password1', 'password2'),
        }),
    )
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone_number', 'is_student_verified')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'created_at')}),
    )
    readonly_fields = ('created_at',)
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    filter_horizontal = ('groups', 'user_permissions')

admin.site.register(User, UserAdmin)
