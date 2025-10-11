from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.utils import extend_schema, OpenApiResponse

from users.serializers import CustomTokenObtainPairSerializer, RegisterSerializer, ActivateAccountSerializer
from users.models import User

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    @extend_schema(
        tags=["Аутентификация"],
        summary="Получить JWT токены",
        description="Эндпоинт для входа. Принимает логин/почту и пароль, возвращает пару access/refresh токенов.",
        request=CustomTokenObtainPairSerializer,
        responses={200: CustomTokenObtainPairSerializer},
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
    
class CustomTokenRefreshView(TokenRefreshView):
    @extend_schema(
        tags=["Аутентификация"],
        summary="Обновление JWT токена",
        description="Передайте refresh-токен, чтобы получить новый access-токен.",
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Аутентификация"],
        summary="Регистрация пользователя",
        description="Создаёт нового пользователя и отправляет письмо для активации аккаунта.",
        request=RegisterSerializer,
        responses={201: dict},  # можно сделать отдельный serializer для ответа
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Пользователь создан. Проверьте почту для активации."},
            status=status.HTTP_201_CREATED
        )
    
# class ActivateAccountView(APIView):
#     permission_classes = [AllowAny]
    
#     @extend_schema(
#         tags=["Аутентификация"],
#         summary="Активация аккаунта",
#         description="Активирует аккаунт по коду, полученному на email.",
#         request=ActivateAccountSerializer,
#         responses={200: dict},
#     )
#     def post(self, request):
#         serializer = ActivateAccountSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         serializer.save()
#         return Response({"detail": "Аккаунт успешно активирован"}, status=status.HTTP_200_OK)

class ActivateAccountView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Аутентификация"],
        summary="Активация аккаунта",
        description="Активирует аккаунт по коду, полученному на email.",
        responses={
            200: OpenApiResponse(description="Аккаунт успешно активирован"),
            400: OpenApiResponse(description="Неверная или устаревшая ссылка"),
        },
    )
    def get(self, request, code):
        try:
            user = User.objects.get(activation_code=code)
        except User.DoesNotExist:
            return Response({"detail": "Неверная или устаревшая ссылка"}, status=status.HTTP_400_BAD_REQUEST)

        if user.is_active:
            return Response({"detail": "Аккаунт уже активирован."}, status=400)
        
        user.is_active = True
        user.activation_code = None
        user.save(update_fields=["is_active", "activation_code"])

        return Response({"detail": "Аккаунт успешно активирован!"}, status=status.HTTP_200_OK)
