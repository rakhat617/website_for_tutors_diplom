from rest_framework import generics, permissions, serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from lessons.models import TimeSlot, Booking
from lessons.serializers import TimeSlotSerializer, BookingSerializer
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


class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "tutor":
            return Booking.objects.filter(timeslot__tutor=user).select_related("timeslot", "student")
        else:
            return Booking.objects.filter(student=user).select_related("timeslot", "timeslot__tutor")

    def perform_create(self, serializer):
        timeslot = serializer.validated_data["timeslot"]
        serializer.save(
            student=self.request.user,
            timeslot=timeslot,
            subject=serializer.validated_data.get("subject"),
            status="pending"
        )


class BookingUpdateStatusView(generics.UpdateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Booking.objects.all()

    def update(self, request, *args, **kwargs):
        booking = self.get_object()

        # Только репетитор своего слота может менять статус
        if booking.timeslot.tutor != request.user:
            return Response(
                {"detail": "Вы не можете изменить этот booking."},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_status = request.data.get("status")
        if new_status not in ["accepted", "rejected"]:
            return Response(
                {"detail": "Некорректный статус."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = new_status
        booking.save()

        # если приняли — слот становится забронированным
        if new_status == "accepted":
            booking.timeslot.is_booked = True
            booking.timeslot.save()

        return Response(BookingSerializer(booking).data)

