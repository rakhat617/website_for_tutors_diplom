from rest_framework import serializers
from lessons.models import TimeSlot

class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ["id", "tutor", "start_time", "end_time", "is_booked"]
        read_only_fields = ["tutor", "is_booked"]
