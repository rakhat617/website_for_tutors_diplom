from rest_framework.routers import DefaultRouter
from django.urls import path, include

from profiles.views import ProfileView, TutorViewSet, SubjectListView, PublicProfileView

router = DefaultRouter()
router.register("tutors", TutorViewSet, basename="tutors")

urlpatterns = [
    path("", include(router.urls)),
    path("subjects/", SubjectListView.as_view(), name="subject-list"),
    path("me/", ProfileView.as_view(), name="profile"),
    path('<int:pk>/', PublicProfileView.as_view(), name='public-profile'),
]