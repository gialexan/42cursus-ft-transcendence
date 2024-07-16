from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_mfa, name='create_mfa'),
    path('validate/', views.validate_mfa, name='validate_mfa'),
]
