from rest_framework import serializers
from .models import ServiceProvider, ServiceRequest
from apps.accounts.serializers import UserSerializer


class ServiceProviderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ServiceProvider
        fields = '__all__'


class ServiceProviderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceProvider
        exclude = ['user']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ServiceRequestSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    provider_name = serializers.CharField(source='provider.user.get_full_name', read_only=True)

    class Meta:
        model = ServiceRequest
        fields = '__all__'
        read_only_fields = ['client']
