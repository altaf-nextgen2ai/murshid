from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    total_orders = serializers.ReadOnlyField()
    total_order_value = serializers.ReadOnlyField()

    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'mobile', 'email',
            'address', 'city', 'state', 'pincode',
            'total_orders', 'total_order_value', 'created_at',
        ]
