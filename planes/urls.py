from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FormaPagoViewSet, 
    TipoConexionViewSet, 
    PlanViewSet, 
    ClienteViewSet,
    CobfactuViewSet,  # Nueva vista
)

router = DefaultRouter()
router.register(r'formas-pago', FormaPagoViewSet)
router.register(r'tipos-conexion', TipoConexionViewSet)  # Corregí el typo
router.register(r'planes', PlanViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'facturas', CobfactuViewSet)  # Nueva ruta

urlpatterns = [
    path('', include(router.urls)),
]