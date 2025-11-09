import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Chat, Message

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"
        self.user = self.scope["user"]
        print(self.user)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Загружаем историю и имя собеседника
        messages = await self.get_chat_history(self.room_name)
        other_user = await self.get_other_user(self.room_name, self.user)

        await self.send(text_data=json.dumps({
            "type": "chat_history",
            "messages": messages,
            "otherUser": {
                "first_name": other_user.first_name if other_user else "",
                "last_name": other_user.last_name if other_user else "",
                "username": other_user.username if other_user else "Неизвестный"
            }
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message")
        sender_username = data.get("sender")

        sender = await self.get_user_by_username(sender_username)
        if not sender:
            return

        chat = await self.get_chat(self.room_name)
        saved_message = await self.create_message(chat, sender, message)

        # Рассылаем всем в комнате
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": {
                    "id": saved_message.id,
                    "text": saved_message.text,
                    "sender": sender.username,
                    "senderId": sender.id,
                    "created_at": saved_message.created_at.isoformat(),
                },
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"],
        }))

    # -------------------- DB HELPERS --------------------

    @database_sync_to_async
    def get_user_by_username(self, username):
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def get_chat(self, room_name):
        try:
            return Chat.objects.get(id=room_name)
        except Chat.DoesNotExist:
            return None

    @database_sync_to_async
    def get_other_user(self, room_name, current_user):
        chat = Chat.objects.get(id=room_name)
        return chat.participants.exclude(id=current_user.id).first()

    @database_sync_to_async
    def get_chat_history(self, room_name):
        messages = Message.objects.filter(chat_id=room_name).order_by("created_at")
        return [
            {
                "id": msg.id,
                "text": msg.text,
                "sender": msg.sender.username,
                "senderId": msg.sender.id,
                "created_at": msg.created_at.isoformat(),
            }
            for msg in messages
        ]

    @database_sync_to_async
    def create_message(self, chat, sender, text):
        return Message.objects.create(chat=chat, sender=sender, text=text)
