# serializers.py
from rest_framework import serializers
from .models import CobfactuConsulta, CobfactuLocal, ServiciosClienteConsulta, ServiciosClienteLocal,ClientesConsulta,ClientesLocal


class CobfactuConsultaSerializer(serializers.ModelSerializer):
    """
    Serializer para consultar la foreign table.
    Solo lectura, sin ID automático de Django.
    """
    
    class Meta:
        model = CobfactuConsulta
        fields = [
            'cod_concesion', 'factura_interna', 'cod_dosificacion', 
            'contrato', 'periodo_desde', 'periodo_hasta', 'telefono',
            'fecha_envio', 'fecha_emision', 'periodo', 'monto_total',
            'cod_mensaje', 'monto_cf', 'numero_renta', 'monto_cotel',
            'monto_cotel_cf', 'nombre_factura', 'ruc_factura',
            'no_autorizacion', 'f_limite', 'cod_control', 'estado',
            'movimiento', 'f_actualizacion', 'id_transaccion', 'estado_transac'
        ]
        read_only_fields = fields  # Todos los campos son de solo lectura


class CobfactuLocalSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo local con ID de Django.
    Permite CRUD completo.
    """
    
    migrado = serializers.BooleanField(source='migrada')

    class Meta:
        model = CobfactuLocal
        fields = [
            'id', 'cod_concesion', 'factura_interna', 'cod_dosificacion',
            'contrato', 'periodo_desde', 'periodo_hasta', 'telefono',
            'fecha_envio', 'fecha_emision', 'periodo', 'monto_total',
            'cod_mensaje', 'monto_cf', 'numero_renta', 'monto_cotel',
            'monto_cotel_cf', 'nombre_factura', 'ruc_factura',
            'no_autorizacion', 'f_limite', 'cod_control', 'estado',
            'movimiento', 'f_actualizacion', 'id_transaccion', 'estado_transac',
            'fecha_migracion', 'migrado'
        ]
        read_only_fields = ['id', 'fecha_migracion']




class ServiciosClienteConsultaSerializer(serializers.ModelSerializer):
    """
    Serializer para consultar la foreign table servicios_cliente.
    Solo lectura, sin ID automático de Django.
    """
    
    class Meta:
        model = ServiciosClienteConsulta
        fields = [
            'contrato', 'ampliacion', 'cod_cliente', 'plan_comercial',
            'forma_pago', 'direccion', 'cod_acci_contrato', 
            'cod_estado_contrato', 'anulado', 'concesion', 'cod_servicio'
        ]
        read_only_fields = fields  # Todos los campos son de solo lectura


class ServiciosClienteLocalSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo local con ID de Django.
    Permite CRUD completo.
    """
    
    class Meta:
        model = ServiciosClienteLocal
        fields = [
            'id', 'contrato', 'ampliacion', 'cod_cliente', 'plan_comercial',
            'forma_pago', 'direccion', 'cod_acci_contrato', 
            'cod_estado_contrato', 'anulado', 'concesion', 'cod_servicio',
            'fecha_migracion', 'migrada', 'migrada_por'
        ]
        read_only_fields = ['id', 'fecha_migracion']

class ClientesConsultaSerializer(serializers.ModelSerializer):
    """
    Serializer para consultar la foreign table clientes.
    Solo lectura, sin ID automático de Django.
    """
    
    class Meta:
        model = ClientesConsulta
        fields = [
            'cod_cliente', 'ape_paterno', 'ape_materno', 'nombres', 'nombre_pila',
            'direccion', 'cod_documento', 'nro_documento', 'tipo_personeria',
            'telefono_ref', 'abonado', 'direccion_esp', 'nro_ruc', 'sexo',
            'estado_civil', 'fax', 'casilla', 'email', 'nombre_factura',
            'ruc_factura', 'dir_factura', 'dir_esp_factura', 'ingresos',
            'luem_cod_lugar_emision', 'inmu_cod_inmueble', 'inmu_cod_inmueble_facturar',
            'zona_cod_zona', 'zona_ciud_cod_ciudad', 'zona_cod_zona_facturar',
            'zona_ciud_cod_ciudad_facturar', 'rubr_cod_rubro', 'f_nacimiento',
            'acti_cod_actividad', 'ape_casada', 'complemento'
        ]
        read_only_fields = fields  # Todos los campos son de solo lectura


class ClientesLocalSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo local con ID de Django.
    Permite CRUD completo.
    """
    
    class Meta:
        model = ClientesLocal
        fields = [
            'id', 'cod_cliente', 'ape_paterno', 'ape_materno', 'nombres', 'nombre_pila',
            'direccion', 'cod_documento', 'nro_documento', 'tipo_personeria',
            'telefono_ref', 'abonado', 'direccion_esp', 'nro_ruc', 'sexo',
            'estado_civil', 'fax', 'casilla', 'email', 'nombre_factura',
            'ruc_factura', 'dir_factura', 'dir_esp_factura', 'ingresos',
            'luem_cod_lugar_emision', 'inmu_cod_inmueble', 'inmu_cod_inmueble_facturar',
            'zona_cod_zona', 'zona_ciud_cod_ciudad', 'zona_cod_zona_facturar',
            'zona_ciud_cod_ciudad_facturar', 'rubr_cod_rubro', 'f_nacimiento',
            'acti_cod_actividad', 'ape_casada', 'complemento',
            'fecha_migracion', 'migrada', 'migrada_por'
        ]
        read_only_fields = ['id', 'fecha_migracion']