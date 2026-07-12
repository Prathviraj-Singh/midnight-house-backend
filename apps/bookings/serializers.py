from rest_framework import serializers
from .models import CelebrationBooking, Booking

class BookingSerializer(serializers.ModelSerializer):
    duration_hours = serializers.ReadOnlyField()

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'movie_name', 'booking_date', 'start_time', 'end_time',
            'duration_hours', 'number_of_guests', 'special_requests',
            'booking_status', 'total_amount', 'advance_amount',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'user', 'booking_status', 'total_amount', 'advance_amount',
            'created_at', 'updated_at',
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        booking = Booking(user=user, **validated_data)
        booking.calculate_pricing()
        booking.full_clean()
        booking.save()
        return booking

class CelebrationBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CelebrationBooking
        fields = [
            'id', 'user', 'package_type', 'occasion_name', 'event_date',
            'number_of_guests', 'special_requests',
            'booking_status', 'total_amount', 'advance_amount',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'user', 'booking_status', 'total_amount', 'advance_amount',
            'created_at', 'updated_at',
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        booking = CelebrationBooking(user=user, **validated_data)
        booking.calculate_pricing()
        booking.full_clean()
        booking.save()
        return booking