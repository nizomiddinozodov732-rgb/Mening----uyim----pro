from django.db import models
from django.conf import settings
from apps.properties.models import Property

class Payment(models.Model):
    METHOD_CHOICES = [
        ('payme', 'Payme'),
        ('click', 'Click'),
        ('uzum', 'Uzum Bank'),
        ('visa', 'Visa'),
        ('mastercard', 'MasterCard'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Kutilmoqda'),
        ('completed', 'Muvaffaqiyatli'),
        ('failed', 'Xato'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    property = models.ForeignKey(Property, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.amount} so'm ({self.method})"
