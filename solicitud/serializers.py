from rest_framework import serializers
from .models import (
    Cliente, TipoPago, Categoria, FormaPago, Estado, ClaseTrabajo,
    TipoTrabajo, TipoConexion, Plan, Solicitud, Contrato, Seguimiento
)


# === SERIALIZERS MAESTROS ===

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'


class TipoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPago
        fields = '__all__'


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'


class FormaPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormaPago
        fields = '__all__'


class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estado
        fields = '__all__'


class ClaseTrabajoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClaseTrabajo
        fields = '__all__'


class TipoTrabajoSerializer(serializers.ModelSerializer):
    COD_ESTADO = EstadoSerializer(read_only=True)
    COD_CLASE = ClaseTrabajoSerializer(read_only=True)

    class Meta:
        model = TipoTrabajo
        fields = '__all__'


class TipoConexionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoConexion
        fields = '__all__'


class PlanSerializer(serializers.ModelSerializer):
    COD_FORMA_PAGO = FormaPagoSerializer(read_only=True)
    COD_TIPO_CONEXION = TipoConexionSerializer(read_only=True)

    class Meta:
        model = Plan
        fields = '__all__'


# === SERIALIZERS TRANSACCIONALES ===

class SolicitudSerializer(serializers.ModelSerializer):
    COD_TIPO_TRABAJO = TipoTrabajoSerializer(read_only=True)
    COD_TIPO_PLAN = PlanSerializer(read_only=True)
    COD_FORMA_PAGO = FormaPagoSerializer(read_only=True)
    COD_CATEGORIA = CategoriaSerializer(read_only=True)
    COD_TIPO_PAGO = TipoPagoSerializer(read_only=True)
    COD_CLIENTE = ClienteSerializer(read_only=True)
    COD_ESTADO = EstadoSerializer(read_only=True)

    class Meta:
        model = Solicitud
        fields = '__all__'


class ContratoSerializer(serializers.ModelSerializer):
    COD_TIPO_PLAN = PlanSerializer(read_only=True)
    COD_CATEGORIA = CategoriaSerializer(read_only=True)
    COD_TIPO_PAGO = TipoPagoSerializer(read_only=True)
    COD_CLIENTE = ClienteSerializer(read_only=True)
    F_SOLICITUD = SolicitudSerializer(read_only=True)
    COD_ESTADO_CONTRATO = EstadoSerializer(read_only=True)
    COD_ESTADO_SERVICIO = EstadoSerializer(read_only=True)
    COD_FORMA_PAGO = FormaPagoSerializer(read_only=True)

    class Meta:
        model = Contrato
        fields = '__all__'


class SeguimientoSerializer(serializers.ModelSerializer):
    SOLICITUD = SolicitudSerializer(read_only=True)
    COD_ESTADO = EstadoSerializer(read_only=True)

    class Meta:
        model = Seguimiento
        fields = '__all__'
