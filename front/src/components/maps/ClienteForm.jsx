import React, { useState, useEffect, useRef } from 'react';
import { Collapse } from '@material-tailwind/react';

import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Input,
  Select,
  Option,
  Button,
  Textarea,
  Alert
} from '@material-tailwind/react';
import { useGoogleMaps } from './hooks/useGoogleMaps';
import { clienteService, tipoServicioService } from './services/apiService';
import { validateCliente } from './utils/validations';
import { TIPO_VIVIENDA_OPTIONS, ESTADO_OPTIONS } from './types/clienteTypes';

const ClienteForm = ({ cliente = null, onSave, onCancel, isEditing = false }) => {
  // Mover esta desestructuración aquí arriba para evitar error
  const {
    isLoaded,
    loadError,
    initializeMap,
    initializeAutocomplete,
    getSelectedPlace,
    createMarker,
    clearMarkers,
    centerMap,
    reverseGeocode
  } = useGoogleMaps();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    ci: '',
    tipo_vivienda: '',
    piso: '',
    zona: '',
    calle: '',
    direccion_completa: '',
    latitud: '',
    longitud: '',
    tipo_servicio: '',
    estado: 'pendiente',
    observaciones: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [tiposServicio, setTiposServicio] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const addressInputRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [ubicacionExpanded, setUbicacionExpanded] = useState(false);

  useEffect(() => {
    if (ubicacionExpanded && isLoaded && mapContainerRef.current) {
      setTimeout(() => {
        window.google.maps.event.trigger(mapContainerRef.current, 'resize');
      }, 300);
    }
  }, [ubicacionExpanded, isLoaded]);

  // Cargar datos iniciales
  useEffect(() => {
    loadTiposServicio();
    if (cliente && isEditing) {
      setFormData({ ...cliente });
      setSelectedLocation({
        lat: parseFloat(cliente.latitud),
        lng: parseFloat(cliente.longitud)
      });
    }
  }, [cliente, isEditing]);

  // Inicializar mapa y autocomplete cuando Google Maps esté cargado
  useEffect(() => {
    if (isLoaded && mapContainerRef.current && addressInputRef.current) {
      initializeMapAndAutocomplete();
    }
  }, [isLoaded]);

  // Actualizar mapa cuando cambie la ubicación seleccionada
  useEffect(() => {
    if (selectedLocation && isLoaded) {
      updateMapLocation(selectedLocation);
    }
  }, [selectedLocation, isLoaded]);

  const loadTiposServicio = async () => {
    try {
      const tipos = await tipoServicioService.getAll({ activo: true });
      setTiposServicio(tipos);
    } catch (error) {
      console.error('Error al cargar tipos de servicio:', error);
    }
  };

  const initializeMapAndAutocomplete = () => {
    // Inicializar mapa
    const map = initializeMap(mapContainerRef.current, {
      center: selectedLocation || { lat: -16.5000, lng: -68.1193 },
      zoom: 15
    });

    // Inicializar autocomplete
    const autocomplete = initializeAutocomplete(addressInputRef.current);

    // Escuchar cambios en el autocomplete
    autocomplete.addListener('place_changed', () => {
      const place = getSelectedPlace();
      if (place) {
        handleLocationSelect(place);
      }
    });

    // Hacer clic en el mapa para seleccionar ubicación
    map.addListener('click', async (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      try {
        const address = await reverseGeocode(lat, lng);
        handleLocationSelect({
          ...address.formatted,
          latitud: lat,
          longitud: lng
        });
      } catch (error) {
        console.error('Error al obtener dirección:', error);
        // Aún así permitir seleccionar las coordenadas
        setSelectedLocation({ lat, lng });
        setFormData(prev => ({
          ...prev,
          latitud: lat,
          longitud: lng
        }));
      }
    });
  };

  const handleLocationSelect = (locationData) => {
    setSelectedLocation({
      lat: locationData.latitud,
      lng: locationData.longitud
    });

    setFormData(prev => ({
      ...prev,
      zona: locationData.zona || prev.zona,
      calle: locationData.calle || prev.calle,
      direccion_completa: locationData.direccion_completa || prev.direccion_completa,
      latitud: locationData.latitud,
      longitud: locationData.longitud
    }));

    if (addressInputRef.current) {
      addressInputRef.current.value = locationData.direccion_completa || '';
    }
  };

  const updateMapLocation = (location) => {
    clearMarkers();
    centerMap(location.lat, location.lng, 16);
    createMarker(location, {
      title: 'Ubicación seleccionada',
      draggable: true
    });
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo al cambiar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar formulario
    const validation = validateCliente(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isEditing && cliente) {
        result = await clienteService.update(cliente.id, formData);
      } else {
        result = await clienteService.create(formData);
      }

      onSave(result);
    } catch (error) {
      if (error.fieldErrors) {
        setErrors(error.fieldErrors);
      } else {
        setErrors({ general: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadError) {
    return (
      <Alert color="red">
        Error al cargar Google Maps: {loadError}
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader floated={false} shadow={false} className="rounded-none">
        <Typography variant="h4" color="blue-gray">
          {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        </Typography>
      </CardHeader>
      
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <Alert color="red">{errors.general}</Alert>
          )}

          {/* Información Personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                error={!!errors.nombre}
                required
              />
              {errors.nombre && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.nombre}
                </Typography>
              )}
            </div>

            <div>
              <Input
                label="Apellido"
                value={formData.apellido}
                onChange={(e) => handleInputChange('apellido', e.target.value)}
                error={!!errors.apellido}
                required
              />
              {errors.apellido && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.apellido}
                </Typography>
              )}
            </div>

            <div>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!errors.email}
                required
              />
              {errors.email && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.email}
                </Typography>
              )}
            </div>

            <div>
              <Input
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                error={!!errors.telefono}
                required
              />
              {errors.telefono && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.telefono}
                </Typography>
              )}
            </div>

            <div>
              <Input
                label="CI"
                value={formData.ci}
                onChange={(e) => handleInputChange('ci', e.target.value)}
                error={!!errors.ci}
                required
              />
              {errors.ci && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.ci}
                </Typography>
              )}
            </div>

            <div>
              <Select
                label="Tipo de Servicio"
                value={formData.tipo_servicio}
                onChange={(value) => handleInputChange('tipo_servicio', value)}
                error={!!errors.tipo_servicio}
              >
                {tiposServicio.map((tipo) => (
                  <Option key={tipo.id} value={tipo.id}>
                    {tipo.nombre} {tipo.precio && `- ${tipo.precio}`}
                  </Option>
                ))}
              </Select>
              {errors.tipo_servicio && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.tipo_servicio}
                </Typography>
              )}
            </div>
          </div>

          {/* Información de Vivienda */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label="Tipo de Vivienda"
                value={formData.tipo_vivienda}
                onChange={(value) => handleInputChange('tipo_vivienda', value)}
                error={!!errors.tipo_vivienda}
              >
                {TIPO_VIVIENDA_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              {errors.tipo_vivienda && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.tipo_vivienda}
                </Typography>
              )}
            </div>

            {formData.tipo_vivienda === 'departamento' && (
              <div>
                <Input
                  label="Piso"
                  value={formData.piso}
                  onChange={(e) => handleInputChange('piso', e.target.value)}
                  error={!!errors.piso}
                  required
                />
                {errors.piso && (
                  <Typography variant="small" color="red" className="mt-1">
                    {errors.piso}
                  </Typography>
                )}
              </div>
            )}

            {isEditing && (
              <div>
                <Select
                  label="Estado"
                  value={formData.estado}
                  onChange={(value) => handleInputChange('estado', value)}
                >
                  {ESTADO_OPTIONS.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {/* Ubicación */}
<div className="space-y-4">
  <div className="flex items-center justify-between cursor-pointer" onClick={() => setUbicacionExpanded(!ubicacionExpanded)}>
    <Typography variant="h6" color="blue-gray">
      Ubicación
    </Typography>
    <Button
      variant="text"
      size="sm"
      color="blue"
      onClick={(e) => {
        e.stopPropagation(); // evitar que el click se propague al div padre y doble toggle
        setUbicacionExpanded(!ubicacionExpanded);
      }}
    >
      {ubicacionExpanded ? 'Ocultar' : 'Ver'}
    </Button>
  </div>

  <Collapse open={ubicacionExpanded}>
    <div>
      <Input
        inputRef={addressInputRef}
        label="Buscar dirección"
        placeholder="Escriba para buscar una dirección..."
        className="mb-4"
      />
      <Typography variant="small" color="gray" className="mb-2">
        Escriba una dirección o haga clic en el mapa para seleccionar la ubicación
      </Typography>

      {/* Mapa */}
      <div className="w-full h-64 border rounded-lg overflow-hidden mb-4">
        {isLoaded ? (
          <div ref={mapContainerRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Typography>Cargando mapa...</Typography>
          </div>
        )}
      </div>

      {/* Campos de ubicación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <Input
            label="Zona"
            value={formData.zona}
            onChange={(e) => handleInputChange('zona', e.target.value)}
            error={!!errors.zona}
            required
          />
          {errors.zona && (
            <Typography variant="small" color="red" className="mt-1">
              {errors.zona}
            </Typography>
          )}
        </div>

        <div>
          <Input
            label="Calle"
            value={formData.calle}
            onChange={(e) => handleInputChange('calle', e.target.value)}
            error={!!errors.calle}
            required
          />
          {errors.calle && (
            <Typography variant="small" color="red" className="mt-1">
              {errors.calle}
            </Typography>
          )}
        </div>
      </div>

      <div className="mb-4">
        <Input
          label="Dirección Completa"
          value={formData.direccion_completa}
          onChange={(e) => handleInputChange('direccion_completa', e.target.value)}
          error={!!errors.direccion_completa}
          required
        />
        {errors.direccion_completa && (
          <Typography variant="small" color="red" className="mt-1">
            {errors.direccion_completa}
          </Typography>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Latitud"
            value={formData.latitud}
            onChange={(e) => handleInputChange('latitud', e.target.value)}
            error={!!errors.latitud}
            disabled
          />
        </div>

        <div>
          <Input
            label="Longitud"
            value={formData.longitud}
            onChange={(e) => handleInputChange('longitud', e.target.value)}
            error={!!errors.longitud}
            disabled
          />
        </div>
      </div>

      {errors.ubicacion && (
        <Typography variant="small" color="red">
          {errors.ubicacion}
        </Typography>
      )}
    </div>
  </Collapse>
</div>


          {/* Observaciones */}
          <div>
            <Textarea
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              {isEditing ? 'Actualizar' : 'Crear'} Cliente
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};

export default ClienteForm;