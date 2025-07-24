from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Cliente, TipoServicio
from .serializers import (
    ClienteSerializer, ClienteCreateSerializer, ClienteUpdateSerializer,
    TipoServicioSerializer
)

class TipoServicioViewSet(viewsets.ModelViewSet):
    queryset = TipoServicio.objects.all()
    serializer_class = TipoServicioSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['activo']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'precio', 'fecha_creacion']
    ordering = ['nombre']

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'tipo_vivienda', 'tipo_servicio', 'zona']
    search_fields = ['nombre', 'apellido', 'email', 'ci', 'telefono', 'direccion_completa']
    ordering_fields = ['fecha_solicitud', 'fecha_actualizacion', 'nombre', 'apellido']
    ordering = ['-fecha_solicitud']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ClienteCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ClienteUpdateSerializer
        return ClienteSerializer
    
    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Obtener clientes pendientes"""
        queryset = self.get_queryset().filter(estado='pendiente')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def activos(self, request):
        """Obtener clientes activos"""
        queryset = self.get_queryset().filter(estado='activo')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def rechazados(self, request):
        """Obtener clientes rechazados"""
        queryset = self.get_queryset().filter(estado='rechazado')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        """Cambiar estado de un cliente"""
        cliente = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado not in ['pendiente', 'rechazado', 'activo']:
            return Response(
                {'error': 'Estado no válido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cliente.estado = nuevo_estado
        if 'observaciones' in request.data:
            cliente.observaciones = request.data['observaciones']
        
        cliente.save()
        serializer = self.get_serializer(cliente)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def buscar_por_ubicacion(self, request):
        """Buscar clientes por zona o calle"""
        zona = request.query_params.get('zona', '')
        calle = request.query_params.get('calle', '')
        
        queryset = self.get_queryset()
        
        if zona:
            queryset = queryset.filter(zona__icontains=zona)
        if calle:
            queryset = queryset.filter(calle__icontains=calle)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de clientes"""
        total = self.get_queryset().count()
        pendientes = self.get_queryset().filter(estado='pendiente').count()
        activos = self.get_queryset().filter(estado='activo').count()
        rechazados = self.get_queryset().filter(estado='rechazado').count()
        
        return Response({
            'total': total,
            'pendientes': pendientes,
            'activos': activos,
            'rechazados': rechazados,
            'porcentaje_activos': round((activos / total * 100) if total > 0 else 0, 2)
        })