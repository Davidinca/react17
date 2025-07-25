// src/components/maps/ClienteList.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  TabPanel,
  Spinner
} from '@material-tailwind/react';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MapPinIcon,
  FunnelIcon,
  ExclamationTriangleIcon
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
  const [mapReady, setMapReady] = useState(false);
  const [debug, setDebug] = useState(false); // Para mostrar info de debug

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    estado: '',
    zona: '',
    tipo_vivienda: ''
  });

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  const {
    isLoaded,
    initializeMap,
    createMarker,
    clearMarkers,
    fitBounds,
    createInfoWindow
  } = useGoogleMaps();

useEffect(() => {
  if (showMap && isLoaded && mapContainerRef.current) {
    // Pequeño delay para asegurar que el modal esté montado
    const timer = setTimeout(() => {
      console.log('Inicializando mapa en el contenedor...');
      const map = initializeMap(mapContainerRef.current, {
        center: {
          lat: selectedCliente?.latitud || -17.78629,
          lng: selectedCliente?.longitud || -63.18117
        },
        zoom: 14
      });

      mapInstanceRef.current = map;
      setMapReady(true);
    }, 100); // Delay de 100ms

    return () => clearTimeout(timer);
  }
}, [showMap, isLoaded, selectedCliente]);

useEffect(() => {
  if (mapReady && selectedCliente && selectedCliente.latitud && selectedCliente.longitud) {
    console.log('Actualizando marcador para cliente:', selectedCliente.nombre_completo);
    clearMarkers();

    const marker = createMarker({
      position: { lat: selectedCliente.latitud, lng: selectedCliente.longitud },
      map: mapInstanceRef.current,
      title: selectedCliente.nombre_completo
    });

    const infoWindow = createInfoWindow({
      content: `<div><strong>${selectedCliente.nombre_completo}</strong><br>${selectedCliente.direccion_completa}</div>`
    });

    infoWindow.open(mapInstanceRef.current, marker);

    // Ajustar el centro del mapa al nuevo cliente
    mapInstanceRef.current.setCenter({
      lat: selectedCliente.latitud,
      lng: selectedCliente.longitud
    });

  }
}, [selectedCliente, mapReady]);



  useEffect(() => {
    console.log('ClienteList montado, cargando clientes...');
    loadClientes();
  }, [refreshTrigger]);

  useEffect(() => {
    console.log('Aplicando filtros...', { clientes: clientes.length, filters, activeTab });
    applyFilters();
  }, [clientes, filters, activeTab]);

  // Debug: mostrar cuando cambian los clientes
  useEffect(() => {
    console.log('Clientes actualizados:', clientes);
  }, [clientes]);

  const loadClientes = async () => {
    console.log('Iniciando carga de clientes...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('Llamando a clienteService.getAll()...');
      const data = await clienteService.getAll();
      console.log('Datos recibidos:', data);
      
      if (!data) {
        throw new Error('No se recibieron datos del servidor');
      }

      if (!Array.isArray(data)) {
        console.error('Los datos recibidos no son un array:', typeof data, data);
        throw new Error('Formato de datos inválido recibido del servidor');
      }

      console.log(`Recibidos ${data.length} clientes del servidor`);
      
      const formattedClientes = data.map((cliente, index) => {
        try {
          return formatCliente(cliente);
        } catch (formatError) {
          console.error(`Error formateando cliente ${index}:`, formatError, cliente);
          // Retornar cliente sin formatear como fallback
          return {
            ...cliente,
            id: cliente.id || index,
            nombre_completo: `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || 'Sin nombre',
            estado_display: cliente.estado || 'pendiente',
            direccion_completa: `${cliente.calle || ''}, ${cliente.zona || ''}`.trim() || 'Sin dirección'
          };
        }
      });
      
      console.log('Clientes formateados:', formattedClientes);
      setClientes(formattedClientes);
      
    } catch (err) {
      console.error('Error cargando clientes:', err);
      setError(`Error al cargar clientes: ${err.message}`);
      // En caso de error, asegurar que clientes sea un array vacío
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!Array.isArray(clientes)) {
      console.error('clientes no es un array:', clientes);
      setFilteredClientes([]);
      return;
    }

    let filtered = [...clientes];
    console.log('Clientes antes de filtrar:', filtered.length);

    // Filtro por tab activo
    if (activeTab !== 'todos') {
      filtered = filtered.filter(cliente => cliente.estado === activeTab);
      console.log(`Después de filtro por tab '${activeTab}':`, filtered.length);
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
      console.log(`Después de filtro de búsqueda '${filters.search}':`, filtered.length);
    }

    // Filtros adicionales
    if (filters.estado) {
      filtered = filtered.filter(cliente => cliente.estado === filters.estado);
      console.log(`Después de filtro por estado '${filters.estado}':`, filtered.length);
    }

    if (filters.zona) {
      filtered = filtered.filter(cliente => 
        (cliente.zona || '').toLowerCase().includes(filters.zona.toLowerCase())
      );
      console.log(`Después de filtro por zona '${filters.zona}':`, filtered.length);
    }

    if (filters.tipo_vivienda) {
      filtered = filtered.filter(cliente => cliente.tipo_vivienda === filters.tipo_vivienda);
      console.log(`Después de filtro por tipo_vivienda '${filters.tipo_vivienda}':`, filtered.length);
    }

    console.log('Clientes finales después de filtros:', filtered.length);
    setFilteredClientes(filtered);
  };

  const handleFilterChange = (name, value) => {
    console.log(`Cambiando filtro ${name} a:`, value);
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    console.log('Limpiando filtros');
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
  setMapReady(false);
  mapInstanceRef.current = null; // Resetear mapa
};


  const handleEstadoChange = async (clienteId, nuevoEstado) => {
    try {
      console.log(`Cambiando estado del cliente ${clienteId} a ${nuevoEstado}`);
      await clienteService.cambiarEstado(clienteId, nuevoEstado);
      loadClientes(); // Recargar lista
    } catch (err) {
      console.error('Error cambiando estado:', err);
      setError(`Error al cambiar estado: ${err.message}`);
    }
  };

  const handleCloseMap = () => {
    setShowMap(false);
    setSelectedCliente(null);
    setMapReady(false);
    if (mapInstanceRef.current) {
      clearMarkers();
      mapInstanceRef.current = null;
    }
  };

  // Calcular estadísticas para los tabs
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
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <Spinner className="h-8 w-8" />
            <Typography>Cargando clientes...</Typography>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
    <Dialog
  size="xl"
  open={showMap}
  handler={handleCloseMap}
  className="max-w-6xl"
>
  <DialogHeader>
    <Typography variant="h5">
      {selectedCliente ? `Ubicación de ${selectedCliente.nombre_completo}` : 'Ubicaciones de Clientes'}
    </Typography>
  </DialogHeader>
  
  <DialogBody className="p-0">
    <div className="h-96 w-full relative">
      {!isLoaded ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <Typography>Cargando Google Maps...</Typography>
        </div>
      ) : (
        <>
          <div 
            ref={mapContainerRef} 
            className="w-full h-full"
          />
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
              <Typography>Inicializando mapa...</Typography>
            </div>
          )}
        </>
      )}
    </div>
  </DialogBody>
  
  <DialogFooter>
    <Button
      variant="outlined"
      onClick={handleCloseMap}
    >
      Cerrar
    </Button>
  </DialogFooter>
</Dialog>
    
    <div className="space-y-6">
      <Card>
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="flex items-center justify-between">
            <Typography variant="h4" color="blue-gray">
              Lista de Clientes
            </Typography>
            <div className="flex items-center gap-2">
              {/* Botón de debug */}
              <Button
                size="sm"
                variant="text"
                onClick={() => setDebug(!debug)}
                className="flex items-center gap-2"
              >
                <ExclamationTriangleIcon className="h-4 w-4" />
                Debug
              </Button>
              
              <Button
                size="sm"
                variant="outlined"
                className="flex items-center gap-2"
                onClick={() => setShowMap(true)}
                disabled={!isLoaded}
              >
                <MapPinIcon className="h-4 w-4" />
                {isLoaded ? 'Ver en Mapa' : 'Cargando Mapa...'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          {error && (
            <Alert color="red" className="mb-4">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5" />
                {error}
              </div>
              <Button 
                size="sm" 
                variant="text" 
                className="mt-2"
                onClick={loadClientes}
              >
                Reintentar
              </Button>
            </Alert>
          )}

          {/* Panel de Debug */}
          {debug && (
            <Alert color="blue" className="mb-4">
              <Typography variant="h6" className="mb-2">Información de Debug:</Typography>
              <div className="text-sm space-y-1">
                <p><strong>Total clientes cargados:</strong> {clientes.length}</p>
                <p><strong>Clientes filtrados:</strong> {filteredClientes.length}</p>
                <p><strong>Tab activo:</strong> {activeTab}</p>
                <p><strong>Filtros activos:</strong> {JSON.stringify(filters)}</p>
                <p><strong>Estado de carga:</strong> {loading ? 'Cargando' : 'Completado'}</p>
                <p><strong>Google Maps cargado:</strong> {isLoaded ? 'Sí' : 'No'}</p>
              </div>
              {clientes.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold">Ver primer cliente (ejemplo)</summary>
                  <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(clientes[0], null, 2)}</pre>
                </details>
              )}
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
                {ESTADO_OPTIONS?.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                )) || []}
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
          {clientes.length === 0 && !loading ? (
            <div className="text-center py-8">
              <Typography color="gray" className="mb-4">
                No hay clientes registrados
              </Typography>
              <Button 
                variant="outlined" 
                onClick={loadClientes}
                className="flex items-center gap-2 mx-auto"
              >
                Recargar
              </Button>
            </div>
          ) : filteredClientes.length === 0 && clientes.length > 0 ? (
            <div className="text-center py-8">
              <Typography color="gray" className="mb-4">
                No se encontraron clientes con los filtros aplicados
              </Typography>
              <Button 
                variant="outlined" 
                onClick={clearFilters}
                className="flex items-center gap-2 mx-auto"
              >
                <FunnelIcon className="h-4 w-4" />
                Limpiar filtros
              </Button>
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
                            {cliente.nombre_completo || 'Nombre no disponible'}
                          </Typography>
                          <Chip
                            size="sm"
                            value={cliente.estado_display || cliente.estado || 'Sin estado'}
                            color={cliente.estado_badge?.color || 'gray'}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                          <div>
                            <Typography variant="small" color="gray">Email:</Typography>
                            <Typography variant="small">{cliente.email || 'No disponible'}</Typography>
                          </div>
                          <div>
                            <Typography variant="small" color="gray">Teléfono:</Typography>
                            <Typography variant="small">{cliente.telefono || 'No disponible'}</Typography>
                          </div>
                          <div>
                            <Typography variant="small" color="gray">CI:</Typography>
                            <Typography variant="small">{cliente.ci || 'No disponible'}</Typography>
                          </div>
                          <div>
                            <Typography variant="small" color="gray">Tipo:</Typography>
                            <Typography variant="small">{cliente.tipo_vivienda_label || cliente.tipo_vivienda || 'No especificado'}</Typography>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <Typography variant="small" color="gray">Dirección:</Typography>
                          <Typography variant="small">{cliente.direccion_completa || 'Dirección no disponible'}</Typography>
                        </div>
                        
                        <div className="mt-2">
                          <Typography variant="small" color="gray">
                            Fecha solicitud: {cliente.fecha_solicitud_formatted || cliente.fecha_solicitud || 'No disponible'}
                          </Typography>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <IconButton
                          size="sm"
                          variant="text"
                          onClick={() => onView && onView(cliente)}
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </IconButton>
                        
                        <IconButton
                          size="sm"
                          variant="text"
                          onClick={() => showClienteOnMap(cliente)}
                          title="Ver en mapa"
                          disabled={!isLoaded || !cliente.latitud || !cliente.longitud}
                        >
                          <MapPinIcon className="h-4 w-4" />
                        </IconButton>
                        
                        <IconButton
                          size="sm"
                          variant="text"
                          onClick={() => onEdit && onEdit(cliente)}
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </IconButton>
                        
                        <IconButton
                          size="sm"
                          variant="text"
                          color="red"
                          onClick={() => onDelete && onDelete(cliente)}
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </IconButton>

                        {/* Cambio rápido de estado */}
                        {ESTADO_OPTIONS && (
                          <Select
                            size="sm"
                            value={cliente.estado || ''}
                            onChange={(value) => handleEstadoChange(cliente.id, value)}
                            className="min-w-[120px]"
                          >
                            {ESTADO_OPTIONS.map(option => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                        )}
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
        handler={handleCloseMap}
        className="max-w-6xl"
      >
        <DialogHeader>
          <Typography variant="h5">
            {selectedCliente ? `Ubicación de ${selectedCliente.nombre_completo}` : 'Ubicaciones de Clientes'}
          </Typography>
        </DialogHeader>
        
        <DialogBody className="p-0">
          <div className="h-96 w-full relative">
            {!isLoaded ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Typography>Cargando Google Maps...</Typography>
              </div>
            ) : (
              <>
                <div 
                  ref={mapContainerRef} 
                  className="w-full h-full"
                />
                {!mapReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                    <Typography>Inicializando mapa...</Typography>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogBody>
        
        <DialogFooter>
          <Button
            variant="outlined"
            onClick={handleCloseMap}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
    </>
  );
  
};

export default ClienteList;