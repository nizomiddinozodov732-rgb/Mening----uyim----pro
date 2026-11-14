import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Env o'zgaruvchilaridan Super Admin yaratadi (agar hali mavjud bo'lmasa)"

    def handle(self, *args, **options):
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', '').strip()
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', '')

        if not username or not password:
            self.stdout.write(
                "DJANGO_SUPERUSER_USERNAME/PASSWORD berilmagan — Super Admin yaratilmadi."
            )
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(f"'{username}' allaqachon mavjud — o'zgartirilmadi.")
            return

        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            profession='customer',
            is_verified=True,
            is_admin=True,
            is_super_admin=True,
        )
        self.stdout.write(self.style.SUCCESS(f"Super Admin yaratildi: {username}"))
