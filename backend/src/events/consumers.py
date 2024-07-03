import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

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
