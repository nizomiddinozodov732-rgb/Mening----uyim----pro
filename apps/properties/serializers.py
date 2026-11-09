from rest_framework import serializers
from .models import Property, PropertyImage, PropertyRating
from apps.accounts.serializers import UserSerializer


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
    owner_phone = serializers.CharField(source='owner.phone', read_only=True)
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

    def get_user_rating(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Agar prefetch qilingan bo'lsa yoki tezkor tekshiruv
            rating_obj = getattr(obj, '_user_rating_cache', None)
            if rating_obj is not None:
                return rating_obj
            ur = obj.ratings.filter(user=request.user).first()
            return ur.stars if ur else None
        return None

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
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
            ur = obj.ratings.filter(user=request.user).first()
            if ur:
                return {'id': ur.id, 'stars': ur.stars, 'comment': ur.comment}
        return None


class PropertyCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    class Meta:
        model = Property
        fields = [
            'title', 'property_type', 'price', 'location', 'latitude',
            'longitude', 'bedrooms', 'bathrooms', 'area', 'description',
            'features', 'video_url', 'images'
        ]

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        validated_data['owner'] = self.context['request'].user
        prop = Property.objects.create(**validated_data)
        for i, img in enumerate(images_data):
            PropertyImage.objects.create(
                property=prop, image=img, is_primary=(i == 0), order=i
            )
        return prop
