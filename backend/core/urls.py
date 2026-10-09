from django.urls import path
from . import views

urlpatterns = [
    path('settings/', views.BusinessSettingsView.as_view(), name='business-settings'),
]
