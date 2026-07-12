from django.utils.deprecation import MiddlewareMixin

class AuthenticationMiddleware(MiddlewareMixin):
    """Placeholder authentication middleware.
    Currently relies on DRF SimpleJWT authentication classes.
    Can be extended for custom token handling.
    """
    def process_request(self, request):
        # No custom processing; placeholder for future extensions.
        return None
