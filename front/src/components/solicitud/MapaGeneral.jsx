import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;

// Crear un icono personalizado para evitar problemas de caché
const createCustomIcon = (color = 'blue') => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// Configuración por defecto para los iconos
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapaGeneral = ({ onEdit, onView, refreshTrigger }) => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '', estado: '', zona: '' });

  useEffect(() => {
    loadClientes();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [clientes, filters]);

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

  const getCustomMarker = (estado) => {
    const colors = {
      pendiente: 'orange',
      activo: 'green',
      rechazado: 'red',
      default: 'blue'
    };
    
    const color = colors[estado] || colors.default;
    return createCustomIcon(color);
  };

  // Create bounds only if we have valid coordinates
  const bounds = useCallback(() => {
    const points = filteredClientes
      .filter(c => c.latitud && c.longitud)
      .map(c => [parseFloat(c.latitud), parseFloat(c.longitud)]);
      
    if (points.length === 0) {
      return null;
    }
    
    const bounds = L.latLngBounds(points);
    return bounds.isValid() ? bounds : null;
  }, [filteredClientes]);

  if (loading) {
    return <div className="flex items-center justify-center h-96">Cargando clientes...</div>;
  }

  const hasValidCoordinates = filteredClientes.some(c => c.latitud && c.longitud);
  const defaultCenter = [-16.5, -68.1]; // Default to La Paz
  const currentBounds = bounds();

  return (
    <div className="space-y-6">
      <div className="h-96 w-full relative">
        {!hasValidCoordinates ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div>No hay ubicaciones para mostrar</div>
          </div>
        ) : (
          <MapContainer 
            key={`map-${filteredClientes.length}`}
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            whenCreated={(map) => {
              if (currentBounds) {
                map.fitBounds(currentBounds);
              }
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {filteredClientes
              .filter(c => c.latitud && c.longitud)
              .map(cliente => (
                <Marker
                  key={cliente.id}
                  position={[parseFloat(cliente.latitud), parseFloat(cliente.longitud)]}
                  icon={getCustomMarker(cliente.estado)}
                >
                  <Popup>
                    <div className="space-y-2">
                      <div className="font-bold">{cliente.nombre_completo}</div>
                      <div>{cliente.direccion_completa}</div>
                      <div className="flex gap-2 mt-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          onClick={() => onView && onView(cliente)}
                        >
                          Ver
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-800 text-sm"
                          onClick={() => onEdit && onEdit(cliente)}
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default MapaGeneral;
