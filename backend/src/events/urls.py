from django.urls import path
from . import views
from django.urls import path
from .consumers import ChatConsumer
from .consumers import NotificationsConsumer

urlpatterns = [
    path('chat/', ChatConsumer),
    path('notification/', NotificationsConsumer),
]
