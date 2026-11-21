from rest_framework import serializers
from .models import MaterialStore, Material, MaterialRating


class MaterialRatingSerializer(serializers.ModelSerializer):
    user_detail = serializers.SerializerMethodField()

    class Meta:
        model = MaterialRating
        fields = ['id', 'stars', 'comment', 'created_at', 'user_detail']

    def get_user_detail(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'full_name': f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username,
            'avatar': obj.user.avatar.url if obj.user.avatar else None,
        }


class MaterialStoreMinimalSerializer(serializers.ModelSerializer):
    rating = serializers.FloatField(read_only=True)
    rating_count = serializers.SerializerMethodField()
    owner_id = serializers.IntegerField(source='owner.id', read_only=True, default=None)

    class Meta:
        model = MaterialStore
        fields = ['id', 'name', 'phone', 'location', 'rating', 'rating_count', 'owner_id']

    def get_rating_count(self, obj):
        if obj.owner:
            return obj.owner.rating_count
        return 0


class MaterialSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    store_detail = MaterialStoreMinimalSerializer(source='store', read_only=True)

    class Meta:
        model = Material
        fields = '__all__'


class MaterialStoreSerializer(serializers.ModelSerializer):
    materials_count = serializers.SerializerMethodField()

    class Meta:
        model = MaterialStore
        fields = '__all__'

    def get_materials_count(self, obj):
        # View'da annotatsiya qilingan bo'lsa undan foydalanamiz (N+1 yo'q).
        annotated = getattr(obj, 'materials_count', None)
        if annotated is not None:
            return annotated
        return obj.materials.count()


class MaterialStoreDetailSerializer(serializers.ModelSerializer):
    materials = MaterialSerializer(many=True, read_only=True)

    class Meta:
        model = MaterialStore
        fields = '__all__'
