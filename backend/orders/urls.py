from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.CreateOrderView.as_view(), name='order-create'),
    path('<str:order_number>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('<str:order_number>/invoice/', views.InvoiceDownloadView.as_view(), name='invoice-download'),
    # Admin
    path('admin/list/', views.AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/<int:pk>/', views.AdminOrderDetailView.as_view(), name='admin-order-detail'),
    path('admin/<int:pk>/status/', views.AdminUpdateOrderStatusView.as_view(), name='admin-order-status'),
    path('admin/<int:pk>/send-invoice/', views.AdminSendInvoiceEmailView.as_view(), name='admin-send-invoice'),
    path('admin/stats/summary/', views.OrderStatsView.as_view(), name='order-stats'),
]
