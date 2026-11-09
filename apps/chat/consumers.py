import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from apps.chat.models import Conversation, Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or self.user.is_anonymous:
            await self.close()
        else:
            self.room_name = f"user_{self.user.id}"
            self.room_group_name = f"chat_{self.room_name}"

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

    async def receive(self, text_data):
        if not self.user or self.user.is_anonymous:
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        action = data.get('action')

        if action == 'message':
            conversation_id = data.get('conversation_id')
            content = data.get('content', '').strip()
            message_type = data.get('message_type', 'text')
            latitude = data.get('latitude')
            longitude = data.get('longitude')

            if not content and not (latitude is not None and longitude is not None):
                return
            if not conversation_id:
                return

            # Save message to DB
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
            signal_type = data.get('signal_type')  # offer, answer, ice-candidate, end-call

            if recipient_id:
                await self.channel_layer.group_send(
                    f"chat_user_{recipient_id}",
                    {
                        'type': 'call_signal_message',
                        'signal': {
                            'caller_id': self.user.id,
                            'caller_name': self.user.get_full_name() or self.user.username,
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
