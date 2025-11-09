from rest_framework import serializers
from lessons.models import TimeSlot, Booking
from profiles.serializers import TutorListSerializer
from users.models import Subject

class TimeSlotSerializer(serializers.ModelSerializer):
    tutor = TutorListSerializer(read_only=True)
    class Meta:
        model = TimeSlot
        fields = ["id", "tutor", "start_time", "end_time", "is_booked"]
        read_only_fields = ["tutor", "is_booked"]


# class BookingSerializer(serializers.ModelSerializer):
#     timeslot = TimeSlotSerializer(read_only=True)
#     student_name = serializers.CharField(source="student.username", read_only=True)
#     tutor_name = serializers.CharField(source="timeslot.tutor.username", read_only=True)

#     class Meta:
#         model = Booking
#         fields = [
#             "id",
#             "student",
#             "student_name",
#             "timeslot",
#             "tutor_name",
#             "status",
#             "created_at",
#         ]
#         read_only_fields = ["student", "created_at"]

#     def create(self, validated_data):
#         user = self.context["request"].user
#         validated_data["student"] = user
#         booking = Booking.objects.create(**validated_data)
#         return booking

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
        ]
        read_only_fields = ["student", "tutor", "subject", "status", "created_at"]

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