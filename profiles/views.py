from rest_framework import generics, viewsets, permissions
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from users.models import User
from profiles.serializers import ProfileSerializer, TutorListSerializer


@extend_schema(
    tags=["Профиль"],
    summary="Просмотр и редактирование профиля",
    description="""
Позволяет получить данные своего профиля (GET) и обновить их (PATCH).
Редактировать можно bio, предметы (subject_ids) и цену за час.
""",
    responses={
        200: OpenApiResponse(response=ProfileSerializer, description="Успешно"),
        401: OpenApiResponse(description="Не авторизован"),
    },
)
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@extend_schema(tags=["Репетиторы"])
class TutorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(role="tutor", is_active=True)
    serializer_class = TutorListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        subject_id = self.request.query_params.get("subject")
        if subject_id:
            queryset = queryset.filter(subjects__id=subject_id)

        max_price = self.request.query_params.get("max_price")
        if max_price:
            queryset = queryset.filter(price_per_hour__lte=max_price)

        ordering = self.request.query_params.get("ordering")
        if ordering:
            queryset = queryset.order_by(ordering)

        return queryset
