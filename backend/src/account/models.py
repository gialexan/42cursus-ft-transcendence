from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class CustomUser(AbstractUser):
    nickname = models.CharField(max_length=50, blank=True)
    theme = models.CharField(max_length=50, blank=True)
    is_mfa_enabled = models.BooleanField(default=False)
    user_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    status_player = models.BooleanField(default=False)

    def __str__(self):
        return self.username
