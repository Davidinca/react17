from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FormaPagoViewSet, TipoConexionViewSet, PlanViewSet, ClienteViewSet

router = DefaultRouter()
router.register(r'formas-pago', FormaPagoViewSet)
router.register(r'tipos-conexion', TipoConexionViewSet)
router.register(r'planes', PlanViewSet)
router.register(r'clientes', ClienteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
