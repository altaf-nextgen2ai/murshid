from rest_framework import serializers
from .models import Order, OrderItem
from customers.serializers import CustomerSerializer
from products.models import Product, ProductSize, ProductColor


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name_snapshot', 'product_thumbnail_snapshot',
            'size', 'color', 'quantity', 'price', 'discount_price', 'subtotal',
        ]


class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    size = serializers.CharField(max_length=10)
    color = serializers.CharField(max_length=50)
    quantity = serializers.IntegerField(min_value=1)

    def validate(self, data):
        try:
            product = Product.objects.get(id=data['product_id'])
        except Product.DoesNotExist:
            raise serializers.ValidationError(f"Product {data['product_id']} does not exist.")

        if not product.sizes.filter(size=data['size']).exists():
            raise serializers.ValidationError(
                f"Size '{data['size']}' is not available for {product.name}."
            )
        if not product.colors.filter(color=data['color']).exists():
            raise serializers.ValidationError(
                f"Color '{data['color']}' is not available for {product.name}."
            )
        data['product'] = product
        return data


class OrderCreateSerializer(serializers.Serializer):
    # Customer fields
    name = serializers.CharField(max_length=255)
    mobile = serializers.CharField(max_length=15)
    email = serializers.EmailField(required=False, allow_blank=True)
    address = serializers.CharField()
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    pincode = serializers.CharField(max_length=10)
    order_note = serializers.CharField(required=False, allow_blank=True)
    items = OrderItemCreateSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Order must have at least one item.")
        return value


class OrderSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    order_status_display = serializers.CharField(source='get_order_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'invoice_number', 'customer',
            'subtotal', 'discount', 'total', 'order_note',
            'payment_status', 'payment_status_display',
            'order_status', 'order_status_display',
            'invoice_path', 'items', 'created_at', 'updated_at',
        ]


class OrderListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_mobile = serializers.CharField(source='customer.mobile', read_only=True)
    order_status_display = serializers.CharField(source='get_order_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'invoice_number',
            'customer_name', 'customer_mobile',
            'total', 'payment_status', 'payment_status_display',
            'order_status', 'order_status_display',
            'created_at',
        ]
