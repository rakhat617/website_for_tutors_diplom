from django.urls import path
from lessons.views import TimeSlotListCreateView, TimeSlotDeleteView, TimeSlotListByTutorView

urlpatterns = [
    path("timeslots/", TimeSlotListCreateView.as_view(), name="timeslot-list-create"),
    path("timeslots/<int:pk>/", TimeSlotDeleteView.as_view(), name="timeslot-delete"),
    path("tutors/<int:tutor_id>/timeslots/", TimeSlotListByTutorView.as_view(), name="tutor-timeslots"),
]
