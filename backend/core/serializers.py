from rest_framework import serializers
from .models import BusinessSettings


class BusinessSettingsSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = BusinessSettings
        fields = [
            'id', 'business_name', 'logo', 'logo_url',
            'business_email', 'business_phone',
            'business_address', 'whatsapp_number',
            'updated_at',
        ]

    def get_logo_url(self, obj):
        if obj.logo:
            return f"/media/{obj.logo.name}"
        return None
