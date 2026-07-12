from django.urls import path

from .views import (
    CreateRazorpayOrderView,
    PaymentDetailView,
    PaymentListView,
    VerifyRazorpayPaymentView,
)

urlpatterns = [
    # Existing routes — preserved
    path("", PaymentListView.as_view(), name="payment-list"),
    path("<uuid:id>/", PaymentDetailView.as_view(), name="payment-detail"),

    # Razorpay routes
    path("create-order/", CreateRazorpayOrderView.as_view(), name="payment-create-order"),
    path("verify/", VerifyRazorpayPaymentView.as_view(), name="payment-verify"),
]
