from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('', views.ProductListView.as_view(), name='product-list'),
    path('<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('<int:product_id>/related/', views.RelatedProductsView.as_view(), name='product-related'),
    path('categories/', views.CategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/all/', views.AllCategoriesView.as_view(), name='all-categories'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category-detail'),
    # Admin
    path('admin/list/', views.AdminProductListView.as_view(), name='admin-product-list'),
    path('create/', views.ProductCreateView.as_view(), name='product-create'),
    path('<int:pk>/edit/', views.ProductUpdateView.as_view(), name='product-update'),
    path('<int:product_id>/images/', views.ProductImageUploadView.as_view(), name='product-images'),
    path('<int:product_id>/images/<int:image_id>/', views.ProductImageUploadView.as_view(), name='product-image-delete'),
]
