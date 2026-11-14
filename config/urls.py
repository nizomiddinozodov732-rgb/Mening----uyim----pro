"""House Shop URL Configuration

Diqqat: Django admin `/django-admin/` da (Next.js admin paneli `/admin/` da).
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/properties/', include('apps.properties.urls')),
    path('api/v1/materials/', include('apps.materials.urls')),
    path('api/v1/services/', include('apps.services.urls')),
    path('api/v1/chat/', include('apps.chat.urls')),
    path('api/v1/ratings/', include('apps.ratings.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/complaints/', include('apps.complaints.urls')),
    path('api/v1/calculator/', include('apps.calculator.urls')),
    path('api/v1/dashboard/', include('apps.dashboard.urls')),
]

# Yuklangan fayllar (rasmlar) — DEBUG=0 bo'lganda ham xizmat qiladi
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
