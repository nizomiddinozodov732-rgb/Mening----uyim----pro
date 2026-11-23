"""Xavfsizlik middleware'lari va yordamchi funksiyalar.

- BlockedIPMiddleware: bloklangan IP manzillardan kelgan so'rovlarni rad etadi.
- LoginBruteForce himoyasi uchun yordamchi funksiyalar (SecurityLog, BlockedIP).
"""
import logging

from django.core.cache import cache
from django.http import JsonResponse

logger = logging.getLogger(__name__)

# Bloklangan IP'lar ro'yxati keshi (har so'rovda DB'ga murojaat qilmaslik uchun)
_BLOCKED_IPS_CACHE_KEY = 'security:blocked_ips'
_BLOCKED_IPS_CACHE_TTL = 60  # sekund

# Login urinishlari hisoblagichi (brute-force aniqlash)
_LOGIN_ATTEMPTS_CACHE_KEY = 'security:login_attempts'
_LOGIN_ATTEMPTS_TTL = 15 * 60  # 15 daqiqa
_LOGIN_MAX_ATTEMPTS = 10  # 15 daqiqada shu miqdordan ko'p xato -> IP bloklanadi


def get_client_ip(request):
    """Proksi (Next.js/Nginx) orqasidagi haqiqiy mijoz IP manzilini aniqlash.

    V-2: `X-Forwarded-For` faqat bevosita ulanish ishonchli proksidan
    (`TRUSTED_PROXY_IPS`) kelganda hisobga olinadi. Bunday holda XFF
    ro'yxatidan proksilar soni (`NUM_PROXIES`) hisobga olinib, proksi o'zi
    qo'shgan (o'ng tomondagi) manzil olinadi. Aks holda sarlavha butunlay
    e'tiborsiz qoldirilib, `REMOTE_ADDR` ishlatiladi — shu yo'l bilan
    soxtalashtirilgan XFF hisoblagichni IP'lar bo'yicha bo'lib tashlay olmaydi.
    """
    remote_addr = request.META.get('REMOTE_ADDR') or None
    xff = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if xff and _is_trusted_proxy(remote_addr):
        addrs = [addr.strip() for addr in xff.split(',') if addr.strip()]
        if addrs:
            num_proxies = _get_num_proxies()
            if num_proxies > 0:
                return addrs[-min(num_proxies, len(addrs))]
            return addrs[-1]
    return remote_addr


def _is_trusted_proxy(remote_addr):
    """`REMOTE_ADDR` ishonchli proksilar ro'yxatida bo'lsa True qaytaradi."""
    if not remote_addr:
        return False
    from django.conf import settings
    return remote_addr in getattr(settings, 'TRUSTED_PROXY_IPS', [])


def _get_num_proxies():
    """Oldimizdagi ishonchli proksilar soni (default 1)."""
    from django.conf import settings
    try:
        return int(getattr(settings, 'NUM_PROXIES', 1))
    except (TypeError, ValueError):
        return 1


def invalidate_blocked_ips_cache():
    """IP bloklanganda/blokdan chiqarilganda keshni tozalash."""
    try:
        cache.delete(_BLOCKED_IPS_CACHE_KEY)
    except Exception:  # pragma: no cover - kesh xatosi xavfsizlikni to'xtatmasligi kerak
        pass


def get_blocked_ips():
    """Bloklangan IP'lar to'plami (keshlangan)."""
    cached = cache.get(_BLOCKED_IPS_CACHE_KEY)
    if cached is not None:
        return cached
    from apps.dashboard.models import BlockedIP
    try:
        ips = set(BlockedIP.objects.values_list('ip_address', flat=True))
    except Exception:
        # Migratsiya tugamagan bo'lsa (jadval yo'q) — bo'sh ro'yxat
        ips = set()
    cache.set(_BLOCKED_IPS_CACHE_KEY, ips, _BLOCKED_IPS_CACHE_TTL)
    return ips


def register_failed_login(ip):
    """Xato login urinishini qayd etadi va kerak bo'lsa IP'ni avtomatik bloklaydi.

    Qaytaradi: qolgan urinishlar soni (0 bo'lsa IP bloklandi).
    """
    if not ip:
        return None
    try:
        attempts = cache.get(_LOGIN_ATTEMPTS_CACHE_KEY, {})
        if not isinstance(attempts, dict):
            attempts = {}
        attempts[ip] = attempts.get(ip, 0) + 1
        count = attempts[ip]
        cache.set(_LOGIN_ATTEMPTS_CACHE_KEY, attempts, _LOGIN_ATTEMPTS_TTL)

        if count >= _LOGIN_MAX_ATTEMPTS:
            from apps.dashboard.models import BlockedIP
            BlockedIP.objects.get_or_create(
                ip_address=ip,
                defaults={'reason': "Avtomatik blok: ko'p marta xato login urinishi"},
            )
            invalidate_blocked_ips_cache()
            _log_security_event(None, 'account_locked', ip, f"{count} marta xato login urinishi")
            attempts[ip] = 0
            cache.set(_LOGIN_ATTEMPTS_CACHE_KEY, attempts, _LOGIN_ATTEMPTS_TTL)
            return 0
        return _LOGIN_MAX_ATTEMPTS - count
    except Exception:  # pragma: no cover
        return None


def reset_failed_logins(ip):
    """Muvaffaqiyatli login'dan keyin urinishlar hisoblagichini tozalash."""
    if not ip:
        return
    try:
        attempts = cache.get(_LOGIN_ATTEMPTS_CACHE_KEY, {})
        if isinstance(attempts, dict) and ip in attempts:
            attempts[ip] = 0
            cache.set(_LOGIN_ATTEMPTS_CACHE_KEY, attempts, _LOGIN_ATTEMPTS_TTL)
    except Exception:  # pragma: no cover
        pass


def _log_security_event(user, event_type, ip, details='', device_info=''):
    """SecurityLog jurnaliga yozuv qo'shish (xato bo'lsa ham so'rovni buzmaydi)."""
    from apps.dashboard.models import SecurityLog
    try:
        SecurityLog.objects.create(
            user=user if getattr(user, 'pk', None) else None,
            event_type=event_type,
            ip_address=ip or None,
            device_info=device_info[:500],
            details=details,
        )
    except Exception:  # pragma: no cover
        logger.exception("SecurityLog yozishda xatolik")


def log_security_event(user, event_type, ip, details='', device_info=''):
    """Ommaviy (public) jurnal funksiyasi."""
    _log_security_event(user, event_type, ip, details, device_info)


class BlockedIPMiddleware:
    """Bloklangan IP manzillardan kelgan barcha so'rovlarni 403 bilan rad etadi."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        ip = get_client_ip(request)
        if ip:
            try:
                if ip in get_blocked_ips():
                    return JsonResponse(
                        {'error': "Sizning IP manzilingiz bloklangan. Administratorga murojaat qiling."},
                        status=403,
                    )
            except Exception:  # pragma: no cover - xavfsizlikni buzmaslik uchun
                logger.exception("Bloklangan IP tekshiruvida xatolik")
        return self.get_response(request)
