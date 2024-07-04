import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        self.player_id = self.scope['user'].id if self.scope['user'].is_authenticated else 'anonymous'
        async_to_sync(self.channel_layer.group_add)(
            f'player_{self.player_id}',
            self.channel_name
        )

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            f'player_{self.player_id}',
            self.channel_name
        )

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json['type']

        if message_type == 'chat_message':
            message = text_data_json['message']
            async_to_sync(self.channel_layer.group_send)(
                f'player_{self.player_id}',
                {
                    'type': 'chat_message',
                    'message': message
                }
            )

    def chat_message(self, event):
        message = event['message']
        self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message
        }))


class NotificationsConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        self.player_uuid = self.scope['url_route']['kwargs']['user_uuid']
        try:
            user = get_user_model().objects.get(user_uuid=self.player_uuid)
            self.player_username = user.username
            async_to_sync(self.channel_layer.group_add)(
                f'user_{self.player_username}',
                self.channel_name
            )
            async_to_sync(self.channel_layer.group_add)(
                f'uuid_{self.player_uuid}',
                self.channel_name
            )
            async_to_sync(self.channel_layer.group_add)(
                "all_users",
                self.channel_name
            )
        except get_user_model().DoesNotExist:
            self.close()

    def disconnect(self, close_code):
        if hasattr(self, 'player_username'):
            async_to_sync(self.channel_layer.group_discard)(
                f'user_{self.player_username}',
                self.channel_name
            )
            async_to_sync(self.channel_layer.group_discard)(
                f'uuid_{self.player_uuid}',
                self.channel_name
            )
            async_to_sync(self.channel_layer.group_discard)(
                "all_users",
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
            else:
                async_to_sync(self.channel_layer.group_send)(
                    "all_users",
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