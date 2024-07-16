import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)

connected_users = {}

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.player_uuid = self.scope['url_route']['kwargs']['user_uuid']
        self.player_group_name = f'player_{self.player_uuid}'

        # Verificar se o jogador já está conectado
        if self.player_uuid in connected_users:
            self.close()  # Fechar a conexão se o jogador já estiver conectado
            logger.warning(f'Player {self.player_uuid} tried to connect again and was blocked.')
            return

        self.accept()

        # Adicionar à sala GlobalChat
        async_to_sync(self.channel_layer.group_add)(
            "GlobalChat",
            self.channel_name
        )

        # Adicionar à sala específica do jogador
        async_to_sync(self.channel_layer.group_add)(
            self.player_group_name,
            self.channel_name
        )

        # Marcar o jogador como conectado
        connected_users[self.player_uuid] = self.channel_name

        logger.info(f'Player {self.player_uuid} connected to GlobalChat')
        logger.info(f'Player {self.player_uuid} connected to group {self.player_group_name}')

    def disconnect(self, close_code):
        # Remover da sala GlobalChat
        async_to_sync(self.channel_layer.group_discard)(
            "GlobalChat",
            self.channel_name
        )

        # Remover da sala específica do jogador
        async_to_sync(self.channel_layer.group_discard)(
            self.player_group_name,
            self.channel_name
        )

        # Remover o jogador da lista de conectados
        if self.player_uuid in connected_users:
            del connected_users[self.player_uuid]

        logger.info(f'Player {self.player_uuid} disconnected from GlobalChat')
        logger.info(f'Player {self.player_uuid} disconnected from group {self.player_group_name}')

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')

        if message_type == 'chat_message':
            message = text_data_json.get('message')
            # Enviar mensagem para a sala GlobalChat
            async_to_sync(self.channel_layer.group_send)(
                "GlobalChat",
                {
                    'type': 'chat_message',
                    'message': message
                }
            )
            # Enviar mensagem para a sala específica do jogador
            # async_to_sync(self.channel_layer.group_send)(
            #     self.player_group_name,
            #     {
            #         'type': 'chat_message',
            #         'message': message
            #     }
            # )
            logger.info(f'Received message from player {self.player_uuid}: {message}')

    def chat_message(self, event):
        message = event['message']
        self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message
        }))
        logger.info(f'Sent message to player {self.player_uuid}: {message}')
