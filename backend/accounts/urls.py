from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.AdminLoginView.as_view(), name='admin-login'),
    path('logout/', views.AdminLogoutView.as_view(), name='admin-logout'),
    path('profile/', views.AdminProfileView.as_view(), name='admin-profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]
