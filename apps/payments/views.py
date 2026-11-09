from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Payment
from .serializers import PaymentSerializer
import uuid

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_admin or self.request.user.is_super_admin:
            return Payment.objects.all()
        return Payment.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def demo_pay(self, request):
        """Simulates Payme/Click/Uzum/Card checkout process in sandbox"""
        amount = request.data.get('amount')
        method = request.data.get('method')
        property_id = request.data.get('property_id')

        if not amount or not method:
            return Response({'error': 'Narx va to\'lov turi kiritilishi shart!'}, status=400)

        # Create pending payment
        payment = Payment.objects.create(
            user=request.user,
            property_id=property_id,
            amount=amount,
            method=method,
            status='pending',
            transaction_id=str(uuid.uuid4())
        )

        # Simulate provider response - 95% success rate
        import random
        success = random.random() < 0.95

        if success:
            payment.status = 'completed'
            payment.save()
            return Response({
                'status': 'success',
                'message': 'To\'lov muvaffaqiyatli amalga oshirildi!',
                'payment': PaymentSerializer(payment, context={'request': request}).data
            })
        else:
            payment.status = 'failed'
            payment.save()
            return Response({
                'status': 'failed',
                'message': 'To\'lov jarayonida xatolik yuz berdi!',
                'payment': PaymentSerializer(payment, context={'request': request}).data
            }, status=400)

    @action(detail=False, methods=['post'])
    def subscribe(self, request):
        """Handle user subscription payments"""
        plan = request.data.get('plan') # 'monthly' or 'yearly'
        method = request.data.get('method')
        
        if not plan or not method:
            return Response({'error': 'Reja va to\'lov turi kiritilishi shart!'}, status=400)
            
        amount = 50000 if plan == 'monthly' else 500000
        
        # Create payment
        payment = Payment.objects.create(
            user=request.user,
            amount=amount,
            method=method,
            status='pending',
            transaction_id=str(uuid.uuid4())
        )
        
        # Simulate successful payment
        payment.status = 'completed'
        payment.save()
        
        # Update user subscription
        from django.utils import timezone
        import datetime
        user = request.user
        user.is_subscribed = True
        
        now = timezone.now()
        current_end = user.subscription_end if user.subscription_end and user.subscription_end > now else now
        
        if plan == 'monthly':
            user.subscription_end = current_end + datetime.timedelta(days=30)
        else:
            user.subscription_end = current_end + datetime.timedelta(days=365)
            
        user.save(update_fields=['is_subscribed', 'subscription_end'])
        
        return Response({
            'status': 'success',
            'message': 'Obuna muvaffaqiyatli rasmiylashtirildi!',
            'subscription_end': user.subscription_end
        })
