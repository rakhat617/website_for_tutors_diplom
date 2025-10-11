from django.contrib import admin

from lessons.models import LessonSlot
from lessons.models import Booking

admin.site.register(LessonSlot)
admin.site.register(Booking)

