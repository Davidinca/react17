import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Button,
  Select,
  Option,
  Input,
  Alert,
  IconButton,
  Chip
} from '@material-tailwind/react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useGoogleMaps } from './hooks/useGoogleMaps';
import { clienteService } from './services/apiService';
import { formatCliente } from './utils/formatters';
import { ESTADO_OPTIONS } from './types/clienteTypes';

const MapaGeneral = ({ onEdit, onView, refreshTrigger }) => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    estado: '',
    zona: ''
  });

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null); // <-- NUEVO
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);

  const {
    isLoaded,
    initializeMap,
    createMarker,
    clearMarkers,
    fitBounds,
    createInfoWindow
  } = useGoogleMaps();

  useEffect(() => {
    loadClientes();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [clientes, filters]);

  useEffect(() => {
    if (isLoaded && filteredClientes.length > 0) {
      initializeMapWithClientes();
    }
  }, [isLoaded, filteredClientes]);

  const loadClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clienteService.getAll();
      const formattedClientes = data.map(formatCliente);
      setClientes(formattedClientes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clientes];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(cliente =>
        cliente.nombre.toLowerCase().includes(searchLower) ||
        cliente.apellido.toLowerCase().includes(searchLower) ||
        cliente.zona.toLowerCase().includes(searchLower) ||
        cliente.calle.toLowerCase().includes(searchLower)
      );
    }

    if (filters.estado) {
      filtered = filtered.filter(cliente => cliente.estado === filters.estado);
    }

    if (filters.zona) {
      filtered = filtered.filter(cliente =>
        cliente.zona.toLowerCase().includes(filters.zona.toLowerCase())
      );
    }

    setFilteredClientes(filtered);
  };

  const initializeMapWithClientes = () => {
    if (!mapContainerRef.current) return;

    clearMarkers();
    markersRef.current = [];
    infoWindowsRef.current.forEach(infoWindow => infoWindow.close());
    infoWindowsRef.current = [];

    const map = initializeMap(mapContainerRef.current);
    mapRef.current = map; // <-- Guardamos el mapa

    if (filteredClientes.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();

    filteredClientes.forEach(cliente => {
      if (cliente.latitud && cliente.longitud) {
        const position = {
          lat: parseFloat(cliente.latitud),
          lng: parseFloat(cliente.longitud)
        };

        const marker = createMarker(position, {
          title: cliente.nombre_completo,
          icon: getMarkerIcon(cliente.estado)
        });

        const infoWindowContent = createInfoWindowContent(cliente);
        const infoWindow = createInfoWindow(infoWindowContent, marker);

        marker.addListener('click', () => {
          infoWindowsRef.current.forEach(iw => iw.close());
          infoWindow.open(map, marker);
        });

        markersRef.current.push(marker);
        infoWindowsRef.current.push(infoWindow);
        bounds.extend(position);
      }
    });

    if (filteredClientes.length > 1) {
      fitBounds(bounds);
    } else if (filteredClientes.length === 1) {
      map.setCenter({
        lat: parseFloat(filteredClientes[0].latitud),
        lng: parseFloat(filteredClientes[0].longitud)
      });
      map.setZoom(16);
    }
  };

  // NUEVO: Forzar resize cuando el mapa esté visible
  useEffect(() => {
    if (isLoaded && mapRef.current) {
      window.google.maps.event.trigger(mapRef.current, 'resize');

      // Re-centrar el mapa después del resize
      if (filteredClientes.length === 1) {
        mapRef.current.setCenter({
          lat: parseFloat(filteredClientes[0].latitud),
          lng: parseFloat(filteredClientes[0].longitud)
        });
        mapRef.current.setZoom(16);
      } else if (filteredClientes.length > 1) {
        const bounds = new window.google.maps.LatLngBounds();
        filteredClientes.forEach(cliente => {
          if (cliente.latitud && cliente.longitud) {
            bounds.extend({
              lat: parseFloat(cliente.latitud),
              lng: parseFloat(cliente.longitud)
            });
          }
        });
        mapRef.current.fitBounds(bounds);
      }
    }
  }, [isLoaded, filteredClientes.length]);

  const createInfoWindowContent = (cliente) => {
    const estadoColor = getStatusBadgeClass(cliente.estado);
    return `
      <div class="p-3 max-w-sm">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-bold text-lg">${cliente.nombre_completo}</h3>
          <span class="px-2 py-1 rounded text-xs ${estadoColor}">
            ${cliente.estado_display}
          </span>
        </div>
        <div class="space-y-2 text-sm">
          <p><strong>Email:</strong> ${cliente.email}</p>
          <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
          <p><strong>Tipo:</strong> ${cliente.tipo_vivienda_label}</p>
          ${cliente.piso ? `<p><strong>Piso:</strong> ${cliente.piso}</p>` : ''}
          <p><strong>Zona:</strong> ${cliente.zona}</p>
          <p><strong>Dirección:</strong> ${cliente.direccion_completa}</p>
        </div>
        <div class="flex gap-2 mt-3">
          <button 
            onclick="window.viewCliente(${cliente.id})" 
            class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            Ver
          </button>
          <button 
            onclick="window.editCliente(${cliente.id})" 
            class="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
          >
            Editar
          </button>
        </div>
      </div>
    `;
  };

  useEffect(() => {
    window.viewCliente = (clienteId) => {
      const cliente = clientes.find(c => c.id === clienteId);
      if (cliente) onView(cliente);
    };

    window.editCliente = (clienteId) => {
      const cliente = clientes.find(c => c.id === clienteId);
      if (cliente) onEdit(cliente);
    };

    return () => {
      delete window.viewCliente;
      delete window.editCliente;
    };
  }, [clientes, onView, onEdit]);

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
      scale: 8,
      strokeColor: '#ffffff',
      strokeWeight: 2
    };
  };

  const getStatusBadgeClass = (estado) => {
    const classes = {
      pendiente: 'bg-orange-100 text-orange-800',
      activo: 'bg-green-100 text-green-800',
      rechazado: 'bg-red-100 text-red-800'
    };
    return classes[estado] || 'bg-gray-100 text-gray-800';
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      estado: '',
      zona: ''
    });
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="flex justify-center items-center h-96">
            <Typography>Cargando mapa...</Typography>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="flex items-center justify-between">
            <Typography variant="h4" color="blue-gray">
              Mapa General de Clientes
            </Typography>
            <Typography variant="small" color="gray">
              {filteredClientes.length} de {clientes.length} clientes
            </Typography>
          </div>
        </CardHeader>

        <CardBody>
          {error && (
            <Alert color="red" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Filtros */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  label="Buscar"
                  icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Buscar por nombre o ubicación..."
                />
              </div>
              <Button
                variant="outlined"
                size="sm"
                className="flex items-center gap-2"
                onClick={clearFilters}
              >
                <FunnelIcon className="h-4 w-4" />
                Limpiar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Estado"
                value={filters.estado}
                onChange={(value) => handleFilterChange('estado', value)}
              >
                <Option value="">Todos los estados</Option>
                {ESTADO_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>

              <Input
                label="Zona"
                value={filters.zona}
                onChange={(e) => handleFilterChange('zona', e.target.value)}
                placeholder="Filtrar por zona"
              />
            </div>
          </div>

          {/* Mapa */}
          <div className="w-full h-96 border rounded-lg overflow-hidden mb-4">
            {isLoaded ? (
              <div ref={mapContainerRef} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Typography>Cargando Google Maps...</Typography>
              </div>
            )}
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-6 text-sm">
            <Typography variant="small" color="gray" className="font-medium">
              Leyenda:
            </Typography>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <Typography variant="small">Pendiente</Typography>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <Typography variant="small">Activo</Typography>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <Typography variant="small">Rechazado</Typography>
            </div>
          </div>

          {/* Lista lateral */}
          {filteredClientes.length > 0 && (
            <div className="mt-6">
              <Typography variant="h6" color="blue-gray" className="mb-4">
                Clientes en el Mapa ({filteredClientes.length})
              </Typography>
              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {filteredClientes.map((cliente) => (
                  <div key={cliente.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getMarkerIcon(cliente.estado).fillColor }}
                      ></div>
                      <div>
                        <Typography variant="small" className="font-medium">
                          {cliente.nombre_completo}
                        </Typography>
                        <Typography variant="small" color="gray">
                          {cliente.zona} - {cliente.calle}
                        </Typography>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Chip
                        size="sm"
                        value={cliente.estado_display}
                        color={cliente.estado_badge?.color || 'gray'}
                      />
                      <IconButton
                        size="sm"
                        variant="text"
                        onClick={() => onView(cliente)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        size="sm"
                        variant="text"
                        onClick={() => onEdit(cliente)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default MapaGeneral;