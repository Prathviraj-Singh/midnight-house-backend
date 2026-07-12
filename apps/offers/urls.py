from django.urls import path
from .views import OfferListCreateAPIView, OfferDetailAPIView, ValidateCouponAPIView

urlpatterns = [
    path('', OfferListCreateAPIView.as_view(), name='offer-list-create'),
    path('validate/', ValidateCouponAPIView.as_view(), name='offer-validate'),
    path('<uuid:id>/', OfferDetailAPIView.as_view(), name='offer-detail'),
]