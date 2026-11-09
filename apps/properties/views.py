from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Property, PropertyImage, PropertyRating
from .serializers import (
    PropertyListSerializer, PropertyDetailSerializer, PropertyCreateSerializer,
    PropertyRatingSerializer
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
        if self.action in ['create', 'update', 'partial_update']:
            return PropertyCreateSerializer
        return PropertyDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied
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
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        # Filter by bedrooms
        bedrooms = self.request.query_params.get('bedrooms')
        if bedrooms:
            qs = qs.filter(bedrooms__gte=bedrooms)
        # Filter by area
        min_area = self.request.query_params.get('min_area')
        max_area = self.request.query_params.get('max_area')
        if min_area:
            qs = qs.filter(area__gte=min_area)
        if max_area:
            qs = qs.filter(area__lte=max_area)
        # Only active by default
        show_all = self.request.query_params.get('all')
        if not show_all:
            qs = qs.filter(status='active')

        # Custom sort parameter support (e.g. sort=rating or sort=-rating)
        sort_param = self.request.query_params.get('sort') or self.request.query_params.get('ordering')
        if sort_param:
            if sort_param in ['rating', '-rating', 'price', '-price', 'created_at', '-created_at', 'views_count', '-views_count']:
                qs = qs.order_by(sort_param)
        else:
            qs = qs.order_by('-rating', '-created_at')

        return qs.select_related('owner').prefetch_related('images', 'ratings')

    @action(detail=False, methods=['get'])
    def my_properties(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Login qiling'}, status=401)
        props = Property.objects.filter(owner=request.user)
        serializer = PropertyListSerializer(props, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        props = Property.objects.filter(status='active').order_by('-rating', '-views_count')[:8]
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
        for i, img in enumerate(images):
            PropertyImage.objects.create(property=prop, image=img, order=i)
        return Response({'message': f'{len(images)} rasm yuklandi'})
