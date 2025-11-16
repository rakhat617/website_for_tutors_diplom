from rest_framework import generics, viewsets, permissions, filters
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models

from users.models import User, Subject, Review
from profiles.serializers import ProfileSerializer, TutorListSerializer, SubjectSerializer, ReviewSerializer
from profiles.filters import TutorFilter
from profiles.pagination import TutorPagination
from lessons.models import Lesson

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
    summary="Просмотр и обновление публичного профиля репетитора",
    description="Возвращает публичные данные конкретного репетитора по ID. Позволяет обновлять профиль через PATCH/PUT (только авторизованный пользователь).",
    responses={200: OpenApiResponse(response=ProfileSerializer)},
)
class PublicProfileView(generics.RetrieveUpdateAPIView):  # <- поменяли на RetrieveUpdateAPIView
    queryset = User.objects.filter(is_active=True)
    serializer_class = ProfileSerializer

    def get_permissions(self):
        """
        Разрешаем редактирование только авторизованному пользователю,
        а просмотр публичного профиля любому.
        """
        if self.request.method in ["PATCH", "PUT"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class CreateReviewView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        student = request.user
        tutor_id = request.data.get("tutor")
        rating = request.data.get("rating")
        comment = request.data.get("comment", "")

        # Проверяем что есть tutor_id и rating
        if not tutor_id or not rating:
            return Response({"detail": "Tutor и rating обязательны."}, status=400)

        # Проверяем количество уроков студента с этим репетитором
        lesson_count = Lesson.objects.filter(
            tutor_id=tutor_id, student=student, status__in=[Lesson.STATUS_COMPLETED]
        ).count()
        if lesson_count < 3:
            return Response({"detail": "Нельзя оставить отзыв — нужно минимум 3 завершенных уроков."}, status=400)

        # Проверяем, что студент ещё не оставлял отзыв
        if Review.objects.filter(tutor_id=tutor_id, student=student).exists():
            return Response({"detail": "Вы уже оставили отзыв."}, status=400)

        # Создаём отзыв
        review = Review.objects.create(tutor_id=tutor_id, student=student, rating=rating, comment=comment)

        # Пересчёт среднего рейтинга
        avg = Review.objects.filter(tutor_id=tutor_id).aggregate(models.Avg("rating"))["rating__avg"]
        tutor = review.tutor
        tutor.rating = avg
        tutor.save(update_fields=["rating"])

        serializer = self.get_serializer(review)
        return Response(serializer.data, status=201)
    

class TutorReviewsView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        tutor_id = self.kwargs['pk']
        return Review.objects.filter(tutor_id=tutor_id).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(student=self.request.user, tutor_id=self.kwargs['pk'])


class IsEligibleToReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        # pk — это id репетитора
        count = Lesson.objects.filter(
            tutor_id=pk,
            student=request.user,
            status__in=[Lesson.STATUS_COMPLETED]
        ).count()
        has_reviewed = Review.objects.filter(tutor_id=pk, student=request.user).exists()
        return Response({"count": count, "has_reviewed": has_reviewed})