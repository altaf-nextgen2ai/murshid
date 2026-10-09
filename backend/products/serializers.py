from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductSize, ProductColor


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    parent_name = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'parent', 'parent_name', 'children']

    def get_children(self, obj):
        children = obj.children.all()
        return CategorySerializer(children, many=True).data

    def get_parent_name(self, obj):
        return obj.parent.name if obj.parent else None


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'image_url', 'display_order']

    def get_image_url(self, obj):
        if obj.image:
            name = str(obj.image.name)
            if name.startswith('http://') or name.startswith('https://'):
                return name
            if name.startswith('/media/'):
                return name
            if name.startswith('media/'):
                return f"/{name}"
            return f"/media/{name}"
        return None


class ProductSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSize
        fields = ['id', 'size']


class ProductColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductColor
        fields = ['id', 'color', 'color_hex']


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    sizes = ProductSizeSerializer(many=True, read_only=True)
    colors = ProductColorSerializer(many=True, read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_name', 'sub_category',
            'price', 'discount_price', 'discount_percentage',
            'thumbnail', 'thumbnail_url', 'sizes', 'colors',
            'is_new_arrival', 'is_trending', 'is_featured', 'is_best_seller',
            'created_at',
        ]

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            name = str(obj.thumbnail.name)
            if name.startswith('http://') or name.startswith('https://'):
                return name
            if name.startswith('/media/'):
                return name
            if name.startswith('media/'):
                return f"/{name}"
            return f"/media/{name}"
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    sizes = ProductSizeSerializer(many=True, read_only=True)
    colors = ProductColorSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_name', 'sub_category',
            'description', 'price', 'discount_price', 'discount_percentage',
            'thumbnail', 'thumbnail_url', 'images', 'sizes', 'colors',
            'is_new_arrival', 'is_trending', 'is_featured', 'is_best_seller',
            'created_at', 'updated_at',
        ]

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            name = str(obj.thumbnail.name)
            if name.startswith('http://') or name.startswith('https://'):
                return name
            if name.startswith('/media/'):
                return name
            if name.startswith('media/'):
                return f"/{name}"
            return f"/media/{name}"
        return None


class ProductWriteSerializer(serializers.ModelSerializer):
    sizes = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    colors = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'sub_category', 'description',
            'price', 'discount_price', 'thumbnail',
            'is_new_arrival', 'is_trending', 'is_featured', 'is_best_seller',
            'sizes', 'colors',
        ]

    def to_internal_value(self, data):
        import json
        if hasattr(data, 'dict'):
            data = data.dict()
        elif hasattr(data, 'copy'):
            data = data.copy()
        else:
            data = dict(data)

        if 'sizes' in data and isinstance(data['sizes'], str):
            try:
                data['sizes'] = json.loads(data['sizes'])
            except Exception:
                pass

        if 'colors' in data and isinstance(data['colors'], str):
            try:
                data['colors'] = json.loads(data['colors'])
            except Exception:
                pass

        if 'discount_price' in data and data['discount_price'] == '':
            data['discount_price'] = None

        if 'category' in data and data['category'] == '':
            data['category'] = None

        return super().to_internal_value(data)

    def to_representation(self, instance):
        return ProductDetailSerializer(instance, context=self.context).data

    def create(self, validated_data):
        sizes_data = validated_data.pop('sizes', [])
        colors_data = validated_data.pop('colors', [])
        product = Product.objects.create(**validated_data)
        for size in sizes_data:
            ProductSize.objects.get_or_create(product=product, size=size)
        for color_item in colors_data:
            if isinstance(color_item, dict):
                ProductColor.objects.get_or_create(
                    product=product,
                    color=color_item.get('color', ''),
                    defaults={'color_hex': color_item.get('color_hex', '#000000')}
                )
        return product

    def update(self, instance, validated_data):
        sizes_data = validated_data.pop('sizes', None)
        colors_data = validated_data.pop('colors', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if sizes_data is not None:
            instance.sizes.all().delete()
            for size in sizes_data:
                ProductSize.objects.get_or_create(product=instance, size=size)
        if colors_data is not None:
            instance.colors.all().delete()
            for color_item in colors_data:
                if isinstance(color_item, dict):
                    ProductColor.objects.get_or_create(
                        product=instance,
                        color=color_item.get('color', ''),
                        defaults={'color_hex': color_item.get('color_hex', '#000000')}
                    )
        return instance

