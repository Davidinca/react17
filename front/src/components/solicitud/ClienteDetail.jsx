// src/components/maps/ClienteDetail.jsx
import React, { useRef, useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Button,
  Chip,
  Select,
  Option,
  Textarea,
  Alert
} from '@material-tailwind/react';
import {
  PencilIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useLeafletMap } from './hooks/useLeafletMap';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { clienteService } from './services/servi';
import { formatCliente } from './utils/formatters';
import { ESTADO_OPTIONS } from './types/clienteTypes';

const ClienteDetail = ({ cliente, onClose, onEdit }) => {
  const [clienteData, setClienteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  
  const mapContainerRef = useRef(null);
  const {
    isLoaded,
    initializeMap,
    createMarker,
    clearMarkers,
    centerMap
  } = useLeafletMap();

  // Función de formateo segura local
  const formatClienteSafe = (clienteRaw) => {
    try {
      // Si formatCliente existe y funciona, úsala
      if (typeof formatCliente === 'function') {
        return formatCliente(clienteRaw);
      }
    } catch (error) {
      console.warn('Error en formatCliente, usando formateo básico:', error);
    }
    
    // Formateo básico como fallback
    return {
      id: clienteRaw.id || '',
      nombre_completo: clienteRaw.nombre_completo || clienteRaw.nombre || 'Sin nombre',
      email: clienteRaw.email || '',
      telefono: clienteRaw.telefono || '',
      ci: clienteRaw.ci || '',
      estado: clienteRaw.estado || 'pendiente',
      estado_display: clienteRaw.estado_display || clienteRaw.estado || 'Pendiente',
      tipo_servicio_nombre: clienteRaw.tipo_servicio_nombre || clienteRaw.servicio || '',
      tipo_vivienda_label: clienteRaw.tipo_vivienda_label || clienteRaw.tipo_vivienda || '',
      piso: clienteRaw.piso || '',
      zona: clienteRaw.zona || '',
      calle: clienteRaw.calle || '',
      direccion_completa: clienteRaw.direccion_completa || clienteRaw.direccion || '',
      latitud: clienteRaw.latitud || clienteRaw.lat || '',
      longitud: clienteRaw.longitud || clienteRaw.lng || clienteRaw.lon || '',
      fecha_solicitud: clienteRaw.fecha_solicitud || clienteRaw.created_at || '',
      fecha_actualizacion: clienteRaw.fecha_actualizacion || clienteRaw.updated_at || '',
      fecha_activacion: clienteRaw.fecha_activacion || '',
      observaciones: clienteRaw.observaciones || ''
    };
  };

  // Debug: Log del cliente recibido
  useEffect(() => {
    console.log('Cliente recibido en props:', cliente);
    
    if (cliente) {
      try {
        const formatted = formatClienteSafe(cliente);
        console.log('Cliente formateado:', formatted);
        setClienteData(formatted);
        setError(null); // Limpiar error si todo salió bien
      } catch (error) {
        console.error('Error al formatear cliente:', error);
        setError(`Error al procesar datos: ${error.message}`);
        // Usar datos básicos como último recurso
        setClienteData({
          id: cliente.id || 'N/A',
          nombre_completo: cliente.nombre_completo || cliente.nombre || 'Cliente sin nombre',
          email: cliente.email || 'No disponible',
          telefono: cliente.telefono || 'No disponible',
          estado: cliente.estado || 'pendiente'
        });
      }
    } else {
      console.warn('No se recibió cliente en props');
      setError('No se recibieron datos del cliente');
    }
  }, [cliente]);

  // Inicializar mapa cuando el componente se monta
  useEffect(() => {
    if (isLoaded && mapContainerRef.current && clienteData) {
      // Configurar el mapa con la ubicación del cliente
      const map = initializeMap(mapContainerRef.current, {
        center: clienteData?.latitud && clienteData?.longitud 
          ? [parseFloat(clienteData.latitud), parseFloat(clienteData.longitud)]
          : [-16.5000, -68.1193],
        zoom: 15
      });

      // Agregar marcador si hay ubicación
      if (clienteData?.latitud && clienteData?.longitud) {
        const position = {
          lat: parseFloat(clienteData.latitud),
          lng: parseFloat(clienteData.longitud)
        };
        
        createMarker(position, {
          title: clienteData.nombre_completo || 'Ubicación del cliente'
        });
        
        // Centrar el mapa en la ubicación
        centerMap(position.lat, position.lng, 16);
      }

      // Asegurarse de que los iconos de Leaflet se carguen correctamente
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });

      // Limpieza al desmontar
      return () => {
        if (map) {
          map.remove();
        }
      };
    }
  }, [isLoaded, clienteData, initializeMap, createMarker, centerMap]);

  const handleEstadoChange = async (nuevoEstado) => {
    if (!clienteData?.id) {
      setError('No se puede cambiar el estado: ID de cliente no disponible');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const updatedCliente = await clienteService.cambiarEstado(
        clienteData.id, 
        nuevoEstado, 
        observaciones
      );
      
      const formatted = formatClienteSafe(updatedCliente);
      setClienteData(formatted);
      setSuccess(`Estado cambiado a ${nuevoEstado} exitosamente`);
      setObservaciones('');
      
      // Reinicializar el mapa con el nuevo estado
      if (isLoaded) {
        setTimeout(() => {
          clearMarkers();
          const position = {
            lat: parseFloat(clienteData.latitud),
            lng: parseFloat(clienteData.longitud)
          };
          createMarker(position, {
            title: clienteData.nombre_completo || 'Ubicación del cliente'
          });
          centerMap(position.lat, position.lng, 16);
        }, 100);
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      setError(err.message || 'Error al cambiar el estado');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estado) => {
    const colors = {
      pendiente: 'orange',
      activo: 'green',
      rechazado: 'red'
    };
    return colors[estado] || 'gray';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  };

  // Mostrar loading si no hay datos
  if (!clienteData) {
    return (
      <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardBody className="flex items-center justify-center py-8">
            <Typography>Cargando datos del cliente...</Typography>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-start justify-center p-4">
      <div className="relative w-full max-w-4xl my-8">
        <Card className="w-full">
          <CardHeader floated={false} shadow={false} className="rounded-none">
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="h4" color="blue-gray">
              {clienteData.nombre_completo || 'Cliente sin nombre'}
            </Typography>
            <div className="flex items-center gap-2 mt-2">
              <Chip
                size="sm"
                value={clienteData.estado_display || clienteData.estado || 'Sin estado'}
                color={getStatusColor(clienteData.estado)}
              />
              <Typography variant="small" color="gray">
                ID: {clienteData.id || 'No disponible'}
              </Typography>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outlined"
              className="flex items-center gap-2"
              onClick={onEdit}
            >
              <PencilIcon className="h-4 w-4" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outlined"
              onClick={onClose}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
        {error && (
          <Alert color="red" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert color="green" dismissible onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Información Personal */}
        <div>
          <Typography variant="h6" color="blue-gray" className="mb-3">
            Información Personal
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-500" />
              <div>
                <Typography variant="small" color="gray">Email</Typography>
                <Typography variant="small" className="font-medium">
                  {clienteData.email || 'No disponible'}
                </Typography>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <PhoneIcon className="h-5 w-5 text-gray-500" />
              <div>
                <Typography variant="small" color="gray">Teléfono</Typography>
                <Typography variant="small" className="font-medium">
                  {clienteData.telefono || 'No disponible'}
                </Typography>
              </div>
            </div>

            <div>
              <Typography variant="small" color="gray">CI</Typography>
              <Typography variant="small" className="font-medium">
                {clienteData.ci || 'No disponible'}
              </Typography>
            </div>

            <div>
              <Typography variant="small" color="gray">Servicio</Typography>
              <Typography variant="small" className="font-medium">
                {clienteData.tipo_servicio_nombre || 'No especificado'}
              </Typography>
            </div>
          </div>
        </div>

        {/* Información de Vivienda */}
        <div>
          <Typography variant="h6" color="blue-gray" className="mb-3">
            Información de Vivienda
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <HomeIcon className="h-5 w-5 text-gray-500" />
              <div>
                <Typography variant="small" color="gray">Tipo</Typography>
                <Typography variant="small" className="font-medium">
                  {clienteData.tipo_vivienda_label || 'No especificado'}
                </Typography>
              </div>
            </div>

            {clienteData.piso && (
              <div>
                <Typography variant="small" color="gray">Piso</Typography>
                <Typography variant="small" className="font-medium">
                  {clienteData.piso}
                </Typography>
              </div>
            )}

            <div>
              <Typography variant="small" color="gray">Zona</Typography>
              <Typography variant="small" className="font-medium">
                {clienteData.zona || 'No disponible'}
              </Typography>
            </div>

            <div>
              <Typography variant="small" color="gray">Calle</Typography>
              <Typography variant="small" className="font-medium">
                {clienteData.calle || 'No disponible'}
              </Typography>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-start gap-3">
              <MapPinIcon className="h-5 w-5 text-gray-500 mt-1" />
              <div className="flex-1">
                <Typography variant="small" color="gray">Dirección Completa</Typography>
                <Typography variant="small" className="font-medium">
                  {clienteData.direccion_completa || 'No disponible'}
                </Typography>
                {(clienteData.latitud && clienteData.longitud) && (
                  <Typography variant="small" color="gray" className="mt-1">
                    Coordenadas: {clienteData.latitud}, {clienteData.longitud}
                  </Typography>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mapa de Ubicación */}
        {(clienteData.latitud && clienteData.longitud) && (
          <div>
            <Typography variant="h6" color="blue-gray" className="mb-3">
              Ubicación en el Mapa
            </Typography>
            <div className="w-full h-64 border rounded-lg overflow-hidden">
              {isLoaded ? (
                <div ref={mapContainerRef} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Typography>Cargando mapa...</Typography>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Información de Fechas */}
        <div>
          <Typography variant="h6" color="blue-gray" className="mb-3">
            Información de Fechas
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <div>
                <Typography variant="small" color="gray">Fecha de Solicitud</Typography>
                <Typography variant="small" className="font-medium">
                  {formatDate(clienteData.fecha_solicitud)}
                </Typography>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <div>
                <Typography variant="small" color="gray">Última Actualización</Typography>
                <Typography variant="small" className="font-medium">
                  {formatDate(clienteData.fecha_actualizacion)}
                </Typography>
              </div>
            </div>

            {clienteData.fecha_activacion && (
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-green-500" />
                <div>
                  <Typography variant="small" color="gray">Fecha de Activación</Typography>
                  <Typography variant="small" className="font-medium">
                    {formatDate(clienteData.fecha_activacion)}
                  </Typography>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cambio de Estado */}
        <div>
          <Typography variant="h6" color="blue-gray" className="mb-3">
            Gestión de Estado
          </Typography>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Typography variant="small" color="gray" className="mb-2">
                  Cambiar Estado
                </Typography>
                <Select
                  value={clienteData.estado}
                  onChange={handleEstadoChange}
                  disabled={loading}
                >
                  {ESTADO_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <Typography variant="small" color="gray" className="mb-2">
                  Observaciones (opcional)
                </Typography>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Agregar observaciones sobre el cambio de estado..."
                  rows={3}
                />
              </div>
            </div>

            {clienteData.observaciones && (
              <div>
                <Typography variant="small" color="gray" className="mb-2">
                  Observaciones Actuales
                </Typography>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <Typography variant="small">
                    {clienteData.observaciones}
                  </Typography>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Debug info - remover en producción */}
       
      </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ClienteDetail;