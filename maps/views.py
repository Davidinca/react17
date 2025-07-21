from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance
from .models import Barrio, Poste, Cliente
from .serializers import (
    BarrioSerializer, PosteSerializer, ClienteSerializer,
    ClienteCreateSerializer, CoberturaVerificacionSerializer
)


class BarrioViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar barrios
    """
    queryset = Barrio.objects.filter(activo=True)
    serializer_class = BarrioSerializer
    
    @action(detail=True, methods=['get'])
    def postes(self, request, pk=None):
        """Obtiene todos los postes de un barrio"""
        barrio = self.get_object()
        postes = Poste.objects.filter(barrio=barrio, activo=True)
        serializer = PosteSerializer(postes, many=True)
        return Response(serializer.data)


class PosteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar postes
    """
    queryset = Poste.objects.filter(activo=True)
    serializer_class = PosteSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        barrio_id = self.request.query_params.get('barrio', None)
        
        if barrio_id:
            queryset = queryset.filter(barrio_id=barrio_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """
        Obtiene postes disponibles cerca de una ubicación
        Query params: lat, lng, radio_metros (opcional, default=150)
        """
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radio_metros = int(request.query_params.get('radio_metros', 150))
        
        if not lat or not lng:
            return Response(
                {'error': 'Se requieren parámetros lat y lng'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ubicacion = Point(float(lng), float(lat))
            
            postes_cercanos = Poste.objects.filter(
                ubicacion__distance_lte=(ubicacion, D(m=radio_metros)),
                nodos_disponibles__gt=0,
                activo=True
            ).annotate(
                distancia=Distance('ubicacion', ubicacion)
            ).order_by('distancia')
            
            serializer = PosteSerializer(postes_cercanos, many=True)
            return Response({
                'postes_disponibles': serializer.data,
                'total_encontrados': postes_cercanos.count(),
                'radio_busqueda': radio_metros
            })
            
        except (ValueError, TypeError) as e:
            return Response(
                {'error': f'Coordenadas inválidas: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar clientes
    """
    queryset = Cliente.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ClienteCreateSerializer
        return ClienteSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        estado = self.request.query_params.get('estado', None)
        barrio_id = self.request.query_params.get('barrio', None)
        
        if estado:
            queryset = queryset.filter(estado_solicitud=estado)
        
        if barrio_id:
            queryset = queryset.filter(barrio_id=barrio_id)
        
        return queryset
    
    @action(detail=True, methods=['put'])
    def asignar_poste(self, request, pk=None):
        """Asigna automáticamente el poste más cercano disponible"""
        cliente = self.get_object()
        
        if cliente.estado_solicitud in ['instalado', 'cancelado']:
            return Response(
                {'error': 'No se puede asignar poste a cliente en estado actual'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        poste_asignado = cliente.asignar_poste_automatico()
        
        if poste_asignado:
            serializer = self.get_serializer(cliente)
            return Response({
                'mensaje': 'Poste asignado exitosamente',
                'cliente': serializer.data,
                'poste_asignado': {
                    'id': poste_asignado.id,
                    'codigo': poste_asignado.codigo,
                    'nodos_disponibles': poste_asignado.nodos_disponibles
                }
            })
        else:
            cliente.estado_solicitud = 'rechazado'
            cliente.save()
            return Response(
                {'error': 'No hay postes disponibles en la zona'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def verificar_cobertura(self, request):
        """
        Verifica si hay cobertura en una ubicación específica
        Body: {"lat": float, "lng": float, "radio_metros": int (opcional)}
        """
        serializer = CoberturaVerificacionSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        lat = serializer.validated_data['lat']
        lng = serializer.validated_data['lng']
        radio_metros = serializer.validated_data['radio_metros']
        
        try:
            ubicacion = Point(lng, lat)
            
            # Buscar postes cercanos disponibles
            postes_cercanos = Poste.objects.filter(
                ubicacion__distance_lte=(ubicacion, D(m=radio_metros)),
                nodos_disponibles__gt=0,
                activo=True
            ).annotate(
                distancia=Distance('ubicacion', ubicacion)
            ).order_by('distancia')
            
            # Determinar barrio
            barrio = None
            barrios_contenedores = Barrio.objects.filter(poligono__contains=ubicacion)
            if barrios_contenedores.exists():
                barrio = barrios_contenedores.first()
            
            return Response({
                'tiene_cobertura': postes_cercanos.exists(),
                'postes_disponibles': postes_cercanos.count(),
                'poste_mas_cercano': PosteSerializer(postes_cercanos.first()).data if postes_cercanos.exists() else None,
                'barrio': {'id': barrio.id, 'nombre': barrio.nombre} if barrio else None,
                'radio_busqueda': radio_metros
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error verificando cobertura: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )