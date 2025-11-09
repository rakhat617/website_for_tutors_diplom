from django.db import models

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
