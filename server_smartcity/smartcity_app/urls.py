from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from usermanagement_24782062.api_views import CitizenRegisterAPIView


urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/register/', CitizenRegisterAPIView.as_view(), name='api_register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('main_app.api_urls')),

    path('', include('main_app.urls')),
    path('about/', include('about.urls')),
    path('contacts/', include('contacts.urls')),
    path('accounts/', include('usermanagement_24782062.urls')),
    path('dashboard/', include('dashboard_24782062.urls')),
]