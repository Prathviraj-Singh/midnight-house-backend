from django.db import models
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import Review
from .serializers import ReviewSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return obj.is_approved or (request.user and request.user == obj.user)
        return request.user == obj.user


class ReviewListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(is_approved=True).order_by("-created_at")

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ReviewDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsOwnerOrReadOnly]
    lookup_field = "id"

    def get_queryset(self):
        if self.request.method in permissions.SAFE_METHODS:
            return Review.objects.filter(
                models.Q(is_approved=True) | models.Q(user=self.request.user)
            ).order_by("-created_at")
        return Review.objects.filter(user=self.request.user).order_by("-created_at")


class AdminReviewListAPIView(generics.ListAPIView):
    """
    GET /reviews/admin/all/?status=pending|approved|rejected
    Admin only — see all reviews for moderation.
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = Review.objects.select_related('user').order_by('-created_at')
        status = self.request.query_params.get('status')
        if status == 'pending':
            qs = qs.filter(is_approved=False)
        elif status == 'approved':
            qs = qs.filter(is_approved=True)
        return qs


class AdminReviewApproveAPIView(APIView):
    """PATCH /reviews/admin/<id>/approve/ — Approve a review."""
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, id):
        review = get_object_or_404(Review, id=id)
        review.is_approved = True
        review.save(update_fields=['is_approved'])
        return Response(ReviewSerializer(review).data)


class AdminReviewRejectAPIView(APIView):
    """DELETE /reviews/admin/<id>/reject/ — Reject (delete) a review."""
    permission_classes = [permissions.IsAdminUser]

    def delete(self, request, id):
        review = get_object_or_404(Review, id=id)
        review.delete()
        return Response({"detail": "Review deleted."})