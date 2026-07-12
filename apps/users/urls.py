from django.urls import path
from .views import RegisterView, LoginView, LogoutView, CustomTokenRefreshView, MeView,ProfileView,ProfileUpdateView, AdminUserListAPIView, AdminCreateStaffAPIView, AdminToggleStaffAPIView


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/update/', ProfileUpdateView.as_view(), name='profile-update'),
    path('admin/users/', AdminUserListAPIView.as_view(), name='admin-user-list'),
    path('admin/create-staff/', AdminCreateStaffAPIView.as_view(), name='admin-create-staff'),
    path('admin/users/<uuid:id>/toggle-staff/', AdminToggleStaffAPIView.as_view(), name='admin-toggle-staff'),
]
