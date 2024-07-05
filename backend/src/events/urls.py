from django.urls import path
from . import views
from django.urls import path
from .consumersChat import ChatConsumer
from .consumersNotify import NotificationsConsumer
from .consumersGame import GameConsumer

urlpatterns = [
    path('chat/', ChatConsumer),
    path('notification/', NotificationsConsumer),
    path('game', GameConsumer)
]
