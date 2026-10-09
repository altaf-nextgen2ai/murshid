from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from .models import Category, Product, ProductImage, ProductSize, ProductColor
from .serializers import (
    CategorySerializer, ProductListSerializer,
    ProductDetailSerializer, ProductWriteSerializer, ProductImageSerializer
)


# ── Category Views ────────────────────────────────────────────────────────────

class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.filter(parent=None)
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]


class AllCategoriesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True, context={'request': request})
        return Response(serializer.data)


# ── Product Views ─────────────────────────────────────────────────────────────

class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        try:
            women_cat = Category.objects.filter(name__iexact='Women').first()
            men_cat = Category.objects.filter(name__iexact='Men').first()
            if women_cat and men_cat:
                women_cat.products.filter(name__in=['Crop Streetwear Tee', 'Minimal Logo Tee', 'Relaxed Fit Tee']).update(category=men_cat)
        except Exception:
            pass

        qs = Product.objects.prefetch_related('sizes', 'colors', 'images')
        params = self.request.query_params

        search = params.get('search', '')
        category = params.get('category', '')
        sub_category = params.get('sub_category', '')
        size = params.get('size', '')
        color = params.get('color', '')
        min_price = params.get('min_price', '')
        max_price = params.get('max_price', '')
        sort = params.get('sort', '-created_at')
        is_new = params.get('is_new_arrival', '')
        is_trending = params.get('is_trending', '')
        is_featured = params.get('is_featured', '')
        is_best_seller = params.get('is_best_seller', '')

        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search) | Q(category__name__icontains=search))
        if category:
            if category.isdigit():
                qs = qs.filter(category__id=int(category))
            else:
                qs = qs.filter(category__name__iexact=category)
        if sub_category:
            qs = qs.filter(sub_category__icontains=sub_category)
        if size:
            qs = qs.filter(sizes__size__iexact=size).distinct()
        if color:
            qs = qs.filter(colors__color__iexact=color).distinct()
        if min_price and min_price.isdigit():
            qs = qs.filter(price__gte=float(min_price))
        if max_price and max_price.isdigit():
            qs = qs.filter(price__lte=float(max_price))

        if is_new.lower() in ['true', '1']:
            qs = qs.filter(is_new_arrival=True)
        if is_trending.lower() in ['true', '1']:
            qs = qs.filter(is_trending=True)
        if is_featured.lower() in ['true', '1']:
            qs = qs.filter(is_featured=True)
        if is_best_seller.lower() in ['true', '1']:
            qs = qs.filter(is_best_seller=True)

        allowed_sorts = ['price', '-price', 'created_at', '-created_at', 'name', '-name']
        if sort in allowed_sorts:
            qs = qs.order_by(sort)

        return qs

    def get_serializer_context(self):
        return {'request': self.request}


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.prefetch_related('sizes', 'colors', 'images')
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        return {'request': self.request}


class ProductCreateView(generics.CreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductWriteSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class ProductUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductWriteSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


# ── Admin: full product list with all fields ──────────────────────────────────

class AdminProductListView(generics.ListAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Product.objects.prefetch_related('sizes', 'colors', 'images')
        params = self.request.query_params
        search = params.get('search', '')
        category = params.get('category', '')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))
        if category:
            if category.isdigit():
                qs = qs.filter(category__id=int(category))
            else:
                qs = qs.filter(category__name__iexact=category)
        return qs

    def get_serializer_context(self):
        return {'request': self.request}


# ── Product Images ────────────────────────────────────────────────────────────

class ProductImageUploadView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        images = request.FILES.getlist('images')
        if not images:
            return Response({'error': 'No images provided'}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for idx, img in enumerate(images):
            pi = ProductImage.objects.create(product=product, image=img, display_order=idx)
            created.append(ProductImageSerializer(pi, context={'request': request}).data)

        return Response(created, status=status.HTTP_201_CREATED)

    def delete(self, request, product_id, image_id=None):
        if image_id:
            try:
                img = ProductImage.objects.get(id=image_id, product_id=product_id)
                img.delete()
                return Response({'message': 'Image deleted'})
            except ProductImage.DoesNotExist:
                return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'error': 'image_id required'}, status=status.HTTP_400_BAD_REQUEST)


class RelatedProductsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response([])

        related = Product.objects.filter(
            category=product.category
        ).exclude(id=product_id).prefetch_related('sizes', 'colors')[:6]

        serializer = ProductListSerializer(related, many=True, context={'request': request})
        return Response(serializer.data)
