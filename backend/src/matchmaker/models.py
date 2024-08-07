from django.db import models
import uuid

class GameRoom(models.Model):
    uuid_game_room = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    game_room_description = models.CharField(max_length=255, blank=True, null=True)
    game_room_status = models.IntegerField(default=0) # 0 - aberta - 1 fechada
    game_room_type = models.IntegerField(default=0) # 0 - default, 1 - wall, 2 - ai, 3 - pvp
    uuid_player_1 = models.UUIDField(blank=True, null=True)
    uuid_player_2 = models.UUIDField(blank=True, null=True)
    uuid_player_3 = models.UUIDField(blank=True, null=True)
    uuid_player_4 = models.UUIDField(blank=True, null=True)
    score_player_1 = models.IntegerField(default=0)
    score_player_2 = models.IntegerField(default=0)
    score_player_3 = models.IntegerField(default=0)
    score_player_4 = models.IntegerField(default=0)

    def __str__(self):
        return f'Game Room {self.uuid_game_room}'
