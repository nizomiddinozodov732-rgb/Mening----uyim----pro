from rest_framework import serializers
from .models import Complaint
from apps.accounts.serializers import UserSerializer

class ComplaintSerializer(serializers.ModelSerializer):
    complainant_detail = UserSerializer(source='complainant', read_only=True)
    accused_detail = UserSerializer(source='accused', read_only=True)
    complaint_type_display = serializers.CharField(source='get_complaint_type_display', read_only=True)
    property_title = serializers.CharField(source='property.title', read_only=True, default='')
    material_name = serializers.CharField(source='material.name', read_only=True, default='')
    store_name = serializers.CharField(source='store.name', read_only=True, default='')

    class Meta:
        model = Complaint
        fields = '__all__'
        read_only_fields = ['complainant']
