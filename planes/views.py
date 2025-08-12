from rest_framework.permissions import AllowAny
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Case, When, IntegerField, Q
from .models import FormaPago, TipoConexion, Plan, Cliente
from .serializers import FormaPagoSerializer, TipoConexionSerializer, PlanSerializer, ClienteSerializer

class FormaPagoViewSet(viewsets.ModelViewSet):
    queryset = FormaPago.objects.all()
    serializer_class = FormaPagoSerializer
    permission_classes = [AllowAny]  # <---

class TipoConexionViewSet(viewsets.ModelViewSet):
    queryset = TipoConexion.objects.all()
    serializer_class = TipoConexionSerializer
    permission_classes = [AllowAny]  # <---

class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [AllowAny]  # <---

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [AllowAny]  # <---
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        # Conteo por estado
        por_estado = Cliente.objects.values('estado').annotate(
            total=Count('id'),
            con_cobertura=Count(Case(When(cobertura='CON_COBERTURA', then=1), output_field=IntegerField())),
            sin_cobertura=Count(Case(When(cobertura='SIN_COBERTURA', then=1), output_field=IntegerField()))
        )
        
        # Conteo por tipo de cliente
        por_tipo = Cliente.objects.values('tipo_cliente').annotate(
            total=Count('id')
        )
        
        # Conteo por cobertura
        por_cobertura = Cliente.objects.values('cobertura').annotate(
            total=Count('id')
        )
        
        # Top 5 zonas con más clientes
        top_zonas = Cliente.objects.values('zona').annotate(
            total=Count('id')
        ).order_by('-total')[:5]
        
        # Resumen general
        total_clientes = Cliente.objects.count()
        total_activos = Cliente.objects.filter(estado='ACTIVO').count()
        total_pendientes = Cliente.objects.filter(
            Q(estado='PEND_COBERTURA') | 
            Q(estado='PEND_EQUIPO') | 
            Q(estado='PEND_INSTALACION')
        ).count()
        total_suspendidos = Cliente.objects.filter(estado='SUSPENDIDO').count()
        
        return Response({
            'resumen': {
                'total_clientes': total_clientes,
                'total_activos': total_activos,
                'total_pendientes': total_pendientes,
                'total_suspendidos': total_suspendidos,
                'porcentaje_activos': round((total_activos / total_clientes * 100), 2) if total_clientes > 0 else 0,
            },
            'por_estado': list(por_estado),
            'por_tipo': list(por_tipo),
            'por_cobertura': list(por_cobertura),
            'top_zonas': list(top_zonas),
        })
