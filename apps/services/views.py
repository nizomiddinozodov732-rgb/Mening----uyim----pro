from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import ServiceProvider, ServiceRequest
from .serializers import ServiceProviderSerializer, ServiceProviderCreateSerializer, ServiceRequestSerializer
from django.db import models as dj_models


class ServiceProviderViewSet(viewsets.ModelViewSet):
    queryset = ServiceProvider.objects.filter(is_available=True).select_related('user')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ServiceProviderCreateSerializer
        return ServiceProviderSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def _can_modify(self, obj):
        user = self.request.user
        return bool(
            user.is_authenticated
            and (user.is_admin or user.is_super_admin or obj.user_id == user.id)
        )

    def get_object(self):
        obj = super().get_object()
        if self.action in ('update', 'partial_update', 'destroy') and not self._can_modify(obj):
            raise PermissionDenied("Bu xizmat profilini tahrirlash yoki o'chirish huquqingiz yo'q.")
        return obj

    def get_queryset(self):
        qs = ServiceProvider.objects.filter(is_available=True).select_related('user')
        profession = self.request.query_params.get('profession')
        if profession:
            qs = qs.filter(user__profession=profession)
        return qs.order_by('-user__rating')

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rate(self, request, pk=None):
        """Ustaga / arxitektora reyting berish"""
        provider = self.get_object()
        target_user = provider.user

        if target_user == request.user:
            return Response({'error': "O'zingizga reyting bera olmaysiz."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            stars = int(request.data.get('stars', 5))
        except (ValueError, TypeError):
            return Response({'error': "Yulduzlar soni butun son bo'lishi kerak."}, status=status.HTTP_400_BAD_REQUEST)

        if not 1 <= stars <= 5:
            return Response({'error': "Reyting 1 dan 5 gacha bo'lishi kerak."}, status=status.HTTP_400_BAD_REQUEST)

        comment = request.data.get('comment', '').strip()

        from apps.ratings.models import Rating
        rating_obj, created = Rating.objects.update_or_create(
            user=request.user,
            target_user=target_user,
            defaults={'stars': stars, 'comment': comment}
        )
        target_user.update_rating()
        target_user.refresh_from_db()

        return Response({
            'message': "Reyting saqlandi!",
            'rating': target_user.rating,
            'rating_count': target_user.rating_count,
            'user_rating': {'id': rating_obj.id, 'stars': rating_obj.stars, 'comment': rating_obj.comment},
        }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def ratings(self, request, pk=None):
        """Usta / arxitektor reytinglarini olish"""
        provider = self.get_object()
        from apps.ratings.models import Rating
        from apps.accounts.serializers import UserSerializer
        ratings = Rating.objects.filter(target_user=provider.user).select_related('user')
        data = [{
            'id': r.id,
            'stars': r.stars,
            'comment': r.comment,
            'created_at': r.created_at.isoformat(),
            'user_detail': {
                'id': r.user.id,
                'username': r.user.username,
                'first_name': r.user.first_name,
                'last_name': r.user.last_name,
                'avatar': r.user.avatar.url if r.user.avatar else None,
            }
        } for r in ratings]
        # Joriy foydalanuvchining reytingi
        user_rating = None
        if request.user.is_authenticated:
            ur = ratings.filter(user=request.user).first()
            if ur:
                user_rating = {'id': ur.id, 'stars': ur.stars, 'comment': ur.comment}
        return Response({'ratings': data, 'user_rating': user_rating})

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def delete_rating(self, request, pk=None):
        provider = self.get_object()
        from apps.ratings.models import Rating
        Rating.objects.filter(user=request.user, target_user=provider.user).delete()
        provider.user.update_rating()
        provider.user.refresh_from_db()
        return Response({'message': "Reyting o'chirildi", 'rating': provider.user.rating})

    @action(detail=False, methods=['get'])
    def architects(self, request):
        qs = self.get_queryset().filter(user__profession='architect')
        serializer = ServiceProviderSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def builders(self, request):
        qs = self.get_queryset().filter(user__profession='builder')
        serializer = ServiceProviderSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def repairmen(self, request):
        qs = self.get_queryset().filter(user__profession='repairman')
        serializer = ServiceProviderSerializer(qs, many=True)
        return Response(serializer.data)


class ServiceRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ServiceRequest.objects.filter(
            dj_models.Q(client=user) | dj_models.Q(provider__user=user)
        )

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)
