from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User


class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '')
        password = request.data.get('password', '')

        user = authenticate(username=username, password=password)

        if user is None:
            return Response({'error': 'Invalid credentials'}, status=401)

        if not user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
            }
        })


class AdminLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully'})


class AdminProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        })


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        import jwt
        credential = request.data.get('credential')
        email = request.data.get('email', '').strip()
        name = request.data.get('name', '').strip()
        picture = request.data.get('picture', '').strip()

        if credential:
            try:
                decoded = jwt.decode(credential, options={"verify_signature": False})
                email = decoded.get('email', email)
                name = decoded.get('name', name or email.split('@')[0])
                picture = decoded.get('picture', picture)
            except Exception:
                pass

        if not email:
            return Response({'error': 'Email is required for Google login'}, status=400)

        user, created = User.objects.get_or_create(username=email, defaults={
            'email': email,
            'first_name': name,
        })
        if not user.email:
            user.email = email
            user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.first_name or user.username,
                'picture': picture,
            }
        })

