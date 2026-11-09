from rest_framework import serializers
from .models import Rating
from apps.accounts.serializers import UserSerializer

class RatingSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Rating
        fields = ['id', 'user', 'user_detail', 'target_user', 'stars', 'comment', 'created_at']
        read_only_fields = ['user']

    def validate_stars(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Yulduzchalar 1 dan 5 gacha bo'lishi kerak.")
        return value
