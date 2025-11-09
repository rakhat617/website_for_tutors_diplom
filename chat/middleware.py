from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import UntypedToken
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.db import close_old_connections
from jwt import decode as jwt_decode
from django.conf import settings

User = get_user_model()

@database_sync_to_async
def get_user(validated_token):
    user_id = validated_token["user_id"]
    return User.objects.get(id=user_id)


class JWTAuthMiddleware:
    """
    Middleware для аутентификации WebSocket по JWT.
    Использует токен в query string: ?token=...
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        token_list = query_params.get("token")

        if token_list:
            token = token_list[0]
            try:
                validated_token = UntypedToken(token)
                decoded_data = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                scope["user"] = await get_user(decoded_data)
            except Exception as e:
                print("❌ JWT ошибка:", e)
                scope["user"] = None
        else:
            scope["user"] = None

        close_old_connections()

        inner = self.inner
        return await inner(scope, receive, send)
