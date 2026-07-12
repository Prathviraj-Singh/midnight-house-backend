import uuid
from decimal import Decimal
from datetime import datetime, timedelta, time as time_type

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Booking(models.Model):
    class BookingStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    # Business rules
    OPENING_TIME = time_type(10, 0)   # 10:00 AM
    CLOSING_TIME = time_type(23, 59)  # 11:59 PM (effectively midnight)
    MIN_DURATION_HOURS = 2
    MAX_DURATION_HOURS = 4
    PRICE_PER_GUEST = Decimal('250.00')
    MIN_ADVANCE_NOTICE_HOURS = 2
    MAX_GUESTS = 8

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')

    movie_name = models.CharField(max_length=255)
    booking_date = models.DateField()
    start_time = models.TimeField(default=time_type(10, 0))
    end_time = models.TimeField(default=time_type(12, 0))

    number_of_guests = models.PositiveSmallIntegerField()
    special_requests = models.TextField(blank=True)

    booking_status = models.CharField(max_length=10, choices=BookingStatus.choices, default=BookingStatus.PENDING)

    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    advance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    ADVANCE_PAYMENT_WINDOW_HOURS = 3

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.movie_name} — {self.booking_date} {self.start_time}-{self.end_time} ({self.booking_status})"

    @property
    def duration_hours(self) -> float:
        start_dt = datetime.combine(self.booking_date, self.start_time)
        end_dt = datetime.combine(self.booking_date, self.end_time)
        return (end_dt - start_dt).total_seconds() / 3600

    def calculate_pricing(self):
        self.total_amount = self.PRICE_PER_GUEST * self.number_of_guests
        self.advance_amount = self.total_amount / 2

    def clean(self):
        errors = {}

        if self.end_time <= self.start_time:
            errors['end_time'] = 'End time must be after start time.'
        else:
            duration = self.duration_hours
            if duration < self.MIN_DURATION_HOURS:
                errors['end_time'] = f'Minimum booking duration is {self.MIN_DURATION_HOURS} hours.'
            if duration > self.MAX_DURATION_HOURS:
                errors['end_time'] = f'Maximum booking duration is {self.MAX_DURATION_HOURS} hours.'

        if self.start_time < self.OPENING_TIME:
            errors['start_time'] = f'We open at {self.OPENING_TIME.strftime("%I:%M %p")}.'
        if self.end_time > self.CLOSING_TIME:
            errors['end_time'] = f'We close at {self.CLOSING_TIME.strftime("%I:%M %p")}.'

        if self.number_of_guests > self.MAX_GUESTS:
            errors['number_of_guests'] = f'Maximum {self.MAX_GUESTS} guests allowed.'
        if self.number_of_guests < 1:
            errors['number_of_guests'] = 'At least 1 guest is required.'

        # Advance notice check
        booking_start_dt = timezone.make_aware(datetime.combine(self.booking_date, self.start_time))
        if booking_start_dt < timezone.now() + timedelta(hours=self.MIN_ADVANCE_NOTICE_HOURS):
            errors['start_time'] = f'Bookings require at least {self.MIN_ADVANCE_NOTICE_HOURS} hours advance notice.'

        # Overlap check — block against PENDING, APPROVED, CONFIRMED bookings on the same date
        if self.booking_date and self.start_time and self.end_time:
            overlapping = Booking.objects.filter(
                booking_date=self.booking_date,
                booking_status__in=[self.BookingStatus.PENDING, self.BookingStatus.APPROVED, self.BookingStatus.CONFIRMED],
            ).exclude(pk=self.pk)

            for existing in overlapping:
                if self.start_time < existing.end_time and self.end_time > existing.start_time:
                    errors['start_time'] = (
                        f'This time overlaps with an existing booking '
                        f'({existing.start_time.strftime("%I:%M %p")} - {existing.end_time.strftime("%I:%M %p")}).'
                    )
                    break

        if errors:
            raise ValidationError(errors)

class CelebrationBooking(models.Model):
    class PackageType(models.TextChoices):
        ESSENTIAL = 'ESSENTIAL', 'Essential'
        PREMIUM = 'PREMIUM', 'Premium'
        FAREWELL = 'FAREWELL', 'Farewell'

    class BookingStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    PACKAGE_PRICES = {
        'ESSENTIAL': Decimal('1499.00'),
        'PREMIUM': Decimal('2999.00'),
        'FAREWELL': Decimal('1999.00'),
    }
    MAX_GUESTS = 15
    MIN_ADVANCE_NOTICE_HOURS = 24
    ADVANCE_PAYMENT_WINDOW_HOURS = 3

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='celebration_bookings')

    package_type = models.CharField(max_length=10, choices=PackageType.choices)
    occasion_name = models.CharField(max_length=255)
    event_date = models.DateField()
    number_of_guests = models.PositiveSmallIntegerField()
    special_requests = models.TextField(blank=True)

    booking_status = models.CharField(max_length=10, choices=BookingStatus.choices, default=BookingStatus.PENDING)

    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    advance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.package_type} — {self.occasion_name} — {self.event_date} ({self.booking_status})"

    def calculate_pricing(self):
        self.total_amount = self.PACKAGE_PRICES[self.package_type]
        self.advance_amount = self.total_amount / 2

    def clean(self):
        errors = {}

        if self.number_of_guests > self.MAX_GUESTS:
            errors['number_of_guests'] = f'Maximum {self.MAX_GUESTS} guests allowed.'
        if self.number_of_guests < 1:
            errors['number_of_guests'] = 'At least 1 guest is required.'

        event_dt = timezone.make_aware(datetime.combine(self.event_date, time_type(0, 0)))
        if event_dt < timezone.now() + timedelta(hours=self.MIN_ADVANCE_NOTICE_HOURS):
            errors['event_date'] = f'Celebration bookings require at least {self.MIN_ADVANCE_NOTICE_HOURS} hours advance notice.'

        if errors:
            raise ValidationError(errors)
            
    class CelebrationBooking(models.Model):
        class PackageType(models.TextChoices):
            ESSENTIAL = 'ESSENTIAL', 'Essential'
            PREMIUM = 'PREMIUM', 'Premium'
            FAREWELL = 'FAREWELL', 'Farewell'

    class BookingStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    PACKAGE_PRICES = {
        'ESSENTIAL': Decimal('1499.00'),
        'PREMIUM': Decimal('2999.00'),
        'FAREWELL': Decimal('1999.00'),
    }
    MAX_GUESTS = 15
    MIN_ADVANCE_NOTICE_HOURS = 24
    ADVANCE_PAYMENT_WINDOW_HOURS = 3

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='celebration_bookings')

    package_type = models.CharField(max_length=10, choices=PackageType.choices)
    occasion_name = models.CharField(max_length=255)
    event_date = models.DateField()
    number_of_guests = models.PositiveSmallIntegerField()
    special_requests = models.TextField(blank=True)

    booking_status = models.CharField(max_length=10, choices=BookingStatus.choices, default=BookingStatus.PENDING)

    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    advance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.package_type} — {self.occasion_name} — {self.event_date} ({self.booking_status})"

    def calculate_pricing(self):
        self.total_amount = self.PACKAGE_PRICES[self.package_type]
        self.advance_amount = self.total_amount / 2

    def clean(self):
        errors = {}

        if self.number_of_guests > self.MAX_GUESTS:
            errors['number_of_guests'] = f'Maximum {self.MAX_GUESTS} guests allowed.'
        if self.number_of_guests < 1:
            errors['number_of_guests'] = 'At least 1 guest is required.'

        event_dt = timezone.make_aware(datetime.combine(self.event_date, time_type(0, 0)))
        if event_dt < timezone.now() + timedelta(hours=self.MIN_ADVANCE_NOTICE_HOURS):
            errors['event_date'] = f'Celebration bookings require at least {self.MIN_ADVANCE_NOTICE_HOURS} hours advance notice.'

        if errors:
            raise ValidationError(errors)