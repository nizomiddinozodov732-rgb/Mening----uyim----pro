from rest_framework import serializers
from .models import Payment
from apps.properties.serializers import PropertyListSerializer

class PaymentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    property_detail = PropertyListSerializer(source='property', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'user', 'user_name', 'property', 'property_detail', 'amount', 'method', 'status', 'transaction_id', 'created_at']
        read_only_fields = ['user', 'status', 'transaction_id']
