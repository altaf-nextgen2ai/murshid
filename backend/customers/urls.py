from django.urls import path
from . import views

urlpatterns = [
    path('', views.CustomerListView.as_view(), name='customer-list'),
    path('<int:pk>/', views.CustomerDetailView.as_view(), name='customer-detail'),
    path('<int:pk>/orders/', views.CustomerOrderHistoryView.as_view(), name='customer-orders'),
]
