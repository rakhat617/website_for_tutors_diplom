from rest_framework import generics, permissions, serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.utils.dateparse import parse_date
from django.db import transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend

from lessons.models import TimeSlot, Booking, Lesson
from lessons.serializers import TimeSlotSerializer, BookingSerializer, StudentTimeSlotSerializer, LessonSerializer
from lessons.filters import BookingFilter, LessonFilter
from lessons.tasks import send_booking_email


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
    permission_classes = [permissions.AllowAny]

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
    filter_backends = [DjangoFilterBackend]
    filterset_class = BookingFilter

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related(
            "timeslot", "student", "timeslot__tutor", "subject"
        )
        if user.role == "tutor":
            qs = qs.filter(timeslot__tutor=user)
        else:
            qs = qs.filter(student=user)
        return qs

    def perform_create(self, serializer):
        timeslot = serializer.validated_data["timeslot"]
        if Booking.objects.filter(
            student=self.request.user,
            timeslot__start_time=timeslot.start_time,
            status__in=["pending", "accepted"]
        ).exists():
            raise serializers.ValidationError("У вас уже есть занятие в это время.")
        
        booking = serializer.save(
            student=self.request.user,
            timeslot=timeslot,
            subject=serializer.validated_data.get("subject"),
            status="pending",
        )

        # Уведомляем репетитора о новой заявке
        if booking.timeslot.tutor.email:
            send_booking_email.delay(
                subject="Новая заявка на урок",
                template_name="emails/new_booking.txt",
                context={"booking_id": booking.id},
                recipient_list=[booking.timeslot.tutor.email],
            )


class BookingUpdateStatusView(generics.UpdateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Booking.objects.all()

    def update(self, request, *args, **kwargs):
        booking = self.get_object()
        user = request.user

        new_status = request.data.get("status")
        allowed_statuses = ["accepted", "rejected", "cancelled"]

        if new_status not in allowed_statuses:
            return Response({"detail": "Некорректный статус."}, status=status.HTTP_400_BAD_REQUEST)

        # Только репетитор своего слота или студент (для отмены) может менять
        if user.role == "tutor" and booking.timeslot.tutor != user:
            return Response({"detail": "Вы не можете изменить этот booking."}, status=status.HTTP_403_FORBIDDEN)

        if user.role == "student" and booking.student != user:
            return Response({"detail": "Вы не можете отменить чужой booking."}, status=status.HTTP_403_FORBIDDEN)

        # Студент не может отменять уже прошедший урок
        if booking.status == "accepted" and booking.timeslot.start_time <= timezone.now():
            return Response({"detail": "Вы не можете отменить уже начавшийся урок."}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            if new_status == "accepted":
                # Отменяем все остальные заявки на этот слот
                Booking.objects.filter(timeslot=booking.timeslot).exclude(id=booking.id).update(status="rejected")
                
                # Помечаем слот как забронированный
                booking.timeslot.is_booked = True
                booking.timeslot.save(update_fields=["is_booked"])

                # Уведомляем студента о принятии
                if booking.student.email:
                    send_booking_email.delay(
                        subject="Ваша заявка принята",
                        template_name="emails/booking_accepted.txt",
                        context={"booking_id": booking.id},
                        recipient_list=[booking.student.email],
                    )
                
                Lesson.objects.create(
                    tutor=booking.timeslot.tutor,
                    student=booking.student,
                    subject=booking.subject,
                    start_time=booking.timeslot.start_time,
                    end_time=booking.timeslot.end_time,
                    booking=booking,
                )
                
            elif new_status == "rejected":
                # Уведомляем студента об отказе
                if booking.student.email:
                    send_booking_email.delay(
                        subject="Ваша заявка отклонена",
                        template_name="emails/booking_rejected.txt",
                        context={"booking_id": booking.id},
                        recipient_list=[booking.student.email],
                    )
            elif new_status == "cancelled":
                if user.role == "student":
                    if booking.timeslot.tutor.email:
                        send_booking_email.delay(
                            subject="Студент отменил заявку",
                            template_name="emails/booking_cancelled_by_student.txt",
                            context={"booking_id": booking.id},
                            recipient_list=[booking.timeslot.tutor.email],
                        )
                # Если репетитор отменяет уже принятую заявку
                elif user.role == "tutor":
                    if booking.student.email:
                        send_booking_email.delay(
                            subject="Репетитор отменил урок",
                            template_name="emails/booking_cancelled_by_tutor.txt",
                            context={"booking_id": booking.id},
                            recipient_list=[booking.student.email],
                        )

                booking.booking_lesson.delete()
                booking.timeslot.is_booked = False
                booking.timeslot.save(update_fields=["is_booked"])

            # Обновляем статус текущей заявки
            booking.status = new_status
            booking.save(update_fields=["status"])

        return Response(BookingSerializer(booking).data)


class StudentCalendarView(generics.ListAPIView):
    serializer_class = StudentTimeSlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Booking.objects.filter(student=user).select_related(
            "timeslot", "timeslot__tutor", "subject"
        )


class LessonListView(generics.ListAPIView):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = LessonFilter

    def get_queryset(self):
        user = self.request.user

        if user.role == "tutor":
            return Lesson.objects.filter(tutor=user).order_by("-start_time")

        if user.role == "student":
            return Lesson.objects.filter(student=user).order_by("-start_time")

        return Lesson.objects.none()


class LessonRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Lesson.objects.all()

    def update(self, request, *args, **kwargs):
        lesson = self.get_object()
        user = request.user
        now = timezone.now()
        data = request.data.copy()

        # Ограничение: пропущенные уроки нельзя изменять
        if lesson.status == Lesson.STATUS_MISSED:
            return Response({"detail": "Нельзя редактировать пропущенный урок."}, status=403)

        # Статус: запланирован — только репетитор, только meeting_link
        if lesson.status == Lesson.STATUS_SCHEDULED:
            if user.role != "tutor":
                return Response({"detail": "Студент не может редактировать этот урок."}, status=403)
            allowed_fields = ["meeting_link"]

        # Статус: идет — только репетитор может менять статус
        elif lesson.status == Lesson.STATUS_IN_PROGRESS:
            if user.role != "tutor":
                return Response({"detail": "Студент не может редактировать этот урок."}, status=403)
            allowed_fields = ["status"]

            # Нельзя завершать до начала
            if now < lesson.start_time:
                return Response({"detail": "Нельзя завершить урок до его начала."}, status=403)

        # Статус: завершён
        elif lesson.status == Lesson.STATUS_COMPLETED:
            if user.role == "tutor":
                allowed_fields = ["homework"]
            elif user.role == "student":
                allowed_fields = ["student_rating", "student_feedback"]
            else:
                return Response({"detail": "Нет доступа."}, status=403)

        else:
            return Response({"detail": "Некорректный статус урока."}, status=400)

        # Чистим лишние поля
        for key in list(data.keys()):
            if key not in allowed_fields:
                data.pop(key)

        serializer = self.get_serializer(lesson, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)
