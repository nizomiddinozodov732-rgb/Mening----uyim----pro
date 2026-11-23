"""Funksional va xavfsizlik testlari — accounts (autentifikatsiya) moduli.

Topilgan zaifliklar (V-1, V-2, V-4, V-10, V-12) tuzatilgandan so'ng, avval PoC
sifatida yozilgan testlar **xavfsiz xatti-harakatni** tekshiruvchi regressiya
testlariga aylantirildi.
"""
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.dashboard.models import BlockedIP, SecurityLog

User = get_user_model()

STRONG_PASSWORD = 'V3ry$trongPassw0rd'


class BaseAPITestCase(TestCase):
    """Umumiy yordamchi: keshni tozalash va JWT bilan autentifikatsiya."""

    def setUp(self):
        cache.clear()  # throttle va brute-force hisoblagichlarini nolga tushirish
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='ali', email='ali@example.com',
            password=STRONG_PASSWORD, profession='seller',
        )

    def authenticate(self, user=None):
        user = user or self.user
        token = str(RefreshToken.for_user(user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return self.client


class RegisterAPITests(BaseAPITestCase):
    url = '/api/v1/auth/register/'

    def test_register_success_returns_tokens_and_hashes_password(self):
        resp = self.client.post(self.url, {
            'username': 'vali', 'email': 'vali@example.com',
            'first_name': 'Vali', 'last_name': 'Valiyev',
            'phone': '+998901112233', 'profession': 'builder',
            'password': STRONG_PASSWORD, 'password2': STRONG_PASSWORD,
        }, format='json')
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertIn('tokens', resp.data)
        self.assertIn('access', resp.data['tokens'])
        created = User.objects.get(username='vali')
        self.assertNotEqual(created.password, STRONG_PASSWORD)
        self.assertTrue(created.password.startswith('pbkdf2_'), created.password[:20])

    def test_register_password_mismatch_is_rejected(self):
        resp = self.client.post(self.url, {
            'username': 'vali', 'email': 'vali@example.com',
            'password': STRONG_PASSWORD, 'password2': 'BoshqaParol!123',
        }, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_register_weak_password_is_rejected(self):
        resp = self.client.post(self.url, {
            'username': 'vali', 'email': 'vali@example.com',
            'password': '12345678', 'password2': '12345678',
        }, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_register_duplicate_username_is_rejected(self):
        resp = self.client.post(self.url, {
            'username': 'ali', 'email': 'boshqa@example.com',
            'password': STRONG_PASSWORD, 'password2': STRONG_PASSWORD,
        }, format='json')
        self.assertEqual(resp.status_code, 400)


class LoginAPITests(BaseAPITestCase):
    url = '/api/v1/auth/login/'

    def test_login_with_username(self):
        resp = self.client.post(self.url, {'username': 'ali', 'password': STRONG_PASSWORD}, format='json')
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)

    def test_login_with_email(self):
        resp = self.client.post(self.url, {'username': 'ali@example.com', 'password': STRONG_PASSWORD}, format='json')
        self.assertEqual(resp.status_code, 200, resp.data)

    def test_login_wrong_password_is_rejected_and_logged(self):
        resp = self.client.post(self.url, {'username': 'ali', 'password': 'xato-parol'}, format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertTrue(SecurityLog.objects.filter(event_type='login_failed').exists())

    def test_login_success_is_logged(self):
        self.client.post(self.url, {'username': 'ali', 'password': STRONG_PASSWORD}, format='json')
        self.assertTrue(SecurityLog.objects.filter(event_type='login_success').exists())

    def test_login_missing_fields_is_rejected(self):
        resp = self.client.post(self.url, {'username': 'ali'}, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_inactive_user_cannot_login(self):
        """Funksional: bloklangan (is_active=False) foydalanuvchi kira olmaydi.

        V-10: `LoginView` da nofaol akkaunt uchun alohida 403 shoxobchasi
        olib tashlandi — Django `authenticate()` nofaol foydalanuvchi uchun
        `None` qaytaradi, shu sababli javob neytral 400 bo'ladi va
        foydalanuvchi mavjudligi oshkor qilinmaydi.
        """
        self.user.is_active = False
        self.user.save(update_fields=['is_active'])
        resp = self.client.post(self.url, {'username': 'ali', 'password': STRONG_PASSWORD}, format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertNotIn('access', resp.data)
        self.assertNotIn('refresh', resp.data)

    def test_jwt_token_is_accepted_by_protected_endpoint(self):
        resp = self.client.post(self.url, {'username': 'ali', 'password': STRONG_PASSWORD}, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
        profile = self.client.get('/api/v1/auth/profile/')
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.data['username'], 'ali')


class ProfileAPITests(BaseAPITestCase):
    url = '/api/v1/auth/profile/'

    def test_profile_requires_authentication(self):
        self.assertEqual(self.client.get(self.url).status_code, 401)

    def test_profile_returns_current_user(self):
        self.authenticate()
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['id'], self.user.id)

    def test_profile_update_changes_editable_fields_only(self):
        self.authenticate()
        resp = self.client.patch(self.url, {
            'first_name': 'Ali', 'last_name': 'Valiyev',
            'phone': '+998990001122', 'bio': 'Yangi bio',
            'rating': 5.0, 'is_admin': True,  # ruxsat etilmagan maydonlar
        }, format='json')
        self.assertEqual(resp.status_code, 200, resp.data)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Ali')
        self.assertEqual(self.user.rating, 0)          # o'zgarmadi
        self.assertFalse(self.user.is_admin)           # o'zgarmadi

    def test_password_change_with_correct_old_password(self):
        self.authenticate()
        resp = self.client.post(self.url, {
            'old_password': STRONG_PASSWORD, 'new_password': 'N3w$trongPassw0rd',
        }, format='json')
        self.assertEqual(resp.status_code, 200, resp.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('N3w$trongPassw0rd'))

    def test_password_change_with_wrong_old_password_fails(self):
        self.authenticate()
        resp = self.client.post(self.url, {
            'old_password': 'xato', 'new_password': 'N3w$trongPassw0rd',
        }, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_password_change_with_weak_new_password_fails(self):
        self.authenticate()
        resp = self.client.post(self.url, {
            'old_password': STRONG_PASSWORD, 'new_password': '12345678',
        }, format='json')
        self.assertEqual(resp.status_code, 400)


class BruteForceProtectionTests(BaseAPITestCase):
    url = '/api/v1/auth/login/'

    def test_ip_is_blocked_after_ten_failed_logins(self):
        for _ in range(10):
            resp = self.client.post(self.url, {'username': 'ali', 'password': 'xato'}, format='json')
            self.assertEqual(resp.status_code, 400, resp.data)
        self.assertTrue(BlockedIP.objects.filter(ip_address='127.0.0.1').exists())
        blocked = self.client.post(self.url, {'username': 'ali', 'password': STRONG_PASSWORD}, format='json')
        self.assertEqual(blocked.status_code, 403)

    def test_spoofed_x_forwarded_for_cannot_bypass_brute_force_blocking(self):
        """V-2: soxta `X-Forwarded-For` hisoblagichni IP'lar bo'yicha bo'lib
        tashlay olmaydi.

        So'rov ishonchli proksidan (`REMOTE_ADDR=127.0.0.1`) keladi va proksi
        haqiqiy mijoz IP'sini XFF oxiriga qo'shadi (`NUM_PROXIES=1`). Hujumchi
        boshiga faqat soxta qiymat qo'sha oladi — bu hisoblagichni almashtira
        olmaydi, shu sababli IP 10 xatodan keyin baribir bloklanadi.
        """
        for i in range(10):
            resp = self.client.post(
                self.url, {'username': 'ali', 'password': 'xato'}, format='json',
                HTTP_X_FORWARDED_FOR=f'10.0.0.{i + 1}, 203.0.113.7',
            )
            self.assertEqual(resp.status_code, 400, resp.data)
        self.assertTrue(BlockedIP.objects.filter(ip_address='203.0.113.7').exists())
        blocked = self.client.post(
            self.url, {'username': 'ali', 'password': STRONG_PASSWORD}, format='json',
            HTTP_X_FORWARDED_FOR='10.0.0.99, 203.0.113.7',
        )
        self.assertEqual(blocked.status_code, 403)

    def test_spoofed_x_forwarded_for_cannot_bypass_drf_throttling(self):
        """V-2: DRF throttling `NUM_PROXIES` orqali XFF'ning faqat proksi
        qo'shgan (o'ng tomondagi) qismini hisobga oladi."""
        statuses = []
        for i in range(12):
            resp = self.client.post(
                self.url, {'username': 'ali', 'password': STRONG_PASSWORD}, format='json',
                HTTP_X_FORWARDED_FOR=f'172.16.0.{i + 1}, 203.0.113.9',
            )
            statuses.append(resp.status_code)
        # 10/min limitidan oshgani uchun 429 (throttle) bo'lishi shart
        self.assertIn(429, statuses)


class PublicUserDataExposureTests(BaseAPITestCase):
    def test_public_user_list_does_not_expose_pii(self):
        """V-4: `AllowAny` ro'yxat/tafsilot endpointlari shaxsiy ma'lumotlarni
        (email, telefon, E2E ochiq kalit) tarqatmaydi."""
        self.user.public_key = '{"kty":"EC","crv":"P-256","x":"abc","y":"def"}'
        self.user.save(update_fields=['public_key'])

        listing = self.client.get('/api/v1/auth/users/')
        self.assertEqual(listing.status_code, 200)
        row = listing.data['results'][0]
        self.assertNotIn('email', row)
        self.assertNotIn('phone', row)
        self.assertNotIn('public_key', row)
        # Ommaviy profil uchun foydali maydonlar saqlanib qoladi
        self.assertEqual(row['username'], 'ali')
        self.assertIn('rating', row)

        detail = self.client.get(f'/api/v1/auth/users/{self.user.id}/')
        self.assertEqual(detail.status_code, 200)
        self.assertNotIn('email', detail.data)
        self.assertNotIn('phone', detail.data)


class AdminPrivilegeEscalationTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = User.objects.create_user(
            username='admin1', email='admin1@example.com',
            password=STRONG_PASSWORD, is_admin=True, is_staff=True,
        )
        self.target = User.objects.create_user(
            username='target', email='target@example.com', password=STRONG_PASSWORD,
        )

    def test_non_admin_gets_empty_admin_user_list(self):
        self.authenticate()
        resp = self.client.get('/api/v1/auth/admin/users/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['count'], 0)

    def test_admin_can_list_users(self):
        self.authenticate(self.admin)
        resp = self.client.get('/api/v1/auth/admin/users/')
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(resp.data['count'], 2)

    def test_non_admin_cannot_update_users(self):
        self.authenticate()
        resp = self.client.patch(f'/api/v1/auth/admin/users/{self.target.id}/', {'first_name': 'Hack'}, format='json')
        self.assertEqual(resp.status_code, 403)

    def test_admin_cannot_self_promote_to_super_admin(self):
        """V-1: oddiy `is_admin` foydalanuvchi `AdminUserSerializer` orqali o'z
        imtiyozini oshira olmaydi — imtiyoz maydonlari faqat o'qish uchun."""
        self.authenticate(self.admin)
        resp = self.client.patch(
            f'/api/v1/auth/admin/users/{self.admin.id}/',
            {'is_super_admin': True}, format='json',
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.admin.refresh_from_db()
        self.assertFalse(self.admin.is_super_admin)  # imtiyoz oshirilmadi

        # Super-admin uchun mo'ljallangan endpoint hali ham yopiq
        escalated = self.client.get('/api/v1/dashboard/command-center/')
        self.assertEqual(escalated.status_code, 403)

    def test_admin_cannot_escalate_other_user(self):
        """V-1: xuddi shu yo'l bilan boshqa foydalanuvchi ham super-admin qilinmaydi."""
        self.authenticate(self.admin)
        resp = self.client.patch(
            f'/api/v1/auth/admin/users/{self.target.id}/',
            {'is_super_admin': True, 'is_active': True}, format='json',
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.target.refresh_from_db()
        self.assertFalse(self.target.is_super_admin)
