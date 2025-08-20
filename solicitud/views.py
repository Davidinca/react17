from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import *
from .serializers import *

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

class TipoPagoViewSet(viewsets.ModelViewSet):
    queryset = TipoPago.objects.all()
    serializer_class = TipoPagoSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class FormaPagoViewSet(viewsets.ModelViewSet):
    queryset = FormaPago.objects.all()
    serializer_class = FormaPagoSerializer

class EstadoViewSet(viewsets.ModelViewSet):
    queryset = Estado.objects.all()
    serializer_class = EstadoSerializer

class ClaseTrabajoViewSet(viewsets.ModelViewSet):
    queryset = ClaseTrabajo.objects.all()
    serializer_class = ClaseTrabajoSerializer

class TipoTrabajoViewSet(viewsets.ModelViewSet):
    queryset = TipoTrabajo.objects.all()
    serializer_class = TipoTrabajoSerializer

class TipoConexionViewSet(viewsets.ModelViewSet):
    queryset = TipoConexion.objects.all()
    serializer_class = TipoConexionSerializer

class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer

class SolicitudViewSet(viewsets.ModelViewSet):
    queryset = Solicitud.objects.all()
    serializer_class = SolicitudSerializer

class ContratoViewSet(viewsets.ModelViewSet):
    queryset = Contrato.objects.all()
    serializer_class = ContratoSerializer

class SeguimientoViewSet(viewsets.ModelViewSet):
    queryset = Seguimiento.objects.all()
    serializer_class = SeguimientoSerializer
