from django.contrib import admin
from .models import GameRoom

@admin.register(GameRoom)
class GameRoomAdmin(admin.ModelAdmin):
    list_display = ('uuid_game_room', 'game_room_description', 'game_room_status', 'game_room_type', 'uuid_player_1', 'uuid_player_2', 'uuid_player_3', 'uuid_player_4')
