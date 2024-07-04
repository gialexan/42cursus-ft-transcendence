from django.urls import path
from . import views
from django.urls import path
from .consumersChat import ChatConsumer
from .consumersNotify import NotificationsConsumer

urlpatterns = [
    path('chat/', ChatConsumer),
    path('notification/', NotificationsConsumer),
]
