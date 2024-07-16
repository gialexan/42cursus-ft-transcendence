import json
from django.http import JsonResponse
from django.core.mail import send_mail
from .models import MFA
from django.contrib.auth import get_user_model
from django.conf import settings
import logging, string, random
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

logger = logging.getLogger(__name__)
User = get_user_model()

# Verificar configurações de email
logger.debug(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
logger.debug(f"EMAIL_HOST: {settings.EMAIL_HOST}")
logger.debug(f"EMAIL_PORT: {settings.EMAIL_PORT}")
logger.debug(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
logger.debug(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")

@csrf_exempt
def create_mfa(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')

        user = User.objects.get(username=username)
        logger.error(f"user: {user.username}")

        characters = string.ascii_uppercase + string.digits
        mfa_code = "".join(random.choices(characters, k=5))

        created = MFA.create_mfa(user, mfa_code)
        logger.error(f"mfa: {created}")

        request.session['id'] = user.id
        request.session['name'] = user.username

        # Send MFA code by email
        send_mail(
            'Transcendence MFA System',
            f'Token MFA: {mfa_code}',
            settings.EMAIL_HOST_USER,
            [user.email],
            fail_silently=False,
        )

        return JsonResponse({'status': 'success', 'message': 'mfa created with success'}, status=201)
    except User.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'failed to create mfa token to this user'}, status=404)
    except Exception as e:
        logger.error(f"Erro to process MFA token: {e}")
        return JsonResponse({'status': 'error', 'message': 'error to process mfa token'}, status=500)

@csrf_exempt
def validate_mfa(request):
    if request.method == 'POST':
        try:
            import json
            data = json.loads(request.body)
            mfa_code = data.get('mfa_code')
            username = data.get('username')

            logger.error(f"MFA Token: {mfa_code}")

            user = User.objects.get(username=username)
            logger.error(f"user: {user.username}")            

            mfa = MFA.get_latest_mfa(user.id)
            logger.error(f"mfa: {mfa}")

            if mfa.consumed:
                logger.error(f"used mfa code: {mfa_code}")
                return JsonResponse({'status': 'error', 'message': 'invalid mfa'}, status=400)
            if mfa.expires_at < timezone.now():
                logger.error(f"expired mfa: {mfa_code}")
                return JsonResponse({'status': 'error', 'message': 'invalid mfa'}, status=400)
            if mfa.code != mfa_code:
                logger.error(f"invalid mfa: {mfa_code}")
                return JsonResponse({'status': 'error', 'message': 'invalid mfa'}, status=400)
            
            mfa.mark_as_consumed()
            return JsonResponse({'status': 'success', 'message': 'valid mfa code'}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'invalid json format'}, status=400)
    else:
        return JsonResponse({'status': 'error', 'message': 'method not allowed'}, status=405)