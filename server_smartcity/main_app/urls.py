from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('reports/', views.ReportListView.as_view(), name='report_list'),
    path('reports/search/', views.ReportSearchJsonView.as_view(), name='report_search_json'),
    path('reports/<int:pk>/json/', views.ReportDetailJsonView.as_view(), name='report_detail_json'),
    path('reports/<int:pk>/', views.ReportDetailView.as_view(), name='report_detail'),
    path('add/', views.ReportCreateView.as_view(), name='add_report'),
    path('edit/<int:pk>/', views.ReportUpdateView.as_view(), name='edit_report'),
    path('delete/<int:pk>/', views.ReportDeleteView.as_view(), name='delete_report'),
    path('reports/<int:pk>/update-status/', views.ReportUpdateStatusView.as_view(), name='update_status'),
]