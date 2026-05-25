from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Report
from .permissions import IsCitizen, IsOwnerAndDraftOrReadOnly
from .serializers import ReportSerializer


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Report.objects.none()

        if getattr(user, 'is_admin', False):
            return Report.objects.exclude(status='DRAFT').order_by('-created_at')

        return Report.objects.filter(
            Q(status='DRAFT', reporter=user) | ~Q(status='DRAFT')
        ).order_by('-created_at')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]

        elif self.action == 'create':
            permission_classes = [permissions.IsAuthenticated, IsCitizen]

        elif self.action in ['update', 'partial_update', 'destroy', 'submit']:
            permission_classes = [permissions.IsAuthenticated, IsOwnerAndDraftOrReadOnly]

        else:
            permission_classes = [permissions.IsAuthenticated]

        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(
            reporter=self.request.user,
            status='DRAFT'
        )

    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        report = self.get_object()
        report.status = 'REPORTED'
        report.save(update_fields=['status', 'updated_at'])

        serializer = self.get_serializer(report)
        return Response(serializer.data, status=status.HTTP_200_OK)