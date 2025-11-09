from django.urls import path
from .views import ChatListView, CreateOrGetChat, MessageListView

urlpatterns = [
    path("", ChatListView.as_view(), name="chat-list"),
    path("create_or_get/", CreateOrGetChat.as_view(), name="create-or-get-chat"),
    path("<uuid:chat_id>/messages/", MessageListView.as_view(), name="chat-messages"),
]
