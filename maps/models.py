from django.db import models
from django.core.validators import EmailValidator, RegexValidator

class TipoServicio(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Tipo de Servicio"
        verbose_name_plural = "Tipos de Servicios"
        
    def __str__(self):
        return self.nombre

class Cliente(models.Model):
    TIPO_VIVIENDA_CHOICES = [
        ('vivienda', 'Vivienda'),
        ('departamento', 'Departamento'),
    ]
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('rechazado', 'Rechazado'),
        ('activo', 'Activo'),
    ]
    
    # Datos personales
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    email = models.EmailField(validators=[EmailValidator()], unique=True)
    telefono = models.CharField(
        max_length=15,
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message="El teléfono debe tener entre 9 y 15 dígitos"
        )]
    )
    ci = models.CharField(max_length=20, unique=True, verbose_name="CI")
    
    # Datos de vivienda
    tipo_vivienda = models.CharField(max_length=15, choices=TIPO_VIVIENDA_CHOICES)
    piso = models.CharField(max_length=10, blank=True, null=True)
    
    # Datos de ubicación (Google Maps)
    zona = models.CharField(max_length=100)
    calle = models.CharField(max_length=200)
    direccion_completa = models.TextField()
    latitud = models.DecimalField(max_digits=20, decimal_places=15)
    longitud = models.DecimalField(max_digits=20, decimal_places=15)
    
    # Servicio y estado
    tipo_servicio = models.ForeignKey(TipoServicio, on_delete=models.CASCADE)
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    
    # Fechas
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    fecha_activacion = models.DateTimeField(blank=True, null=True)
    
    # Observaciones
    observaciones = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ['-fecha_solicitud']
        
    def __str__(self):
        return f"{self.nombre} {self.apellido} - {self.get_estado_display()}"
    
    def save(self, *args, **kwargs):
        # Auto-completar piso si es departamento
        if self.tipo_vivienda == 'departamento' and not self.piso:
            self.piso = '1'  # Valor por defecto
        elif self.tipo_vivienda == 'vivienda':
            self.piso = None
        
        # Actualizar fecha de activación
        if self.estado == 'activo' and not self.fecha_activacion:
            from django.utils import timezone
            self.fecha_activacion = timezone.now()
            
        super().save(*args, **kwargs)
