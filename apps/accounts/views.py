from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .middleware import (
    get_client_ip, log_security_event, register_failed_login, reset_failed_logins,
)
from .serializers import RegisterSerializer, UserSerializer, UserProfileUpdateSerializer, AdminUserSerializer

User = get_user_model()


class LoginView(APIView):
    """Username yoki Email bilan login.

    Brute-force himoyasi: throttle (10/min) + 15 daqiqada 10 xatodan keyin
    IP avtomatik bloklanadi. Barcha urinishlar SecurityLog'ga yoziladi.
    """
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'login'

    def post(self, request):
        credential = request.data.get('username', '').strip()
        password   = request.data.get('password', '')
        ip = get_client_ip(request)
        device = request.META.get('HTTP_USER_AGENT', '')

        if not credential or not password:
            return Response({'error': "Username/email va parol kiritish shart"}, status=400)

        # Email bilan qidiruv
        user = None
        if '@' in credential:
            try:
                user_obj = User.objects.get(email=credential)
                user = authenticate(request, username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass

        # Username bilan qidiruv
        if user is None:
            user = authenticate(request, username=credential, password=password)

        if user is None:
            remaining = register_failed_login(ip)
            log_security_event(
                None, 'login_failed', ip,
                details=f"Xato login urinishi: {credential[:100]}",
                device_info=device,
            )
            payload = {'error': "Username/email yoki parol noto'g'ri"}
            if isinstance(remaining, int) and remaining <= 3:
                payload['error'] += f". Diqqat: {remaining} ta urinish qoldi"
            return Response(payload, status=400)

        if not user.is_active:
            log_security_event(user, 'login_failed', ip, details="Bloklangan akkauntga kirish urinishi", device_info=device)
            return Response({'error': "Hisobingiz bloklangan"}, status=403)

        reset_failed_logins(ip)
        log_security_event(user, 'login_success', ip, details="Muvaffaqiyatli kirish", device_info=device)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        })


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'register'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer

    def post(self, request):
        """Profil sahifasidan parolni o'zgartirish (old_password + new_password)"""
        old_password = request.data.get('old_password', '')
        new_password = request.data.get('new_password', '')

        if not request.user.check_password(old_password):
            return Response({'error': "Joriy parol noto'g'ri"}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'error': "Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user=request.user)
        except ValidationError as exc:
            return Response({'error': ' '.join(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save(update_fields=['password'])
        return Response({'message': "Parol muvaffaqiyatli o'zgartirildi"})


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = User.objects.filter(is_active=True)
        profession = self.request.query_params.get('profession')
        if profession:
            queryset = queryset.filter(profession=profession)
        # Faqat ruxsat etilgan maydonlar bo'yicha saralash (xato 500 ning oldini oladi)
        allowed_ordering = {'rating', '-rating', 'date_joined', '-date_joined', 'username', '-username'}
        ordering = self.request.query_params.get('ordering', '-rating')
        if ordering not in allowed_ordering:
            ordering = '-rating'
        return queryset.order_by(ordering)


class TopProfessionalsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        top_sellers = User.objects.filter(profession='seller', is_active=True).order_by('-rating')[:6]
        top_builders = User.objects.filter(profession='builder', is_active=True).order_by('-rating')[:6]
        top_repairmen = User.objects.filter(profession='repairman', is_active=True).order_by('-rating')[:6]
        top_architects = User.objects.filter(profession='architect', is_active=True).order_by('-rating')[:6]
        return Response({
            'sellers': UserSerializer(top_sellers, many=True).data,
            'builders': UserSerializer(top_builders, many=True).data,
            'repairmen': UserSerializer(top_repairmen, many=True).data,
            'architects': UserSerializer(top_architects, many=True).data,
        })


# ===== ADMIN VIEWS =====

class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not (self.request.user.is_admin or self.request.user.is_super_admin):
            return User.objects.none()
        return User.objects.all().order_by('-date_joined')


class AdminUserUpdateView(generics.UpdateAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()

    def update(self, request, *args, **kwargs):
        if not (request.user.is_admin or request.user.is_super_admin):
            return Response({'error': 'Ruxsat yo\'q'}, status=403)
        return super().update(request, *args, **kwargs)


class AdminStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not (request.user.is_admin or request.user.is_super_admin):
            return Response({'error': 'Ruxsat yo\'q'}, status=403)
        from apps.properties.models import Property
        from apps.payments.models import Payment
        from apps.complaints.models import Complaint
        
        return Response({
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'sellers': User.objects.filter(profession='seller').count(),
            'builders': User.objects.filter(profession='builder').count(),
            'architects': User.objects.filter(profession='architect').count(),
            'repairmen': User.objects.filter(profession='repairman').count(),
            'total_properties': Property.objects.count(),
            'active_properties': Property.objects.filter(status='active').count(),
            'total_payments': Payment.objects.count(),
            'pending_complaints': Complaint.objects.filter(status='pending').count(),
        })


# ===== SUPER ADMIN =====

class SuperAdminManageAdminView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_super_admin:
            return Response({'error': 'Faqat Super Admin!'}, status=403)
        try:
            user = User.objects.get(pk=pk)
            action = request.data.get('action')
            if action == 'make_admin':
                user.is_admin = True
                user.save()
            elif action == 'remove_admin':
                user.is_admin = False
                user.save()
            elif action == 'deactivate':
                user.is_active = False
                user.save()
            elif action == 'activate':
                user.is_active = True
                user.save()
            return Response(AdminUserSerializer(user).data)
        except User.DoesNotExist:
            return Response({'error': 'Foydalanuvchi topilmadi'}, status=404)
