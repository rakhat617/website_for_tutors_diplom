from rest_framework import serializers
from django.contrib.auth import get_user_model

from users.models import Subject

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
            "email",
            "role",
            "bio",
            "subjects",     # read-only список названий
            "subject_ids",  # write-only список id
            "price_per_hour",
            "rating",
        ]
        read_only_fields = ["id", "username", "email", "role", "rating"]


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
            "bio",
            "subjects",     # read-only
            "subject_ids",  # write-only
            "price_per_hour",
            "rating",
        ]
