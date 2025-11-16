# lessons/signals.py
# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from django.utils import timezone
# from .models import Booking, Lesson

# @receiver(post_save, sender=Booking)
# def create_lesson_after_booking(sender, instance, created, **kwargs):
#     """
#     Создаём Lesson автоматически, когда статус accepted
#     """
#     if instance.status == "accepted":
#         Lesson.objects.create(
#             booking=instance,
#             tutor=instance.timeslot.tutor,
#             student=instance.student,
#             subject=instance.subject,
#             start_time=instance.timeslot.start_time,
#             end_time=instance.timeslot.end_time,
#             status="scheduled" 
#         )
