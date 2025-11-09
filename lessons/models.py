from django.db import models

from users.models import User

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
