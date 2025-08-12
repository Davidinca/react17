from django.db import models

class FormaPago(models.Model):
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)
    abreviacion = models.CharField(max_length=10)
    estado = models.BooleanField(default=True)  # True = Activo, False = Inactivo

    def __str__(self):
        return self.nombre

class TipoConexion(models.Model):
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)
    estado = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

class Plan(models.Model):
    descripcion = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20, unique=True)
    forma_pago = models.ForeignKey(FormaPago, on_delete=models.PROTECT)
    tipo_conexion = models.ForeignKey(TipoConexion, on_delete=models.PROTECT)
    monto_basico = models.DecimalField(max_digits=10, decimal_places=2)
    tipo_basico = models.CharField(max_length=50)  # Ej: "Mensual", "Anual"
    fecha_inicial = models.DateField()
    fecha_final = models.DateField(blank=True, null=True)  # Puede ser indefinido
    estado = models.BooleanField(default=True)
    codigo_item = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.descripcion} ({self.codigo})"

class Cliente(models.Model):
    ESTADO_CHOICES = [
        ('PEND_COBERTURA', 'Pendiente por cobertura'),
        ('PEND_EQUIPO', 'Pendiente por equipo'),
        ('PEND_INSTALACION', 'Pendiente por instalación'),
        ('ACTIVO', 'Activo'),
        ('SUSPENDIDO', 'Suspendido'),
    ]

    COBERTURA_CHOICES = [
        ('CON_COBERTURA', 'Con cobertura'),
        ('SIN_COBERTURA', 'Sin cobertura'),
    ]

    TIPO_CLIENTE_CHOICES = [
        ('COMUN', 'Usuario común'),
        ('EMPRESA', 'Empresa'),
    ]

    nombre = models.CharField(max_length=50)
    apellido = models.CharField(max_length=50)
    ci = models.CharField(max_length=20, unique=True, blank=True, null=True)  # Opcional si es empresa
    email = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=20)
    vivienda = models.CharField(max_length=20, choices=[('Casa', 'Casa'), ('Departamento', 'Departamento')])
    piso = models.CharField(max_length=10, blank=True, null=True)
    calle = models.CharField(max_length=100)
    zona = models.CharField(max_length=100)
    direccion_completa = models.TextField()
    numero_puerta = models.CharField(max_length=20)
    referencias = models.TextField(blank=True, null=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    latitud = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    tipo_cliente = models.CharField(max_length=10, choices=TIPO_CLIENTE_CHOICES, default='COMUN')
    nit = models.CharField(max_length=20, blank=True, null=True)  # Solo si es empresa
    razon_social = models.CharField(max_length=100, blank=True, null=True)  # Solo si es empresa
    cobertura = models.CharField(max_length=20, choices=COBERTURA_CHOICES, default='SIN_COBERTURA')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PEND_COBERTURA')
    observaciones = models.TextField(blank=True, null=True)
    plan = models.ForeignKey('Plan', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.nombre} {self.apellido} ({self.ci if self.ci else 'Empresa'})"

    def save(self, *args, **kwargs):
        # Si es vivienda tipo "Casa", se limpia el campo "piso"
        if self.vivienda == 'Casa':
            self.piso = None

        # Si es cliente común, limpiar campos de empresa
        if self.tipo_cliente == 'COMUN':
            self.nit = None
            self.razon_social = None

        super().save(*args, **kwargs)
