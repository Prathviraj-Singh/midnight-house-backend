from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static

def api_root(request):
    return JsonResponse({
        "name": "Midnight House API",
        "version": "1.0.0",
        "status": "online",
        "tagline": "Your Own Private Space"
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', api_root),
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/catalog/', include('apps.catalog.urls')),
    path('api/v1/cart/', include('apps.cart.urls')),
    path('api/v1/orders/', include('apps.orders.urls')),
    path('api/v1/bookings/', include('apps.bookings.urls')),
    path('api/v1/reviews/', include('apps.reviews.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/offers/', include('apps.offers.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)