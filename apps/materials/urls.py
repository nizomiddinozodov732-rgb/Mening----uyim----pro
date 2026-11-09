from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'stores', views.MaterialStoreViewSet)
router.register(r'items', views.MaterialViewSet)

urlpatterns = [
    path('categories/', views.get_categories, name='material-categories'),
    path('', include(router.urls)),
]
