from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError, AuthenticationFailed


class CookieJWTAuthentication(JWTAuthentication):
    """
    Reads the JWT access token from the 'access_token' HTTP-only cookie
    instead of the Authorization header.
    Falls back to Authorization header if cookie is absent (useful for Postman).
    """

    def authenticate(self, request):
        # Try cookie first
        raw_token = request.COOKIES.get('access_token')

        if raw_token is None:
            # Fall back to default header-based auth
            return super().authenticate(request)
        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
        except (InvalidToken, TokenError, AuthenticationFailed):
            return None

        return user, validated_token
