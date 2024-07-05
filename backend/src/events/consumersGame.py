import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)

class GameConsumer(WebsocketConsumer):
    def connect(self):
        self.game_uuid = self.scope['url_route']['kwargs']['game_uuid']
        self.accept()
        async_to_sync(self.channel_layer.group_add)(
            f'game_{self.game_uuid}',
            self.channel_name
        )
        logger.info(f"Connected to game room: {self.game_uuid}")

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            f'game_{self.game_uuid}',
            self.channel_name
        )
        logger.info(f"Disconnected from game room: {self.game_uuid}")

    def receive(self, text_data):
        data = json.loads(text_data)
        logger.error(f"Data Received: {data}")
        if data['type'] == 'key_press':
            try:
                response = {
                    'type': 'key_press',
                    'player_uuid': data['player_uuid'],
                    'key': data['key'],
                    'message': f"Key {data['key']} pressed by {data['player_uuid']}"
                }
                logger.error(f"Key press received: {data}")

                async_to_sync(self.channel_layer.group_send)(
                    f'game_{self.game_uuid}',
                    {
                        'type': 'game_position',
                        'response': response
                    }
                )

            except KeyError as e:
                logger.error(f"KeyError: {str(e)}")

    def game_position(self, event):
        response = event['response']
        self.send(text_data=json.dumps({
            'type': 'game_report',
            'message': "oi",
            'response': response
        }))
