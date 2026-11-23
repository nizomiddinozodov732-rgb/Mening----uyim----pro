"""Funksional va xavfsizlik testlari — chat moduli."""
import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Conversation, Message

User = get_user_model()

PASSWORD = 'V3ry$trongPassw0rd'


class ChatBaseTestCase(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.alice = User.objects.create_user(username='alice', password=PASSWORD, profession='seller')
        self.bob = User.objects.create_user(username='bob', password=PASSWORD, profession='builder')
        self.eve = User.objects.create_user(username='eve', password=PASSWORD, profession='customer')

    def authenticate(self, user):
        token = str(RefreshToken.for_user(user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return self.client

    def create_conversation(self):
        self.authenticate(self.alice)
        resp = self.client.post('/api/v1/chat/conversations/', {'recipient_id': self.bob.id}, format='json')
        self.assertEqual(resp.status_code, 201, resp.data)
        return Conversation.objects.get(pk=resp.data['id'])


class ConversationAccessTests(ChatBaseTestCase):
    def test_conversation_requires_authentication(self):
        self.assertEqual(self.client.get('/api/v1/chat/conversations/').status_code, 401)

    def test_create_conversation_adds_both_participants(self):
        conv = self.create_conversation()
        self.assertEqual(set(conv.participants.values_list('id', flat=True)), {self.alice.id, self.bob.id})

    def test_duplicate_conversation_is_reused(self):
        conv = self.create_conversation()
        again = self.client.post('/api/v1/chat/conversations/', {'recipient_id': self.bob.id}, format='json')
        self.assertEqual(again.status_code, 200)
        self.assertEqual(again.data['id'], conv.id)
        self.assertEqual(Conversation.objects.count(), 1)

    def test_cannot_start_conversation_with_self(self):
        self.authenticate(self.alice)
        resp = self.client.post('/api/v1/chat/conversations/', {'recipient_id': self.alice.id}, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_nonexistent_recipient_is_rejected(self):
        self.authenticate(self.alice)
        resp = self.client.post('/api/v1/chat/conversations/', {'recipient_id': 99999}, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_user_sees_only_own_conversations(self):
        self.create_conversation()
        self.authenticate(self.eve)
        resp = self.client.get('/api/v1/chat/conversations/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['count'], 0)

    def test_non_participant_cannot_read_messages(self):
        conv = self.create_conversation()
        self.authenticate(self.eve)
        resp = self.client.get(f'/api/v1/chat/conversations/{conv.id}/messages/')
        self.assertEqual(resp.status_code, 404)

    def test_non_participant_cannot_send_message(self):
        conv = self.create_conversation()
        self.authenticate(self.eve)
        resp = self.client.post(
            f'/api/v1/chat/conversations/{conv.id}/send_message/',
            {'content': 'Ruxsatsiz xabar', 'message_type': 'text'}, format='json',
        )
        self.assertEqual(resp.status_code, 404)
        self.assertEqual(Message.objects.count(), 0)

    def test_participant_can_send_and_read_message(self):
        conv = self.create_conversation()
        resp = self.client.post(
            f'/api/v1/chat/conversations/{conv.id}/send_message/',
            {'content': 'Salom, Bob!', 'message_type': 'text'}, format='json',
        )
        self.assertEqual(resp.status_code, 201, resp.data)

        self.authenticate(self.bob)
        listing = self.client.get(f'/api/v1/chat/conversations/{conv.id}/messages/')
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(len(listing.data), 1)
        self.assertEqual(listing.data[0]['content'], 'Salom, Bob!')
        self.assertTrue(Message.objects.get().is_read)

    def test_users_endpoint_excludes_self(self):
        self.authenticate(self.alice)
        resp = self.client.get('/api/v1/chat/conversations/users/')
        self.assertEqual(resp.status_code, 200)
        ids = [u['id'] for u in resp.data]
        self.assertNotIn(self.alice.id, ids)
        self.assertIn(self.bob.id, ids)


class ChatFileUploadSecurityTests(ChatBaseTestCase):
    """V-5: chat fayllari allowlist orqali tekshiriladi.

    `.html`/`.svg` kabi fayllar `/media/` orqali same-origin xizmat qilinib
    saqlangan XSS (stored XSS) hosil qilishi mumkin edi — endi ular rad
    etiladi va `/media/` `X-Content-Type-Options: nosniff` bilan beriladi.
    """

    def setUp(self):
        super().setUp()
        # Yuklangan fayllar vaqtinchalik papkaga yoziladi (ishchi papka toza qoladi)
        self._media_root = tempfile.mkdtemp(prefix='hs_chat_media_')
        self._override = override_settings(MEDIA_ROOT=self._media_root)
        self._override.enable()

    def tearDown(self):
        self._override.disable()
        shutil.rmtree(self._media_root, ignore_errors=True)
        super().tearDown()

    def _upload(self, name, content, content_type):
        conv = self.create_conversation()
        payload = SimpleUploadedFile(name, content, content_type=content_type)
        return self.client.post(
            f'/api/v1/chat/conversations/{conv.id}/send_message/',
            {'content': '', 'message_type': 'document', 'file': payload}, format='multipart',
        )

    def test_html_upload_is_rejected(self):
        resp = self._upload('evil.html', b'<script>alert(document.cookie)</script>', 'text/html')
        self.assertEqual(resp.status_code, 400, resp.data)
        self.assertEqual(Message.objects.count(), 0)

    def test_svg_upload_is_rejected(self):
        resp = self._upload('evil.svg', b'<svg onload="alert(1)"></svg>', 'image/svg+xml')
        self.assertEqual(resp.status_code, 400, resp.data)
        self.assertEqual(Message.objects.count(), 0)

    def test_allowed_image_upload_succeeds_and_media_is_nosniff(self):
        resp = self._upload('photo.png', b'\x89PNG\r\n\x1a\n', 'image/png')
        self.assertEqual(resp.status_code, 201, resp.data)
        msg = Message.objects.first()
        self.assertIsNotNone(msg.file)
        media = self.client.get(f'/media/{msg.file.name}')
        try:
            self.assertEqual(media.status_code, 200)
            self.assertEqual(media['X-Content-Type-Options'], 'nosniff')
        finally:
            media.close()
