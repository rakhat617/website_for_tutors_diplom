from django.db import models

from users.models import User

class LessonSlot(models.Model):
    tutor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="slots")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_booked = models.BooleanField(default=False)

class Booking(models.Model):
    STATUS_CHOICES = (
        ("pending", "В ожидании"),
        ("confirmed", "Подтверждено"),
        ("completed", "Завершено"),
        ("canceled", "Отменено"),
    )

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    lesson_slot = models.ForeignKey(LessonSlot, on_delete=models.CASCADE, related_name="bookings")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    feedback = models.TextField(blank=True, null=True)
    rating = models.IntegerField(blank=True, null=True)  # студент может поставить оценку

