from django.urls import path
from .views import (
    BookingListCreateAPIView,
    BookingDetailAPIView,
    BookingApproveAPIView,
    BookingRejectAPIView,
    BusyTimesAPIView,
    AdminBookingListAPIView,
    ExpireUnpaidBookingsAPIView,
    CelebrationBookingListCreateAPIView,
    CelebrationBookingDetailAPIView,
    CelebrationBookingApproveAPIView,
    CelebrationBookingRejectAPIView,
    AdminCelebrationBookingListAPIView,
)

urlpatterns = [
    path('', BookingListCreateAPIView.as_view(), name='booking-list-create'),
    path('busy/', BusyTimesAPIView.as_view(), name='booking-busy-times'),
    path('admin/all/', AdminBookingListAPIView.as_view(), name='booking-admin-list'),
    path('admin/expire-unpaid/', ExpireUnpaidBookingsAPIView.as_view(), name='booking-expire-unpaid'),

    path('celebrations/', CelebrationBookingListCreateAPIView.as_view(), name='celebration-list-create'),
    path('celebrations/admin/all/', AdminCelebrationBookingListAPIView.as_view(), name='celebration-admin-list'),
    path('celebrations/<uuid:id>/', CelebrationBookingDetailAPIView.as_view(), name='celebration-detail'),
    path('celebrations/<uuid:id>/approve/', CelebrationBookingApproveAPIView.as_view(), name='celebration-approve'),
    path('celebrations/<uuid:id>/reject/', CelebrationBookingRejectAPIView.as_view(), name='celebration-reject'),

    path('<uuid:id>/', BookingDetailAPIView.as_view(), name='booking-detail'),
    path('<uuid:id>/approve/', BookingApproveAPIView.as_view(), name='booking-approve'),
    path('<uuid:id>/reject/', BookingRejectAPIView.as_view(), name='booking-reject'),
]