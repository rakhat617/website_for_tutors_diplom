from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from django.shortcuts import get_object_or_404
from .models import Chat, Message
from .serializers import ChatSerializer, MessageSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatListView(generics.ListAPIView):
    serializer_class = ChatSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Chat.objects.filter(participants=self.request.user).prefetch_related("participants", "messages")


class CreateOrGetChat(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tutor_id = request.data.get("tutor_id")
        tutor = get_object_or_404(User, id=tutor_id)
        chat, _ = Chat.get_or_create_between(request.user, tutor)
        return Response({"room_name": chat.room_name, "id": chat.id})


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        chat_id = self.kwargs["chat_id"]
        chat = get_object_or_404(Chat, id=chat_id, participants=self.request.user)
        return chat.messages.all()
