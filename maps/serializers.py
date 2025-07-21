from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Barrio, Poste, Cliente


class BarrioSerializer(GeoFeatureModelSerializer):
    total_postes = serializers.ReadOnlyField()
    postes_disponibles = serializers.ReadOnlyField()
    
    class Meta:
        model = Barrio
        geo_field = 'poligono'
        fields = ['id', 'nombre', 'activo', 'total_postes', 'postes_disponibles', 'created_at']


class BarrioSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Barrio
        fields = ['id', 'nombre']


class PosteSerializer(GeoFeatureModelSerializer):
    barrio = BarrioSimpleSerializer(read_only=True)
    barrio_id = serializers.IntegerField(write_only=True)
    tiene_disponibilidad = serializers.ReadOnlyField()
    porcentaje_ocupacion = serializers.ReadOnlyField()
    clientes_asignados = serializers.ReadOnlyField()
    
    class Meta:
        model = Poste
        geo_field = 'ubicacion'
        fields = [
            'id', 'codigo', 'barrio', 'barrio_id', 'capacidad_nodos', 
            'nodos_disponibles', 'activo', 'observaciones',
            'tiene_disponibilidad', 'porcentaje_ocupacion', 'clientes_asignados',
            'created_at', 'updated_at'
        ]


class PosteSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Poste
        fields = ['id', 'codigo', 'nodos_disponibles', 'capacidad_nodos']


class ClienteSerializer(GeoFeatureModelSerializer):
    barrio = BarrioSimpleSerializer(read_only=True)
    barrio_id = serializers.IntegerField(write_only=True)
    poste_asignado = PosteSimpleSerializer(read_only=True)
    distancia_al_poste = serializers.ReadOnlyField()
    
    class Meta:
        model = Cliente
        geo_field = 'ubicacion'
        fields = [
            'id', 'nombre', 'apellido', 'telefono', 'email', 'direccion',
            'barrio', 'barrio_id', 'poste_asignado', 'estado_solicitud',
            'observaciones', 'fecha_solicitud', 'fecha_instalacion',
            'distancia_al_poste', 'created_at', 'updated_at'
        ]


class ClienteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = [
            'nombre', 'apellido', 'telefono', 'email', 'direccion',
            'ubicacion', 'barrio_id', 'observaciones'
        ]
    
    def create(self, validated_data):
        cliente = Cliente.objects.create(**validated_data)
        # Intentar asignar poste automáticamente
        cliente.asignar_poste_automatico()
        return cliente


class CoberturaVerificacionSerializer(serializers.Serializer):
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    radio_metros = serializers.IntegerField(default=150)