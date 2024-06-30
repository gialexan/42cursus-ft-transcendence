from django.urls import path
from . import views

urlpatterns = [
    path('login-form/', views.login_form, name='login_form'),
    path('register/', views.register, name='register'),
    path('validate-jwt/', views.validate_jwt, name='validate_jwt'),
    path('validate-oauth-login/', views.validate_oauth_login, name='validate_oauth_login'),

    path('player-info/', views.player_info, name='player_info'),
    path('player-score/', views.player_score, name='player_score')
]
