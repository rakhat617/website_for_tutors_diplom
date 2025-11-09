from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import TimeSlot
from .serializers import TimeSlotSerializer
from django.utils.dateparse import parse_date

class TimeSlotListCreateView(generics.ListCreateAPIView):
    """
    GET: Любой авторизованный пользователь может просмотреть расписание репетитора
         через ?tutor_id=... и ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
    POST: Только репетитор может добавлять свои слоты
    """
    serializer_class = TimeSlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = TimeSlot.objects.all()

        # Фильтрация по репетитору
        tutor_id = self.request.query_params.get("tutor_id")
        if tutor_id:
            queryset = queryset.filter(tutor_id=tutor_id)
        else:
            # Если не указан, возвращаем слоты текущего пользователя
            queryset = queryset.filter(tutor=self.request.user)

        # Фильтрация по дате
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            start = parse_date(start_date)
            if start:
                queryset = queryset.filter(start_time__date__gte=start)
        if end_date:
            end = parse_date(end_date)
            if end:
                queryset = queryset.filter(start_time__date__lte=end)

        return queryset.order_by("start_time")

    def perform_create(self, serializer):
        if self.request.user.role != "tutor":
            raise PermissionDenied("Только репетитор может добавлять слоты.")
        serializer.save(tutor=self.request.user)


class TimeSlotDeleteView(generics.DestroyAPIView):
    """
    DELETE: Только сам репетитор может удалить свой слот.
    """
    serializer_class = TimeSlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TimeSlot.objects.filter(tutor=self.request.user)

    def perform_destroy(self, instance):
        if instance.tutor != self.request.user:
            raise PermissionDenied("Вы не можете удалить слот другого репетитора.")
        instance.delete()

class TimeSlotListByTutorView(generics.ListAPIView):
    serializer_class = TimeSlotSerializer
    permission_classes = [permissions.AllowAny]  # или IsAuthenticated

    def get_queryset(self):
        tutor_id = self.kwargs["tutor_id"]
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")

        qs = TimeSlot.objects.filter(tutor_id=tutor_id)

        if start_date:
            qs = qs.filter(start_time__date__gte=start_date)
        if end_date:
            qs = qs.filter(start_time__date__lte=end_date)

        return qs.order_by("start_time")
