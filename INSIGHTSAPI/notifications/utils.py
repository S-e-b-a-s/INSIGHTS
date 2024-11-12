"""Utility functions for the notifications app."""

from django.contrib.auth import get_user_model
from django.core.mail import mail_admins

from .models import Notification
from .serializers import NotificationSerializer

User = get_user_model()


def create_notification(title: str, message: str, user) -> Notification | None:
    """Create a notification for a user."""
    if not isinstance(user, User):
        raise ValueError("user must be an instance of User model.")
    # Check the if the notification is valid
    notification_serializer = NotificationSerializer(
        data={"title": title, "message": message}
    )
    if not notification_serializer.is_valid():
        mail_admins(
            f"Error al crear la notificación {title}",
            f"La notificación para el usuario {user.get_full_name()} no es válida: {notification_serializer.errors}",
        )
        return None
    # Create the notification
    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
    )
    return notification
