from django.db import models
from django.conf import settings


class ServiceProvider(models.Model):
    """Xizmat ko'rsatuvchilar - Quruvchi, Ta'mirlovchi, Me'mor"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='service_profile')
    specialization = models.CharField(max_length=255)
    experience_years = models.IntegerField(default=0)
    bio = models.TextField(blank=True)
    hourly_rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    completed_projects = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True)
    portfolio_images = models.JSONField(default=list, blank=True)
    skills = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.specialization}"


class ServiceRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Kutilmoqda'),
        ('accepted', 'Qabul qilindi'),
        ('in_progress', 'Jarayonda'),
        ('completed', 'Bajarildi'),
        ('cancelled', 'Bekor qilindi'),
    ]
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='service_requests')
    provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, related_name='requests')
    description = models.TextField()
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"So'rov: {self.client} → {self.provider}"
