// src/components/maps/ClienteList.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Button,
  Input,
  Select,
  Option,
  Chip,
  IconButton,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Alert,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel
} from '@material-tailwind/react';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MapPinIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useGoogleMaps } from './hooks/useGoogleMaps';
import { clienteService } from './services/apiService';
import { formatCliente } from './utils/formatters';
import { ESTADO_OPTIONS } from './types/clienteTypes';

const ClienteList = ({ onEdit, onView, onDelete, refreshTrigger }) => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    estado: '',
    zona: '',
    tipo_vivienda: ''
  });

  const mapContainerRef = useRef(null);
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
  }, [clientes, filters, activeTab]);

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

    // Filtro por tab activo
    if (activeTab !== 'todos') {
      filtered = filtered.filter(cliente => cliente.estado === activeTab);
    }

    // Filtro por búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(cliente =>
  (cliente.nombre || '').toLowerCase().includes(searchLower) ||
  (cliente.apellido || '').toLowerCase().includes(searchLower) ||
  (cliente.email || '').toLowerCase().includes(searchLower) ||
  (cliente.ci || '').toLowerCase().includes(searchLower) ||
  (cliente.telefono || '').toLowerCase().includes(searchLower) ||
  (cliente.zona || '').toLowerCase().includes(searchLower) ||
  (cliente.calle || '').toLowerCase().includes(searchLower)
);

    }

    // Filtros adicionales
    if (filters.estado) {
      filtered = filtered.filter(cliente => cliente.estado === filters.estado);
    }

    if (filters.zona) {
      filtered = filtered.filter(cliente => 
        cliente.zona.toLowerCase().includes(filters.zona.toLowerCase())
      );
    }

    if (filters.tipo_vivienda) {
      filtered = filtered.filter(cliente => cliente.tipo_vivienda === filters.tipo_vivienda);
    }

    setFilteredClientes(filtered);
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
      zona: '',
      tipo_vivienda: ''
    });
  };

  const showClienteOnMap = (cliente) => {
    setSelectedCliente(cliente);
    setShowMap(true);
  };

  const initializeMapWithClientes = () => {
    if (!isLoaded || !mapContainerRef.current) return;

    const map = initializeMap(mapContainerRef.current);
    clearMarkers();

    const clientesToShow = selectedCliente ? [selectedCliente] : filteredClientes;
    
    if (clientesToShow.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();

    clientesToShow.forEach(cliente => {
      if (cliente.latitud && cliente.longitud) {
        const position = {
          lat: parseFloat(cliente.latitud),
          lng: parseFloat(cliente.longitud)
        };

        const marker = createMarker(position, {
          title: cliente.nombre_completo,
          icon: getMarkerIcon(cliente.estado)
        });

        const infoWindowContent = `
          <div class="p-2">
            <h3 class="font-bold">${cliente.nombre_completo}</h3>
            <p><strong>Email:</strong> ${cliente.email}</p>
            <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
            <p><strong>Dirección:</strong> ${cliente.direccion_completa}</p>
            <p><strong>Estado:</strong> 
              <span class="px-2 py-1 rounded text-xs ${getStatusColor(cliente.estado)}">
                ${cliente.estado_display}
              </span>
            </p>
          </div>
        `;

        createInfoWindow(infoWindowContent, marker);
        bounds.extend(position);
      }
    });

    if (clientesToShow.length > 1) {
      fitBounds(bounds);
    } else if (clientesToShow.length === 1) {
      map.setCenter({
        lat: parseFloat(clientesToShow[0].latitud),
        lng: parseFloat(clientesToShow[0].longitud)
      });
      map.setZoom(16);
    }
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
      scale: 8,
      strokeColor: '#ffffff',
      strokeWeight: 2
    };
  };

  const getStatusColor = (estado) => {
    const colors = {
      pendiente: 'bg-orange-100 text-orange-800',
      activo: 'bg-green-100 text-green-800',
      rechazado: 'bg-red-100 text-red-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const handleEstadoChange = async (clienteId, nuevoEstado) => {
    try {
      await clienteService.cambiarEstado(clienteId, nuevoEstado);
      loadClientes(); // Recargar lista
    } catch (err) {
      setError(err.message);
    }
  };

  const tabsData = [
    { label: 'Todos', value: 'todos', count: clientes.length },
    { label: 'Pendientes', value: 'pendiente', count: clientes.filter(c => c.estado === 'pendiente').length },
    { label: 'Activos', value: 'activo', count: clientes.filter(c => c.estado === 'activo').length },
    { label: 'Rechazados', value: 'rechazado', count: clientes.filter(c => c.estado === 'rechazado').length }
  ];

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="flex justify-center items-center h-64">
            <Typography>Cargando clientes...</Typography>
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
              Lista de Clientes
            </Typography>
            <Button
              size="sm"
              variant="outlined"
              className="flex items-center gap-2"
              onClick={() => setShowMap(true)}
            >
              <MapPinIcon className="h-4 w-4" />
              Ver en Mapa
            </Button>
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
                  placeholder="Buscar por nombre, email, CI, teléfono..."
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <Select
                label="Tipo de Vivienda"
                value={filters.tipo_vivienda}
                onChange={(value) => handleFilterChange('tipo_vivienda', value)}
              >
                <Option value="">Todos los tipos</Option>
                <Option value="vivienda">Vivienda</Option>
                <Option value="departamento">Departamento</Option>
              </Select>
            </div>
          </div>

          {/* Tabs por estado */}
          <Tabs value={activeTab} onChange={setActiveTab} className="mb-6">
            <TabsHeader>
              {tabsData.map(({ label, value, count }) => (
                <Tab key={value} value={value}>
                  {label} ({count})
                </Tab>
              ))}
            </TabsHeader>
          </Tabs>

          {/* Lista de clientes */}
          {filteredClientes.length === 0 ? (
            <div className="text-center py-8">
              <Typography color="gray">
                No se encontraron clientes con los filtros aplicados
              </Typography>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredClientes.map((cliente) => (
                <Card key={cliente.id} className="border">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Typography variant="h6" color="blue-gray">
                            {cliente.nombre_completo}
                          </Typography>
                          <Chip
                            size="sm"
                            value={cliente.estado_display}
                            color={cliente.estado_badge?.color || 'gray'}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                          <div>
                            <Typography variant="small" color="gray">Email:</Typography>
                            <Typography variant="small">{cliente.email}</Typography>
                          </div>
                          <div>
                            <Typography variant="small" color="gray">Teléfono:</Typography>
                            <Typography variant="small">{cliente.telefono}</Typography>
                          </div>
                          <div>
                            <Typography variant="small" color="gray">CI:</Typography>
                            <Typography variant="small">{cliente.ci}</Typography>
                          </div>
                          <div>
                            <Typography variant="small" color="gray">Tipo:</Typography>
                            <Typography variant="small">{cliente.tipo_vivienda_label}</Typography>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <Typography variant="small" color="gray">Dirección:</Typography>
                          <Typography variant="small">{cliente.direccion_completa}</Typography>
                        </div>
                        
                        <div className="mt-2">
                          <Typography variant="small" color="gray">
                            Fecha solicitud: {cliente.fecha_solicitud_formatted}
                          </Typography>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <IconButton
                          size="sm"
                          variant="text"
                          onClick={() => onView(cliente)}
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </IconButton>
                        
                        <IconButton
                          size="sm"
                          variant="text"
                          onClick={() => showClienteOnMap(cliente)}
                          title="Ver en mapa"
                        >
                          <MapPinIcon className="h-4 w-4" />
                        </IconButton>
                        
                        <IconButton
                          size="sm"
                          variant="text"
                          onClick={() => onEdit(cliente)}
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </IconButton>
                        
                        <IconButton
                          size="sm"
                          variant="text"
                          color="red"
                          onClick={() => onDelete(cliente)}
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </IconButton>

                        {/* Cambio rápido de estado */}
                        <Select
                          size="sm"
                          value={cliente.estado}
                          onChange={(value) => handleEstadoChange(cliente.id, value)}
                          className="min-w-[120px]"
                        >
                          {ESTADO_OPTIONS.map(option => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Dialog del Mapa */}
      <Dialog
        size="xl"
        open={showMap}
        handler={() => setShowMap(false)}
        className="max-w-6xl"
      >
        <DialogHeader>
          <Typography variant="h5">
            {selectedCliente ? `Ubicación de ${selectedCliente.nombre_completo}` : 'Ubicaciones de Clientes'}
          </Typography>
        </DialogHeader>
        
        <DialogBody className="p-0">
          <div className="h-96 w-full">
            {isLoaded ? (
              <div 
                ref={mapContainerRef} 
                className="w-full h-full"
                onLoad={initializeMapWithClientes}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Typography>Cargando mapa...</Typography>
              </div>
            )}
          </div>
        </DialogBody>
        
        <DialogFooter>
          <Button
            variant="outlined"
            onClick={() => {
              setShowMap(false);
              setSelectedCliente(null);
            }}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default ClienteList;