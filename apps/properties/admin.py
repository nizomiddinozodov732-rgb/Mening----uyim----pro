from django.contrib import admin
from .models import Property, PropertyImage, PropertyRating


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1


class PropertyRatingInline(admin.TabularInline):
    model = PropertyRating
    extra = 0
    readonly_fields = ['user', 'stars', 'comment', 'created_at']


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['title', 'property_type', 'price', 'rating', 'rating_count', 'views_count', 'status', 'owner', 'created_at']
    list_filter = ['property_type', 'status', 'created_at']
    search_fields = ['title', 'location', 'description', 'owner__username', 'owner__first_name']
    inlines = [PropertyImageInline, PropertyRatingInline]


@admin.register(PropertyRating)
class PropertyRatingAdmin(admin.ModelAdmin):
    list_display = ['property', 'user', 'stars', 'created_at']
    list_filter = ['stars', 'created_at']
    search_fields = ['property__title', 'user__username', 'comment']
