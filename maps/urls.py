from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BarrioViewSet, PosteViewSet, ClienteViewSet

router = DefaultRouter()
router.register(r'barrios', BarrioViewSet)
router.register(r'postes', PosteViewSet)
router.register(r'clientes', ClienteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]