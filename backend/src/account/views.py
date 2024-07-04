from django.shortcuts import render
from .models import CustomUser as User
import logging

logger = logging.getLogger(__name__)

def change_status_player(player_uuid, status):
    try:
        user = User.objects.get(user_uuid=player_uuid)
        user.status_player = status
        user.save()
        logger.info(f"Changed status_player for {user.username} to {status}")
    except User.DoesNotExist:
        logger.info(f"User with UUID {player_uuid} does not exist")
