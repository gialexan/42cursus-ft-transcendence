from django.urls import path
from . import views
from django.urls import path
from .consumers import ChatConsumer

urlpatterns = [
    path('chat/', ChatConsumer),
]
