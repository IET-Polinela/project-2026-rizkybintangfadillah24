from rest_framework import permissions, viewsets
from .models import Report
from .serializers import ReportSerializer


class ReportViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = Report.objects.all().order_by('-created_at')
    serializer_class = ReportSerializer