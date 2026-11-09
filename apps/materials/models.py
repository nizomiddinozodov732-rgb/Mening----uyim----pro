from django.db import models
from django.conf import settings


class MaterialStore(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    latitude = models.FloatField(default=41.2995)
    longitude = models.FloatField(default=69.2401)
    phone = models.CharField(max_length=20)
    rating = models.FloatField(default=0)
    working_hours = models.CharField(max_length=100, default='9:00 - 18:00')
    image = models.ImageField(upload_to='stores/', blank=True, null=True)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stores', null=True, blank=True)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Material(models.Model):
    CATEGORY_CHOICES = [
        ('cement', 'Sement'),
        ('brick', "G'isht"),
        ('wood', 'Yog\'och'),
        ('metal', 'Metall'),
        ('paint', 'Bo\'yoq'),
        ('plumbing', 'Santexnika'),
        ('electrical', 'Elektr'),
        ('tiles', 'Plitka'),
        ('roofing', 'Tom yopish'),
        ('insulation', 'Izolyatsiya'),
        ('tools', 'Asboblar'),
        ('other', 'Boshqa'),
    ]

    store = models.ForeignKey(MaterialStore, on_delete=models.CASCADE, related_name='materials')
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    unit = models.CharField(max_length=50, help_text="dona, kg, m², m³")
    quantity = models.IntegerField(default=0)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='materials/', blank=True, null=True)
    status = models.CharField(max_length=20, default='available')
    rating = models.FloatField(default=0.0)
    rating_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-rating', '-created_at']

    def __str__(self):
        return f"{self.name} - {self.price} so'm"

    def update_rating(self):
        ratings = self.ratings.all()
        if ratings.exists():
            avg = ratings.aggregate(models.Avg('stars'))['stars__avg']
            self.rating = round(avg, 2) if avg is not None else 0.0
            self.rating_count = ratings.count()
        else:
            self.rating = 0.0
            self.rating_count = 0
        self.save(update_fields=['rating', 'rating_count'])


class MaterialRating(models.Model):
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='material_ratings')
    stars = models.PositiveSmallIntegerField(default=5)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('material', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} -> {self.material.name}: {self.stars}*"
