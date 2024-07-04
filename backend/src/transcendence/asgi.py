import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from events.consumersChat import ChatConsumer
from events.consumersNotify import NotificationsConsumer

from events.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence.settings')

# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     "websocket": AuthMiddlewareStack(
#         URLRouter([
#             path("ws/chat/", ChatConsumer.as_asgi()),
#             path("ws/notifications/", NotificationsConsumer.as_asgi()),
#         ])
#     ),
# })

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})

