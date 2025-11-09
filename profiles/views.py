from rest_framework import generics, viewsets, permissions, filters
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from django_filters.rest_framework import DjangoFilterBackend

from users.models import User, Subject
from profiles.serializers import ProfileSerializer, TutorListSerializer, SubjectSerializer
from profiles.filters import TutorFilter
from profiles.pagination import TutorPagination

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


@extend_schema(
    tags=["Предметы"],
    summary="Список всех предметов",
    description="Возвращает список всех предметов, которые могут выбрать репетиторы.",
    responses={200: OpenApiResponse(response=SubjectSerializer)},
)
class SubjectListView(generics.ListAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.AllowAny]


# class TutorViewSet(viewsets.ReadOnlyModelViewSet):
#     queryset = User.objects.filter(role="tutor", is_active=True)
#     serializer_class = TutorListSerializer
#     permission_classes = [permissions.AllowAny]

#     def get_queryset(self):
#         queryset = super().get_queryset()
#         subject_id = self.request.query_params.get("subject")
#         if subject_id:
#             queryset = queryset.filter(subjects__id=subject_id)

#         max_price = self.request.query_params.get("max_price")
#         if max_price:
#             queryset = queryset.filter(price_per_hour__lte=max_price)

#         ordering = self.request.query_params.get("ordering")
#         if ordering:
#             queryset = queryset.order_by(ordering)

#         return queryset


@extend_schema(tags=["Репетиторы"])
class TutorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        User.objects.filter(role="tutor", is_active=True)
        .select_related()                # для ForeignKey (если будут, напр. city или avatar)
        .prefetch_related("subjects")    # для ManyToManyField
    )
    serializer_class = TutorListSerializer
    permission_classes = [permissions.AllowAny]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = TutorFilter
    ordering_fields = ["price_per_hour", "rating", "username"]
    ordering = ["-rating"]  # по умолчанию сортировка по рейтингу (лучшие сверху)
    pagination_class = TutorPagination


@extend_schema(
    tags=["Профиль"],
    summary="Просмотр профиля репетитора",
    description="Возвращает публичные данные конкретного репетитора по ID.",
    responses={200: OpenApiResponse(response=ProfileSerializer)},
)
class PublicProfileView(generics.RetrieveAPIView):
    queryset = User.objects.filter(role="tutor", is_active=True)
    serializer_class = ProfileSerializer
    permission_classes = [permissions.AllowAny]