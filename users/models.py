import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ("student", "Студент"),
        ("tutor", "Репетитор"),
    )
    email = models.EmailField(
        unique=True
        )
    is_active = models.BooleanField(
        default=False,
    )
    role = models.CharField(
        max_length=10, 
        choices=ROLE_CHOICES
        )
    bio = models.TextField(
        blank=True, 
        null=True
        )

    subjects = models.ManyToManyField(
        to="Subject", 
        blank=True
        )
    price_per_hour = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True
        )
    rating = models.FloatField(
        default=0
        )

    activation_code = models.UUIDField(
        unique=True, 
        default=uuid.uuid4,
        null=True,
        blank=True,
        verbose_name="код активации",
        )
    
    def save(self, *args, **kwargs):
        # Если это суперюзер — всегда активный
        if self.is_superuser:
            self.is_active = True
        super().save(*args, **kwargs)
        
    def __str__(self):
        return f"{self.username} ({self.role})"

class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
