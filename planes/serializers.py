from rest_framework import serializers
from .models import FormaPago, TipoConexion, Plan, Cliente

class FormaPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormaPago
        fields = ['id', 'nombre', 'abreviacion','descripcion', 'estado']

class TipoConexionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoConexion
        fields = ['id', 'nombre', 'descripcion', 'estado']

class PlanSerializer(serializers.ModelSerializer):
    forma_pago = FormaPagoSerializer(read_only=True)
    tipo_conexion = TipoConexionSerializer(read_only=True)

    forma_pago_id = serializers.PrimaryKeyRelatedField(
        queryset=FormaPago.objects.all(), source='forma_pago', write_only=True
    )
    tipo_conexion_id = serializers.PrimaryKeyRelatedField(
        queryset=TipoConexion.objects.all(), source='tipo_conexion', write_only=True
    )

    class Meta:
        model = Plan
        fields = [
            'id', 'descripcion', 'codigo', 'forma_pago', 'forma_pago_id',
            'tipo_conexion', 'tipo_conexion_id', 'monto_basico',
            'tipo_basico', 'fecha_inicial', 'fecha_final', 'estado', 'codigo_item'
        ]

class ClienteSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)
    plan_id = serializers.PrimaryKeyRelatedField(
        queryset=Plan.objects.all(), 
        source='plan', 
        write_only=True,
        required=False,
        allow_null=True
    )

    def validate(self, data):
        # Si la cobertura es CON_COBERTURA, plan_id es obligatorio
        if data.get('cobertura') == 'CON_COBERTURA' and 'plan' not in data:
            raise serializers.ValidationError({"plan_id": "Este campo es obligatorio cuando hay cobertura"})
        return data

    class Meta:
        model = Cliente
        fields = '__all__'
