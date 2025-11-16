from rest_framework import serializers
from django.contrib.auth import get_user_model

from users.models import Subject, Review

User = get_user_model()

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name"]


class ProfileSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)
    subject_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Subject.objects.all(),
        write_only=True,
        source="subjects"
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "role",
            "bio",
            "subjects",     # read-only список названий
            "subject_ids",  # write-only список id
            "price_per_hour",
            "rating",
        ]
        read_only_fields = ["id", "username", "email", "role"]


class ReviewSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "tutor", "student", "student_name", "rating", "comment", "created_at"]
        read_only_fields = ["student", "tutor", "created_at", "student_name"]


class TutorListSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)
    subject_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Subject.objects.all(),
        write_only=True,
        source="subjects"
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "bio",
            "subjects",     # read-only
            "subject_ids",  # write-only
            "price_per_hour",
            "rating",
        ]