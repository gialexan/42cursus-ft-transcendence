import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)

class GameConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        self.game_uuid = self.scope['url_route']['kwargs']['game_uuid']
        try:
            async_to_sync(self.channel_layer.group_add)(
                f'uuid_{self.game_uuid}',
                self.channel_name
            )
        except get_user_model().DoesNotExist:
            self.close()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            f'uuid_{self.game_uuid}',
            self.channel_name
        )

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')

        if message_type == 'notification':
            notification = text_data_json.get('notification')
            target_username = text_data_json.get('username', None)
            target_uuid = text_data_json.get('user_uuid', None)

            if target_username:
                async_to_sync(self.channel_layer.group_send)(
                    f'user_{target_username}',
                    {
                        'type': 'send_notification',
                        'notification': notification
                    }
                )
            elif target_uuid:
                async_to_sync(self.channel_layer.group_send)(
                    f'uuid_{target_uuid}',
                    {
                        'type': 'send_notification',
                        'notification': notification
                    }
                )

    def send_notification(self, event):
        notification = event['notification']
        self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': notification
        }))
