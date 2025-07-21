from django.contrib.gis.db import models
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance


class Barrio(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    poligono = models.PolygonField()
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Barrio"
        verbose_name_plural = "Barrios"
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre
    
    def total_postes(self):
        return self.poste_set.count()
    
    def postes_disponibles(self):
        return self.poste_set.filter(nodos_disponibles__gt=0).count()


class Poste(models.Model):
    codigo = models.CharField(max_length=20, unique=True)
    ubicacion = models.PointField()
    barrio = models.ForeignKey(Barrio, on_delete=models.CASCADE)
    capacidad_nodos = models.IntegerField(default=8)
    nodos_disponibles = models.IntegerField(default=8)
    activo = models.BooleanField(default=True)
    observaciones = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Poste"
        verbose_name_plural = "Postes"
        ordering = ['codigo']
    
    def __str__(self):
        return f"Poste {self.codigo} - {self.barrio.nombre}"
    
    @property
    def tiene_disponibilidad(self):
        return self.nodos_disponibles > 0
    
    @property
    def porcentaje_ocupacion(self):
        if self.capacidad_nodos == 0:
            return 0
        return ((self.capacidad_nodos - self.nodos_disponibles) / self.capacidad_nodos) * 100
    
    def clientes_asignados(self):
        return self.cliente_set.filter(estado_solicitud='asignado').count()
    
    def reservar_nodo(self):
        """Reserva un nodo si hay disponibilidad"""
        if self.tiene_disponibilidad:
            self.nodos_disponibles -= 1
            self.save()
            return True
        return False
    
    def liberar_nodo(self):
        """Libera un nodo si no excede la capacidad"""
        if self.nodos_disponibles < self.capacidad_nodos:
            self.nodos_disponibles += 1
            self.save()
            return True
        return False


class Cliente(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('asignado', 'Asignado'),
        ('instalado', 'Instalado'),
        ('rechazado', 'Rechazado'),
        ('cancelado', 'Cancelado'),
    ]
    
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    direccion = models.CharField(max_length=255)
    ubicacion = models.PointField()
    barrio = models.ForeignKey(Barrio, on_delete=models.CASCADE)
    poste_asignado = models.ForeignKey(Poste, on_delete=models.SET_NULL, null=True, blank=True)
    estado_solicitud = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    observaciones = models.TextField(blank=True, null=True)
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_instalacion = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ['-fecha_solicitud']
    
    def __str__(self):
        return f"{self.nombre} {self.apellido} - {self.estado_solicitud}"
    
    def distancia_al_poste(self):
        """Calcula la distancia al poste asignado en metros"""
        if self.poste_asignado:
            return self.ubicacion.distance(self.poste_asignado.ubicacion) * 111320  # Aproximación en metros
        return None
    
    def buscar_postes_cercanos(self, radio_metros=150):
        """Busca postes cercanos con disponibilidad"""
        return Poste.objects.filter(
            ubicacion__distance_lte=(self.ubicacion, D(m=radio_metros)),
            nodos_disponibles__gt=0,
            activo=True
        ).annotate(
            distancia=Distance('ubicacion', self.ubicacion)
        ).order_by('distancia')
    
    def asignar_poste_automatico(self):
        """Asigna automáticamente el poste más cercano disponible"""
        postes_cercanos = self.buscar_postes_cercanos()
        
        if postes_cercanos.exists():
            poste_optimo = postes_cercanos.first()
            if poste_optimo.reservar_nodo():
                # Liberar nodo del poste anterior si existe
                if self.poste_asignado and self.poste_asignado != poste_optimo:
                    self.poste_asignado.liberar_nodo()
                
                self.poste_asignado = poste_optimo
                self.estado_solicitud = 'asignado'
                self.save()
                return poste_optimo
        
        return None