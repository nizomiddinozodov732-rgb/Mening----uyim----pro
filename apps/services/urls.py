from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'providers', views.ServiceProviderViewSet)
router.register(r'requests', views.ServiceRequestViewSet, basename='service-requests')

urlpatterns = [
    path('', include(router.urls)),
]
