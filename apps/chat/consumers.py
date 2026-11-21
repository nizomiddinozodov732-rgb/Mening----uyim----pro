import json
import time
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from apps.chat.models import Conversation, Message

User = get_user_model()

# Xabarlar/signallar uchun xavfsizlik cheklovlari
# E2E shifrlangan matn base64 ko'rinishida ~1.4x kattaroq bo'ladi, shu sababli
# limit shifrlangan matnni ham qamrab oladi (ochiq matn limiti frontendda).
MAX_MESSAGE_LENGTH = 10000
MAX_SIGNAL_PAYLOAD_BYTES = 65536  # 64 KB (SDP/ICE uchun yetarli)
ALLOWED_MESSAGE_TYPES = {'text', 'image', 'video', 'document', 'location'}
ALLOWED_SIGNAL_TYPES = {
    'offer', 'answer', 'ice-candidate', 'end-call', 'reject', 'ringing', 'busy',
}
# Bitta ulanish uchun signal chastotasi cheklovi (spam/xalaqit oldini olish)
SIGNAL_RATE_WINDOW = 60  # sekund
SIGNAL_RATE_MAX = 120    # oynada maksimal signal soni


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or self.user.is_anonymous:
            # Avtorizatsiya bo'lmasa ulanishni rad etamiz
            await self.close(code=4001)
            return
        else:
            self.room_name = f"user_{self.user.id}"
            self.room_group_name = f"chat_{self.room_name}"

            # signal chastotasi hisoblagichi (faqat shu ulanish uchun)
            self._signal_window_start = time.monotonic()
            self._signal_count = 0

            # Join user's personal channel group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()

            # Set user online status
            await self.set_user_status(True)

    async def disconnect(self, close_code):
        if self.user and not self.user.is_anonymous:
            # Leave user group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            # Set user offline status
            await self.set_user_status(False)

    def _signal_rate_ok(self):
        """Signallar chastotasini cheklash (ulanish darajasida)."""
        now = time.monotonic()
        if now - self._signal_window_start > SIGNAL_RATE_WINDOW:
            self._signal_window_start = now
            self._signal_count = 0
        self._signal_count += 1
        return self._signal_count <= SIGNAL_RATE_MAX

    async def receive(self, text_data):
        if not self.user or self.user.is_anonymous:
            return

        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            return

        if not isinstance(data, dict):
            return

        action = data.get('action')

        if action == 'message':
            conversation_id = data.get('conversation_id')
            content = (data.get('content') or '').strip()
            message_type = data.get('message_type', 'text')
            latitude = data.get('latitude')
            longitude = data.get('longitude')

            # Faqat ruxsat etilgan turdagi xabarlar
            if message_type not in ALLOWED_MESSAGE_TYPES:
                return
            # Matn uzunligini cheklash (DoS/abuse oldini olish)
            if len(content) > MAX_MESSAGE_LENGTH:
                content = content[:MAX_MESSAGE_LENGTH]
            if not content and not (latitude is not None and longitude is not None):
                return
            if not conversation_id:
                return

            # Save message to DB (faqat qatnashuvchi yubora oladi)
            msg = await self.save_message(conversation_id, content, message_type, latitude, longitude)
            if not msg:
                return

            recipients = await self.get_conversation_participants(conversation_id)

            # Send message to all participants
            msg_payload = {
                'id': msg.id,
                'conversation': conversation_id,
                'sender': self.user.id,
                'sender_name': self.user.get_full_name() or self.user.username,
                'content': msg.content,
                'message_type': msg.message_type,
                'file_url': msg.file.url if msg.file else None,
                'file_name': msg.file_name,
                'file_size': msg.file_size,
                'latitude': msg.latitude,
                'longitude': msg.longitude,
                'created_at': msg.created_at.isoformat()
            }

            for recipient_id in recipients:
                await self.channel_layer.group_send(
                    f"chat_user_{recipient_id}",
                    {
                        'type': 'chat_message',
                        'message': msg_payload
                    }
                )

        elif action == 'call_signal':
            recipient_id = data.get('recipient_id')
            signal_data = data.get('signal_data')
            call_type = data.get('call_type', 'video')  # video or audio
            signal_type = data.get('signal_type')  # offer, answer, ice-candidate, end-call, reject, ringing, busy

            # ── Xavfsizlik tekshiruvlari ──────────────────────────
            # 1) Faqat ma'lum signal turlarini qabul qilamiz
            if signal_type not in ALLOWED_SIGNAL_TYPES:
                return
            # 2) Call turi cheklangan bo'lishi kerak
            if call_type not in ('video', 'audio'):
                return
            # 3) Payload hajmi cheklovi (DoS oldini olish)
            if signal_data is not None:
                try:
                    if len(json.dumps(signal_data)) > MAX_SIGNAL_PAYLOAD_BYTES:
                        return
                except (TypeError, ValueError):
                    return
            # 4) Chastota cheklovi
            if not self._signal_rate_ok():
                return

            try:
                recipient_id = int(recipient_id)
            except (ValueError, TypeError):
                return

            # 5) O'ziga signal yuborishni taqiqlash
            if recipient_id == self.user.id:
                return

            # 6) Qabul qiluvchi mavjud va faol bo'lishi kerak
            if not await self.is_active_user(recipient_id):
                return

            # 7) MUHIM: faqat umumiy suhbati (conversation) bo'lgan
            #    foydalanuvchilarga signal yuborish mumkin.
            #    Aks holda istalgan uchinchi shaxs boshqasiga
            #    qo'ng'iroq signali yuborib xalaqit berishi/tinglashi mumkin edi.
            if not await self.are_in_same_conversation(recipient_id):
                return

            await self.channel_layer.group_send(
                f"chat_user_{recipient_id}",
                {
                    'type': 'call_signal_message',
                    'signal': {
                        'caller_id': self.user.id,
                        'caller_name': self.user.get_full_name() or self.user.username,
                        'caller_avatar': self.user.avatar.url if self.user.avatar else None,
                        'recipient_id': recipient_id,
                        'signal_data': signal_data,
                        'call_type': call_type,
                        'signal_type': signal_type
                    }
                }
            )

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'message',
            'data': message
        }))

    async def call_signal_message(self, event):
        signal = event['signal']
        await self.send(text_data=json.dumps({
            'type': 'call_signal',
            'data': signal
        }))

    @database_sync_to_async
    def set_user_status(self, is_online):
        try:
            User.objects.filter(id=self.user.id).update(is_online=is_online)
        except Exception:
            pass

    @database_sync_to_async
    def save_message(self, conversation_id, content, message_type, latitude=None, longitude=None):
        try:
            conv = Conversation.objects.filter(id=conversation_id, participants=self.user).first()
            if not conv:
                return None
            msg = Message.objects.create(
                conversation=conv,
                sender=self.user,
                content=content or ("Lokatsiya" if message_type == 'location' else ""),
                message_type=message_type,
                latitude=latitude,
                longitude=longitude
            )
            conv.save()
            return msg
        except Exception:
            return None

    @database_sync_to_async
    def get_conversation_participants(self, conversation_id):
        try:
            conv = Conversation.objects.filter(id=conversation_id).first()
            if conv:
                return list(conv.participants.values_list('id', flat=True))
        except Exception:
            pass
        return []

    @database_sync_to_async
    def is_active_user(self, user_id):
        """Qabul qiluvchi mavjud va faol ekanini tekshirish."""
        try:
            return User.objects.filter(id=user_id, is_active=True).exists()
        except Exception:
            return False

    @database_sync_to_async
    def are_in_same_conversation(self, other_user_id):
        """Ikki foydalanuvchi kamida bitta umumiy suhbatda qatnashganini tekshirish.

        Bu WebRTC signalini faqat haqiqiy suhbatdoshlar o'rtasida
        almashinishini kafolatlaydi (uchinchi shaxs aralashuvi oldini oladi).
        """
        try:
            return Conversation.objects.filter(
                participants=self.user
            ).filter(
                participants__id=other_user_id
            ).exists()
        except Exception:
            return False
