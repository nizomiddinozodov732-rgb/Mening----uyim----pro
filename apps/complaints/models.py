from django.db import models
from django.conf import settings

class Complaint(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Kutilmoqda'),
        ('reviewing', 'Ko\'rib chiqilmoqda'),
        ('resolved', 'Hal etildi'),
        ('rejected', 'Rad etildi'),
    ]

    COMPLAINT_TYPE_CHOICES = [
        ('fraud', 'Firibgarlik / Aldov'),
        ('fake', 'Soxta / Noto\'g\'ri ma\'lumot'),
        ('inappropriate', 'Nomaqbul yoki haqoratomuz kontent'),
        ('poor_quality', 'Sifatsiz xizmat yoki tovar'),
        ('spam', 'Spam yoki reklama'),
        ('other', 'Boshqa muammo'),
    ]

    complainant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='filed_complaints')
    accused = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='received_complaints')
    
    # Qo'shimcha nishonlar
    property = models.ForeignKey('properties.Property', on_delete=models.SET_NULL, null=True, blank=True, related_name='complaints')
    material = models.ForeignKey('materials.Material', on_delete=models.SET_NULL, null=True, blank=True, related_name='complaints')
    store = models.ForeignKey('materials.MaterialStore', on_delete=models.SET_NULL, null=True, blank=True, related_name='complaints')

    complaint_type = models.CharField(max_length=30, choices=COMPLAINT_TYPE_CHOICES, default='other')
    subject = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_response = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        target = self.accused.username if self.accused else (self.property.title if self.property else 'Ob\'yekt')
        return f"Complaint by {self.complainant.username} against {target}"
