from rest_framework import serializers
from .models import Cliente, TipoServicio

class TipoServicioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoServicio
        fields = '__all__'

class ClienteSerializer(serializers.ModelSerializer):
    tipo_servicio_nombre = serializers.CharField(source='tipo_servicio.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_vivienda_display = serializers.CharField(source='get_tipo_vivienda_display', read_only=True)
    
    class Meta:
        model = Cliente
        fields = [
            'id', 'nombre', 'apellido', 'email', 'telefono', 'ci',
            'tipo_vivienda', 'tipo_vivienda_display', 'piso',
            'zona', 'calle', 'direccion_completa', 'latitud', 'longitud',
            'tipo_servicio', 'tipo_servicio_nombre', 'estado', 'estado_display',
            'fecha_solicitud', 'fecha_actualizacion', 'fecha_activacion',
            'observaciones'
        ]
        read_only_fields = ['fecha_solicitud', 'fecha_actualizacion', 'fecha_activacion']
    
    def validate_email(self, value):
        if Cliente.objects.filter(email=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("Ya existe un cliente con este email.")
        return value
    
    def validate_ci(self, value):
        if Cliente.objects.filter(ci=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("Ya existe un cliente con este CI.")
        return value
    
    def validate(self, data):
        # Validar que si es departamento debe tener piso
        if data.get('tipo_vivienda') == 'departamento' and not data.get('piso'):
            raise serializers.ValidationError({
                'piso': 'El piso es requerido para departamentos.'
            })
        return data

class ClienteCreateSerializer(ClienteSerializer):
    """Serializer específico para creación con validaciones adicionales"""
    class Meta(ClienteSerializer.Meta):
        pass

class ClienteUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizaciones parciales"""
    class Meta:
        model = Cliente
        fields = [
            'nombre', 'apellido', 'email', 'telefono', 'ci',
            'tipo_vivienda', 'piso', 'zona', 'calle', 'direccion_completa',
            'latitud', 'longitud', 'tipo_servicio', 'estado', 'observaciones'
        ]