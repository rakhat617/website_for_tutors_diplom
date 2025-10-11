from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from users.models import User


@receiver(post_save, sender=User)
def create_activation_code(sender, instance, created, **kwargs):

    if created and not instance.is_active:
        activation_link = f"{settings.FRONTEND_URL}/auth/activate/{instance.activation_code}"
        send_mail(
            subject="Активация аккаунта",
            message=f"Привет, {instance.username}!\n\nПерейдите по ссылке, чтобы активировать ваш аккаунт:\n{activation_link}",
            from_email="noreply@example.com",
            recipient_list=[instance.email],
        )
