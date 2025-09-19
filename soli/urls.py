# urls.py
from django.urls import path
from . import views

app_name = 'soli'

urlpatterns = [
    # FACTURAS

    path('facturas-locales/', 
         views.listar_cobfactu_locales, 
         name='facturas-locales'),
         
    path('consulta-factura-cliente/', 
         views.consulta_facturas_cliente, 
         name='consulta-por-cliente'),
         

     # SERVICIOS
     path('consulta-servicio/', 
         views.consulta_servicios_cliente, 
         name='consulta-por-cliente'),

     path('servicios-locales/', 
         views.listar_servicios_locales, 
         name='servicios-locales'),  

    

    # CLIENTES
    path('consulta-cliente/', 
         views.consulta_cliente_documento, 
         name='consulta-por-documento'),
     
    # Listar clientes locales migrados
    path('clientes-locales/', 
         views.listar_clientes_locales, 
         name='clientes-locales'),
    
    # Buscar clientes por nombre
    path('clientes-buscar/', 
         views.buscar_cliente_nombre, 
         name='buscar-por-nombre'),
    

    
    # Cliente servicios facturas resumido
    path('cliente-servicios-facturas-resumido/', 
         views.cliente_servicios_facturas_resumido, 
         name='cliente-servicios-facturas-resumido'),
]
