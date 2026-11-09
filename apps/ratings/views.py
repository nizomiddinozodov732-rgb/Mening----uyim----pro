from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Rating
from .serializers import RatingSerializer

class RatingViewSet(viewsets.ModelViewSet):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        qs = Rating.objects.all()
        target_user = self.request.query_params.get('target_user')
        if target_user:
            qs = qs.filter(target_user_id=target_user)
        return qs
