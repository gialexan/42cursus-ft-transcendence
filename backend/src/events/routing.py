from django.urls import re_path
from . import consumersChat
from . import consumersNotify
from . import consumersGame

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<user_uuid>[0-9a-f-]+)/$', consumersChat.ChatConsumer.as_asgi()),
    re_path(r'ws/notifications/(?P<user_uuid>[0-9a-f-]+)/$', consumersNotify.NotificationsConsumer.as_asgi()),
    re_path(r'ws/game/(?P<game_uuid>[0-9a-f-]+)/$', consumersGame.GameConsumer.as_asgi()),
]