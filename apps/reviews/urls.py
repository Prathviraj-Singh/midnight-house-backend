from django.urls import path
from .views import (
    ReviewListCreateAPIView,
    ReviewDetailAPIView,
    AdminReviewListAPIView,
    AdminReviewApproveAPIView,
    AdminReviewRejectAPIView,
)

urlpatterns = [
    path('', ReviewListCreateAPIView.as_view(), name='review-list-create'),
    path('admin/all/', AdminReviewListAPIView.as_view(), name='review-admin-list'),
    path('admin/<uuid:id>/approve/', AdminReviewApproveAPIView.as_view(), name='review-approve'),
    path('admin/<uuid:id>/reject/', AdminReviewRejectAPIView.as_view(), name='review-reject'),
    path('<uuid:id>/', ReviewDetailAPIView.as_view(), name='review-detail'),
]