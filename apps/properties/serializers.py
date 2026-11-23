from rest_framework import serializers
from .models import Property, PropertyImage, PropertyRating
from apps.accounts.serializers import UserSerializer

# V-9: yuklanadigan rasmlar uchun hajm va tur cheklovi (DoS/storage abuse).
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_CONTENT_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}


def validate_uploaded_images(images):
    for img in images:
        if img.size > MAX_IMAGE_SIZE:
            raise serializers.ValidationError(
                f"Har bir rasm hajmi {MAX_IMAGE_SIZE // (1024 * 1024)}MB dan oshmasligi kerak."
            )
        content_type = (getattr(img, 'content_type', '') or '').lower()
        if content_type and content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
            raise serializers.ValidationError("Faqat JPEG, PNG, WEBP yoki GIF rasm yuklash mumkin.")
    return images


class PropertyRatingSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = PropertyRating
        fields = ['id', 'user', 'user_detail', 'stars', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']

    def validate_stars(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Yulduzchalar 1 dan 5 gacha bo'lishi kerak.")
        return value


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'is_primary', 'order']


class PropertyListSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    owner_phone = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_property_type_display', read_only=True)
    primary_image = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            'id', 'title', 'property_type', 'type_display', 'price',
            'location', 'latitude', 'longitude', 'bedrooms', 'bathrooms',
            'area', 'features', 'status', 'views_count', 'rating', 'rating_count',
            'user_rating', 'owner', 'owner_name', 'owner_phone', 'primary_image', 'created_at'
        ]

    def get_owner_phone(self, obj):
        # V-7: e'lon egasining telefon raqami faqat autentifikatsiya qilingan
        # foydalanuvchiga ko'rsatiladi (anonim scraping'ning oldini oladi).
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.owner.phone or ''
        return None

    def get_user_rating(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return None
        # `user_ratings` — view'da Prefetch(to_attr) orqali tayyorlanadi (N+1 yo'q)
        cached = getattr(obj, 'user_ratings', None)
        if cached is not None:
            return cached[0].stars if cached else None
        ur = obj.ratings.filter(user=request.user).first()
        return ur.stars if ur else None

    def get_primary_image(self, obj):
        # Prefetch keshidan foydalanamiz — har bir e'lon uchun qo'shimcha
        # so'rov yubormaslik uchun (N+1 muammosini oldini oladi).
        images = obj.images.all()
        img = next((i for i in images if i.is_primary), None) or next(iter(images), None)
        if img:
            image_str = str(img.image)
            if image_str.startswith('http'):
                return image_str
            if 'mock_image' in image_str or not img.image.storage.exists(img.image.name):
                fallbacks = [
                    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
                    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
                    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
                    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
                    "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80",
                ]
                return fallbacks[obj.id % len(fallbacks)]
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(img.image.url)
            return img.image.url
        return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"


class PropertyDetailSerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    type_display = serializers.CharField(source='get_property_type_display', read_only=True)
    ratings = PropertyRatingSerializer(many=True, read_only=True)
    user_rating = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = '__all__'

    def get_user_rating(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Prefetch qilingan `ratings` ro'yxatidan topamiz (qo'shimcha so'rovsiz)
            uid = request.user.id
            for r in obj.ratings.all():
                if r.user_id == uid:
                    return {'id': r.id, 'stars': r.stars, 'comment': r.comment}
        return None


class PropertyCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    class Meta:
        model = Property
        fields = [
            'id', 'title', 'property_type', 'price', 'location', 'latitude',
            'longitude', 'bedrooms', 'bathrooms', 'area', 'description',
            'features', 'video_url', 'status', 'images'
        ]
        read_only_fields = ['id']

    def validate_images(self, value):
        return validate_uploaded_images(value)

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        validated_data['owner'] = self.context['request'].user
        prop = Property.objects.create(**validated_data)
        for i, img in enumerate(images_data):
            PropertyImage.objects.create(
                property=prop, image=img, is_primary=(i == 0), order=i
            )
        return prop


class PropertyUpdateSerializer(serializers.ModelSerializer):
    """Mavjud e'lonni tahrirlash (barcha maydonlar + rasmlar)."""
    images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    keep_image_ids = serializers.JSONField(write_only=True, required=False)

    class Meta:
        model = Property
        fields = [
            'id', 'title', 'property_type', 'price', 'location', 'latitude',
            'longitude', 'bedrooms', 'bathrooms', 'area', 'description',
            'features', 'video_url', 'status', 'images', 'keep_image_ids'
        ]
        read_only_fields = ['id']

    def validate_images(self, value):
        return validate_uploaded_images(value)

    def validate_keep_image_ids(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Rasm ID lari ro'yxat bo'lishi kerak.")
        try:
            return [int(i) for i in value]
        except (TypeError, ValueError):
            raise serializers.ValidationError("Rasm ID lari butun son bo'lishi kerak.")

    def update(self, instance, validated_data):
        new_images = validated_data.pop('images', [])
        keep_ids = validated_data.pop('keep_image_ids', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        existing = PropertyImage.objects.filter(property=instance)

        # Foydalanuvchi saqlab qolgan rasmlardan tashqarisini o'chiramiz
        if keep_ids is not None:
            existing.exclude(id__in=keep_ids).delete()

        # Yangi rasmlarni qo'shamiz
        if new_images:
            has_primary = PropertyImage.objects.filter(property=instance, is_primary=True).exists()
            start = PropertyImage.objects.filter(property=instance).count()
            for i, img in enumerate(new_images):
                PropertyImage.objects.create(
                    property=instance, image=img, order=start + i,
                    is_primary=(not has_primary and i == 0),
                )

        # Har doim bitta asosiy rasm bo'lishini ta'minlaymiz
        has_images = PropertyImage.objects.filter(property=instance).exists()
        has_primary = PropertyImage.objects.filter(property=instance, is_primary=True).exists()
        if has_images and not has_primary:
            first = PropertyImage.objects.filter(property=instance).order_by('order', 'id').first()
            first.is_primary = True
            first.save(update_fields=['is_primary'])

        return instance
