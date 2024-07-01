from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.http import HttpResponse

def send_chat_message(player_id, message):
    channel_layer = get_channel_layer()
    group_name = f'player_{player_id}'

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'chat_message',
            'message': message,
        }
    )

def send_notification_to_player(player_id, notification):
    channel_layer = get_channel_layer()
    group_name = f'player_{player_id}'

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'send_notification',
            'notification': notification,
        }
    )

def example_chat_view(request):
    player_id = request.user.id  # Supondo que você tenha um jogador autenticado
    message = "Esta é uma mensagem de bate-papo"
    send_chat_message(player_id, message)
    return HttpResponse("Mensagem de bate-papo enviada")

def example_notification_view(request):
    player_id = request.user.id  # Supondo que você tenha um jogador autenticado
    notification = "Você tem uma nova notificação"
    send_notification_to_player(player_id, notification)
    return HttpResponse("Notificação enviada")
