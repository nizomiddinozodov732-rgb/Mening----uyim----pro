from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from .serializers import RegisterSerializer, UserSerializer, UserProfileUpdateSerializer, AdminUserSerializer

User = get_user_model()


class LoginView(APIView):
    """Username yoki Email bilan login"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        credential = request.data.get('username', '').strip()
        password   = request.data.get('password', '')

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
            return Response({'error': "Username/email yoki parol noto'g'ri"}, status=400)

        if not user.is_active:
            return Response({'error': "Hisobingiz bloklangan"}, status=403)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        })


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

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
        ordering = self.request.query_params.get('ordering', '-rating')
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
