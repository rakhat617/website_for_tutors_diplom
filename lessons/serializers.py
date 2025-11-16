from rest_framework import serializers
from lessons.models import TimeSlot, Booking, Lesson
from profiles.serializers import TutorListSerializer
from users.models import Subject
from users.serializers import UserLiteSerializer
from profiles.serializers import SubjectSerializer

class TimeSlotSerializer(serializers.ModelSerializer):
    tutor = TutorListSerializer(read_only=True)
    is_student_booked = serializers.SerializerMethodField()
    accepted_booking = serializers.SerializerMethodField()
    has_pending_booking = serializers.SerializerMethodField()
    pending_bookings = serializers.SerializerMethodField()

    class Meta:
        model = TimeSlot
        fields = ["id", "tutor", "start_time", "end_time", 
                  "is_booked", "is_student_booked", 
                  "accepted_booking", "has_pending_booking", "pending_bookings",]
        read_only_fields = ["tutor", "is_booked", "is_student_booked", 
                            "has_pending_booking", "accepted_booking", "pending_bookings",]
    
    def get_is_student_booked(self, obj):
        request = self.context.get("request")
        student = request.user if request else None
        if not student or student.role != "student":
            return False
        return Booking.objects.filter(
            student=student,
            timeslot__start_time=obj.start_time,
            status__in=["pending", "accepted"]
        ).exists()
    
    def get_has_pending_booking(self, obj):
        return obj.bookings_timeslot.filter(status="pending").exists()
    
    def get_accepted_booking(self, obj):
        booking = obj.bookings_timeslot.filter(status='accepted').select_related('student', 'subject').first()
        if booking:
            return {
                "id": booking.id,
                "student_first_name": booking.student.first_name,
                "student_last_name": booking.student.last_name,
                "student_username": booking.student.username,
                "student_id": booking.student.id,
                "subject_name": getattr(booking.subject, "name", "—"),
                "status": booking.status
            }
        return None
    
    def get_pending_bookings(self, obj):
        # Все "pending" заявки на этот слот
        pending = obj.bookings_timeslot.filter(status="pending").select_related("student", "subject")
        return [
            {
                "id": booking.id,
                "student_first_name": booking.student.first_name,
                "student_last_name": booking.student.last_name,
                "student_username": booking.student.username,
                "student_id": booking.student.id,
                "subject_name": getattr(booking.subject, "name", "—"),
                "status": booking.status
            }
            for booking in pending
        ]
    


class StudentTimeSlotSerializer(serializers.ModelSerializer):
    start_time = serializers.DateTimeField(source="timeslot.start_time")
    end_time = serializers.DateTimeField(source="timeslot.end_time")
    tutor_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = ["id", "start_time", "end_time", "timeslot", "tutor_name", "subject_name", "status"]

    def get_tutor_name(self, obj):
        return f"{obj.timeslot.tutor.first_name} {obj.timeslot.tutor.last_name}"

    def get_subject_name(self, obj):
        return obj.subject.name if obj.subject else None


class BookingSerializer(serializers.ModelSerializer):
    # читаем красиво: timeslot объект
    timeslot = TimeSlotSerializer(read_only=True)
    # пишем просто id
    timeslot_id = serializers.PrimaryKeyRelatedField(
        queryset=TimeSlot.objects.all(), source="timeslot", write_only=True
    )
    
    student = serializers.SerializerMethodField() 
    tutor = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), source="subject", write_only=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "student",
            "tutor",
            "timeslot",
            "timeslot_id",
            "status",
            "created_at",
            "subject",
            "subject_id",
            "status_display"
        ]
        read_only_fields = ["student", "tutor", "subject", "status", "created_at", "status_display"]

    def get_student(self, obj):
        return {
            "id": obj.student.id,
            "first_name": obj.student.first_name,
            "last_name": obj.student.last_name,
            "username": obj.student.username,
        }
    
    def get_tutor(self, obj):
        # Возвращаем инфо о репетиторе из timeslot
        tutor = obj.timeslot.tutor
        return {
            "id": tutor.id,
            "first_name": tutor.first_name,
            "last_name": tutor.last_name,
            "username": tutor.username,
            "subjects": [{"id": s.id, "name": s.name} for s in tutor.subjects.all()],
        }
    
    def get_subject(self, obj):
        return obj.subject.name if obj.subject else None
    

class LessonSerializer(serializers.ModelSerializer):
    tutor = UserLiteSerializer(read_only=True)
    student = UserLiteSerializer(read_only=True)
    subject = SubjectSerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Lesson
        fields = [
            "id", "booking", "tutor", "student", "subject",
            "start_time", "end_time",
            "meeting_link", "homework",
            "student_rating", "student_feedback",
            "status", "status_display",
        ]
        read_only_fields = [
            "id", "booking", "tutor", "student", "subject",
            "start_time", "end_time", "status_display"
        ]