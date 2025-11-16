from django.urls import path
from lessons.views import (
    TimeSlotListCreateView, TimeSlotDeleteView, TimeSlotListByTutorView,
    BookingListCreateView, BookingUpdateStatusView, StudentCalendarView, LessonListView, LessonRetrieveUpdateView
)

urlpatterns = [
    path("timeslots/", TimeSlotListCreateView.as_view(), name="timeslot-list-create"),
    path("timeslots/<int:pk>/", TimeSlotDeleteView.as_view(), name="timeslot-delete"),
    path("tutors/<int:tutor_id>/timeslots/", TimeSlotListByTutorView.as_view(), name="tutor-timeslots"),
    path("bookings/", BookingListCreateView.as_view(), name="booking-list-create"),
    path("bookings/<int:pk>/", BookingUpdateStatusView.as_view(), name="booking-update-status"),
    path("student-timeslots/", StudentCalendarView.as_view(), name="student-timeslot-list"),
    path("", LessonListView.as_view(), name="lessons-list"),
    path("<int:pk>/", LessonRetrieveUpdateView.as_view(), name="lesson-update"),

]
