from django.contrib import admin
from .models import CustomUser

# Register your models here.
@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'nickname', 'theme', 'is_mfa_enabled', 'user_uuid', 'status_player']  # Customize as needed
    # Add other configurations as needed