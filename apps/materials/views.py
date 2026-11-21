from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.decorators import action
from django.db.models import Count, Prefetch
from .models import MaterialStore, Material, MaterialRating
from .serializers import (
    MaterialStoreSerializer,
    MaterialStoreDetailSerializer,
    MaterialSerializer,
    MaterialRatingSerializer
)


class MaterialStoreViewSet(viewsets.ModelViewSet):
    queryset = MaterialStore.objects.filter(status='active')

    def get_queryset(self):
        # `materials_count` ni annotatsiya qilamiz (serializerda N+1 oldini oladi)
        # va aniq tartiblash (pagination barqarorligi uchun).
        qs = (
            MaterialStore.objects.filter(status='active')
            .select_related('owner')
            .annotate(materials_count=Count('materials'))
            .order_by('-rating', '-created_at')
        )
        if self.action == 'retrieve':
            # Batafsil ko'rinishda do'kon materiallari va ularning do'konini
            # oldindan yuklaymiz (nested serializerda N+1 oldini oladi).
            qs = qs.prefetch_related(
                Prefetch('materials', queryset=Material.objects.select_related('store', 'store__owner'))
            )
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MaterialStoreDetailSerializer
        return MaterialStoreSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def _can_modify(self, obj):
        user = self.request.user
        return bool(
            user.is_authenticated
            and (user.is_admin or user.is_super_admin or obj.owner_id == user.id)
        )

    def get_object(self):
        obj = super().get_object()
        if self.action in ('update', 'partial_update', 'destroy') and not self._can_modify(obj):
            raise PermissionDenied("Bu do'konni tahrirlash yoki o'chirish huquqingiz yo'q.")
        return obj

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rate(self, request, pk=None):
        """Do'konga reyting berish"""
        store = self.get_object()
        try:
            stars = int(request.data.get('stars', 5))
        except (ValueError, TypeError):
            return Response({'error': "Yulduzlar soni butun son bo'lishi kerak."}, status=status.HTTP_400_BAD_REQUEST)
        if not 1 <= stars <= 5:
            return Response({'error': "Reyting 1 dan 5 gacha bo'lishi kerak."}, status=status.HTTP_400_BAD_REQUEST)

        comment = request.data.get('comment', '').strip()

        # MaterialStoreRating modeli yo'q — oddiy reyting saqlaymiz
        from apps.ratings.models import Rating
        from apps.accounts.models import User as AuthUser
        # Do'kon owner ni target_user sifatida ishlatamiz
        if store.owner:
            rating_obj, created = Rating.objects.update_or_create(
                user=request.user, target_user=store.owner,
                defaults={'stars': stars, 'comment': comment}
            )
            store.owner.update_rating()
            store.rating = store.owner.rating
            store.save(update_fields=['rating'])
            return Response({
                'message': "Reyting saqlandi!",
                'rating': store.rating,
                'user_rating': {'stars': stars, 'comment': comment},
            }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
        # Owner yo'q bo'lsa
        return Response({'message': "Reyting saqlandi!", 'rating': store.rating})

    @action(detail=True, methods=['get'])
    def ratings(self, request, pk=None):
        store = self.get_object()
        if not store.owner:
            return Response({'ratings': [], 'user_rating': None})
        from apps.ratings.models import Rating
        qs = Rating.objects.filter(target_user=store.owner).select_related('user')
        data = [{
            'id': r.id, 'stars': r.stars, 'comment': r.comment,
            'created_at': r.created_at.isoformat(),
            'user_detail': {
                'id': r.user.id, 'username': r.user.username,
                'first_name': r.user.first_name, 'last_name': r.user.last_name,
                'avatar': r.user.avatar.url if r.user.avatar else None,
            }
        } for r in qs]
        user_rating = None
        if request.user.is_authenticated:
            ur = qs.filter(user=request.user).first()
            if ur:
                user_rating = {'id': ur.id, 'stars': ur.stars, 'comment': ur.comment}
        return Response({'ratings': data, 'user_rating': user_rating})

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def delete_rating(self, request, pk=None):
        store = self.get_object()
        if store.owner:
            from apps.ratings.models import Rating
            Rating.objects.filter(user=request.user, target_user=store.owner).delete()
            store.owner.update_rating()
        return Response({'message': "Reyting o'chirildi"})


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.filter(status='available')
    serializer_class = MaterialSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'rate', 'delete_rating']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def _can_modify(self, obj):
        user = self.request.user
        return bool(
            user.is_authenticated
            and (user.is_admin or user.is_super_admin or obj.store.owner_id == user.id)
        )

    def get_object(self):
        obj = super().get_object()
        if self.action in ('update', 'partial_update', 'destroy') and not self._can_modify(obj):
            raise PermissionDenied("Bu materialni tahrirlash yoki o'chirish huquqingiz yo'q.")
        return obj

    def get_queryset(self):
        qs = Material.objects.filter(status='available').select_related('store', 'store__owner')
        category = self.request.query_params.get('category')
        store = self.request.query_params.get('store')
        if category:
            qs = qs.filter(category=category)
        if store:
            qs = qs.filter(store_id=store)
        return qs.order_by('-rating', '-created_at')

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rate(self, request, pk=None):
        """Materialga reyting (1-5) va sharh qoldirish"""
        material = self.get_object()
        try:
            stars = int(request.data.get('stars', 5))
        except (ValueError, TypeError):
            return Response({'error': "Yulduzlar soni butun son bo'lishi kerak."}, status=status.HTTP_400_BAD_REQUEST)

        if not 1 <= stars <= 5:
            return Response({'error': "Reyting 1 dan 5 gacha bo'lishi kerak."}, status=status.HTTP_400_BAD_REQUEST)

        comment = request.data.get('comment', '').strip()

        rating_obj, created = MaterialRating.objects.update_or_create(
            material=material,
            user=request.user,
            defaults={'stars': stars, 'comment': comment}
        )
        material.update_rating()

        return Response({
            'message': "Reyting qoldirildi!",
            'rating': material.rating,
            'rating_count': material.rating_count,
            'user_rating': {
                'id': rating_obj.id,
                'stars': rating_obj.stars,
                'comment': rating_obj.comment
            }
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def ratings(self, request, pk=None):
        """Materialning barcha sharhlari va foydalanuvchining o'z bahosini olish"""
        material = self.get_object()
        ratings = material.ratings.select_related('user').all()
        serializer = MaterialRatingSerializer(ratings, many=True)

        user_rating = None
        if request.user.is_authenticated:
            ur = ratings.filter(user=request.user).first()
            if ur:
                user_rating = {
                    'id': ur.id,
                    'stars': ur.stars,
                    'comment': ur.comment,
                    'created_at': ur.created_at.isoformat()
                }

        return Response({
            'ratings': serializer.data,
            'user_rating': user_rating,
            'average_rating': material.rating,
            'rating_count': material.rating_count
        })

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def delete_rating(self, request, pk=None):
        """Materialga qoldirilgan bahoni o'chirish"""
        material = self.get_object()
        MaterialRating.objects.filter(material=material, user=request.user).delete()
        material.update_rating()
        return Response({
            'message': "Reyting o'chirildi",
            'rating': material.rating,
            'rating_count': material.rating_count
        })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_categories(request):
    categories = [
        {'id': k, 'name': v} for k, v in Material.CATEGORY_CHOICES
    ]
    return Response(categories)
