from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('reports/', views.report_list, name='report_list'),
    path('add/', views.add_report, name='add_report'),
    path('edit/<int:report_id>/', views.edit_report, name='edit_report'),
    path('delete/<int:report_id>/', views.delete_report, name='delete_report'),
]