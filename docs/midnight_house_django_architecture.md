# Midnight House Backend Architecture Spec
## High-Level Django & Django REST Framework (DRF) System Design

---

## 1. Django Project Architecture & Design Philosophy

To support a production-grade, highly maintainable system, we will structure the Django application using a **modular monolithic architecture** combined with a **Service Layer (Domain-Driven Design Lite)** pattern. This isolates core business domain policies from HTTP delivery concerns.

### 1.1 Key Principles
* **Separation of Concerns (SoC)**: Django Views and ViewSets are strictly responsible for request parsing, query parameter validation, routing, and HTTP response mapping. Serializers handle data validation and representation. All business logic sits inside isolated **Service** classes.
* **Fat Services, Skinny Views, Skinny Models**: Models remain raw representations of database state with minimal utility helpers. Views do not query databases with complex logic or mutate multiple entities.
* **Transactional Boundaries**: All multi-table updates (e.g., booking a theater slot while checking out a food package) must occur inside explicit database transaction blocks (`transaction.atomic()`).
* **Environment-Based Configs**: Modular settings directory replacing `settings.py` to segregate `base`, `local`, and `production` environments.

---

## 2. Django Apps Breakdown

We decompose the domain into six distinct Django apps, ensuring clear architectural boundaries:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Django App Boundaries                           │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────────┤
│    users    │   catalog   │   orders    │  bookings   │   marketing    │
├─────────────┼─────────────┼─────────────┼─────────────┼────────────────┤
│ Auth, OTP,  │ Categories, │ Cart, Dine- │ Slots, Room │ Offers,        │
│ Profile, IDs│ Menu Items  │ in, Delivery│ reservation │ Student codes  │
└─────────────┴─────────────┴─────────────┴─────────────┴────────────────┘
```

1. **`users`**: Manages custom user profiles, JWT creation/rotation, verification status (student ID validation uploads), and contact details.
2. **`catalog`**: Handles category classification and menu items. Contains fields for item properties, availability states, and image mappings.
3. **`orders`**: Focuses on shopping cart validation, order item calculations, preparation state machines, and distance-based delivery verification.
4. **`bookings`**: Orchestrates slot management, private theater reservation requests, guest count validation, screening types, and larger event reservations (Birthdays/Farewell parties).
5. **`marketing`**: Houses coupon systems, dynamic pricing overrides (weekend rates), and promotion logic.
6. **`reviews`**: Manages customer ratings and reviews, ensuring reviews are bound to verified transactions.

---

## 3. Models Mapping & Database Operations

All models utilize UUIDs as primary keys instead of auto-incrementing integers to prevent resource enumeration and protect business volume intelligence. Below are the class schemas and operational definitions:

### 3.1 App: `users`
* **`User` (extends `AbstractBaseUser`, `PermissionsMixin`)**
  * `id`: `UUIDField` (Primary Key, default=uuid.uuid4)
  * `email`: `EmailField` (Unique, index=True)
  * `phone_number`: `CharField` (Unique, max_length=15, db_index=True)
  * `first_name`: `CharField`
  * `last_name`: `CharField`
  * `is_student_verified`: `BooleanField` (default=False)
  * `is_staff`: `BooleanField` (default=False)
  * `created_at`: `DateTimeField` (auto_now_add=True)
* **`UserProfile`**
  * `id`: `UUIDField` (Primary Key)
  * `user`: `OneToOneField` (cascade to User, related_name='profile')
  * `student_id_image_url`: `URLField` (Cloudinary hosted, blank=True)
  * `default_delivery_address`: `TextField` (blank=True)
  * `administrative_notes`: `TextField` (blank=True)

### 3.2 App: `catalog`
* **`Category`**
  * `id`: `AutoField` (Primary Key)
  * `name`: `CharField` (Unique, max_length=50)
  * `description`: `TextField` (blank=True)
* **`MenuItem`**
  * `id`: `UUIDField` (Primary Key)
  * `category`: `ForeignKey` (to Category, related_name='items')
  * `name`: `CharField` (max_length=100)
  * `description`: `TextField`
  * `price`: `DecimalField` (max_digits=8, decimal_places=2)
  * `image_url`: `URLField`
  * `is_available`: `BooleanField` (default=True, db_index=True)
  * `is_best_seller`: `BooleanField` (default=False)

### 3.3 App: `orders`
* **`Order`**
  * `id`: `UUIDField` (Primary Key)
  * `user`: `ForeignKey` (to User, related_name='orders')
  * `offer`: `ForeignKey` (to marketing.Offer, null=True, on_delete=SET_NULL)
  * `status`: `CharField` (Choices: `PENDING`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`)
  * `order_type`: `CharField` (Choices: `DELIVERY`, `DINE_IN`)
  * `delivery_address`: `TextField` (nullable)
  * `table_number`: `CharField` (nullable, max_length=10)
  * `subtotal`: `DecimalField` (max_digits=10, decimal_places=2)
  * `tax`: `DecimalField` (max_digits=8, decimal_places=2)
  * `delivery_fee`: `DecimalField` (max_digits=8, decimal_places=2)
  * `discount_amount`: `DecimalField` (max_digits=8, decimal_places=2)
  * `total_payable`: `DecimalField` (max_digits=10, decimal_places=2)
  * `created_at`: `DateTimeField` (auto_now_add=True, db_index=True)
* **`OrderItem`**
  * `id`: `UUIDField` (Primary Key)
  * `order`: `ForeignKey` (to Order, related_name='items')
  * `menu_item`: `ForeignKey` (to catalog.MenuItem)
  * `quantity`: `PositiveIntegerField`
  * `unit_price`: `DecimalField` (max_digits=8, decimal_places=2)
  * `total_price`: `DecimalField` (max_digits=10, decimal_places=2)

### 3.4 App: `bookings`
* **`TheaterSlot`**
  * `id`: `PositiveIntegerField` (Primary Key - values limited to 1, 2)
  * `slot_name`: `CharField` (Choices: `SLOT_A`, `SLOT_B`)
  * `start_time`: `TimeField` (5:00 PM)
  * `end_time`: `TimeField` (8:00 PM / 11:00 PM)
* **`TheaterBooking`**
  * `id`: `UUIDField` (Primary Key)
  * `user`: `ForeignKey` (to User)
  * `slot`: `ForeignKey` (to TheaterSlot)
  * `booking_date`: `DateField` (db_index=True)
  * `guest_count`: `PositiveIntegerField` (Valued 1 to 8)
  * `screening_type`: `CharField` (Choices: `MOVIE`, `IPL`, `BIRTHDAY`, `FRIENDS`)
  * `food_package`: `ForeignKey` (to EventPackage, null=True, on_delete=SET_NULL)
  * `base_price`: `DecimalField` (max_digits=8, decimal_places=2)
  * `total_payable`: `DecimalField` (max_digits=8, decimal_places=2)
  * `status`: `CharField` (Choices: `CONFIRMED`, `CANCELLED`, `PENDING_PAYMENT`)
  * `created_at`: `DateTimeField` (auto_now_add=True)
  * *Constraint*: Unique combination of `(slot, booking_date)` with status not equal to `CANCELLED`.
* **`EventPackage`**
  * `id`: `UUIDField` (Primary Key)
  * `name`: `CharField` (Choices: `BASIC`, `PREMIUM`, `FAREWELL`)
  * `package_details`: `TextField`
  * `base_price`: `DecimalField` (max_digits=8, decimal_places=2)
* **`EventBooking`**
  * `id`: `UUIDField` (Primary Key)
  * `user`: `ForeignKey` (to User)
  * `event_package`: `ForeignKey` (to EventPackage)
  * `event_date`: `DateField`
  * `guest_count`: `PositiveIntegerField` (Max 10)
  * `custom_requirements`: `TextField`
  * `calculated_price`: `DecimalField` (max_digits=8, decimal_places=2)
  * `status`: `CharField` (Choices: `PENDING`, `CONFIRMED`, `CANCELLED`)

### 3.5 App: `marketing`
* **`Offer`**
  * `id`: `UUIDField` (Primary Key)
  * `code`: `CharField` (Unique, max_length=20)
  * `offer_type`: `CharField` (Choices: `PERCENTAGE`, `FLAT`, `FREE_ITEM`)
  * `discount_value`: `DecimalField`
  * `min_order_value`: `DecimalField`
  * `valid_from`: `DateTimeField`
  * `valid_to`: `DateTimeField`
  * `is_active`: `BooleanField` (default=True)

### 3.6 App: `reviews`
* **`Review`**
  * `id`: `UUIDField` (Primary Key)
  * `user`: `ForeignKey` (to User)
  * `menu_item`: `ForeignKey` (to catalog.MenuItem, null=True)
  * `booking`: `ForeignKey` (to bookings.TheaterBooking, null=True)
  * `rating`: `PositiveIntegerField` (min=1, max=5)
  * `review_text`: `TextField`
  * `is_approved`: `BooleanField` (default=False)

---

## 4. Permissions Strategy & Custom Handlers

DRF permission classes control visibility. We define dynamic granular authorization checking parameters at execution:

* **`IsAdminOrReadOnly`**: Allows read endpoints (`GET`, `HEAD`) for general customers, blocks write actions (`POST`, `PUT`, `DELETE`) for non-staff.
* **`IsVerifiedStudent`**: Restricts resource access to users where `is_student_verified = True`.
* **`IsOwnerOrAdmin`**: Used for Orders, Bookings, Profiles. Verifies `request.user == obj.user` or `request.user.is_staff == True`.

```python
# Conceptual implementation patterns for custom permissions
from rest_framework import permissions

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        return obj.user == request.user

class IsVerifiedStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.is_student_verified
        )
```

---

## 5. Authentication Strategy (JWT via HTTP-Only Cookies)

Instead of passing access tokens in local storage (vulnerable to XSS), the system implements an HTTP-Only secure cookie strategy.

* **Payload Standard**: JWT HMAC-SHA256 tokens using `djangorestframework-simplejwt`.
* **Double-Cookie Mechanism**:
  1. `access_token` cookie: HTTP-only, Secure (production), SameSite=Lax, path=/ (expires in 15 mins).
  2. `refresh_token` cookie: HTTP-only, Secure (production), SameSite=Lax, path=/api/auth/token/refresh/ (expires in 7 days).
* **Handshake Workflow**:
  * Frontend sends credentials to `/api/auth/login/`.
  * Django DRF parses, issues tokens, appends `Set-Cookie` headers, and returns user metadata.
  * For subsequent requests, the browser attaches the cookie automatically. The custom DRF authentication backend extracts JWT from headers or cookies.

---

## 6. Service Layer Architecture (Domain Logic Decoupling)

To prevent business logic from leaking into Views and Serializers, we introduce a `services.py` module inside each app. These act as cohesive units of operation.

```
┌────────────────────────────────────────────────────────┐
│                      Request Flow                      │
│                                                        │
│ Client ──> View (Route/Auth) ──> Serializer (Validate) │
│                                      │                 │
│                                      ▼                 │
│                    Service Layer (Business Rules)      │
│                                      │                 │
│                                      ▼                 │
│                     Database (SELECT FOR UPDATE)       │
└────────────────────────────────────────────────────────┘
```

### 6.1 Concurrency & Resiliency Design (Theater Booking)
The critical operational risk is overlapping slot reservations.
`TheaterBookingService` executes a `SELECT ... FOR UPDATE` row-level lock on the `TheaterSlot` / Reservation date metadata index inside a transaction to prevent race conditions.

```python
# Service Method Design Pattern
from django.db import transaction
from django.core.exceptions import ValidationError
from bookings.models import TheaterBooking, TheaterSlot

class TheaterBookingService:
    @staticmethod
    def create_booking(user, slot_id, date, guests, screening_type, food_package_id=None):
        with transaction.atomic():
            # Acquire database lock on slot verification to serialize concurrent writes
            slot = TheaterSlot.objects.select_for_update().get(id=slot_id)
            
            # Check existance of conflicting bookings
            exists = TheaterBooking.objects.filter(
                slot=slot, 
                booking_date=date, 
                status__in=['CONFIRMED', 'PENDING_PAYMENT']
            ).exists()
            
            if exists:
                raise ValidationError("This slot is already booked for the selected date.")
                
            # Perform calculation logic (Student Discounts, package additions)
            ...
            
            booking = TheaterBooking.objects.create(
                user=user,
                slot=slot,
                booking_date=date,
                guest_count=guests,
                screening_type=screening_type,
                ...
            )
            return booking
```

### 6.2 Distance Verification Service (`orders`)
Calculates coordinates difference (Haversine formula) to verify physical boundaries:
* Store Coordinates: `(22.7533, 75.8937)`
* Maximum distance: `5.0` km (with $0.1$ km grace margin).
* If evaluation fails, throws `OutOfRangeError` which serializes to `400 Bad Request`.

---

## 7. Serializer Structure

Serializers strictly perform validation, sanitization, and serialization/deserialization. No database writing occurs in serializer `save()` overrides.

* **Validation Rules (Data Sanity)**:
  * `TheaterBookingSerializer`: Overrides `validate()` to check if `booking_date` is in the past, if `guest_count` exceeds 8, or if the booking request violates the 2-hour advance booking policy.
  * `OrderSerializer`: Validates item list existences, checks if dynamic status transitions match the state machine rules (e.g. `PENDING` $\rightarrow$ `PREPARING` is valid, but `PENDING` $\rightarrow$ `COMPLETED` directly is blocked).

---

## 8. View Structure

Views leverage `ModelViewSet` and custom generic views to map URLs to services.

* **Pagination**: Default page size of 20 items for list views.
* **Filtering & Ordering**: Integrate `django-filters` for catalog searching, sorting catalog items by price, and filtering bookings by date parameters.

---

## 9. URL Structure

All routes reside under `/api/v1/` to support API versioning.

```
/api/v1/
├── auth/
│   ├── register/                 [POST] (Public)
│   ├── login/                    [POST] (Public)
│   ├── logout/                   [POST] (Auth Required)
│   ├── student-verify/           [POST] (Auth Required - Upload ID)
│   └── token/refresh/            [POST] (Public - Rotate Access Cookie)
├── catalog/
│   ├── categories/               [GET] (Public)
│   └── items/                    [GET] (Public) / [POST, PUT, DELETE] (Admin Only)
├── orders/
│   ├── calculate-fee/            [POST] (Auth Required - Check 5 KM limits)
│   ├── checkout/                 [POST] (Auth Required)
│   └── history/                  [GET] (Auth Required - Owner/Admin)
├── theater/
│   ├── slots/                    [GET] (Public)
│   └── bookings/                 [POST, GET] (Auth Required)
└── admin/
    ├── analytics/dashboard/      [GET] (Admin Only)
    └── slot-lock/                [POST] (Admin Only)
```

---

## 10. Production Folder Structure

This project follows a clean repository layout separating deployment assets, configuration modules, and application containers.

```
midnight-house/
├── .github/                      # CI/CD Workflows (Linting, Deployment)
├── deploy/                       # Production Deployment configurations
│   ├── nginx/
│   │   └── nginx.conf            # Nginx config for reverse proxy & SSL
│   ├── docker/
│   │   ├── Dockerfile.prod       # Multi-stage production build
│   │   └── docker-compose.prod.yml
│   └── supervisor/
│       └── gunicorn.conf         # Process manager mapping
├── config/                       # Project Settings Directory
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py               # Shared Django configurations
│   │   ├── local.py              # Development flags & DB configs
│   │   └── production.py         # Production caching, secure cookies
│   ├── __init__.py
│   ├── urls.py                   # Master routing dispatcher
│   ├── wsgi.py                   # Gunicorn target
│   └── asgi.py                   # Channels target (for dynamic orders push)
├── apps/                         # App Container Directory
│   ├── users/
│   │   ├── migrations/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── services.py           # User management/verification logic
│   │   ├── views.py
│   │   └── urls.py
│   ├── catalog/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   └── views.py
│   ├── orders/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── services.py           # Cart, pricing, and radius checking logic
│   │   └── views.py
│   ├── bookings/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── services.py           # Concurrency-safe reservation engine
│   │   └── views.py
│   ├── marketing/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   └── views.py
│   └── reviews/
│       ├── models.py
│       ├── serializers.py
│       └── views.py
├── manage.py                     # Execution Entrypoint
├── requirements.txt              # Production Dependency Spec
├── pyproject.toml                # Black, Flake8, Isort standards
└── README.md
```
