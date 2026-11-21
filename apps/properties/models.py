from django.db import models
from django.conf import settings


class Property(models.Model):
    TYPE_CHOICES = [
        ('house', 'Uy'),
        ('apartment', 'Kvartira'),
        ('land', 'Yer'),
        ('rental', 'Ijara'),
    ]
    STATUS_CHOICES = [
        ('active', 'Faol'),
        ('sold', 'Sotilgan'),
        ('inactive', 'Nofaol'),
        ('pending', 'Kutilmoqda'),
    ]

    title = models.CharField(max_length=255)
    property_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    price = models.DecimalField(max_digits=15, decimal_places=2)
    location = models.CharField(max_length=255)
    latitude = models.FloatField(default=41.2995)
    longitude = models.FloatField(default=69.2401)
    bedrooms = models.IntegerField(default=0)
    bathrooms = models.IntegerField(default=0)
    area = models.FloatField(help_text="Maydon (m²)")
    description = models.TextField()
    features = models.JSONField(default=list, blank=True)
    video_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    views_count = models.IntegerField(default=0)
    rating = models.FloatField(default=0.0, db_index=True)
    rating_count = models.IntegerField(default=0)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='properties')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Properties'
        ordering = ['-rating', '-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['property_type']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.get_property_type_display()}"

    def update_rating(self):
        ratings = self.ratings.all()
        if ratings.exists():
            avg = ratings.aggregate(models.Avg('stars'))['stars__avg'] or 0.0
            self.rating = round(float(avg), 2)
            self.rating_count = ratings.count()
        else:
            self.rating = 0.0
            self.rating_count = 0
        self.save(update_fields=['rating', 'rating_count'])


class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='properties/')
    is_primary = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Image for {self.property.title}"


class PropertyRating(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='property_ratings')
    stars = models.IntegerField(default=5)  # 1 - 5
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Property Rating'
        verbose_name_plural = 'Property Ratings'
        unique_together = ('property', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} rated {self.property.title} with {self.stars} stars"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.property.update_rating()

    def delete(self, *args, **kwargs):
        prop = self.property
        super().delete(*args, **kwargs)
        prop.update_rating()
