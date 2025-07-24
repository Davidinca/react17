from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'clientes', views.ClienteViewSet)
router.register(r'tipos-servicio', views.TipoServicioViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
