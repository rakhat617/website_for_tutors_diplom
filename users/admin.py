from django.contrib import admin

from users.models import User
from users.models import Subject, Review

admin.site.register(User)
admin.site.register(Subject)
admin.site.register(Review)
