from django.contrib.auth import get_user_model
from rest_framework import serializers


CustomUser = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id',
            'username',
            'password',
        ]
        read_only_fields = [
            'id',
        ]

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            is_admin=False,
            is_member=True,
        )
        return user