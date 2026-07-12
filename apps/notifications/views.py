from django.core.mail import send_mail
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListAPIView(generics.ListAPIView):
    """
    GET /notifications/
    Returns the authenticated user's notifications, newest first.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationMarkReadAPIView(APIView):
    """
    PATCH /notifications/<uuid:id>/read/
    Marks a single notification as read.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, id, *args, **kwargs):
        try:
            notification = Notification.objects.get(id=id, user=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        notification.is_read = True
        notification.save(update_fields=["is_read", "updated_at"])
        return Response(
            {"detail": "Notification marked as read."},
            status=status.HTTP_200_OK,
        )


class NotificationMarkAllReadAPIView(APIView):
    """
    PATCH /notifications/mark-all-read/
    Marks all of the authenticated user's notifications as read.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def patch(self, request, *args, **kwargs):
        unread_qs = Notification.objects.filter(user=request.user, is_read=False)
        count = unread_qs.update(is_read=True, updated_at=timezone.now())
        return Response(
            {"detail": f"{count} notifications marked as read."},
            status=status.HTTP_200_OK,
        )


class NotificationUnreadCountAPIView(APIView):
    """
    GET /notifications/unread-count/
    Returns the number of unread notifications for the authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": count}, status=status.HTTP_200_OK)


def send_notification_email(user_email: str, title: str, message: str, notification: Notification) -> None:
    """
    Helper to send an email using Django's ``send_mail`` utility.

    * Sends the email.
    * Updates ``notification.status`` to ``SENT`` on success or ``FAILED`` on exception.
    """
    try:
        send_mail(
            subject=title,
            message=message,
            from_email=None,  # Uses DEFAULT_FROM_EMAIL from settings
            recipient_list=[user_email],
            fail_silently=False,
        )
        notification.status = Notification.Status.SENT
    except Exception:  # pragma: no cover
        notification.status = Notification.Status.FAILED
    finally:
        notification.save(update_fields=["status", "updated_at"])
