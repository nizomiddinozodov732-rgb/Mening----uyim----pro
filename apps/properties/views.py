from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.http import Http404
from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend
from .models import Property, PropertyImage, PropertyRating
from .serializers import (
    PropertyListSerializer, PropertyDetailSerializer, PropertyCreateSerializer,
    PropertyUpdateSerializer, PropertyRatingSerializer, validate_uploaded_images
)


class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.filter(status='active').order_by('-rating', '-created_at')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['property_type', 'status', 'owner']
    search_fields = ['title', 'location', 'description']
    ordering_fields = ['rating', 'rating_count', 'price', 'created_at', 'views_count', 'area']
    ordering = ['-rating', '-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return PropertyListSerializer
        if self.action in ['update', 'partial_update']:
            return PropertyUpdateSerializer
        if self.action == 'create':
            return PropertyCreateSerializer
        return PropertyDetailSerializer

    # O'qish uchun ochiq (anonim) action'lar. Qolgan barcha action'lar
    # (create/update/destroy/rate/delete_rating/upload_images/my_properties)
    # autentifikatsiya talab qiladi.
    PUBLIC_ACTIONS = {'list', 'retrieve', 'featured', 'ratings'}

    def get_permissions(self):
        # V-3: `@action(permission_classes=...)` e'tiborsiz qoldirilmasin.
        # Avval barcha action'larga `AllowAny` qaytarilar edi — natijada anonim
        # `rate`/`delete_rating` so'rovi `AnonymousUser` bilan ishlab 500 xato
        # (DoS vektori) berardi.
        if self.action in self.PUBLIC_ACTIONS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def _can_modify(self, obj):
        user = self.request.user
        return bool(
            user.is_authenticated
            and (user.is_admin or user.is_super_admin or obj.owner_id == user.id)
        )

    def get_object(self):
        obj = super().get_object()
        is_owner = self._can_modify(obj)
        # Faqat egasi (yoki admin) tahrirlashi/o'chirishi mumkin
        if self.action in ('update', 'partial_update', 'destroy') and not is_owner:
            raise PermissionDenied("Bu e'lonni tahrirlash yoki o'chirish huquqingiz yo'q.")
        # Nofaol (yashirin) e'lonni faqat egasi yoki admin ko'ra oladi
        if self.action == 'retrieve' and obj.status != 'active' and not is_owner:
            raise Http404("E'lon topilmadi.")
        return obj

    def perform_create(self, serializer):
        user = self.request.user
        if user.profession == 'customer':
            raise PermissionDenied("Oddiy mijozlar e'lon joylay olmaydi. Faqat mutaxassislar qidirishingiz mumkin.")
        if not user.is_subscribed and not (user.is_admin or user.is_super_admin):
            raise PermissionDenied("E'lon qo'shish uchun avval obuna bo'lishingiz kerak.")
        serializer.save(owner=user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def get_queryset(self):
        qs = Property.objects.all()
        # Filter by type
        prop_type = self.request.query_params.get('type')
        if prop_type:
            qs = qs.filter(property_type=prop_type)
        # Filter by price range (noto'g'ri qiymatlar e'tiborsiz qoldiriladi)
        min_price = self._parse_number('min_price')
        max_price = self._parse_number('max_price')
        if min_price is not None:
            qs = qs.filter(price__gte=min_price)
        if max_price is not None:
            qs = qs.filter(price__lte=max_price)
        # Filter by bedrooms
        bedrooms = self._parse_number('bedrooms', int)
        if bedrooms is not None:
            qs = qs.filter(bedrooms__gte=bedrooms)
        # Filter by area
        min_area = self._parse_number('min_area')
        max_area = self._parse_number('max_area')
        if min_area is not None:
            qs = qs.filter(area__gte=min_area)
        if max_area is not None:
            qs = qs.filter(area__lte=max_area)
        # Only active by default (tahrirlash/o'chirish/ko'rish uchun status cheklovi yo'q)
        show_all = self.request.query_params.get('all')
        # V-6: yashirin (nofaol/sotilgan) e'lonlarni `?all=1` orqali faqat
        # admin/super-admin ko'ra oladi — anonim so'rovchi ko'ra olmaydi.
        request_user = getattr(self.request, 'user', None)
        is_privileged = bool(
            request_user is not None
            and request_user.is_authenticated
            and (request_user.is_admin or request_user.is_super_admin)
        )
        if show_all and not is_privileged:
            show_all = None
        if not show_all and self.action not in ('retrieve', 'update', 'partial_update', 'destroy'):
            qs = qs.filter(status='active')

        # Custom sort parameter support (e.g. sort=rating or sort=-rating)
        sort_param = self.request.query_params.get('sort') or self.request.query_params.get('ordering')
        if sort_param:
            if sort_param in ['rating', '-rating', 'price', '-price', 'created_at', '-created_at', 'views_count', '-views_count']:
                qs = qs.order_by(sort_param)
        else:
            qs = qs.order_by('-rating', '-created_at')

        # Rasm va reytinglarni oldindan yuklash (N+1 muammosini bartaraf etadi).
        images_prefetch = Prefetch('images', queryset=PropertyImage.objects.order_by('-is_primary', 'order'))
        qs = qs.select_related('owner').prefetch_related(images_prefetch)
        user = getattr(self.request, 'user', None)
        if self.action == 'list':
            # Ro'yxatda faqat joriy foydalanuvchining reytingi kerak (yengil).
            if user is not None and user.is_authenticated:
                qs = qs.prefetch_related(
                    Prefetch('ratings', queryset=PropertyRating.objects.filter(user=user), to_attr='user_ratings')
                )
        elif self.action == 'retrieve':
            # Batafsil ko'rinishda barcha reytinglar kerak (serializer to'liq
            # ro'yxatni chiqaradi). V-8: `rate`/`delete_rating` action'larida
            # reytinglar prefetch qilinmaydi — aks holda keshdagi eski ro'yxat
            # agregat hisoblashni buzadi.
            qs = qs.prefetch_related(
                Prefetch('ratings', queryset=PropertyRating.objects.select_related('user').order_by('-created_at'))
            )
        return qs

    def _parse_number(self, key, cast=float):
        """Query parametrni xavfsiz songa aylantiradi; noto'g'ri bo'lsa None qaytaradi."""
        raw = self.request.query_params.get(key)
        if raw in (None, ''):
            return None
        try:
            return cast(raw)
        except (ValueError, TypeError):
            return None

    @action(detail=False, methods=['get'])
    def my_properties(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Login qiling'}, status=401)
        props = (
            Property.objects.filter(owner=request.user)
            .select_related('owner')
            .prefetch_related(
                Prefetch('images', queryset=PropertyImage.objects.order_by('-is_primary', 'order')),
                Prefetch('ratings', queryset=PropertyRating.objects.filter(user=request.user), to_attr='user_ratings'),
            )
        )
        serializer = PropertyListSerializer(props, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        prefetches = [
            Prefetch('images', queryset=PropertyImage.objects.order_by('-is_primary', 'order')),
        ]
        if request.user.is_authenticated:
            prefetches.append(
                Prefetch('ratings', queryset=PropertyRating.objects.filter(user=request.user), to_attr='user_ratings')
            )
        props = (
            Property.objects.filter(status='active')
            .select_related('owner')
            .prefetch_related(*prefetches)
            .order_by('-rating', '-views_count')[:8]
        )
        serializer = PropertyListSerializer(props, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rate(self, request, pk=None):
        prop = self.get_object()
        if prop.owner == request.user:
            return Response({'error': "O'zingizning e'loningizga reyting bera olmaysiz."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            stars = int(request.data.get('stars', 5))
        except (ValueError, TypeError):
            return Response({'error': "Yulduzlar soni butun son bo'lishi kerak."}, status=status.HTTP_400_BAD_REQUEST)

        if stars < 1 or stars > 5:
            return Response({'error': "Reyting 1 dan 5 gacha bo'lishi kerak."}, status=status.HTTP_400_BAD_REQUEST)

        comment = request.data.get('comment', '').strip()

        rating_obj, created = PropertyRating.objects.update_or_create(
            property=prop,
            user=request.user,
            defaults={'stars': stars, 'comment': comment}
        )
        prop.refresh_from_db()

        return Response({
            'message': "Reyting muvaffaqiyatli saqlandi",
            'rating': prop.rating,
            'rating_count': prop.rating_count,
            'user_rating': {
                'id': rating_obj.id,
                'stars': rating_obj.stars,
                'comment': rating_obj.comment
            }
        }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def ratings(self, request, pk=None):
        prop = self.get_object()
        ratings = prop.ratings.select_related('user').all()
        serializer = PropertyRatingSerializer(ratings, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def delete_rating(self, request, pk=None):
        prop = self.get_object()
        PropertyRating.objects.filter(property=prop, user=request.user).delete()
        prop.update_rating()
        prop.refresh_from_db()
        return Response({
            'message': "Reyting o'chirildi",
            'rating': prop.rating,
            'rating_count': prop.rating_count
        })

    @action(detail=True, methods=['post'])
    def upload_images(self, request, pk=None):
        prop = self.get_object()
        if prop.owner != request.user:
            return Response({'error': 'Ruxsat yo\'q'}, status=403)
        images = request.FILES.getlist('images')
        # V-9: rasm turi va hajmi allowlist orqali tekshiriladi
        validate_uploaded_images(images)
        for i, img in enumerate(images):
            PropertyImage.objects.create(property=prop, image=img, order=i)
        return Response({'message': f'{len(images)} rasm yuklandi'})
