from django.db import models

# === TABLAS MAESTRAS ===

class Cliente(models.Model):
    COD_CLIENTE = models.CharField(max_length=13, primary_key=True)
    NOMBRE = models.CharField(max_length=100)
    APELLIDO = models.CharField(max_length=100)
    CI = models.CharField(max_length=20, blank=True, null=True)
    EMAIL = models.EmailField(max_length=100, blank=True, null=True)
    TELEFONO = models.CharField(max_length=15, blank=True, null=True)
    VIVIENDA = models.CharField(max_length=20, blank=True, null=True)
    PISO = models.CharField(max_length=10, blank=True, null=True)
    CALLE = models.CharField(max_length=100, blank=True, null=True)
    ZONA = models.CharField(max_length=100, blank=True, null=True)
    DIRECCION_COMPLETA = models.CharField(max_length=200, blank=True, null=True)
    NUMERO_PUERTA = models.CharField(max_length=20, blank=True, null=True)
    REFERENCIAS = models.CharField(max_length=200, blank=True, null=True)
    LONGITUD = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    LATITUD = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    TIPO_CLIENTE = models.CharField(max_length=10, blank=True, null=True)
    NIT = models.CharField(max_length=20, blank=True, null=True)
    RAZON_SOCIAL = models.CharField(max_length=100, blank=True, null=True)
    OBSERVACIONES = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        return f"{self.NOMBRE} {self.APELLIDO}"


class TipoPago(models.Model):
    COD_TIPO_PAGO = models.AutoField(primary_key=True)
    DESCRIPCION = models.CharField(max_length=30)
    ESTADO_ACTIVO_TIPAG = models.CharField(max_length=1)

    def __str__(self):
        return self.DESCRIPCION


class Categoria(models.Model):
    COD_CATEGORIA = models.AutoField(primary_key=True)
    DESCRIPCION = models.CharField(max_length=100)
    ESTADO_ACTIVO = models.CharField(max_length=1)

    def __str__(self):
        return self.DESCRIPCION


class FormaPago(models.Model):
    COD_FORMA_PAGO = models.AutoField(primary_key=True)
    DESCRIPCION = models.CharField(max_length=30)
    ESTADO_ACTIVO = models.CharField(max_length=1)
    ABREVIACION = models.CharField(max_length=3)

    def __str__(self):
        return self.DESCRIPCION


class Estado(models.Model):
    COD_ESTADO = models.AutoField(primary_key=True)
    DESCRIPCION = models.CharField(max_length=100)
    ESTADO = models.CharField(max_length=1)

    def __str__(self):
        return self.DESCRIPCION


class ClaseTrabajo(models.Model):
    COD_CLASE = models.CharField(max_length=2, primary_key=True)
    DESCRIPCION = models.CharField(max_length=30)
    ESTADO_ACTIVO = models.CharField(max_length=1)
    CON_CROQUIS = models.CharField(max_length=1)
    GRUPO = models.CharField(max_length=20)
    MODIFICA_ACCION = models.CharField(max_length=1)
    MODIFICA_FORMA = models.CharField(max_length=1)
    MODIFICA_TARIFA = models.CharField(max_length=1)

    def __str__(self):
        return self.DESCRIPCION


class TipoTrabajo(models.Model):
    COD_TIPO_TRABAJO = models.AutoField(primary_key=True)
    DESCRIPCION = models.CharField(max_length=30)
    COD_ESTADO = models.ForeignKey(Estado, on_delete=models.PROTECT)
    MONTO = models.DecimalField(max_digits=10, decimal_places=2)
    COD_MONEDA = models.IntegerField()
    MESESAPLICAR = models.IntegerField()
    INDICADOR_PROCESO = models.CharField(max_length=1)
    COD_CLASE = models.ForeignKey(ClaseTrabajo, on_delete=models.PROTECT)
    GENERA_OT = models.CharField(max_length=1)
    COD_CONCEPTO = models.CharField(max_length=6)
    TRAMITE = models.IntegerField()
    COSTO_FIJO = models.CharField(max_length=1)
    REGULADO = models.CharField(max_length=1)

    def __str__(self):
        return self.DESCRIPCION


class TipoConexion(models.Model):
    COD_TIPO_CONEXION = models.AutoField(primary_key=True)
    DESCRIPCION = models.CharField(max_length=30)
    ESTADO_ACTIVO_TICON = models.CharField(max_length=1)

    def __str__(self):
        return self.DESCRIPCION


class Plan(models.Model):
    COD_TIPO_PLAN = models.AutoField(primary_key=True)
    DESCRIPCION = models.CharField(max_length=30)
    COD_FORMA_PAGO = models.ForeignKey(FormaPago, on_delete=models.PROTECT)
    COD_TIPO_CONEXION = models.ForeignKey(TipoConexion, on_delete=models.PROTECT)
    MONTO_BASICO = models.DecimalField(max_digits=10, decimal_places=4)
    TIPO_BASICO = models.IntegerField()
    F_INICIAL = models.DateField()
    F_FINAL = models.DateField(blank=True, null=True)
    ESTADO_ACTIVO = models.CharField(max_length=1)

    def __str__(self):
        return self.DESCRIPCION


# === TABLAS TRANSACCIONALES ===

class Solicitud(models.Model):
    SOLICITUD = models.AutoField(primary_key=True)
    COD_TIPO_TRABAJO = models.ForeignKey(TipoTrabajo, on_delete=models.PROTECT)
    COD_TIPO_PLAN = models.ForeignKey(Plan, on_delete=models.PROTECT)
    COD_FORMA_PAGO = models.ForeignKey(FormaPago, on_delete=models.PROTECT)
    COD_CATEGORIA = models.ForeignKey(Categoria, on_delete=models.PROTECT)
    COD_TIPO_PAGO = models.ForeignKey(TipoPago, on_delete=models.PROTECT)
    F_SOLICITUD = models.DateField()
    COD_UNIDAD = models.IntegerField()
    NO_EMPLEADO = models.CharField(max_length=6)
    COD_CLIENTE = models.ForeignKey(Cliente, on_delete=models.PROTECT)
    F_PREVISTA = models.DateField(blank=True, null=True)
    OBSERVACIONES = models.CharField(max_length=150, blank=True, null=True)
    COD_ESTADO = models.ForeignKey(Estado, on_delete=models.PROTECT)
    F_ESTADO = models.DateField(blank=True, null=True)
    F_ANULACION = models.DateField(blank=True, null=True)
    TIPO_CONEXION = models.CharField(max_length=30, blank=True, null=True)
    F_PREVISTA_VENC = models.DateField(blank=True, null=True)
    COD_FLUJO_ESTADO = models.IntegerField(blank=True, null=True)
    COBERTURA = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return f"Solicitud {self.SOLICITUD}"


class Contrato(models.Model):
    CONTRATO_INTERNET = models.AutoField(primary_key=True)
    USERNAME = models.CharField(max_length=50)
    CLAVE = models.CharField(max_length=50)
    COD_TIPO_PLAN = models.ForeignKey(Plan, on_delete=models.PROTECT)
    COD_CATEGORIA = models.ForeignKey(Categoria, on_delete=models.PROTECT)
    COD_TIPO_PAGO = models.ForeignKey(TipoPago, on_delete=models.PROTECT)
    COD_CLIENTE = models.ForeignKey(Cliente, on_delete=models.PROTECT)
    F_SOLICITUD = models.ForeignKey(Solicitud, on_delete=models.PROTECT)
    F_CONTRATO = models.DateField()
    OBSERVACIONES = models.CharField(max_length=150, blank=True, null=True)
    COD_ESTADO_CONTRATO = models.ForeignKey(Estado, on_delete=models.PROTECT, related_name='estado_contrato')
    COD_ESTADO_SERVICIO = models.ForeignKey(Estado, on_delete=models.PROTECT, related_name='estado_servicio')
    COD_ACCI_CONTRATO = models.IntegerField(blank=True, null=True)
    F_RESCISION = models.DateField(blank=True, null=True)
    F_INSTALACION = models.DateField(blank=True, null=True)
    TIPO_CONEXION = models.CharField(max_length=30, blank=True, null=True)
    COD_FORMA_PAGO = models.ForeignKey(FormaPago, on_delete=models.PROTECT)
    ESTADO_FACT = models.IntegerField(blank=True, null=True)
    MODEM = models.CharField(max_length=1, blank=True, null=True)

    def __str__(self):
        return f"Contrato {self.CONTRATO_INTERNET}"


class Seguimiento(models.Model):
    SOLICITUD = models.ForeignKey(Solicitud, on_delete=models.CASCADE)
    COD_ESTADO = models.ForeignKey(Estado, on_delete=models.PROTECT)
    F_INICIO = models.DateField()
    USER_INICIO = models.CharField(max_length=6)
    F_FIN = models.DateField(blank=True, null=True)
    USER_FIN = models.CharField(max_length=6, blank=True, null=True)
    NRO_SEGUIMIENTO = models.IntegerField()

    def __str__(self):
        return f"Seguimiento {self.NRO_SEGUIMIENTO} de Solicitud {self.SOLICITUD.SOLICITUD}"


