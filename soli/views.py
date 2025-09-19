from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import CobfactuConsulta, CobfactuLocal, ServiciosClienteConsulta, ServiciosClienteLocal, ClientesConsulta, ClientesLocal
from .serializers import ClientesConsultaSerializer, ClientesLocalSerializer,CobfactuConsultaSerializer,CobfactuLocalSerializer,ServiciosClienteConsultaSerializer,ServiciosClienteLocalSerializer
from decimal import Decimal
from django.db.models import Sum, Count




@api_view(['GET'])
def listar_cobfactu_locales(request):
    try:
        cobfactu = CobfactuLocal.objects.all()[:10]  # 👈 límite de 10
        serializer = CobfactuLocalSerializer(cobfactu, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def consulta_facturas_cliente(request):
    """
    Verifica y migra todas las facturas de todos los contratos de un cliente.
    GET /api/facturas/consulta/?cod_cliente=123
    """
    cod_cliente = request.query_params.get('cod_cliente')
    if not cod_cliente:
        return Response({'error': 'Se requiere el parámetro cod_cliente'}, status=400)
    
    try:
        # 1. Buscar contratos locales del cliente
        contratos = ServiciosClienteLocal.objects.filter(cod_cliente=cod_cliente).values_list('contrato', flat=True)
        if not contratos:
            return Response({'status': 'sin_servicios'}, status=404)
        
        migrados_total = 0
        contratos_migrados = []

        with transaction.atomic():
            for contrato in contratos:
                registros = CobfactuConsulta.objects.por_contrato(contrato)
                if not registros.exists():
                    continue
                
                migrados = 0
                for r in registros:
                    if not CobfactuLocal.objects.filter(factura_interna=r.factura_interna).exists():
                        CobfactuLocal.objects.create(
                            cod_concesion=r.cod_concesion,
                            factura_interna=r.factura_interna,
                            cod_dosificacion=r.cod_dosificacion,
                            contrato=r.contrato,
                            periodo_desde=r.periodo_desde,
                            periodo_hasta=r.periodo_hasta,
                            telefono=r.telefono,
                            fecha_envio=r.fecha_envio,
                            fecha_emision=r.fecha_emision,
                            periodo=r.periodo,
                            monto_total=r.monto_total,
                            cod_mensaje=r.cod_mensaje,
                            monto_cf=r.monto_cf,
                            numero_renta=r.numero_renta,
                            monto_cotel=r.monto_cotel,
                            monto_cotel_cf=r.monto_cotel_cf,
                            nombre_factura=r.nombre_factura,
                            ruc_factura=r.ruc_factura,
                            no_autorizacion=r.no_autorizacion,
                            f_limite=r.f_limite,
                            cod_control=r.cod_control,
                            estado=r.estado,
                            movimiento=r.movimiento,
                            f_actualizacion=r.f_actualizacion,
                            id_transaccion=r.id_transaccion,
                            estado_transac=r.estado_transac,
                            migrada=True,
                            migrada_por=request.user if getattr(request, "user", None) and request.user.is_authenticated else None
                        )
                        migrados += 1
                
                if migrados > 0:
                    contratos_migrados.append({
                        "contrato": contrato,
                        "facturas_migradas": migrados
                    })
                    migrados_total += migrados
        
        return Response({
            "status": "migrado",
            "total_facturas": migrados_total,
            "detalle": contratos_migrados
        })
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)





@api_view(['GET'])
def consulta_servicios_cliente(request):
    """
    Verifica y migra servicios de un cliente por cod_cliente.
    GET /api/servicios/consulta/?cod_cliente=123
    """
    cod_cliente = request.query_params.get('cod_cliente')
    if not cod_cliente:
        return Response({'error': 'Se requiere el parámetro cod_cliente'}, status=400)

    try:
        # 1. Verificar si ya existen servicios en local
        if ServiciosClienteLocal.objects.filter(cod_cliente=cod_cliente).exists():
            contratos = list(
                ServiciosClienteLocal.objects.filter(cod_cliente=cod_cliente)
                .values_list("contrato", flat=True)
            )
            return Response({'status': 'existe', 'data': {'contratos': contratos}})
        
        # 2. Buscar en la foreign table
        registros = ServiciosClienteConsulta.objects.filter(cod_cliente=cod_cliente)
        if not registros.exists():
            return Response({'status': 'no_encontrado'}, status=404)
        
        # 3. Migrar registros
        contratos = []
        with transaction.atomic():
            for r in registros:
                if not ServiciosClienteLocal.objects.filter(contrato=r.contrato).exists():
                    nuevo = ServiciosClienteLocal.objects.create(
                        contrato=r.contrato,
                        ampliacion=r.ampliacion,
                        cod_cliente=r.cod_cliente,
                        plan_comercial=r.plan_comercial,
                        forma_pago=r.forma_pago,
                        direccion=r.direccion,
                        cod_acci_contrato=r.cod_acci_contrato,
                        cod_estado_contrato=r.cod_estado_contrato,
                        anulado=r.anulado,
                        concesion=r.concesion,
                        cod_servicio=r.cod_servicio,
                        migrada=True,
                        migrada_por=request.user if getattr(request, "user", None) and request.user.is_authenticated else None
                    )
                    contratos.append(nuevo.contrato)
        
        return Response({'status': 'migrado', 'registros': len(contratos), 'data': {'contratos': contratos}})

    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def listar_servicios_locales(request):
    try:
        servicios = ServiciosClienteLocal.objects.all()[:10]  # 👈 límite de 10
        serializer = ServiciosClienteLocalSerializer(servicios, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)








@api_view(['GET'])
def consulta_cliente_documento(request):
    """
    Verifica y migra datos de un cliente por número de documento
    GET /api/consultacliente/consulta/?nro_documento=12345678
    """
    nro_documento = request.query_params.get('nro_documento')
    if not nro_documento:
        return Response({'error': 'Se requiere el parámetro nro_documento'}, status=400)
    
    try:
        # Verificar si ya existe en local
        if ClientesLocal.objects.filter(nro_documento=nro_documento).exists():
            return Response({'status': 'existe'})
            
        # Buscar en la foreign table
        registros = ClientesConsulta.objects.filter(nro_documento=nro_documento)
        if not registros.exists():
            return Response({'status': 'no_encontrado'}, status=404)
            
        # Migrar registros
        migrados = 0
        with transaction.atomic():
            for r in registros:
                # Verificar si ya existe por cod_cliente para evitar duplicados
                if not ClientesLocal.objects.filter(cod_cliente=r.cod_cliente).exists():
                    ClientesLocal.objects.create(
                        cod_cliente=r.cod_cliente,
                        ape_paterno=r.ape_paterno,
                        ape_materno=r.ape_materno,
                        nombres=r.nombres,
                        nombre_pila=r.nombre_pila,
                        direccion=r.direccion,
                        cod_documento=r.cod_documento,
                        nro_documento=r.nro_documento,
                        tipo_personeria=r.tipo_personeria,
                        telefono_ref=r.telefono_ref,
                        abonado=r.abonado,
                        direccion_esp=r.direccion_esp,
                        nro_ruc=r.nro_ruc,
                        sexo=r.sexo,
                        estado_civil=r.estado_civil,
                        fax=r.fax,
                        casilla=r.casilla,
                        email=r.email,
                        nombre_factura=r.nombre_factura,
                        ruc_factura=r.ruc_factura,
                        dir_factura=r.dir_factura,
                        dir_esp_factura=r.dir_esp_factura,
                        ingresos=r.ingresos,
                        luem_cod_lugar_emision=r.luem_cod_lugar_emision,
                        inmu_cod_inmueble=r.inmu_cod_inmueble,
                        inmu_cod_inmueble_facturar=r.inmu_cod_inmueble_facturar,
                        zona_cod_zona=r.zona_cod_zona,
                        zona_ciud_cod_ciudad=r.zona_ciud_cod_ciudad,
                        zona_cod_zona_facturar=r.zona_cod_zona_facturar,
                        zona_ciud_cod_ciudad_facturar=r.zona_ciud_cod_ciudad_facturar,
                        rubr_cod_rubro=r.rubr_cod_rubro,
                        f_nacimiento=r.f_nacimiento,
                        acti_cod_actividad=r.acti_cod_actividad,
                        ape_casada=r.ape_casada,
                        complemento=r.complemento,
                        migrada=True,
                        migrada_por=request.user if hasattr(request, 'user') and request.user.is_authenticated else None
                    )
                    migrados += 1
                
        return Response({
            'status': 'migrado',
            'registros': migrados,
            'data': {'cod_cliente': r.cod_cliente}
        })        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def listar_clientes_locales(request):
    """
    Lista clientes migrados desde la tabla local
    GET /api/consultacliente/locales/
    """
    try:
        clientes = ClientesLocal.objects.all()
        serializer = ClientesLocalSerializer(clientes, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def buscar_cliente_nombre(request):
    """
    Busca clientes por nombre en la tabla local
    GET /api/consultacliente/buscar/?nombre=Juan
    """
    nombre = request.query_params.get('nombre')
    if not nombre:
        return Response({'error': 'Se requiere el parámetro nombre'}, status=400)
    
    try:
        from django.db.models import Q
        clientes = ClientesLocal.objects.filter(
            Q(nombre_pila__icontains=nombre) |
            Q(nombres__icontains=nombre) |
            Q(ape_paterno__icontains=nombre) |
            Q(ape_materno__icontains=nombre)
        )
        serializer = ClientesLocalSerializer(clientes, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)










@api_view(['GET'])
def cliente_servicios_facturas_resumido(request):
    """
    Trae un cliente por nro_documento, sus servicios y el resumen de las facturas que debe.
    GET /api/cliente/detalle/?nro_documento=4819716
    """
    nro_documento = request.query_params.get('nro_documento')
    if not nro_documento:
        return Response({'error': 'Se requiere el parámetro nro_documento'}, status=400)
    
    try:
        # Buscar cliente
        cliente = ClientesLocal.objects.filter(nro_documento=nro_documento).first()
        if not cliente:
            return Response({'status': 'no_encontrado'}, status=404)

        # Buscar servicios del cliente
        servicios = ServiciosClienteLocal.objects.filter(cod_cliente=cliente.cod_cliente)
        servicios_data = []

        for servicio in servicios:
            # Resumir solo facturas pendientes o no pagadas
            resumen_facturas = CobfactuLocal.objects.filter(
                contrato=servicio.contrato,
                estado__in=['G', 'NP']  # 👈 solo las que debe
            ).aggregate(
                cantidad_facturas=Count('factura_interna'),
                total_monto=Sum('monto_total')
            )

            servicios_data.append({
                'servicio': ServiciosClienteLocalSerializer(servicio).data,
                'facturas_resumen': resumen_facturas
            })

        return Response({
            'cliente': {
                'cod_cliente': cliente.cod_cliente,
                'nombres': cliente.nombres,
                'nro_documento': cliente.nro_documento
            },
            'servicios': servicios_data
        })

    except Exception as e:
        return Response({'error': str(e)}, status=500)