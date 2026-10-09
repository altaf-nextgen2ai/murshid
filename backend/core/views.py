from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import BusinessSettings
from .serializers import BusinessSettingsSerializer


class BusinessSettingsView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [AllowAny]

    def get(self, request):
        settings = BusinessSettings.get_settings()
        if settings.business_email != 'murshid10032004@gmail.com':
            settings.business_email = 'murshid10032004@gmail.com'
            settings.save()
        serializer = BusinessSettingsSerializer(settings, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        settings = BusinessSettings.get_settings()
        serializer = BusinessSettingsSerializer(
            settings, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def patch(self, request):
        return self.put(request)
