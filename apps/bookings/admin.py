"""
Views for the Mini-Theater Booking API.
"""

from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking
from .serializers import BookingSerializer


class BookingListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  -> User ki saari bookings dikhao.
    POST -> Nayi booking create karo.
    """

    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Booking.objects.filter(user=self.request.user)
            .order_by("-created_at")
            .select_related("user")
        )

    def perform_create(self, serializer):
        serializer.save()


class BookingDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET     -> Specific booking dekho.
    PATCH   -> Sirf cancellation allow hai.
    DELETE  -> Sirf cancelled bookings delete ho sakti hain.
    """

    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

    def patch(self, request, *args, **kwargs):
        booking = self.get_object()

        if set(request.data.keys()) != {"booking_status"}:
            raise PermissionDenied(
                "Only the 'booking_status' field may be modified."
            )

        new_status = request.data.get("booking_status")

        if new_status != Booking.BookingStatus.CANCELLED:
            raise PermissionDenied(
                "You may only set 'booking_status' to CANCELLED."
            )

        booking.booking_status = Booking.BookingStatus.CANCELLED
        booking.save()

        serializer = self.get_serializer(booking)

        return Response(serializer.data)

    def delete(self, request, *args, **kwargs):
        booking = self.get_object()

        if booking.booking_status != Booking.BookingStatus.CANCELLED:
            raise ValidationError(
                "Only bookings with status CANCELLED may be deleted."
            )

        return super().delete(request, *args, **kwargs)


class BookingApproveAPIView(APIView):
    """
    Admin booking approve karega.
    """

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, id):
        booking = Booking.objects.get(id=id)

        booking.booking_status = Booking.BookingStatus.APPROVED
        booking.save()

        serializer = BookingSerializer(booking)

        return Response(
            {
                "message": "Booking approved successfully.",
                "booking": serializer.data,
            }
        )


class BookingRejectAPIView(APIView):
    """
    Admin booking reject karega.
    """

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, id):
        booking = Booking.objects.get(id=id)

        booking.booking_status = Booking.BookingStatus.REJECTED
        booking.save()

        serializer = BookingSerializer(booking)

        return Response(
            {
                "message": "Booking rejected successfully.",
                "booking": serializer.data,
            }
        )