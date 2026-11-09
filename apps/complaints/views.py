from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Complaint
from .serializers import ComplaintSerializer

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy']:
            # Admin only or owner only
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_super_admin:
            return Complaint.objects.all()
        return Complaint.objects.filter(complainant=user)

    def perform_create(self, serializer):
        complaint = serializer.save(complainant=self.request.user)
        if not complaint.accused:
            if complaint.property and complaint.property.owner:
                complaint.accused = complaint.property.owner
            elif complaint.material and complaint.material.store and complaint.material.store.owner:
                complaint.accused = complaint.material.store.owner
            elif complaint.store and complaint.store.owner:
                complaint.accused = complaint.store.owner
            if complaint.accused:
                complaint.save(update_fields=['accused'])
