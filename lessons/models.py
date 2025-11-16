from django.db import models
from django.utils import timezone

from users.models import User, Subject

class TimeSlot(models.Model):
    tutor = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name="time_slots")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_booked = models.BooleanField(default=False)

    class Meta:
        ordering = ["start_time"]
        unique_together = ("tutor", "start_time")

    def __str__(self):
        return f"{self.tutor} - {self.start_time.strftime('%Y-%m-%d %H:%M')}"


class Booking(models.Model):
    STATUS_CHOICES = [
        ("pending", "В ожидании"),
        ("accepted", "Принято"),
        ("rejected", "Отклонено"),
        ("cancelled", "Отменено")
    ]

    student = models.ForeignKey(
        to=User, on_delete=models.CASCADE, related_name="bookings_student"
    )
    timeslot = models.ForeignKey(
        to=TimeSlot, on_delete=models.CASCADE, related_name="bookings_timeslot"
    )
    subject = models.ForeignKey(to=Subject, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "timeslot")  # чтобы студент не мог дважды запросить один слот

    def __str__(self):
        return f"{self.student} → {self.timeslot} [{self.status}]"


class Lesson(models.Model):
    STATUS_SCHEDULED = "scheduled"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_COMPLETED = "completed"
    STATUS_MISSED = "missed"

    STATUS_CHOICES = [
        (STATUS_SCHEDULED, "Запланирован"),
        (STATUS_IN_PROGRESS, "В процессе"),
        (STATUS_COMPLETED, "Завершён"),
        (STATUS_MISSED, "Пропущен"),
    ]

    tutor = models.ForeignKey(
        to=User,
        on_delete=models.CASCADE,
        related_name="lessons_as_tutor",
        db_index=True,
    )
    student = models.ForeignKey(
        to=User,
        on_delete=models.CASCADE,
        related_name="lessons_as_student",
        db_index=True,
    )

    # subject – ссылка на модель Subject (у тебя она в users.models)
    subject = models.ForeignKey(
        to=Subject,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="lessons",
    )

    start_time = models.DateTimeField(db_index=True)
    end_time = models.DateTimeField(db_index=True)

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_SCHEDULED, db_index=True
    )

    # связь на заявку, если урок создан из Booking
    booking = models.OneToOneField(
        to=Booking,
        on_delete=models.CASCADE,
        related_name="booking_lesson",
        help_text="Из какой заявки создан урок (если создан из заявки)"
    )

    # дополнительные поля для отчётов / записи / ссылки на конференцию
    meeting_link = models.URLField(null=True, blank=True)
    homework = models.TextField(null=True, blank=True)

    student_rating = models.IntegerField(null=True, blank=True)  # от 1 до 5
    student_feedback = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_time"]
        indexes = [
            models.Index(fields=["tutor", "start_time"]),
            models.Index(fields=["student", "start_time"]),
        ]
        # Не обязательно, но можно запретить дублирование урока для одного и того же тьютора и времени:
        unique_together = (("tutor", "start_time"),)

    def __str__(self):
        return f"Lesson {self.id}: {self.tutor} — {self.student} @ {self.start_time.isoformat()}"
