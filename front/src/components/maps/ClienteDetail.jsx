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
import { useGoogleMaps } from './hooks/useGoogleMaps';
import { clienteService } from './services/apiService';
import { formatCliente } from './utils/formatters';
import { ESTADO_OPTIONS } from './types/clienteTypes';

const ClienteDetail = ({ cliente, onClose, onEdit }) => {
  const [clienteData, setClienteData] = useState(formatCliente(cliente));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  
  const mapContainerRef = useRef(null);
  const {
    isLoaded,
    initializeMap,
    createMarker,
    createInfoWindow
  } = useGoogleMaps();

  useEffect(() => {
    if (isLoaded && mapContainerRef.current && clienteData.latitud && clienteData.longitud) {
      initializeClienteMap();
    }
  }, [isLoaded, clienteData]);

  const initializeClienteMap = () => {
    const position = {
      lat: parseFloat(clienteData.latitud),
      lng: parseFloat(clienteData.longitud)
    };

    const map = initializeMap(mapContainerRef.current, {
      center: position,
      zoom: 16
    });

    const marker = createMarker(position, {
      title: clienteData.nombre_completo,
      icon: getMarkerIcon(clienteData.estado)
    });

    const infoWindowContent = `
      <div class="p-3 max-w-xs">
        <h3 class="font-bold text-lg mb-2">${clienteData.nombre_completo}</h3>
        <div class="space-y-1 text-sm">
          <p><strong>Email:</strong> ${clienteData.email}</p>
          <p><strong>Teléfono:</strong> ${clienteData.telefono}</p>
          <p><strong>Tipo:</strong> ${clienteData.tipo_vivienda_label}</p>
          ${clienteData.piso ? `<p><strong>Piso:</strong> ${clienteData.piso}</p>` : ''}
          <p><strong>Dirección:</strong> ${clienteData.direccion_completa}</p>
        </div>
      </div>
    `;

    createInfoWindow(infoWindowContent, marker);
  };

  const getMarkerIcon = (estado) => {
    const colors = {
      pendiente: '#ff9800',
      activo: '#4caf50',
      rechazado: '#f44336'
    };

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: colors[estado] || '#9e9e9e',
      fillOpacity: 0.8,
      scale: 10,
      strokeColor: '#ffffff',
      strokeWeight: 2
    };
  };

  const handleEstadoChange = async (nuevoEstado) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedCliente = await clienteService.cambiarEstado(
        clienteData.id, 
        nuevoEstado, 
        observaciones
      );
      
      setClienteData(formatCliente(updatedCliente));
      setSuccess(`Estado cambiado a ${nuevoEstado} exitosamente`);
      setObservaciones('');
      
      // Reinicializar el mapa con el nuevo estado
      if (isLoaded) {
        setTimeout(initializeClienteMap, 100);
      }
    } catch (err) {
      setError(err.message);
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
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader floated={false} shadow={false} className="rounded-none">
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="h4" color="blue-gray">
              {clienteData.nombre_completo}
            </Typography>
            <div className="flex items-center gap-2 mt-2">
              <Chip
                size="sm"
                value={clienteData.estado_display}
                color={getStatusColor(clienteData.estado)}
              />
              <Typography variant="small" color="gray">
                ID: {clienteData.id}
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
                  {clienteData.email}
                </Typography>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <PhoneIcon className="h-5 w-5 text-gray-500" />
              <div>
                <Typography variant="small" color="gray">Teléfono</Typography>
                <Typography variant="small" className="font-medium">
                  {clienteData.telefono}
                </Typography>
              </div>
            </div>

            <div>
              <Typography variant="small" color="gray">CI</Typography>
              <Typography variant="small" className="font-medium">
                {clienteData.ci}
              </Typography>
            </div>

            <div>
              <Typography variant="small" color="gray">Servicio</Typography>
              <Typography variant="small" className="font-medium">
                {clienteData.tipo_servicio_nombre}
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
                  {clienteData.tipo_vivienda_label}
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
                {clienteData.zona}
              </Typography>
            </div>

            <div>
              <Typography variant="small" color="gray">Calle</Typography>
              <Typography variant="small" className="font-medium">
                {clienteData.calle}
              </Typography>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-start gap-3">
              <MapPinIcon className="h-5 w-5 text-gray-500 mt-1" />
              <div className="flex-1">
                <Typography variant="small" color="gray">Dirección Completa</Typography>
                <Typography variant="small" className="font-medium">
                  {clienteData.direccion_completa}
                </Typography>
                <Typography variant="small" color="gray" className="mt-1">
                  Coordenadas: {clienteData.latitud}, {clienteData.longitud}
                </Typography>
              </div>
            </div>
          </div>
        </div>

        {/* Mapa de Ubicación */}
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
      </CardBody>
    </Card>
  );
};

export default ClienteDetail;