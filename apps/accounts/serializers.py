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


class PublicUserSerializer(serializers.ModelSerializer):
    """V-4: Ommaviy (autentifikatsiyasiz) ko'rinish uchun minimal serializer.

    Shaxsiy ma'lumotlar (email, telefon, messenjerlar, E2E ochiq kalit) va
    imtiyoz belgilari (is_staff/is_superuser/is_subscribed) chiqarilmaydi.
    """
    profession_display = serializers.CharField(source='get_profession_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'profession',
            'profession_display', 'avatar', 'bio', 'rating', 'rating_count',
            'is_verified', 'is_online', 'date_joined',
        ]


class UserSerializer(serializers.ModelSerializer):
    """Boshqa foydalanuvchilar uchun umumiy serializer.

    V-12: `is_staff`, `is_superuser`, `is_subscribed`, `subscription_end`
    kabi xizmat maydonlari bu yerdan olib tashlandi (faqat o'z profili uchun
    `OwnUserSerializer` orqali beriladi).
    """
    profession_display = serializers.CharField(source='get_profession_display', read_only=True)
    is_admin = serializers.SerializerMethodField()
    is_super_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'phone',
            'telegram', 'whatsapp', 'instagram',
            'profession', 'profession_display', 'avatar', 'bio', 'rating',
            'rating_count', 'is_verified', 'is_online', 'date_joined',
            'is_admin', 'is_super_admin', 'public_key',
        ]
        read_only_fields = ['rating', 'rating_count', 'is_verified', 'date_joined']

    def get_is_admin(self, obj):
        return bool(obj.is_admin or obj.is_staff or obj.is_super_admin or obj.is_superuser)

    def get_is_super_admin(self, obj):
        return bool(obj.is_super_admin or obj.is_superuser)


class OwnUserSerializer(UserSerializer):
    """Faqat foydalanuvchining o'z profili uchun (email, obuna, imtiyoz)."""

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + [
            'email', 'is_staff', 'is_superuser', 'is_subscribed', 'subscription_end',
        ]


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'telegram', 'whatsapp', 'instagram', 'bio', 'avatar', 'profession', 'public_key']


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
        # V-1: Imtiyozli maydonlar faqat o'qish uchun. Rol/faollikni faqat
        # SuperAdminManageAdminView orqali super admin o'zgartiradi.
        read_only_fields = [
            'id', 'username', 'rating', 'rating_count', 'is_verified',
            'is_online', 'is_active', 'is_admin', 'is_super_admin',
            'date_joined', 'last_seen',
        ]
