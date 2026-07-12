# Auth Implementation Report
## TSK-2.1 & TSK-2.2 — Custom User Model & SimpleJWT Configuration

**Sprint**: Sprint 1
**Status**: ✅ Complete
**Verified**: Django system check passes with 0 issues.

---

## 1. Tasks Completed

### TSK-2.1 — Custom User Model & User Manager
**Goal**: Create the `apps/users` application and define a custom `User` model using Email as the primary identifier, plus a `UserProfile` model.

**Status**: ✅ Complete

### TSK-2.2 — SimpleJWT Integration & Token Configuration
**Goal**: Install `djangorestframework-simplejwt`, configure token lifetimes, rotation rules, and blacklist support inside Django settings.

**Status**: ✅ Complete

---

## 2. Files Created

| File | Purpose |
| :--- | :--- |
| [`apps/users/__init__.py`](file:///c:/Users/prath/OneDrive/Desktop/midnight/apps/users/__init__.py) | Package initialization for users Django app |
| [`apps/users/apps.py`](file:///c:/Users/prath/OneDrive/Desktop/midnight/apps/users/apps.py) | `UsersConfig` with correct `name = 'apps.users'` namespace |
| [`apps/users/models.py`](file:///c:/Users/prath/OneDrive/Desktop/midnight/apps/users/models.py) | Custom `User` + `UserManager` + `UserProfile` models |
| [`apps/users/admin.py`](file:///c:/Users/prath/OneDrive/Desktop/midnight/apps/users/admin.py) | Django Admin registration with inline `UserProfile` |
| [`apps/users/migrations/__init__.py`](file:///c:/Users/prath/OneDrive/Desktop/midnight/apps/users/migrations/__init__.py) | Migrations package initialization |
| [`apps/users/migrations/0001_initial.py`](file:///c:/Users/prath/OneDrive/Desktop/midnight/apps/users/migrations/0001_initial.py) | Auto-generated migration creating `User` and `UserProfile` tables |

---

## 3. Files Modified

| File | Change |
| :--- | :--- |
| [`config/settings/base.py`](file:///c:/Users/prath/OneDrive/Desktop/midnight/config/settings/base.py) | Added `AUTH_USER_MODEL`, `INSTALLED_APPS` entries, `REST_FRAMEWORK` auth class, `SIMPLE_JWT` config block |
| [`config/settings/local.py`](file:///c:/Users/prath/OneDrive/Desktop/midnight/config/settings/local.py) | Removed conflicting `SIMPLE_JWT` override that was shadowing base.py settings |

---

## 4. Model Definitions

### 4.1 `User` Model — [`apps/users/models.py`](file:///c:/Users/prath/OneDrive/Desktop/midnight/apps/users/models.py)

Inherits from `AbstractBaseUser` and `PermissionsMixin`.

| Field | Type | Properties |
| :--- | :--- | :--- |
| `id` | `UUIDField` | Primary Key, `uuid.uuid4`, not editable |
| `email` | `EmailField` | Unique, `db_index=True` — **primary identifier** |
| `phone_number` | `CharField(15)` | Unique, `db_index=True` |
| `first_name` | `CharField(50)` | Required |
| `last_name` | `CharField(50)` | Required |
| `is_student_verified` | `BooleanField` | Default `False` — used for student discount gates |
| `is_staff` | `BooleanField` | Default `False` — Admin role flag |
| `is_active` | `BooleanField` | Default `True` |
| `created_at` | `DateTimeField` | `auto_now_add=True` |

**Manager**: `UserManager` implements `create_user()` and `create_superuser()` with email normalization and password hashing.

**Configuration**:
- `USERNAME_FIELD = 'email'` — Email replaces username
- `REQUIRED_FIELDS = ['phone_number', 'first_name', 'last_name']`

### 4.2 `UserProfile` Model — [`apps/users/models.py`](file:///c:/Users/prath/OneDrive/Desktop/midnight/apps/users/models.py)

Linked 1-to-1 with `User`. Stores extended profile and student verification data.

| Field | Type | Properties |
| :--- | :--- | :--- |
| `id` | `UUIDField` | Primary Key, `uuid.uuid4` |
| `user` | `OneToOneField` | CASCADE, `related_name='profile'` |
| `student_id_image_url` | `URLField` | Nullable — Cloudinary URL of student ID image |
| `default_delivery_address` | `TextField` | Nullable — saved delivery address |
| `administrative_notes` | `TextField` | Nullable — internal admin staff notes |

---

## 5. Settings Configuration

### `config/settings/base.py` — Key additions

```python
# Custom User Model registration
AUTH_USER_MODEL = 'users.User'

# INSTALLED_APPS additions
'rest_framework_simplejwt',
'rest_framework_simplejwt.token_blacklist',
'apps.users',

# DRF authentication class
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    ...
}

# JWT configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}
```

### Token Security Design

| Parameter | Value | Rationale |
| :--- | :--- | :--- |
| `ACCESS_TOKEN_LIFETIME` | 15 minutes | Short-lived; minimizes damage if intercepted |
| `REFRESH_TOKEN_LIFETIME` | 7 days | Matches PRD spec for session validity |
| `ROTATE_REFRESH_TOKENS` | `True` | Issues a new refresh token on every use |
| `BLACKLIST_AFTER_ROTATION` | `True` | Old refresh tokens are invalidated after rotation — prevents replay attacks |

---

## 6. Migration Output

```
Migrations for 'users':
  apps/users/migrations/0001_initial.py
    - Create model User
    - Create model UserProfile
```

The migration was generated cleanly by Django 4.2.30 using the `.venv` virtual environment. Note: A PostgreSQL `Connection Refused` warning appeared during migration generation — this is expected because there is no local PostgreSQL instance running yet. The migration **file** is correctly generated and will apply cleanly once PostgreSQL is started using the credentials in `.env`.

---

## 7. System Check Result

```
System check identified no issues (0 silenced).
```

Django's full system check passes with zero errors or warnings, confirming:
- `AUTH_USER_MODEL` is correctly wired to `apps.users.User`
- `rest_framework_simplejwt.token_blacklist` is correctly installed and resolvable
- All model relationships are valid
- No conflicting settings remain

---

## 8. Remaining Sprint 1 Tasks

The following tasks remain before Sprint 1 is complete:

| Task ID | Description | Status |
| :--- | :--- | :--- |
| **TSK-2.3** | Custom HTTP-only cookie JWT authentication backend | ⬜ Not Started |
| **TSK-2.4** | Auth API endpoints (Register, Login, Logout, Token Refresh) | ⬜ Not Started |
| **TSK-2.5** | Frontend Axios client auth integration | ⬜ Not Started |
| **TSK-2.6** | Frontend Login & Register UI screens | ⬜ Not Started |
| **TSK-3.1** | `UserProfile` API serializers and service layer | ⬜ Not Started |
| **TSK-3.2** | Profile retrieval & address update API views | ⬜ Not Started |
| **TSK-3.5** | Frontend user dashboard with booking/order history | ⬜ Not Started |

---

## 9. Next Steps

When ready to proceed to **TSK-2.3 and TSK-2.4**, the following actions are required:

1. Create `apps/users/serializers.py` — define `RegisterSerializer` and `LoginSerializer` with field-level validation.
2. Create `apps/users/authentication.py` — implement custom `JWTCookieAuthentication` backend class that reads the `access_token` cookie.
3. Create `apps/users/views.py` — implement `RegisterView`, `LoginView`, `LogoutView`, and `TokenRefreshView`.
4. Create `apps/users/urls.py` — define auth URL patterns.
5. Wire `apps/users/urls.py` into `config/urls.py` under `/api/v1/auth/`.
6. Start the local PostgreSQL instance and run `python manage.py migrate` to apply migrations to the database.
