from django.conf import settings
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.shortcuts import get_object_or_404
from .models import User
from django.contrib.auth import authenticate
from django.db import transaction
from .serializers import RegisterSerializer
from .models import UserProfile
from .serializers import UserDetailSerializer, UserProfileSerializer


def _set_auth_cookies(response, access_token, refresh_token):
    """Helper: write JWT tokens into secure HTTP-only cookies."""
    response.set_cookie(
        key='access_token',
        value=str(access_token),
        httponly=True,
        secure=True,
        samesite='None',
        max_age=15 * 60,  # 15 minutes
    )
    response.set_cookie(
        key='refresh_token',
        value=str(refresh_token),
        httponly=True,
        secure=True,
        samesite='None',
        max_age=7 * 24 * 60 * 60,  # 7 days
    )


class RegisterView(generics.CreateAPIView):
    """Register a new user and return JWT tokens in HTTP-only cookies."""
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        response = Response(
            {
                "detail": "Registration successful.",
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "phone_number": user.phone_number,
                    "is_student_verified": user.is_student_verified,
                    "is_staff": user.is_staff,
                }
            },
            status=status.HTTP_201_CREATED,
        )
        _set_auth_cookies(response, access, refresh)
        return response


class LoginView(APIView):
    """Login with email + password — returns JWT tokens in HTTP-only cookies."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {"detail": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"detail": "Account is disabled."},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        response = Response(
            {
                "detail": "Login successful.",
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "phone_number": user.phone_number,
                    "is_student_verified": user.is_student_verified,
                    "is_staff": user.is_staff,
                }
            },
            status=status.HTTP_200_OK,
        )
        _set_auth_cookies(response, access, refresh)
        return response


class LogoutView(APIView):
    """Logout — blacklist refresh token and clear auth cookies."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Try to blacklist from cookie first, then from body
        refresh_token = (
            request.COOKIES.get('refresh_token')
            or request.data.get('refresh')
        )

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass  # Already blacklisted or invalid — still clear cookies

        response = Response(
            {"detail": "Logout successful."},
            status=status.HTTP_205_RESET_CONTENT,
        )
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response


class CustomTokenRefreshView(APIView):
    """Read refresh token from cookie, issue new token pair into cookies."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = (
            request.COOKIES.get('refresh_token')
            or request.data.get('refresh')
        )

        if not refresh_token:
            return Response(
                {"detail": "Refresh token not provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(refresh_token)
            access = refresh.access_token
        except (TokenError, InvalidToken):
            return Response(
                {"detail": "Refresh token is invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        response = Response(
            {"detail": "Token refreshed successfully."},
            status=status.HTTP_200_OK,
        )
        _set_auth_cookies(response, access, refresh)
        return response


class MeView(APIView):
    """Return the currently authenticated user's profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        return Response(
            {
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone_number": user.phone_number,
                "is_student_verified": user.is_student_verified,
                "is_staff": user.is_staff,
                "created_at": user.created_at,
            }
        )


class ProfileView(APIView):
    """GET /auth/profile/ — full profile with UserProfile nested."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)


class ProfileUpdateView(APIView):
    """PATCH /auth/profile/update/ — update name, phone, delivery address."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        user = request.user
        user_fields = {}
        allowed_user_fields = ['first_name', 'last_name', 'phone_number']
        for field in allowed_user_fields:
            if field in request.data:
                user_fields[field] = request.data[field]

        if user_fields:
            for field, value in user_fields.items():
                setattr(user, field, value)
            user.save(update_fields=list(user_fields.keys()))

        profile_fields = {}
        if 'default_delivery_address' in request.data:
            profile_fields['default_delivery_address'] = request.data['default_delivery_address']

        if profile_fields:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            for field, value in profile_fields.items():
                setattr(profile, field, value)
            profile.save(update_fields=list(profile_fields.keys()))

        serializer = UserDetailSerializer(user)
        return Response(serializer.data)

class AdminUserListAPIView(generics.ListAPIView):
    """GET /auth/admin/users/ — list all users"""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by('-created_at').values(
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'is_staff', 'is_active', 'created_at'
        )
        return Response(list(users))


class AdminCreateStaffAPIView(APIView):
    """POST /auth/admin/create-staff/ — create new staff user"""
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        phone_number = request.data.get('phone_number', '').strip()

        if not all([email, password, first_name, last_name, phone_number]):
            return Response(
                {"detail": "All fields are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"detail": "A user with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            is_staff=True,
        )
        return Response({
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_staff": user.is_staff,
        }, status=status.HTTP_201_CREATED)


class AdminToggleStaffAPIView(APIView):
    """PATCH /auth/admin/users/<id>/toggle-staff/ — make/remove staff"""
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, id):
        user = get_object_or_404(User, id=id)

        if user == request.user:
            return Response(
                {"detail": "You cannot change your own staff status."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.is_staff = not user.is_staff
        user.save(update_fields=['is_staff'])
        return Response({
            "id": str(user.id),
            "email": user.email,
            "is_staff": user.is_staff,
        })