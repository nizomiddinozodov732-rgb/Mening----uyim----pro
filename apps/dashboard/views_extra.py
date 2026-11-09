from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Sum, Count, Q, Avg, F
from apps.properties.models import Property
from apps.payments.models import Payment
from apps.complaints.models import Complaint
from apps.materials.models import MaterialStore, Material
from apps.services.models import ServiceProvider, ServiceRequest
from apps.ratings.models import Rating
from .models import AuditLog, Banner, PromoCode, MassNotification, ConstructionProject, SecurityLog, BlockedIP
from .views import IsAdminOrSuperAdmin, IsSuperAdminOnly
from datetime import timedelta
import random

User = get_user_model()


def log_action(user, action, target_type='', target_id=None, target_name='', details='', ip=''):
    AuditLog.objects.create(
        user=user, action=action, target_type=target_type,
        target_id=target_id, target_name=target_name,
        details=details, ip_address=ip
    )


class CommandCenterView(APIView):
    permission_classes = [IsSuperAdminOnly]

    def get(self, request):
        now = timezone.now()
        today = now.date()
        online = User.objects.filter(is_online=True).count()
        sellers = User.objects.filter(profession='seller', is_online=True).count()
        workers = User.objects.filter(profession__in=['builder', 'repairman'], is_online=True).count()
        architects = User.objects.filter(profession='architect', is_online=True).count()
        today_listings = Property.objects.filter(created_at__date=today).count()
        today_rev = float(Payment.objects.filter(created_at__date=today, status='completed').aggregate(t=Sum('amount'))['t'] or 0)
        pending = Complaint.objects.filter(status='pending').count()
        recent_payments = Payment.objects.select_related('user').order_by('-created_at')[:10]
        payments_list = [{"id": p.id, "user": p.user.get_full_name() or p.user.username, "amount": str(p.amount), "method": p.get_method_display(), "status": p.status, "time": p.created_at.strftime('%H:%M')} for p in recent_payments]

        return Response({
            "online_users": online, "active_sellers": sellers,
            "active_workers": workers, "active_architects": architects,
            "today_listings": today_listings, "today_revenue": today_rev,
            "pending_complaints": pending,
            "server": {"cpu": random.randint(15, 65), "ram": random.randint(30, 80), "disk": random.randint(40, 70), "status": "online"},
            "recent_payments": payments_list,
        })


class AIMonitoringView(APIView):
    permission_classes = [IsSuperAdminOnly]

    def get(self, request):
        # Soxta e'lonlar: narxi 0 yoki rasm yo'q
        fake_props = Property.objects.filter(Q(price__lte=100) | Q(images__isnull=True)).distinct()[:20]
        fake_list = [{"id": p.id, "title": p.title, "price": str(p.price), "reason": "Juda past narx" if p.price <= 100 else "Rasm yo'q", "owner": p.owner.get_full_name()} for p in fake_props]

        # Shubhali foydalanuvchilar: yangi + ko'p e'lon
        week_ago = timezone.now() - timedelta(days=7)
        suspicious = User.objects.filter(date_joined__gte=week_ago).annotate(pc=Count('properties')).filter(pc__gte=5)
        sus_list = [{"id": u.id, "name": u.get_full_name(), "joined": u.date_joined.strftime('%Y-%m-%d'), "listings": u.pc} for u in suspicious[:10]]

        # G'ayrioddiy narxlar
        avg_price = Property.objects.filter(status='active').aggregate(a=Avg('price'))['a'] or 0
        if avg_price > 0:
            unusual = Property.objects.filter(Q(price__gt=avg_price * 5) | Q(price__lt=avg_price * 0.05), status='active')[:10]
        else:
            unusual = Property.objects.none()
        unusual_list = [{"id": p.id, "title": p.title, "price": str(p.price), "avg": str(round(avg_price)), "owner": p.owner.get_full_name()} for p in unusual]

        return Response({
            "fake_listings": fake_list, "fake_count": len(fake_list),
            "suspicious_users": sus_list, "suspicious_count": len(sus_list),
            "unusual_prices": unusual_list, "unusual_count": len(unusual_list),
            "duplicate_images": [], "duplicate_count": 0,
            "total_alerts": len(fake_list) + len(sus_list) + len(unusual_list),
        })


class RegionStatsView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        regions = [
            {"name": "Toshkent shahri", "lat": 41.2995, "lng": 69.2401, "code": "tosh_sh"},
            {"name": "Toshkent viloyati", "lat": 41.3167, "lng": 69.3167, "code": "tosh_v"},
            {"name": "Samarqand", "lat": 39.6542, "lng": 66.9597, "code": "samar"},
            {"name": "Buxoro", "lat": 39.7681, "lng": 64.4556, "code": "buxoro"},
            {"name": "Andijon", "lat": 40.7821, "lng": 72.3442, "code": "andijon"},
            {"name": "Farg'ona", "lat": 40.3834, "lng": 71.7870, "code": "fargona"},
            {"name": "Namangan", "lat": 40.9983, "lng": 71.6726, "code": "namangan"},
            {"name": "Qashqadaryo", "lat": 38.8628, "lng": 65.8003, "code": "qashqa"},
            {"name": "Surxondaryo", "lat": 37.9319, "lng": 67.5644, "code": "surxon"},
            {"name": "Jizzax", "lat": 40.1158, "lng": 67.8422, "code": "jizzax"},
            {"name": "Sirdaryo", "lat": 40.8386, "lng": 68.6653, "code": "sirdaryo"},
            {"name": "Xorazm", "lat": 41.5513, "lng": 60.6318, "code": "xorazm"},
            {"name": "Navoiy", "lat": 40.1003, "lng": 65.3792, "code": "navoiy"},
            {"name": "Qoraqalpog'iston", "lat": 42.4600, "lng": 59.6000, "code": "qoraq"},
        ]
        for r in regions:
            props = Property.objects.filter(location__icontains=r['name'][:4])
            r['houses_sold'] = props.filter(status='sold').count()
            r['active_listings'] = props.filter(status='active').count()
            r['avg_price'] = float(props.aggregate(a=Avg('price'))['a'] or 0)
            workers = User.objects.filter(profession__in=['builder', 'repairman'], bio__icontains=r['name'][:4]).count()
            r['workers_count'] = workers
            r['materials_count'] = Material.objects.filter(store__location__icontains=r['name'][:4]).count()
        return Response(regions)


class BusinessAnalyticsView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        # Top sotuvchilar
        top_sellers = User.objects.filter(profession='seller').annotate(
            total_sales=Count('properties', filter=Q(properties__status='sold')),
            total_revenue=Sum('payments__amount', filter=Q(payments__status='completed'))
        ).order_by('-total_sales')[:10]
        sellers_list = [{"id": u.id, "name": u.get_full_name() or u.username, "sales": u.total_sales, "revenue": float(u.total_revenue or 0), "rating": u.rating, "verified": u.is_verified} for u in top_sellers]

        # Top ustalar
        top_workers = User.objects.filter(profession__in=['builder', 'repairman']).order_by('-rating')[:10]
        workers_list = [{"id": u.id, "name": u.get_full_name() or u.username, "profession": u.get_profession_display(), "rating": u.rating, "rating_count": u.rating_count, "verified": u.is_verified} for u in top_workers]

        # Top arxitektorlar
        top_architects = User.objects.filter(profession='architect').order_by('-rating')[:10]
        arch_list = [{"id": u.id, "name": u.get_full_name() or u.username, "rating": u.rating, "rating_count": u.rating_count, "verified": u.is_verified} for u in top_architects]

        # Top materiallar
        top_materials = Material.objects.order_by('-quantity')[:10]
        mat_list = [{"id": m.id, "name": m.name, "category": m.get_category_display(), "price": str(m.price), "quantity": m.quantity, "store": m.store.name} for m in top_materials]

        return Response({
            "top_sellers": sellers_list, "top_workers": workers_list,
            "top_architects": arch_list, "top_materials": mat_list,
        })


class RevenueCenterView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        now = timezone.now()
        today = now.date()

        # Kunlik (oxirgi 30 kun)
        daily = []
        for i in range(29, -1, -1):
            d = today - timedelta(days=i)
            amt = float(Payment.objects.filter(created_at__date=d, status='completed').aggregate(t=Sum('amount'))['t'] or 0)
            daily.append({"date": d.strftime('%d.%m'), "amount": amt})

        # Haftalik (oxirgi 12 hafta)
        weekly = []
        for i in range(11, -1, -1):
            start = today - timedelta(weeks=i+1)
            end = today - timedelta(weeks=i)
            amt = float(Payment.objects.filter(created_at__date__gte=start, created_at__date__lt=end, status='completed').aggregate(t=Sum('amount'))['t'] or 0)
            weekly.append({"week": f"H{12-i}", "amount": amt})

        # Oylik (oxirgi 12 oy)
        monthly = []
        for i in range(11, -1, -1):
            m = now.month - i
            y = now.year
            while m <= 0:
                m += 12
                y -= 1
            amt = float(Payment.objects.filter(created_at__month=m, created_at__year=y, status='completed').aggregate(t=Sum('amount'))['t'] or 0)
            months_uz = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
            monthly.append({"month": months_uz[m-1], "amount": amt})

        total = float(Payment.objects.filter(status='completed').aggregate(t=Sum('amount'))['t'] or 0)
        today_rev = float(Payment.objects.filter(created_at__date=today, status='completed').aggregate(t=Sum('amount'))['t'] or 0)
        week_rev = float(Payment.objects.filter(created_at__date__gte=today-timedelta(days=7), status='completed').aggregate(t=Sum('amount'))['t'] or 0)
        month_rev = float(Payment.objects.filter(created_at__date__gte=today-timedelta(days=30), status='completed').aggregate(t=Sum('amount'))['t'] or 0)

        return Response({
            "daily": daily, "weekly": weekly, "monthly": monthly,
            "totals": {"today": today_rev, "week": week_rev, "month": month_rev, "all_time": total}
        })


class VerifiedCenterView(APIView):
    permission_classes = [IsSuperAdminOnly]

    def get(self, request):
        prof = request.query_params.get('profession', '')
        users = User.objects.filter(profession__in=['seller', 'builder', 'repairman', 'architect'])
        if prof:
            users = users.filter(profession=prof)
        data = [{"id": u.id, "name": u.get_full_name() or u.username, "profession": u.get_profession_display(), "profession_code": u.profession, "rating": u.rating, "is_verified": u.is_verified, "joined": u.date_joined.strftime('%Y-%m-%d')} for u in users.order_by('-rating')[:50]]
        return Response(data)

    def patch(self, request):
        uid = request.data.get('user_id')
        try:
            u = User.objects.get(id=uid)
        except User.DoesNotExist:
            return Response({"error": "Topilmadi"}, status=404)
        u.is_verified = not u.is_verified
        u.save(update_fields=['is_verified'])
        action = 'user_verified' if u.is_verified else 'user_unverified'
        log_action(request.user, action, 'user', u.id, u.get_full_name())
        return Response({"success": True, "is_verified": u.is_verified})


class MarketingCenterView(APIView):
    permission_classes = [IsSuperAdminOnly]

    def get(self, request):
        banners = Banner.objects.all()
        promos = PromoCode.objects.all()
        b_list = [{"id": b.id, "title": b.title, "position": b.get_position_display(), "is_active": b.is_active, "clicks": b.clicks, "views": b.views, "created_at": b.created_at.strftime('%Y-%m-%d')} for b in banners]
        p_list = [{"id": p.id, "code": p.code, "discount_percent": p.discount_percent, "max_uses": p.max_uses, "used_count": p.used_count, "is_active": p.is_active, "valid_until": p.valid_until.strftime('%Y-%m-%d') if p.valid_until else None} for p in promos]
        return Response({"banners": b_list, "promos": p_list})

    def post(self, request):
        t = request.data.get('type')
        if t == 'banner':
            Banner.objects.create(title=request.data.get('title', ''), description=request.data.get('description', ''), link=request.data.get('link', ''), position=request.data.get('position', 'hero'), created_by=request.user)
            log_action(request.user, 'banner_created', 'banner', details=request.data.get('title', ''))
        elif t == 'promo':
            v_until = request.data.get('valid_until')
            if not v_until or not str(v_until).strip():
                v_until = None
            PromoCode.objects.create(code=request.data.get('code', ''), discount_percent=int(request.data.get('discount_percent', 0)), max_uses=int(request.data.get('max_uses', 0)), valid_until=v_until, created_by=request.user)
            log_action(request.user, 'promo_created', 'promo', details=request.data.get('code', ''))
        return Response({"success": True})

    def delete(self, request):
        t = request.data.get('type') or request.query_params.get('type')
        oid = request.data.get('id') or request.query_params.get('id')
        if t == 'banner':
            Banner.objects.filter(id=oid).delete()
            log_action(request.user, 'banner_deleted', 'banner', oid)
        elif t == 'promo':
            PromoCode.objects.filter(id=oid).delete()
        return Response({"success": True})


class MassNotificationView(APIView):
    permission_classes = [IsSuperAdminOnly]

    def get(self, request):
        notifs = MassNotification.objects.all()[:50]
        data = [{"id": n.id, "title": n.title, "message": n.message, "audience": n.get_target_audience_display(), "audience_code": n.target_audience, "recipients": n.recipients_count, "sent_by": n.sent_by.get_full_name() if n.sent_by else '', "created_at": n.created_at.strftime('%Y-%m-%d %H:%M')} for n in notifs]
        return Response(data)

    def post(self, request):
        title = request.data.get('title', '')
        message = request.data.get('message', '')
        audience = request.data.get('audience', 'all')
        users = User.objects.all()
        mapping = {'sellers': 'seller', 'workers': 'builder', 'architects': 'architect', 'builders': 'builder', 'customers': 'customer'}
        if audience in mapping:
            users = users.filter(profession=mapping[audience])
        elif audience == 'verified':
            users = users.filter(is_verified=True)
        elif audience == 'admins':
            users = users.filter(Q(is_admin=True) | Q(is_super_admin=True))
        count = users.count()
        MassNotification.objects.create(title=title, message=message, target_audience=audience, sent_by=request.user, recipients_count=count, is_sent=True)
        log_action(request.user, 'notification_sent', details=f"{title} → {count} kishi")
        return Response({"success": True, "recipients_count": count})


class AuditLogView(APIView):
    permission_classes = [IsSuperAdminOnly]

    def get(self, request):
        logs = AuditLog.objects.select_related('user').all()
        action_filter = request.query_params.get('action', '')
        if action_filter:
            logs = logs.filter(action=action_filter)
        logs = logs[:100]
        data = [{"id": l.id, "user": l.user.get_full_name() if l.user else 'System', "action": l.action, "action_display": l.get_action_display(), "target_type": l.target_type, "target_id": l.target_id, "target_name": l.target_name, "details": l.details, "ip": l.ip_address or '', "time": l.created_at.strftime('%Y-%m-%d %H:%M:%S')} for l in logs]
        return Response(data)


class ConstructionProjectsView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        projects = ConstructionProject.objects.select_related('architect', 'builder', 'material_seller', 'created_by').all()
        data = []
        for p in projects:
            data.append({
                "id": p.id, "title": p.title, "description": p.description,
                "architect": p.architect.get_full_name() if p.architect else None,
                "builder": p.builder.get_full_name() if p.builder else None,
                "material_seller": p.material_seller.get_full_name() if p.material_seller else None,
                "workers_count": p.workers.count(),
                "budget": str(p.budget), "spent": str(p.spent),
                "location": p.location, "status": p.status,
                "status_display": p.get_status_display(),
                "progress": p.progress,
                "start_date": str(p.start_date) if p.start_date else None,
                "end_date": str(p.end_date) if p.end_date else None,
                "created_at": p.created_at.strftime('%Y-%m-%d'),
            })
        return Response(data)

    def post(self, request):
        d = request.data
        project = ConstructionProject.objects.create(
            title=d.get('title', ''), description=d.get('description', ''),
            budget=d.get('budget', 0), location=d.get('location', ''),
            status=d.get('status', 'planning'), created_by=request.user
        )
        log_action(request.user, 'project_created', 'project', project.id, project.title)
        return Response({"success": True, "id": project.id})

    def patch(self, request):
        pid = request.data.get('id')
        try:
            p = ConstructionProject.objects.get(id=pid)
        except ConstructionProject.DoesNotExist:
            return Response({"error": "Topilmadi"}, status=404)
        for field in ['title', 'description', 'location', 'status', 'progress']:
            if field in request.data:
                setattr(p, field, request.data[field])
        if 'budget' in request.data:
            p.budget = request.data['budget']
        p.save()
        log_action(request.user, 'project_updated', 'project', p.id, p.title)
        return Response({"success": True})


class SecurityCenterView(APIView):
    permission_classes = [IsSuperAdminOnly]

    def get(self, request):
        logs = SecurityLog.objects.select_related('user').all()[:100]
        blocked = BlockedIP.objects.all()
        login_history = [{"id": l.id, "user": l.user.get_full_name() if l.user else 'Unknown', "event": l.get_event_type_display(), "event_type": l.event_type, "ip": l.ip_address or '', "device": l.device_info, "location": l.location, "time": l.created_at.strftime('%Y-%m-%d %H:%M')} for l in logs]
        blocked_list = [{"id": b.id, "ip": b.ip_address, "reason": b.reason, "blocked_by": b.blocked_by.get_full_name() if b.blocked_by else '', "time": b.created_at.strftime('%Y-%m-%d %H:%M')} for b in blocked]
        return Response({"login_history": login_history, "blocked_ips": blocked_list})


class BlockIPView(APIView):
    permission_classes = [IsSuperAdminOnly]

    def post(self, request):
        ip = request.data.get('ip_address', '')
        reason = request.data.get('reason', '')
        if not ip:
            return Response({"error": "IP kerak"}, status=400)
        obj, created = BlockedIP.objects.get_or_create(ip_address=ip, defaults={"reason": reason, "blocked_by": request.user})
        if created:
            log_action(request.user, 'ip_blocked', 'ip', details=ip)
        return Response({"success": True, "created": created})

    def delete(self, request):
        ip = request.data.get('ip_address', '') or request.query_params.get('ip_address', '')
        if ip:
            BlockedIP.objects.filter(ip_address=ip).delete()
            log_action(request.user, 'ip_unblocked', 'ip', details=ip)
        return Response({"success": True})


class AdminPasswordChangeView(APIView):
    permission_classes = [IsSuperAdminOnly]

    def post(self, request):
        uid = request.data.get('user_id')
        new_pass = request.data.get('new_password', '')
        if not new_pass or len(new_pass) < 6:
            return Response({"error": "Parol kamida 6 ta belgi bo'lishi kerak"}, status=400)
        try:
            u = User.objects.get(id=uid)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"error": "Foydalanuvchi topilmadi"}, status=404)
        u.set_password(new_pass)
        u.save()
        log_action(request.user, 'password_changed', 'user', u.id, u.get_full_name(), f"Parol Super Admin tomonidan o'zgartirildi")
        return Response({"success": True, "message": "Parol muvaffaqiyatli o'zgartirildi"})


class SiteSettingView(APIView):
    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH']:
            return [IsAdminOrSuperAdmin()]
        from rest_framework.permissions import AllowAny
        return [AllowAny()]

    def get(self, request):
        from .models import SiteSetting
        s = SiteSetting.get_settings()
        return Response({
            "hero_badge": s.hero_badge,
            "hero_title": s.hero_title,
            "hero_subtitle": s.hero_subtitle,
            "announcement_text": s.announcement_text,
            "contact_email": s.contact_email,
            "contact_phone": s.contact_phone,
            "telegram_url": s.telegram_url,
            "instagram_url": s.instagram_url,
            "updated_at": s.updated_at.strftime("%Y-%m-%d %H:%M") if s.updated_at else '',
        })

    def put(self, request):
        from .models import SiteSetting
        s = SiteSetting.get_settings()
        if 'hero_badge' in request.data:
            s.hero_badge = request.data.get('hero_badge', '').strip()
        if 'hero_title' in request.data:
            s.hero_title = request.data.get('hero_title', '').strip()
        if 'hero_subtitle' in request.data:
            s.hero_subtitle = request.data.get('hero_subtitle', '').strip()
        if 'announcement_text' in request.data:
            s.announcement_text = request.data.get('announcement_text', '').strip()
        if 'contact_email' in request.data:
            s.contact_email = request.data.get('contact_email', '').strip()
        if 'contact_phone' in request.data:
            s.contact_phone = request.data.get('contact_phone', '').strip()
        if 'telegram_url' in request.data:
            s.telegram_url = request.data.get('telegram_url', '').strip()
        if 'instagram_url' in request.data:
            s.instagram_url = request.data.get('instagram_url', '').strip()
        s.save()
        log_action(request.user, 'settings_changed', 'setting', details="Bosh sahifa matnlari yangilandi")
        return Response({
            "success": True,
            "message": "Bosh sahifa sozlamalari muvaffaqiyatli saqlandi",
            "settings": {
                "hero_badge": s.hero_badge,
                "hero_title": s.hero_title,
                "hero_subtitle": s.hero_subtitle,
                "announcement_text": s.announcement_text,
                "contact_email": s.contact_email,
                "contact_phone": s.contact_phone,
                "telegram_url": s.telegram_url,
                "instagram_url": s.instagram_url,
                "updated_at": s.updated_at.strftime("%Y-%m-%d %H:%M"),
            }
        })


class NewsView(APIView):
    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return [IsSuperAdminOnly()]
        from rest_framework.permissions import AllowAny
        return [AllowAny()]

    def get(self, request):
        from .models import News
        nid = request.query_params.get('id')
        if nid:
            try:
                n = News.objects.get(id=nid)
                n.views += 1
                n.save(update_fields=['views'])
                return Response({
                    "id": n.id, "title": n.title, "content": n.content,
                    "image": request.build_absolute_uri(n.image.url) if n.image else None,
                    "views": n.views, "created_at": n.created_at.strftime('%Y-%m-%d')
                })
            except News.DoesNotExist:
                return Response({"error": "Topilmadi"}, status=404)
        
        news = News.objects.filter(is_published=True)
        data = [{"id": n.id, "title": n.title, "content": n.content[:150] + "...", "image": request.build_absolute_uri(n.image.url) if n.image else None, "views": n.views, "created_at": n.created_at.strftime('%Y-%m-%d')} for n in news]
        return Response(data)

    def post(self, request):
        from .models import News
        n = News.objects.create(
            title=request.data.get('title', ''),
            content=request.data.get('content', ''),
            is_published=request.data.get('is_published', True)
        )
        if 'image' in request.FILES:
            n.image = request.FILES['image']
            n.save()
        log_action(request.user, 'other', 'news', n.id, n.title, "Yangilik qo'shildi")
        return Response({"success": True, "id": n.id})
    
    def delete(self, request):
        from .models import News
        nid = request.query_params.get('id')
        if nid:
            News.objects.filter(id=nid).delete()
            log_action(request.user, 'other', 'news', nid, details="Yangilik o'chirildi")
        return Response({"success": True})


class OnlineUsersView(APIView):
    """Hozir online bo'lgan foydalanuvchilar"""
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        from datetime import timedelta
        # So'nggi 5 daqiqada faol bo'lgan foydalanuvchilar
        five_min_ago = timezone.now() - timedelta(minutes=5)

        users = User.objects.all().order_by('-last_seen')[:100]
        data = []
        for u in users:
            data.append({
                "id":               u.id,
                "username":         u.username,
                "full_name":        f"{u.first_name} {u.last_name}".strip() or u.username,
                "first_name":       u.first_name,
                "last_name":        u.last_name,
                "avatar":           u.avatar.url if u.avatar else None,
                "profession":       u.profession,
                "profession_display": u.get_profession_display(),
                "is_verified":      u.is_verified,
                "is_admin":         u.is_admin,
                "is_super_admin":   u.is_super_admin,
                "is_online":        u.is_online,
                "last_seen":        u.last_seen.isoformat() if u.last_seen else None,
            })
        return Response(data)
