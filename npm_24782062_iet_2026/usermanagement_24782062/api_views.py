from rest_framework import generics, permissions
from .serializers import RegisterSerializer


class CitizenRegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]