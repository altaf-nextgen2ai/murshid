from django.urls import path, re_path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    re_path(r'^login/?$', views.AdminLoginView.as_view(), name='admin-login'),
    re_path(r'^google-login/?$', views.GoogleLoginView.as_view(), name='google-login'),
    re_path(r'^logout/?$', views.AdminLogoutView.as_view(), name='admin-logout'),
    re_path(r'^profile/?$', views.AdminProfileView.as_view(), name='admin-profile'),
    re_path(r'^token/refresh/?$', TokenRefreshView.as_view(), name='token-refresh'),
]

