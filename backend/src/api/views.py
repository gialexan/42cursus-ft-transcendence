from datetime import datetime, timedelta
import json
import logging

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
# from django.contrib.auth.models import User
from account.models import CustomUser as User
from matchmaker.models import GameRoom
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import jwt, requests
from jwt import InvalidTokenError
from jwt import DecodeError

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()
logger = logging.getLogger(__name__)

SECRET_KEY = settings.SECRET_KEY
JWT_EXPIRATION_DELTA = getattr(settings, 'JWT_EXPIRATION_DELTA', timedelta(days=1))

def generate_jwt_token(user):
    expiration = datetime.utcnow() + JWT_EXPIRATION_DELTA
    payload = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'exp': expiration,
        'iat': datetime.utcnow(),
        'iss': 'eramos6-game'
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

@require_http_methods(["GET"])
def validate_jwt(request):
    logger.info("validate_jwt")
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token não fornecido'}, status=400)

    token = auth_header.split(' ')[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return JsonResponse(payload, status=200)
    except InvalidTokenError:
        return JsonResponse({'error': 'Token inválido'}, status=401)

@csrf_exempt
def login_form(request):
    logger.info("login_form")
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            token = generate_jwt_token(user)
            return JsonResponse({
                'token': token,
                'user_id': user.id,
                'username': user.username,
                'status': 'success',
                'message': 'Credenciais válidas'
            }, status=200)
        return JsonResponse({'status': 'error', 'message': 'Credenciais inválidas'}, status=401)
    return JsonResponse({'error': 'Método não permitido'}, status=405)

@csrf_exempt
def register(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')

            if User.objects.filter(username=username).exists():
                return JsonResponse({'status': 'error', 'message': 'Username already exists'}, status=400)

            user = User.objects.create_user(username=username, email=email, password=password)
            user.save()

            return JsonResponse({'status': 'success', 'message': 'User registered successfully'}, status=201)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'error': 'Método não permitido'}, status=405)

@csrf_exempt
@require_http_methods(["POST"])
def validate_oauth_login(request):
    try:
        data = json.loads(request.body)
        code = data.get('code')
        if not code:
            return JsonResponse({'error': 'Code not provided'}, status=400)

        token_response = requests.post('https://api.intra.42.fr/oauth/token', data={
            'grant_type': 'authorization_code',
            'client_id': settings.OAUTH_CLIENT_ID,
            'client_secret': settings.OAUTH_CLIENT_SECRET,
            'code': code,
            'redirect_uri': settings.REDIRECT_URI_42,
        })
        
        if token_response.status_code != 200:
            return JsonResponse({'error': 'Failed to get access token from OAuth provider'}, status=400)

        token_data = token_response.json()
        access_token = token_data.get('access_token')

        if not access_token:
            return JsonResponse({'error': 'No access token found in the response'}, status=400)

        user_response = requests.get('https://api.intra.42.fr/v2/me', headers={
            'Authorization': f'Bearer {access_token}'
        })

        if user_response.status_code != 200:
            return JsonResponse({'error': 'Failed to fetch user info from OAuth provider'}, status=400)

        user_data = user_response.json()
        username = user_data['login']
        email = user_data['email']

        user, created = User.objects.get_or_create(username=username, defaults={'email': email})

        if created:
            user.set_unusable_password()
            user.save()

        token = generate_jwt_token(user)
        return JsonResponse({'token': token}, status=200)
    except Exception as e:
        logger.error(f'Error in validate_oauth_login: {e}')
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def player_info(request):
    logger.info("player_info")
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token not provided'}, status=400)

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except DecodeError:
        return JsonResponse({'error': 'Invalid token'}, status=401)

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
        if not user_id:
            return JsonResponse({'error': 'Invalid token'}, status=401)               
        
        user = User.objects.get(id=user_id)

        print(f"Dados do usuário (id={user.id}):")
        for field in user._meta.get_fields():
            try:
                value = getattr(user, field.name)
                print(f"{field.name}: {value}")
                logger.error(f"{field.name}: {value}")
            except AttributeError:
                # Tratar campos que não são atributos do modelo (como relacionamentos)
                pass

        logger.error(f'Error User: {user}')
        return JsonResponse({
            'status': 'success',
            'nickname': user.nickname,
            'username': user.username,
            'email': user.email,
            'is_mfa_enabled': user.is_mfa_enabled,
            'theme': user.theme,
            'status_player': user.status_player,
            'user_uuid': user.user_uuid,
        }, status=200)

    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f'Error fetching player info: {e}')
        return JsonResponse({'error': 'Internal Server Error'}, status=500)

@csrf_exempt
def players_status(request):
    if request.method == 'GET':
        players = User.objects.all()
        players_data = [
            {
                'username': player.username,
                'nickname': player.nickname if player.nickname else player.username,
                'status_player': player.status_player,
                'user_uuid': player.user_uuid
            }
            for player in players
        ]
        return JsonResponse({'status': 'success', 'players': players_data}, status=200)
    return JsonResponse({'error': 'Método não permitido'}, status=405)

@csrf_exempt
def update_profile(request):
    logger.info("update_profile")
    if request.method == 'POST':
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Token not provided'}, status=400)

        token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except DecodeError:
            return JsonResponse({'error': 'Invalid token'}, status=401)

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        try:
            user = User.objects.get(username=payload['username'])
            user.nickname = data['nickname']
            user.theme = data['theme']
            user.is_mfa_enabled = bool(data['is_mfa_enabled'])

            user.save()

            return JsonResponse({'status': 'Profile updated successfully'}, status=200)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
@require_http_methods(["GET"])
def player_score(request):
    logger.info("player_score")
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token not provided'}, status=400)

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except DecodeError:
        return JsonResponse({'error': 'Invalid token'}, status=401)

    logger.info("success:", payload)

    # Mock scores data
    scores = [
        {'position': 1, 'player': 'Ygor', 'points': 7398},
        {'position': 2, 'player': 'Jacob', 'points': 6790},
        {'position': 3, 'player': 'John', 'points': 6215},
    ]

    return JsonResponse({
        'status': 'success',
        'scores': scores
    }, status=200)

def send_notification(message, link, username=None, user_uuid=None):
    try:
        if not message:
            raise ValueError('Message is required')

        if not link:
            raise ValueError('Link is required')

        channel_layer = get_channel_layer()

        notification_data = {
            'type': 'send_notification',
            'notification': {
                'message': message,
                'link': link
            }
        }

        if username:
            async_to_sync(channel_layer.group_send)(
                f'user_{username}', notification_data
            )
        elif user_uuid:
            async_to_sync(channel_layer.group_send)(
                f'uuid_{user_uuid}', notification_data
            )
        else:
            async_to_sync(channel_layer.group_send)(
                "all_users", notification_data
            )
    except Exception as e:
        # Log the exception or handle it as needed
        print(f'Error sending notification: {e}')

@csrf_exempt
def notifications(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            message = data.get('message')
            link = data.get('link')
            username = data.get('username', None)
            user_uuid = data.get('user_uuid', None)

            send_notification(message, link, username, user_uuid)

            return JsonResponse({'status': 'success', 'message': 'Notification sent successfully'}, status=201)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)

# @csrf_exempt
# def notifications(request):
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             message = data.get('message')
#             link = data.get('link')
#             username = data.get('username', None)
#             user_uuid = data.get('user_uuid', None)

#             if not message:
#                 return JsonResponse({'status': 'error', 'message': 'Message is required'}, status=400)

#             if not link:
#                 return JsonResponse({'status': 'error', 'message': 'Link is required'}, status=400)

#             channel_layer = get_channel_layer()

#             notification_data = {
#                 'type': 'send_notification',
#                 'notification': {
#                     'message': message,
#                     'link': link
#                 }
#             }

#             if username:
#                 async_to_sync(channel_layer.group_send)(
#                     f'user_{username}', notification_data
#                 )
#             elif user_uuid:
#                 async_to_sync(channel_layer.group_send)(
#                     f'uuid_{user_uuid}', notification_data
#                 )
#             else:
#                 async_to_sync(channel_layer.group_send)(
#                     "all_users", notification_data
#                 )

#             return JsonResponse({'status': 'success', 'message': 'Notification sent successfully'}, status=201)
#         except Exception as e:
#             return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
#     return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)

@csrf_exempt
def example_notification_view(request):
    player_username = "tonnytg"
    notification = "Você tem uma nova notificação"
    
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{player_username}',
        {
            'type': 'send_notification',
            'notification': notification,
        }
    )
    
    return HttpResponse("Notificação enviada")

@csrf_exempt
def send_user_notification(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_uuid = data.get('user_uuid')
        message = data.get('message')

        if user_uuid and message:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'uuid_{user_uuid}',
                {
                    'type': 'send_notification',
                    'notification': message,
                }
            )
            return JsonResponse({'status': 'success', 'message': 'Notification sent successfully.'})
        return JsonResponse({'status': 'error', 'message': 'Invalid data.'})
    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'})

@csrf_exempt
def game_room(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            game_room_description = data.get('game_room_description', '')
            game_room_type = data.get('game_room_type', 0)
            uuid_player_1 = data.get('uuid_player_1')
            uuid_player_2 = data.get('uuid_player_2', None)
            uuid_player_3 = data.get('uuid_player_3', None)
            uuid_player_4 = data.get('uuid_player_4', None)

            if not uuid_player_1:
                return JsonResponse({'status': 'error', 'message': 'uuid_player_1 is required'}, status=400)

            game_room = GameRoom.objects.create(
                game_room_description=game_room_description,
                game_room_type=game_room_type,
                uuid_player_1=uuid_player_1,
                uuid_player_2=uuid_player_2,
                uuid_player_3=uuid_player_3,
                uuid_player_4=uuid_player_4,
            )

            message = "Invite to game"
            link = f"http://localhost/game-room?uuid={game_room.uuid_game_room}"

            player_uuids = [uuid_player_1, uuid_player_2, uuid_player_3, uuid_player_4]
            for player_uuid in player_uuids:
                if player_uuid:
                    send_notification(message, link, user_uuid=player_uuid)

            return JsonResponse({'status': 'success', 'game_room_uuid': str(game_room.uuid_game_room)}, status=201)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)   


@csrf_exempt
def game_room_info(request):
    logger.info("game room info")
    
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token not provided'}, status=400)

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except DecodeError:
        return JsonResponse({'error': 'Invalid token'}, status=401)

    game_uuid = request.GET.get('game_uuid')
    if not game_uuid:
        return JsonResponse({'error': 'Game UUID not provided'}, status=400)

    try:
        game_room = GameRoom.objects.get(uuid_game_room=game_uuid)
        game_room_data = {
            'game_room_description': game_room.game_room_description,
            'game_room_type': game_room.game_room_type,
            'game_room_status': game_room.game_room_status,
            'uuid_player_1': game_room.uuid_player_1,
            'uuid_player_2': game_room.uuid_player_2,
            'uuid_player_3': game_room.uuid_player_3,
            'uuid_player_4': game_room.uuid_player_4,
            'score_player_1': game_room.score_player_1,
            'score_player_2': game_room.score_player_2,
            'score_player_3': game_room.score_player_3,
            'score_player_4': game_room.score_player_4,
        }

        return JsonResponse({'status': 'success', 'game_room': game_room_data}, status=200)
    except GameRoom.DoesNotExist:
        return JsonResponse({'error': 'Game room not found'}, status=404)