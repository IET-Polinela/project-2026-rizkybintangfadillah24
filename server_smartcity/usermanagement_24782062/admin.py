from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Role', {'fields': ('is_admin', 'is_member')}),
    )

    list_display = (
        'username',
        'email',
        'is_staff',
        'is_superuser',
        'is_admin',
        'is_member',
    )