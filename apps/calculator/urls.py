from django.urls import path
from . import views

urlpatterns = [
    path('calculate/', views.ConstructionCalculatorView.as_view(), name='calculate'),
]
