from django.urls import path, include
from rest_framework.routers import DefaultRouter
from solicitud import views  # aquí usamos tu app 'solicitud'

router = DefaultRouter()

# Registramos los ViewSets de la app 'solicitud'
router.register(r'clientes', views.ClienteViewSet)
router.register(r'tipopagos', views.TipoPagoViewSet)
router.register(r'categorias', views.CategoriaViewSet)
router.register(r'formaspago', views.FormaPagoViewSet)
router.register(r'estados', views.EstadoViewSet)
router.register(r'clasestrabajo', views.ClaseTrabajoViewSet)
router.register(r'tipostrabajo', views.TipoTrabajoViewSet)
router.register(r'tipoconexiones', views.TipoConexionViewSet)
router.register(r'planes', views.PlanViewSet)
router.register(r'solicitudes', views.SolicitudViewSet)
router.register(r'contratos', views.ContratoViewSet)
router.register(r'seguimientos', views.SeguimientoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
