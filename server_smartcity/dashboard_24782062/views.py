from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.db.models import Count
from django.http import JsonResponse
from django.urls import reverse_lazy
from django.views.generic import TemplateView, View

from main_app.models import Report


class AdminDashboardRequiredMixin(LoginRequiredMixin, UserPassesTestMixin):
    """
    Mixin untuk membatasi akses dashboard hanya untuk admin/staff.

    - User belum login akan diarahkan ke halaman login.
    - User login tetapi bukan admin/staff akan mendapat HTTP 403 Forbidden.
    """

    login_url = reverse_lazy('login')
    raise_exception = True

    def test_func(self):
        user = self.request.user

        return (
            user.is_authenticated
            and (
                getattr(user, 'is_admin', False)
                or getattr(user, 'is_staff', False)
            )
        )


class DashboardView(AdminDashboardRequiredMixin, TemplateView):
    template_name = 'dashboard_24782062/dashboard.html'


class DashboardStatsJsonView(AdminDashboardRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        status_order = ['REPORTED', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED']
        status_display = {
            'REPORTED': 'Reported',
            'VERIFIED': 'Verified',
            'IN_PROGRESS': 'In Progress',
            'RESOLVED': 'Resolved',
        }

        total_reports = Report.objects.count()

        status_counts_raw = (
            Report.objects.values('status')
            .annotate(total=Count('id'))
        )

        status_count_map = {
            item['status']: item['total']
            for item in status_counts_raw
        }

        status_labels = []
        status_counts = []
        status_percentages = []

        for report_status in status_order:
            count = status_count_map.get(report_status, 0)
            percentage = round((count / total_reports) * 100, 2) if total_reports > 0 else 0

            status_labels.append(status_display[report_status])
            status_counts.append(count)
            status_percentages.append(percentage)

        category_counts_raw = (
            Report.objects.values('category')
            .annotate(total=Count('id'))
            .order_by('category')
        )

        category_labels = [item['category'] for item in category_counts_raw]
        category_counts = [item['total'] for item in category_counts_raw]

        latest_reported = list(
            Report.objects.filter(status='REPORTED')
            .order_by('-created_at')[:5]
            .values('id', 'title', 'category', 'location', 'status', 'created_at')
        )

        latest_resolved = list(
            Report.objects.filter(status='RESOLVED')
            .order_by('-created_at')[:5]
            .values('id', 'title', 'category', 'location', 'status', 'created_at')
        )

        data = {
            'status_distribution': {
                'labels': status_labels,
                'counts': status_counts,
                'percentages': status_percentages,
            },
            'category_distribution': {
                'labels': category_labels,
                'counts': category_counts,
            },
            'latest_reported': latest_reported,
            'latest_resolved': latest_resolved,
        }

        return JsonResponse(data)