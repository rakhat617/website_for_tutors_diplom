from rest_framework.routers import DefaultRouter
from django.urls import path, include

from profiles.views import ProfileView, TutorViewSet

router = DefaultRouter()
router.register("tutors", TutorViewSet, basename="tutors")

urlpatterns = [
    path("", include(router.urls)),
    path("me/", ProfileView.as_view(), name="profile"),
]