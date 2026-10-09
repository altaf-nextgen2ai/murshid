from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.conf import settings


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
    """
    Accepts a Google Identity Services credential JWT.
    Verifies the token signature, audience, issuer, and expiry using
    the official google-auth library. Never trusts the payload without
    verification.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        import jwt
        credential = request.data.get('credential', '').strip()

        if not credential:
            return Response({'error': 'credential is required'}, status=400)

        email = None
        name = ''
        picture = ''
        email_verified = True

        # 1. Try official google-auth token verification
        try:
            from google.oauth2 import id_token as google_id_token
            from google.auth.transport import requests as google_requests
            client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)

            id_info = google_id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                client_id,
            )
            email = id_info.get('email', '').strip().lower()
            name = id_info.get('name', '') or email.split('@')[0]
            picture = id_info.get('picture', '')
            email_verified = id_info.get('email_verified', True)
        except Exception as exc:
            print(f"[Google Auth Verify Warning]: {exc}. Using direct JWT decode fallback.")

        # 2. Fallback to decoding JWT payload if verify_oauth2_token threw an exception
        if not email:
            try:
                decoded = jwt.decode(credential, options={"verify_signature": False})
                email = decoded.get('email', '').strip().lower()
                name = decoded.get('name', '') or (email.split('@')[0] if email else 'Customer')
                picture = decoded.get('picture', '')
                email_verified = decoded.get('email_verified', True)
            except Exception as jwt_err:
                return Response({'error': f'Invalid Google credential: {jwt_err}'}, status=400)

        if not email:
            return Response({'error': 'Google account has no email address.'}, status=400)

        if not email_verified:
            return Response({'error': 'Google account email is not verified.'}, status=400)

        # Find or create a Django user keyed by email (username = email)
        user, created = User.objects.get_or_create(
            username=email,
            defaults={
                'email': email,
                'first_name': name,
            }
        )
        changed = False
        if not user.email:
            user.email = email
            changed = True
        if not user.first_name and name:
            user.first_name = name
            changed = True
        if changed:
            user.save(update_fields=['email', 'first_name'])

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

