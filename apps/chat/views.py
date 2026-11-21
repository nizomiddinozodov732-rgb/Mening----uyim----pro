from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db.models import Prefetch
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from apps.accounts.serializers import UserSerializer
from apps.properties.models import PropertyImage, PropertyRating

User = get_user_model()


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = (
            Conversation.objects.filter(participants=self.request.user)
            .distinct()
            .select_related('property', 'property__owner')
            .prefetch_related(
                'participants',
                # Oxirgi xabar va o'qilmaganlar sonini hisoblash uchun barcha
                # xabarlarni bir marta yuklaymiz (N+1 oldini oladi).
                Prefetch('messages', queryset=Message.objects.select_related('sender').order_by('-created_at')),
                Prefetch('property__images', queryset=PropertyImage.objects.order_by('-is_primary', 'order')),
            )
            .order_by('-updated_at')
        )
        user = getattr(self.request, 'user', None)
        if user is not None and user.is_authenticated:
            qs = qs.prefetch_related(
                Prefetch(
                    'property__ratings',
                    queryset=PropertyRating.objects.filter(user=user),
                    to_attr='user_ratings',
                )
            )
        return qs

    def create(self, request, *args, **kwargs):
        recipient_id = request.data.get('recipient_id')
        property_id = request.data.get('property_id')

        if recipient_id:
            try:
                recipient_id = int(recipient_id)
            except (ValueError, TypeError):
                raise ValidationError({"recipient_id": "Noto'g'ri foydalanuvchi ID"})

            if recipient_id == request.user.id:
                raise ValidationError({"error": "O'zingiz bilan suhbat ocha olmaysiz."})

            if not User.objects.filter(id=recipient_id).exists():
                raise ValidationError({"recipient_id": "Bunday foydalanuvchi topilmadi."})

            existing = Conversation.objects.filter(
                participants=request.user
            ).filter(
                participants=recipient_id
            )
            if property_id:
                existing = existing.filter(property_id=property_id)
            else:
                existing = existing.filter(property__isnull=True)

            if existing.exists():
                conv = existing.first()
                return Response(
                    ConversationSerializer(conv, context={'request': request}).data,
                    status=status.HTTP_200_OK
                )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conv = serializer.save()
        conv.participants.add(request.user)
        if recipient_id:
            conv.participants.add(recipient_id)

        return Response(
            ConversationSerializer(conv, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conv = self.get_object()
        # Mark messages as read
        conv.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)
        msgs = conv.messages.all()
        serializer = MessageSerializer(msgs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        conv = self.get_object()
        file_obj = request.FILES.get('file')
        file_name = ''
        file_size = None
        if file_obj:
            file_name = file_obj.name
            file_size = file_obj.size

        serializer = MessageSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        msg = serializer.save(
            sender=request.user,
            conversation=conv,
            file=file_obj,
            file_name=file_name or request.data.get('file_name', ''),
            file_size=file_size or request.data.get('file_size')
        )
        conv.save()  # updates updated_at timestamp

        file_url = None
        if msg.file:
            file_url = request.build_absolute_uri(msg.file.url)

        # Real-time WebSocket orqali barcha qatnashuvchilarga xabar tarqatish
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                participant_ids = list(conv.participants.values_list('id', flat=True))
                msg_data = {
                    'id': msg.id,
                    'conversation': conv.id,
                    'sender': request.user.id,
                    'sender_name': request.user.get_full_name() or request.user.username,
                    'content': msg.content,
                    'message_type': msg.message_type,
                    'file_url': file_url,
                    'file_name': msg.file_name,
                    'file_size': msg.file_size,
                    'latitude': msg.latitude,
                    'longitude': msg.longitude,
                    'created_at': msg.created_at.isoformat()
                }
                for pid in participant_ids:
                    async_to_sync(channel_layer.group_send)(
                        f"chat_user_{pid}",
                        {
                            'type': 'chat_message',
                            'message': msg_data
                        }
                    )
        except Exception as e:
            # Broadcast xatosi bo'lsa ham HTTP xabar saqlangan
            pass

        return Response(MessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def users(self, request):
        """Chat boshlash uchun boshqa foydalanuvchilar ro'yxati"""
        q = request.query_params.get('search', '').strip()
        qs = User.objects.exclude(id=request.user.id)
        if q:
            qs = qs.filter(
                username__icontains=q
            ) | qs.filter(
                first_name__icontains=q
            ) | qs.filter(
                last_name__icontains=q
            )
        users = qs[:30]
        return Response(UserSerializer(users, many=True, context={'request': request}).data)
