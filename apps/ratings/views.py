from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from .models import Rating
from .serializers import RatingSerializer


class RatingViewSet(viewsets.ModelViewSet):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        # Faqat reyting egasi (yoki admin) uni tahrirlashi/o'chirishi mumkin
        if self.action in ('update', 'partial_update', 'destroy'):
            if not (user.is_authenticated and (user.is_admin or user.is_super_admin or obj.user_id == user.id)):
                raise PermissionDenied("Bu reytingni o'zgartirish yoki o'chirish huquqingiz yo'q.")
        return obj

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_user = serializer.validated_data.get('target_user')
        if target_user and target_user == request.user:
            return Response(
                {'error': "O'zingizga reyting bera olmaysiz."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Bir foydalanuvchi bir marta reyting beradi — qayta yuborilsa yangilanadi
        # (unique_together buzilib 500 xato chiqmasligi uchun).
        rating, created = Rating.objects.update_or_create(
            user=request.user,
            target_user=target_user,
            defaults={
                'stars': serializer.validated_data.get('stars', 5),
                'comment': serializer.validated_data.get('comment', ''),
            },
        )
        output = self.get_serializer(rating)
        return Response(
            output.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def get_queryset(self):
        qs = Rating.objects.all()
        target_user = self.request.query_params.get('target_user')
        if target_user:
            qs = qs.filter(target_user_id=target_user)
        return qs
