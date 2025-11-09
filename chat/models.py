from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Chat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participants = models.ManyToManyField(User, related_name="chats")
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def room_name(self):
        return f"chat_{self.id}"

    @classmethod
    def get_or_create_between(cls, user1, user2):
        chat = cls.objects.filter(participants=user1).filter(participants=user2).first()
        if chat:
            return chat, False
        chat = cls.objects.create()
        chat.participants.add(user1, user2)
        return chat, True

    def __str__(self):
        users = ", ".join([u.username for u in self.participants.all()])
        return f"Chat({users})"


class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender.username}: {self.text[:30]}"
