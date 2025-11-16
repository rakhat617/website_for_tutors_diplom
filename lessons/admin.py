from django.contrib import admin

from lessons.models import TimeSlot, Booking, Lesson

admin.site.register(TimeSlot)
admin.site.register(Booking)
admin.site.register(Lesson)
