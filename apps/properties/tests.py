"""Funksional va xavfsizlik testlari — properties (e'lonlar) moduli."""
import io

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from PIL import Image
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Property, PropertyImage, PropertyRating

User = get_user_model()

PASSWORD = 'V3ry$trongPassw0rd'


def make_image_bytes():
    buf = io.BytesIO()
    Image.new('RGB', (2, 2), color=(120, 180, 240)).save(buf, format='PNG')
    return buf.getvalue()


class PropertyBaseTestCase(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.seller = User.objects.create_user(
            username='seller', password=PASSWORD, profession='seller', is_subscribed=True,
        )
        self.other = User.objects.create_user(
            username='other', password=PASSWORD, profession='builder', is_subscribed=True,
        )
        self.customer = User.objects.create_user(
            username='customer', password=PASSWORD, profession='customer',
        )
        self.active = Property.objects.create(
            title='Faol uy', property_type='house', price=100000, location='Toshkent',
            area=120, description='Tavsif', owner=self.seller, status='active',
        )
        self.sold = Property.objects.create(
            title='Sotilgan uy', property_type='house', price=200000, location='Toshkent',
            area=150, description='Tavsif', owner=self.seller, status='sold',
        )

    def authenticate(self, user):
        token = str(RefreshToken.for_user(user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return self.client


class PropertyListTests(PropertyBaseTestCase):
    def test_anonymous_list_returns_only_active(self):
        resp = self.client.get('/api/v1/properties/')
        self.assertEqual(resp.status_code, 200)
        titles = [p['title'] for p in resp.data['results']]
        self.assertIn('Faol uy', titles)
        self.assertNotIn('Sotilgan uy', titles)

    def test_all_parameter_does_not_reveal_hidden_listings_to_anonymous(self):
        """V-6: `?all=1` anonim so'rovchiga yashirin e'lonlarni ochmaydi."""
        resp = self.client.get('/api/v1/properties/?all=1')
        self.assertEqual(resp.status_code, 200)
        titles = [p['title'] for p in resp.data['results']]
        self.assertNotIn('Sotilgan uy', titles)

    def test_all_parameter_reveals_hidden_listings_to_admin(self):
        """V-6: faqat admin/super-admin `?all=1` bilan yashirin e'lonlarni ko'radi."""
        self.seller.is_admin = True
        self.seller.save(update_fields=['is_admin'])
        self.authenticate(self.seller)
        resp = self.client.get('/api/v1/properties/?all=1')
        self.assertEqual(resp.status_code, 200)
        titles = [p['title'] for p in resp.data['results']]
        self.assertIn('Sotilgan uy', titles)

    def test_public_listing_does_not_expose_owner_phone(self):
        """V-7: `owner_phone` anonim so'rovchiga ko'rinmaydi."""
        self.seller.phone = '+998901234567'
        self.seller.save(update_fields=['phone'])
        resp = self.client.get('/api/v1/properties/')
        row = resp.data['results'][0]
        self.assertIsNone(row['owner_phone'])

    def test_authenticated_user_sees_owner_phone_in_listing(self):
        """V-7: `owner_phone` faqat autentifikatsiya qilingan foydalanuvchiga beriladi."""
        self.seller.phone = '+998901234567'
        self.seller.save(update_fields=['phone'])
        self.authenticate(self.customer)
        resp = self.client.get('/api/v1/properties/')
        row = resp.data['results'][0]
        self.assertEqual(row['owner_phone'], '+998901234567')

    def test_price_filter_works(self):
        Property.objects.create(
            title='Qimmat faol uy', property_type='house', price=200000,
            location='Toshkent', area=150, description='Tavsif',
            owner=self.seller, status='active',
        )
        resp = self.client.get('/api/v1/properties/?min_price=150000&max_price=250000')
        self.assertEqual(resp.status_code, 200)
        titles = [p['title'] for p in resp.data['results']]
        self.assertIn('Qimmat faol uy', titles)     # 200000 — oraliqda
        self.assertNotIn('Faol uy', titles)         # 100000 — oraliqdan tashqarida
        self.assertNotIn('Sotilgan uy', titles)     # yashirin e'lon ko'rinmaydi

    def test_invalid_filter_values_do_not_break_endpoint(self):
        resp = self.client.get('/api/v1/properties/?min_price=abc&bedrooms=xyz')
        self.assertEqual(resp.status_code, 200)

    def test_retrieve_increments_views_count(self):
        resp = self.client.get(f'/api/v1/properties/{self.active.id}/')
        self.assertEqual(resp.status_code, 200)
        self.active.refresh_from_db()
        self.assertEqual(self.active.views_count, 1)

    def test_hidden_property_returns_404_for_anonymous(self):
        resp = self.client.get(f'/api/v1/properties/{self.sold.id}/')
        self.assertEqual(resp.status_code, 404)

    def test_owner_can_retrieve_hidden_property(self):
        self.authenticate(self.seller)
        resp = self.client.get(f'/api/v1/properties/{self.sold.id}/')
        self.assertEqual(resp.status_code, 200)

    def test_featured_endpoint(self):
        resp = self.client.get('/api/v1/properties/featured/')
        self.assertEqual(resp.status_code, 200)


class PropertyCreateTests(PropertyBaseTestCase):
    payload = {
        'title': 'Yangi uy', 'property_type': 'house', 'price': '150000',
        'location': 'Samarqand', 'area': 90, 'description': 'Yangi e\'lon',
        'bedrooms': 3, 'bathrooms': 2,
    }

    def test_anonymous_cannot_create(self):
        self.assertEqual(self.client.post('/api/v1/properties/', self.payload, format='json').status_code, 401)

    def test_customer_cannot_create_listing(self):
        self.authenticate(self.customer)
        resp = self.client.post('/api/v1/properties/', self.payload, format='json')
        self.assertEqual(resp.status_code, 403)

    def test_unsubscribed_seller_cannot_create_listing(self):
        self.seller.is_subscribed = False
        self.seller.save(update_fields=['is_subscribed'])
        self.authenticate(self.seller)
        resp = self.client.post('/api/v1/properties/', self.payload, format='json')
        self.assertEqual(resp.status_code, 403)

    def test_subscribed_seller_creates_listing_and_becomes_owner(self):
        self.authenticate(self.seller)
        resp = self.client.post('/api/v1/properties/', self.payload, format='json')
        self.assertEqual(resp.status_code, 201, resp.data)
        created = Property.objects.get(pk=resp.data['id'])
        self.assertEqual(created.owner, self.seller)

    def test_image_upload_while_creating_listing(self):
        self.authenticate(self.seller)
        payload = dict(self.payload, title='Rasmli uy')
        payload['images'] = [SimpleUploadedFileStub('a.png', make_image_bytes(), 'image/png')]
        resp = self.client.post('/api/v1/properties/', payload, format='multipart')
        self.assertEqual(resp.status_code, 201, resp.data)
        created = Property.objects.get(pk=resp.data['id'])
        self.assertEqual(created.images.count(), 1)
        created.images.all().delete()


class SimpleUploadedFileStub:
    def __new__(cls, name, content, content_type):
        from django.core.files.uploadedfile import SimpleUploadedFile
        return SimpleUploadedFile(name, content, content_type=content_type)


class PropertyModifyTests(PropertyBaseTestCase):
    def test_owner_can_update_listing(self):
        self.authenticate(self.seller)
        resp = self.client.patch(f'/api/v1/properties/{self.active.id}/', {'title': 'Yangilangan'}, format='json')
        self.assertEqual(resp.status_code, 200, resp.data)
        self.active.refresh_from_db()
        self.assertEqual(self.active.title, 'Yangilangan')

    def test_non_owner_cannot_update_listing(self):
        self.authenticate(self.other)
        resp = self.client.patch(f'/api/v1/properties/{self.active.id}/', {'title': 'O\u2018g\u2018irlangan'}, format='json')
        self.assertEqual(resp.status_code, 403)
        self.active.refresh_from_db()
        self.assertNotEqual(self.active.title, 'O\u2018g\u2018irlangan')

    def test_non_owner_cannot_delete_listing(self):
        self.authenticate(self.other)
        self.assertEqual(self.client.delete(f'/api/v1/properties/{self.active.id}/').status_code, 403)
        self.assertTrue(Property.objects.filter(pk=self.active.pk).exists())

    def test_owner_can_delete_listing(self):
        self.authenticate(self.seller)
        self.assertEqual(self.client.delete(f'/api/v1/properties/{self.active.id}/').status_code, 204)
        self.assertFalse(Property.objects.filter(pk=self.active.pk).exists())

    def test_authenticated_user_sees_only_own_listings_in_my_properties(self):
        self.authenticate(self.other)
        resp = self.client.get('/api/v1/properties/my_properties/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data, [])

    def test_my_properties_requires_authentication(self):
        self.assertEqual(self.client.get('/api/v1/properties/my_properties/').status_code, 401)


class PropertyRatingTests(PropertyBaseTestCase):
    def test_owner_cannot_rate_own_listing(self):
        self.authenticate(self.seller)
        resp = self.client.post(f'/api/v1/properties/{self.active.id}/rate/', {'stars': 5}, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_user_can_rate_and_average_is_updated(self):
        """V-8: birinchi reyting agregatga darhol o'tadi.

        `Property.update_rating()` endi `rating`/`rating_count`ni to'g'ridan-to'g'ri
        bazadan agregat qilib hisoblaydi (kesh/prefetch ta'siriga bog'liq emas).
        """
        self.authenticate(self.other)
        resp = self.client.post(f'/api/v1/properties/{self.active.id}/rate/', {'stars': 4, 'comment': 'Yaxshi'}, format='json')
        self.assertEqual(resp.status_code, 201, resp.data)
        self.active.refresh_from_db()
        self.assertEqual(self.active.rating, 4.0)
        self.assertEqual(self.active.rating_count, 1)

    def test_rating_is_updated_on_second_submission(self):
        self.authenticate(self.other)
        self.client.post(f'/api/v1/properties/{self.active.id}/rate/', {'stars': 4}, format='json')
        resp = self.client.post(f'/api/v1/properties/{self.active.id}/rate/', {'stars': 2}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.active.refresh_from_db()
        self.assertEqual(self.active.rating, 2.0)
        self.assertEqual(PropertyRating.objects.filter(property=self.active).count(), 1)

    def test_out_of_range_rating_is_rejected(self):
        self.authenticate(self.other)
        self.assertEqual(
            self.client.post(f'/api/v1/properties/{self.active.id}/rate/', {'stars': 9}, format='json').status_code, 400)

    def test_rating_action_requires_authentication(self):
        """V-3: `get_permissions()` endi `@action` uchun autentifikatsiyani talab
        qiladi — anonim `POST /rate/` 500 emas, 401 qaytaradi."""
        resp = self.client.post(f'/api/v1/properties/{self.active.id}/rate/', {'stars': 5}, format='json')
        self.assertEqual(resp.status_code, 401)

    def test_ratings_list_is_public(self):
        self.authenticate(self.other)
        self.client.post(f'/api/v1/properties/{self.active.id}/rate/', {'stars': 5}, format='json')
        self.client.credentials()
        resp = self.client.get(f'/api/v1/properties/{self.active.id}/ratings/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)

    def test_delete_rating_recomputes_aggregate(self):
        """V-8: `delete_rating` agregatni to'g'ri qayta hisoblaydi.

        `PropertyRating` o'chirilgach `prop.update_rating()` bazadan qayta
        agregat qiladi, shu sababli `rating_count` nolga tushadi.
        """
        self.authenticate(self.other)
        self.client.post(f'/api/v1/properties/{self.active.id}/rate/', {'stars': 5}, format='json')
        resp = self.client.delete(f'/api/v1/properties/{self.active.id}/delete_rating/')
        self.assertEqual(resp.status_code, 200)
        self.active.refresh_from_db()
        self.assertEqual(self.active.rating_count, 0)
        self.assertEqual(self.active.rating, 0.0)
