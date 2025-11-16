from rest_framework.routers import DefaultRouter
from django.urls import path, include

from profiles.views import (ProfileView, TutorViewSet, SubjectListView, PublicProfileView, 
                            CreateReviewView, TutorReviewsView, IsEligibleToReviewView)

router = DefaultRouter()
router.register("tutors", TutorViewSet, basename="tutors")

urlpatterns = [
    path("", include(router.urls)),
    path("subjects/", SubjectListView.as_view(), name="subject-list"),
    path("me/", ProfileView.as_view(), name="profile"),
    path('<int:pk>/', PublicProfileView.as_view(), name='public-profile'),
    path("reviews/", CreateReviewView.as_view(), name="create-review"),
    path('<int:pk>/reviews/', TutorReviewsView.as_view(), name='tutor-reviews'),
    path('<int:pk>/is_eligible/', IsEligibleToReviewView.as_view(), name='lessons-count-for-user'),
]