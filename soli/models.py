# models.py
from django.db import models
from django.conf import settings
from decimal import Decimal
from django.db.models import Q

class CobfactuConsultaManager(models.Manager):
    """
    Manager personalizado para CobfactuConsulta con métodos de utilidad
    """
    def por_contrato(self, contrato):
        """Filtra por contrato específico"""
        return self.filter(contrato=contrato)
    
    def pendientes_migracion(self, contrato=None):
        """Retorna facturas que no han sido migradas"""
        from django.db.models import Q
        queryset = self.all()
        if contrato:
            queryset = queryset.filter(contrato=contrato)
        
        # Usar subconsulta para evitar dependencia circular
        return queryset.exclude(
            factura_interna__in=CobfactuLocal.objects.values('factura_interna')
        )
    
    def por_periodo(self, fecha_inicio, fecha_fin):
        """Filtra por rango de fechas de emisión"""
        return self.filter(fecha_emision__range=[fecha_inicio, fecha_fin])

class CobfactuConsulta(models.Model):
    """
    Modelo para consultar la foreign table.
    Siguiendo el mismo patrón que Empleado_fdw
    """
    # Usamos factura_interna como primary_key, igual que persona en Empleado_fdw
    factura_interna = models.DecimalField(max_digits=20, decimal_places=0, primary_key=True)
    
    cod_concesion = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    cod_dosificacion = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    contrato = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    periodo_desde = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    periodo_hasta = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    telefono = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    fecha_envio = models.DateField(null=True, blank=True)
    fecha_emision = models.DateField(null=True, blank=True)
    periodo = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    monto_total = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    cod_mensaje = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    monto_cf = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    numero_renta = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    monto_cotel = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    monto_cotel_cf = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    nombre_factura = models.CharField(max_length=100, null=True, blank=True)
    ruc_factura = models.CharField(max_length=12, null=True, blank=True)
    no_autorizacion = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    f_limite = models.CharField(max_length=10, null=True, blank=True)
    cod_control = models.CharField(max_length=16, null=True, blank=True)
    estado = models.CharField(max_length=2, null=True, blank=True)
    movimiento = models.CharField(max_length=2, null=True, blank=True)
    f_actualizacion = models.DateField(null=True, blank=True)
    id_transaccion = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    estado_transac = models.CharField(max_length=1, null=True, blank=True)

    objects = CobfactuConsultaManager()

    class Meta:
        managed = False  # Django no gestionará esta tabla
        db_table = 'cobfactu'  # Nombre de tu foreign table
        verbose_name = "Factura Consulta"
        verbose_name_plural = "Facturas Consulta"
        
    def __str__(self):
        return f"Factura: {self.factura_interna} - Contrato: {self.contrato}"

    def monto_total_formateado(self):
        """Retorna el monto total formateado"""
        if self.monto_total:
            return f"Bs. {self.monto_total:,.2f}"
        return "N/A"

    def esta_vigente(self):
        """Verifica si la factura está vigente"""
        return self.estado not in ['AN', 'CA']  # Anulada, Cancelada (ajustar según tus códigos)


class CobfactuLocal(models.Model):
    """
    Modelo local para almacenar la información migrada con ID propio de Django.
    Siguiendo el patrón de tu modelo Usuario
    """
    # Django creará automáticamente el campo 'id' como AutoField
    cod_concesion = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    factura_interna = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True, db_index=True)
    cod_dosificacion = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    contrato = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True, db_index=True)  # Índice para búsquedas
    periodo_desde = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    periodo_hasta = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    telefono = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    fecha_envio = models.DateField(null=True, blank=True)
    fecha_emision = models.DateField(null=True, blank=True)
    periodo = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    monto_total = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    cod_mensaje = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    monto_cf = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    numero_renta = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    monto_cotel = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    monto_cotel_cf = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    nombre_factura = models.CharField(max_length=100, null=True, blank=True)
    ruc_factura = models.CharField(max_length=12, null=True, blank=True)
    no_autorizacion = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    f_limite = models.CharField(max_length=10, null=True, blank=True)
    cod_control = models.CharField(max_length=16, null=True, blank=True)
    estado = models.CharField(max_length=2, null=True, blank=True)
    movimiento = models.CharField(max_length=2, null=True, blank=True)
    f_actualizacion = models.DateField(null=True, blank=True)
    id_transaccion = models.DecimalField(max_digits=20, decimal_places=0, null=True, blank=True)
    estado_transac = models.CharField(max_length=1, null=True, blank=True)
    
    # Campos adicionales para control (siguiendo tu patrón)
    fecha_migracion = models.DateTimeField(auto_now_add=True)
    migrada = models.BooleanField(default=True)
    migrada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Usando el modelo de usuario personalizado
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='facturas_migradas',
        verbose_name='Migrado por'
    )
    
    class Meta:
        db_table = 'cobfactu_local'
        verbose_name = "Factura Local"
        verbose_name_plural = "Facturas Locales"
        indexes = [
            models.Index(fields=['contrato']),
            models.Index(fields=['factura_interna']),
            models.Index(fields=['fecha_emision']),
            models.Index(fields=['fecha_migracion']),
        ]
        # Evitar duplicados por factura_interna + contrato
        unique_together = [('factura_interna', 'contrato')]
        
    def __str__(self):
        return f"Factura: {self.factura_interna} - Contrato: {self.contrato}"

    # Métodos de utilidad siguiendo tu patrón
    def es_factura_migrada(self):
        """Verifica si es una factura migrada desde FDW"""
        return self.migrada

    def monto_total_formateado(self):
        """Retorna el monto total formateado"""
        if self.monto_total:
            return f"Bs. {self.monto_total:,.2f}"
        return "N/A"

    def esta_vigente(self):
        """Verifica si la factura está vigente"""
        return self.estado not in ['AN', 'CA']  # Anulada, Cancelada (ajustar según tus códigos)


class ServiciosClienteConsultaManager(models.Manager):
    """
    Manager personalizado para ServiciosClienteConsulta con métodos de utilidad
    """
    def por_contrato(self, contrato):
        """Filtra por contrato específico"""
        return self.filter(contrato=contrato)
    
    def por_cliente(self, cod_cliente):
        """Filtra por código de cliente específico"""
        return self.filter(cod_cliente=cod_cliente)
    
    def pendientes_migracion(self, contrato=None):
        """Retorna servicios que no han sido migrados"""
        from django.db.models import Q
        queryset = self.all()
        if contrato:
            queryset = queryset.filter(contrato=contrato)
        
        # Usar subconsulta para evitar dependencia circular
        return queryset.exclude(
            contrato__in=ServiciosClienteLocal.objects.values('contrato')
        )
    
    def activos(self):
        """Filtra servicios no anulados"""
        return self.filter(anulado__isnull=True).exclude(anulado='S')
    
    def por_servicio(self, cod_servicio):
        """Filtra por tipo de servicio"""
        return self.filter(cod_servicio=cod_servicio)
    
    def por_plan_comercial(self, plan_comercial):
        """Filtra por plan comercial"""
        return self.filter(plan_comercial=plan_comercial)

class ServiciosClienteConsulta(models.Model):
    """
    Modelo para consultar la foreign table servicios_cliente.
    Siguiendo el mismo patrón que CobfactuConsulta
    """
    # Usamos contrato como primary_key ya que parece ser el identificador principal
    contrato = models.CharField(max_length=50, primary_key=True)
    
    ampliacion = models.CharField(max_length=50, null=True, blank=True)
    cod_cliente = models.CharField(max_length=50, null=True, blank=True)
    plan_comercial = models.CharField(max_length=50, null=True, blank=True)
    forma_pago = models.CharField(max_length=50, null=True, blank=True)
    direccion = models.CharField(max_length=255, null=True, blank=True)
    cod_acci_contrato = models.CharField(max_length=50, null=True, blank=True)
    cod_estado_contrato = models.CharField(max_length=50, null=True, blank=True)
    anulado = models.CharField(max_length=50, null=True, blank=True)
    concesion = models.CharField(max_length=50, null=True, blank=True)
    cod_servicio = models.CharField(max_length=50, null=True, blank=True)

    objects = ServiciosClienteConsultaManager()

    class Meta:
        managed = False  # Django no gestionará esta tabla
        db_table = 'servicios_cliente'  # Nombre de tu foreign table
        verbose_name = "Servicio Cliente Consulta"
        verbose_name_plural = "Servicios Cliente Consulta"
        
    def __str__(self):
        return f"Contrato: {self.contrato} - Cliente: {self.cod_cliente}"

    def esta_activo(self):
        """Verifica si el servicio está activo (no anulado)"""
        return self.anulado != 'S' and self.anulado is not None

    def direccion_formateada(self):
        """Retorna la dirección formateada"""
        if self.direccion:
            return self.direccion.title()
        return "Sin dirección"


class ServiciosClienteLocal(models.Model):
    """
    Modelo local para almacenar la información migrada con ID propio de Django.
    Siguiendo el patrón de CobfactuLocal
    """
    # Django creará automáticamente el campo 'id' como AutoField
    contrato = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    ampliacion = models.CharField(max_length=50, null=True, blank=True)
    cod_cliente = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    plan_comercial = models.CharField(max_length=50, null=True, blank=True)
    forma_pago = models.CharField(max_length=50, null=True, blank=True)
    direccion = models.CharField(max_length=255, null=True, blank=True)
    cod_acci_contrato = models.CharField(max_length=50, null=True, blank=True)
    cod_estado_contrato = models.CharField(max_length=50, null=True, blank=True)
    anulado = models.CharField(max_length=50, null=True, blank=True)
    concesion = models.CharField(max_length=50, null=True, blank=True)
    cod_servicio = models.CharField(max_length=50, null=True, blank=True)
    
    # Campos adicionales para control (siguiendo tu patrón)
    fecha_migracion = models.DateTimeField(auto_now_add=True)
    migrada = models.BooleanField(default=True)
    migrada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Usando el modelo de usuario personalizado
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='servicios_migrados',
        verbose_name='Migrado por'
    )
    
    class Meta:
        db_table = 'servicios_cliente_local'
        verbose_name = "Servicio Cliente Local"
        verbose_name_plural = "Servicios Cliente Locales"
        indexes = [
            models.Index(fields=['contrato']),
            models.Index(fields=['cod_cliente']),
            models.Index(fields=['cod_servicio']),
            models.Index(fields=['fecha_migracion']),
        ]
        # Evitar duplicados por contrato + cod_cliente
        unique_together = [('contrato', 'cod_cliente')]
        
    def __str__(self):
        return f"Contrato: {self.contrato} - Cliente: {self.cod_cliente}"

    # Métodos de utilidad siguiendo tu patrón
    def es_servicio_migrado(self):
        """Verifica si es un servicio migrado desde FDW"""
        return self.migrada

    def esta_activo(self):
        """Verifica si el servicio está activo (no anulado)"""
        return self.anulado != 'S' and self.anulado is not None

    def direccion_formateada(self):
        """Retorna la dirección formateada"""
        if self.direccion:
            return self.direccion.title()
        return "Sin dirección"

    def get_plan_comercial_display(self):
        """Retorna una versión legible del plan comercial"""
        if self.plan_comercial:
            return self.plan_comercial.replace('_', ' ').title()
        return "Sin plan"


class ClientesConsultaManager(models.Manager):
    """
    Manager personalizado para ClientesConsulta con métodos de utilidad
    """
    def por_codigo_cliente(self, cod_cliente):
        """Filtra por código de cliente específico"""
        return self.filter(cod_cliente=cod_cliente)
    
    def por_documento(self, cod_documento, nro_documento):
        """Filtra por tipo y número de documento"""
        return self.filter(cod_documento=cod_documento, nro_documento=nro_documento)
    
    def pendientes_migracion(self, cod_cliente=None):
        """Retorna clientes que no han sido migrados"""
        from django.db.models import Q
        queryset = self.all()
        if cod_cliente:
            queryset = queryset.filter(cod_cliente=cod_cliente)
        
        # Usar subconsulta para evitar dependencia circular
        return queryset.exclude(
            cod_cliente__in=ClientesLocal.objects.values('cod_cliente')
        )
    
    def por_ruc(self, nro_ruc):
        """Filtra por RUC"""
        return self.filter(nro_ruc=nro_ruc)
    
    def por_nombre(self, nombre):
        """Busca por nombre completo o nombre de pila"""
        return self.filter(
            Q(nombre_pila__icontains=nombre) |
            Q(nombres__icontains=nombre) |
            Q(ape_paterno__icontains=nombre) |
            Q(ape_materno__icontains=nombre)
        )
    
    def abonados(self):
        """Filtra solo abonados"""
        return self.filter(abonado='S')


class ClientesConsulta(models.Model):
    """
    Modelo para consultar la foreign table clientes.
    Siguiendo el mismo patrón que CobfactuConsulta
    """
    # Usamos cod_cliente como primary_key
    cod_cliente = models.CharField(max_length=13, primary_key=True)
    
    ape_paterno = models.CharField(max_length=20, null=True, blank=True)
    ape_materno = models.CharField(max_length=20, null=True, blank=True)
    nombres = models.CharField(max_length=25, null=True, blank=True)
    nombre_pila = models.CharField(max_length=70)
    direccion = models.CharField(max_length=36)
    cod_documento = models.CharField(max_length=3)
    nro_documento = models.CharField(max_length=12, null=True, blank=True)
    tipo_personeria = models.CharField(max_length=1)
    telefono_ref = models.DecimalField(max_digits=8, decimal_places=0, null=True, blank=True)
    abonado = models.CharField(max_length=1, null=True, blank=True)
    direccion_esp = models.CharField(max_length=36, null=True, blank=True)
    nro_ruc = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    sexo = models.CharField(max_length=1, null=True, blank=True)
    estado_civil = models.CharField(max_length=1, null=True, blank=True)
    fax = models.DecimalField(max_digits=8, decimal_places=0, null=True, blank=True)
    casilla = models.DecimalField(max_digits=6, decimal_places=0, null=True, blank=True)
    email = models.CharField(max_length=50, null=True, blank=True)
    nombre_factura = models.CharField(max_length=70)
    ruc_factura = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    dir_factura = models.CharField(max_length=36, null=True, blank=True)
    dir_esp_factura = models.CharField(max_length=36, null=True, blank=True)
    ingresos = models.DecimalField(max_digits=15, decimal_places=0, null=True, blank=True)
    luem_cod_lugar_emision = models.CharField(max_length=3, null=True, blank=True)
    inmu_cod_inmueble = models.DecimalField(max_digits=4, decimal_places=0, null=True, blank=True)
    inmu_cod_inmueble_facturar = models.DecimalField(max_digits=4, decimal_places=0, null=True, blank=True)
    zona_cod_zona = models.CharField(max_length=4, null=True, blank=True)
    zona_ciud_cod_ciudad = models.CharField(max_length=3, null=True, blank=True)
    zona_cod_zona_facturar = models.CharField(max_length=4, null=True, blank=True)
    zona_ciud_cod_ciudad_facturar = models.CharField(max_length=3, null=True, blank=True)
    rubr_cod_rubro = models.CharField(max_length=3, null=True, blank=True)
    f_nacimiento = models.DateField(null=True, blank=True)
    acti_cod_actividad = models.CharField(max_length=3, null=True, blank=True)
    ape_casada = models.CharField(max_length=20, null=True, blank=True)
    complemento = models.CharField(max_length=4, null=True, blank=True)

    objects = ClientesConsultaManager()

    class Meta:
        managed = False  # Django no gestionará esta tabla
        db_table = 'clientes'  # Nombre de tu foreign table
        verbose_name = "Cliente Consulta"
        verbose_name_plural = "Clientes Consulta"
        
    def __str__(self):
        return f"Cliente: {self.cod_cliente} - {self.nombre_pila}"

    def nombre_completo(self):
        """Retorna el nombre completo del cliente"""
        nombres = [self.ape_paterno, self.ape_materno, self.nombres]
        return " ".join([n for n in nombres if n])

    def es_abonado(self):
        """Verifica si es abonado"""
        return self.abonado == 'S'

    def get_sexo_display(self):
        """Retorna el sexo de forma legible"""
        opciones = {'M': 'Masculino', 'F': 'Femenino'}
        return opciones.get(self.sexo, 'No especificado')


class ClientesLocal(models.Model):
    """
    Modelo local para almacenar la información migrada con ID propio de Django.
    Siguiendo el patrón de CobfactuLocal
    """
    # Django creará automáticamente el campo 'id' como AutoField
    cod_cliente = models.CharField(max_length=13, db_index=True)
    ape_paterno = models.CharField(max_length=20, null=True, blank=True)
    ape_materno = models.CharField(max_length=20, null=True, blank=True)
    nombres = models.CharField(max_length=25, null=True, blank=True)
    nombre_pila = models.CharField(max_length=70)
    direccion = models.CharField(max_length=36)
    cod_documento = models.CharField(max_length=3)
    nro_documento = models.CharField(max_length=12, null=True, blank=True)
    tipo_personeria = models.CharField(max_length=1)
    telefono_ref = models.DecimalField(max_digits=8, decimal_places=0, null=True, blank=True)
    abonado = models.CharField(max_length=1, null=True, blank=True)
    direccion_esp = models.CharField(max_length=36, null=True, blank=True)
    nro_ruc = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    sexo = models.CharField(max_length=1, null=True, blank=True)
    estado_civil = models.CharField(max_length=1, null=True, blank=True)
    fax = models.DecimalField(max_digits=8, decimal_places=0, null=True, blank=True)
    casilla = models.DecimalField(max_digits=6, decimal_places=0, null=True, blank=True)
    email = models.CharField(max_length=50, null=True, blank=True)
    nombre_factura = models.CharField(max_length=70)
    ruc_factura = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    dir_factura = models.CharField(max_length=36, null=True, blank=True)
    dir_esp_factura = models.CharField(max_length=36, null=True, blank=True)
    ingresos = models.DecimalField(max_digits=15, decimal_places=0, null=True, blank=True)
    luem_cod_lugar_emision = models.CharField(max_length=3, null=True, blank=True)
    inmu_cod_inmueble = models.DecimalField(max_digits=4, decimal_places=0, null=True, blank=True)
    inmu_cod_inmueble_facturar = models.DecimalField(max_digits=4, decimal_places=0, null=True, blank=True)
    zona_cod_zona = models.CharField(max_length=4, null=True, blank=True)
    zona_ciud_cod_ciudad = models.CharField(max_length=3, null=True, blank=True)
    zona_cod_zona_facturar = models.CharField(max_length=4, null=True, blank=True)
    zona_ciud_cod_ciudad_facturar = models.CharField(max_length=3, null=True, blank=True)
    rubr_cod_rubro = models.CharField(max_length=3, null=True, blank=True)
    f_nacimiento = models.DateField(null=True, blank=True)
    acti_cod_actividad = models.CharField(max_length=3, null=True, blank=True)
    ape_casada = models.CharField(max_length=20, null=True, blank=True)
    complemento = models.CharField(max_length=4, null=True, blank=True)
    
    # Campos adicionales para control (siguiendo tu patrón)
    fecha_migracion = models.DateTimeField(auto_now_add=True)
    migrada = models.BooleanField(default=True)
    migrada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clientes_migrados',
        verbose_name='Migrado por'
    )
    
    class Meta:
        db_table = 'clientes_local'
        verbose_name = "Cliente Local"
        verbose_name_plural = "Clientes Locales"
        indexes = [
            models.Index(fields=['cod_cliente']),
            models.Index(fields=['nro_documento']),
            models.Index(fields=['nro_ruc']),
            models.Index(fields=['fecha_migracion']),
        ]
        # Evitar duplicados por cod_cliente
        unique_together = [('cod_cliente',)]
        
    def __str__(self):
        return f"Cliente: {self.cod_cliente} - {self.nombre_pila}"

    def es_cliente_migrado(self):
        """Verifica si es un cliente migrado desde FDW"""
        return self.migrada

    def nombre_completo(self):
        """Retorna el nombre completo del cliente"""
        nombres = [self.ape_paterno, self.ape_materno, self.nombres]
        return " ".join([n for n in nombres if n])

    def es_abonado(self):
        """Verifica si es abonado"""
        return self.abonado == 'S'

    def get_sexo_display(self):
        """Retorna el sexo de forma legible"""
        opciones = {'M': 'Masculino', 'F': 'Femenino'}
        return opciones.get(self.sexo, 'No especificado')        