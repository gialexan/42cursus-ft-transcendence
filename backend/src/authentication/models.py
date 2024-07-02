from datetime import datetime, timedelta
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class MFA(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    client_id = models.IntegerField()
    consumed = models.BooleanField(default=False)

    @classmethod
    def create_mfa(cls, user, mfa_code):
        return cls.objects.create(
            user=user,
            code=mfa_code,
            expires_at=datetime.now() + timedelta(minutes=1),
            client_id=user.id
        )

    @classmethod
    def get_latest_mfa(cls, id):
        return cls.objects.filter(client_id=id).latest('expires_at')

    def mark_as_consumed(self):
        self.consumed = True
        self.save()

    def __str__(self):
        return f'MFA for {self.user.username}'
