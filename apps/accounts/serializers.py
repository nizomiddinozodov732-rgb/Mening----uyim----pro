from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'password', 'password2', 'profession']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Parollar mos kelmadi"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    profession_display = serializers.CharField(source='get_profession_display', read_only=True)
    is_admin = serializers.SerializerMethodField()
    is_super_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone',
            'telegram', 'whatsapp', 'instagram',
            'profession', 'profession_display', 'avatar', 'bio', 'rating',
            'rating_count', 'is_verified', 'is_online', 'date_joined',
            'is_admin', 'is_super_admin', 'is_staff', 'is_superuser',
            'is_subscribed', 'subscription_end',
        ]
        read_only_fields = ['rating', 'rating_count', 'is_verified', 'date_joined']

    def get_is_admin(self, obj):
        return bool(obj.is_admin or obj.is_staff or obj.is_super_admin or obj.is_superuser)

    def get_is_super_admin(self, obj):
        return bool(obj.is_super_admin or obj.is_superuser)


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'telegram', 'whatsapp', 'instagram', 'bio', 'avatar', 'profession']


class AdminUserSerializer(serializers.ModelSerializer):
    profession_display = serializers.CharField(source='get_profession_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone',
            'profession', 'profession_display', 'avatar', 'bio', 'rating',
            'rating_count', 'is_verified', 'is_online', 'is_active',
            'is_admin', 'is_super_admin', 'date_joined', 'last_seen'
        ]
