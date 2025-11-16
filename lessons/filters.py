from django_filters import rest_framework as filters
from django.db.models import Q

from users.models import Subject
from lessons.models import Booking, Lesson

class BookingFilter(filters.FilterSet):
    STATUS_CHOICES = [
        ("pending", "Ожидает"),
        ("accepted", "Принятые"),
        ("rejected", "Отклонённые"),
        ("cancelled", "Отмененные"),
    ]

    status = filters.ChoiceFilter(choices=STATUS_CHOICES)
    subject = filters.ModelChoiceFilter(queryset=Subject.objects.all())
    search = filters.CharFilter(method="filter_by_user_name", label="Поиск по имени/фамилии/username")

    class Meta:
        model = Booking
        fields = ["status", "subject", "search"]

    def filter_by_user_name(self, queryset, name, value):
        user = self.request.user
        if user.role == "tutor":
            # фильтруем студентов
            return queryset.filter(
                Q(student__first_name__icontains=value)
                | Q(student__last_name__icontains=value)
                | Q(student__username__icontains=value)
            )
        else:
            # фильтруем репетиторов
            return queryset.filter(
                Q(timeslot__tutor__first_name__icontains=value)
                | Q(timeslot__tutor__last_name__icontains=value)
                | Q(timeslot__tutor__username__icontains=value)
            )


class LessonFilter(filters.FilterSet):
    STATUS_CHOICES = [
        ("scheduled", "Запланирован"),
        ("in_progress", "В процессе"),
        ("completed", "Завершён"),
        ("missed", "Пропущен"),
    ]
    
    status = filters.ChoiceFilter(choices=STATUS_CHOICES)
    subject = filters.ModelChoiceFilter(queryset=Subject.objects.all())
    search = filters.CharFilter(method="filter_by_user_name", label="Поиск по имени/фамилии/username")

    class Meta:
        model = Lesson
        fields = ["status", "subject", "search"]

    def filter_by_user_name(self, queryset, name, value):
        user = self.request.user
        if user.role == "tutor":
            # фильтруем студентов
            return queryset.filter(
                Q(student__first_name__icontains=value)
                | Q(student__last_name__icontains=value)
                | Q(student__username__icontains=value)
            )
        else:
            # фильтруем репетиторов
            return queryset.filter(
                Q(timeslot__tutor__first_name__icontains=value)
                | Q(timeslot__tutor__last_name__icontains=value)
                | Q(timeslot__tutor__username__icontains=value)
            )
