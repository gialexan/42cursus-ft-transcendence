from django.urls import re_path
from . import consumersChat
from . import consumersNotify

websocket_urlpatterns = [
    re_path(r'ws/chat/$', consumersChat.ChatConsumer.as_asgi()),
    re_path(r'ws/notifications/(?P<user_uuid>[0-9a-f-]+)/$', consumersNotify.NotificationsConsumer.as_asgi()),
]