from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    """Tizimda kim nima qilganini yozib borish"""
    ACTION_CHOICES = [
        ('user_created', 'Foydalanuvchi yaratildi'),
        ('user_updated', 'Foydalanuvchi yangilandi'),
        ('user_deleted', "Foydalanuvchi o'chirildi"),
        ('user_banned', 'Foydalanuvchi bloklandi'),
        ('user_unbanned', 'Foydalanuvchi blokdan chiqarildi'),
        ('user_verified', 'Foydalanuvchi tasdiqlandi'),
        ('user_unverified', 'Foydalanuvchi tasdiqdan olindi'),
        ('admin_granted', 'Admin huquqi berildi'),
        ('admin_revoked', 'Admin huquqi olindi'),
        ('password_changed', "Parol o'zgartirildi"),
        ('property_created', "E'lon yaratildi"),
        ('property_updated', "E'lon yangilandi"),
        ('property_deleted', "E'lon o'chirildi"),
        ('property_status_changed', "E'lon holati o'zgardi"),
        ('complaint_resolved', 'Shikoyat hal etildi'),
        ('complaint_rejected', 'Shikoyat rad etildi'),
        ('payment_updated', "To'lov yangilandi"),
        ('banner_created', 'Banner yaratildi'),
        ('banner_updated', 'Banner yangilandi'),
        ('banner_deleted', "Banner o'chirildi"),
        ('promo_created', 'Aksiya kodi yaratildi'),
        ('notification_sent', 'Ommaviy xabar yuborildi'),
        ('ip_blocked', 'IP bloklandi'),
        ('ip_unblocked', 'IP blokdan chiqarildi'),
        ('project_created', 'Loyiha yaratildi'),
        ('project_updated', 'Loyiha yangilandi'),
        ('settings_changed', "Sozlamalar o'zgartirildi"),
        ('login', 'Tizimga kirish'),
        ('logout', 'Tizimdan chiqish'),
        ('other', 'Boshqa'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='audit_logs'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    target_type = models.CharField(max_length=50, blank=True)
    target_id = models.IntegerField(null=True, blank=True)
    target_name = models.CharField(max_length=255, blank=True)
    details = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} — {self.get_action_display()} ({self.created_at})"


class Banner(models.Model):
    """Marketing bannerlari"""
    POSITION_CHOICES = [
        ('hero', 'Bosh sahifa (Hero)'),
        ('sidebar', 'Yon panel'),
        ('footer', 'Pastki qism'),
        ('popup', 'Popup'),
        ('listing', "E'lonlar orasida"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='banners/', blank=True, null=True)
    link = models.URLField(blank=True)
    position = models.CharField(max_length=20, choices=POSITION_CHOICES, default='hero')
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(default=0)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    clicks = models.IntegerField(default=0)
    views = models.IntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='created_banners'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_position_display()})"


class PromoCode(models.Model):
    """Aksiya kodlari"""
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    discount_percent = models.IntegerField(default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    max_uses = models.IntegerField(default=0)
    used_count = models.IntegerField(default=0)
    min_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='created_promos'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} — {self.discount_percent}%"


class MassNotification(models.Model):
    """Ommaviy xabarlar"""
    AUDIENCE_CHOICES = [
        ('all', 'Barcha foydalanuvchilar'),
        ('sellers', 'Faqat sotuvchilar'),
        ('workers', 'Faqat ustalar'),
        ('architects', 'Faqat arxitektorlar'),
        ('builders', 'Faqat quruvchilar'),
        ('customers', 'Faqat mijozlar'),
        ('verified', 'Faqat verified'),
        ('admins', 'Faqat adminlar'),
    ]

    title = models.CharField(max_length=255)
    message = models.TextField()
    target_audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default='all')
    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='sent_notifications'
    )
    recipients_count = models.IntegerField(default=0)
    is_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} → {self.get_target_audience_display()}"


class ConstructionProject(models.Model):
    """Qurilish loyihalari"""
    STATUS_CHOICES = [
        ('planning', 'Rejada'),
        ('in_progress', 'Jarayonda'),
        ('paused', "To'xtatilgan"),
        ('completed', 'Yakunlangan'),
        ('cancelled', 'Bekor qilingan'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    architect = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='architect_projects'
    )
    builder = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='builder_projects'
    )
    material_seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='seller_projects'
    )
    workers = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name='worker_projects'
    )
    budget = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    spent = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    location = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    progress = models.IntegerField(default=0)  # 0-100%
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='created_projects'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class SecurityLog(models.Model):
    """Xavfsizlik loglari"""
    EVENT_CHOICES = [
        ('login_success', 'Muvaffaqiyatli kirish'),
        ('login_failed', 'Xato kirish'),
        ('logout', 'Chiqish'),
        ('password_change', "Parol o'zgartirish"),
        ('password_reset', 'Parol tiklash'),
        ('account_locked', 'Akkaunt bloklandi'),
        ('suspicious_activity', 'Shubhali faoliyat'),
        ('api_abuse', 'API suiistifoda'),
        ('2fa_enabled', '2FA yoqildi'),
        ('2fa_disabled', "2FA o'chirildi"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='security_logs'
    )
    event_type = models.CharField(max_length=30, choices=EVENT_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device_info = models.CharField(max_length=500, blank=True)
    location = models.CharField(max_length=255, blank=True)
    details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} — {self.get_event_type_display()} ({self.created_at})"


class BlockedIP(models.Model):
    """Bloklangan IP manzillar"""
    ip_address = models.GenericIPAddressField(unique=True)
    reason = models.TextField(blank=True)
    blocked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='blocked_ips'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.ip_address} — {self.reason}"


class SiteSetting(models.Model):
    """Bosh sahifani boshqarish uchun sozlamalar"""
    hero_badge = models.CharField(max_length=255, default="O'zbekistoning №1 ko'chmas mulk platformasi")
    hero_title = models.CharField(max_length=255, default="Orzuingizdagi uyni bugun toping")
    hero_subtitle = models.TextField(default="Ko'chmas mulk, qurilish materiallari, ustalar va arxitektorlar — hammasi bir joyda.")
    announcement_text = models.CharField(max_length=500, blank=True, default="")
    contact_email = models.EmailField(default="info@houseshop.uz")
    contact_phone = models.CharField(max_length=20, default="+998 90 123 45 67")
    telegram_url = models.CharField(max_length=255, blank=True, default="https://t.me/houseshop_uz")
    instagram_url = models.CharField(max_length=255, blank=True, default="https://instagram.com/houseshop_uz")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "Bosh sahifa sozlamalari"

    @classmethod
    def get_settings(cls):
        obj, created = cls.objects.get_or_create(id=1)
        return obj


class News(models.Model):
    """Bosh sahifadagi yangiliklar"""
    title = models.CharField(max_length=255)
    content = models.TextField()
    image = models.ImageField(upload_to='news/', blank=True, null=True)
    is_published = models.BooleanField(default=True)
    views = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
