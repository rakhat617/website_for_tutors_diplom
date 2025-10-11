from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()


class UsernameOrEmailBackend(ModelBackend):
    """
    Позволяет логиниться и по username, и по email
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # пробуем по username
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            try:
                # если не найден → пробуем по email
                user = User.objects.get(email=username)
            except User.DoesNotExist:
                return None

        if user.check_password(password):
            return user
        return None
