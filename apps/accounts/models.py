from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Custom User model with profession support"""
    
    PROFESSION_CHOICES = [
        ('customer', 'Oddiy mijoz'),
        ('seller', 'Sotuvchi'),
        ('builder', 'Quruvchi'),
        ('repairman', "Ta'mirlovchi usta"),
        ('architect', "Me'mor"),
    ]
    
    phone = models.CharField(max_length=20, blank=True)
    telegram = models.CharField(max_length=100, blank=True, help_text="Telegram username yoki havola")
    whatsapp = models.CharField(max_length=50, blank=True, help_text="WhatsApp telefon raqam")
    instagram = models.CharField(max_length=100, blank=True, help_text="Instagram profil nomi")
    profession = models.CharField(max_length=20, choices=PROFESSION_CHOICES, default='customer')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True)
    rating = models.FloatField(default=0)
    rating_count = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)

    # Subscription
    is_subscribed = models.BooleanField(default=False)
    subscription_end = models.DateTimeField(null=True, blank=True)

    # Admin levels
    is_admin = models.BooleanField(default=False)
    is_super_admin = models.BooleanField(default=False)

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_profession_display()})"

    def update_rating(self):
        from apps.ratings.models import Rating
        ratings = Rating.objects.filter(target_user=self)
        if ratings.exists():
            self.rating = ratings.aggregate(models.Avg('stars'))['stars__avg']
            self.rating_count = ratings.count()
            self.save(update_fields=['rating', 'rating_count'])
