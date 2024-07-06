import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        self.player_id = self.scope['user'].id if self.scope['user'].is_authenticated else 'anonymous'
        self.group_name = f'player_{self.player_id}'
        
        async_to_sync(self.channel_layer.group_add)(
            self.group_name,
            self.channel_name
        )

        logger.info(f'Player {self.player_id} connected to group {self.group_name}')

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.group_name,
            self.channel_name
        )

        logger.info(f'Player {self.player_id} disconnected from group {self.group_name}')

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')

        if message_type == 'chat_message':
            message = text_data_json.get('message')
            async_to_sync(self.channel_layer.group_send)(
                self.group_name,
                {
                    'type': 'chat_message',
                    'message': message
                }
            )
            logger.info(f'Received message from player {self.player_id}: {message}')

    def chat_message(self, event):
        message = event['message']
        self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message
        }))
        logger.info(f'Sent message to player {self.player_id}: {message}')
