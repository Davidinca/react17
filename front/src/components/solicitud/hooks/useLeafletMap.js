// src/components/maps/hooks/useLeafletMap.js
import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { formatAddress } from '../utils/formatters';

// Función para crear iconos personalizados con colores
const createCustomIcon = (color = 'blue') => {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// Configuración de iconos por defecto
const DefaultIcon = L.icon({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Configurar icono por defecto para todos los marcadores
L.Marker.prototype.options.icon = DefaultIcon;

export const useLeafletMap = () => {
  const [isLoaded, setIsLoaded] = useState(true); // Leaflet se carga con el bundle
  const [loadError, setLoadError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const geocoderService = 'https://nominatim.openstreetmap.org/search';
  const reverseGeocoderService = 'https://nominatim.openstreetmap.org/reverse';

  // Inicializar el mapa
  const initializeMap = useCallback((mapElement, options = {}) => {
    if (!mapElement) return null;

    // Configuración por defecto
    const defaultOptions = {
      center: [-16.5000, -68.1193], // La Paz, Bolivia
      zoom: 13,
      zoomControl: true,
      ...options
    };

    try {
      // Crear instancia del mapa
      const map = L.map(mapElement, {
        center: defaultOptions.center,
        zoom: defaultOptions.zoom,
        zoomControl: defaultOptions.zoomControl
      });

      // Añadir capa de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
      return map;
    } catch (error) {
      console.error('Error al inicializar el mapa de Leaflet:', error);
      setLoadError('Error al inicializar el mapa');
      return null;
    }
  }, []);

  // Crear marcador
  const createMarker = useCallback((position, options = {}) => {
    if (!mapInstanceRef.current) return null;

    const marker = L.marker(
      [position.lat || position[0], position.lng || position[1]],
      {
        draggable: options.draggable || false,
        title: options.title || '',
        icon: options.icon || DefaultIcon,
        riseOnHover: options.riseOnHover || false,
        ...options
      }
    ).addTo(mapInstanceRef.current);

    // Si el marcador es arrastrable, configurar eventos de arrastre
    if (options.draggable) {
      marker.on('dragend', async (e) => {
        const newPosition = e.target.getLatLng();
        
        // Si hay un callback para manejar el arrastre, llamarlo
        if (options.onDragEnd) {
          options.onDragEnd({
            lat: newPosition.lat,
            lng: newPosition.lng
          });
        }
        
        // Actualizar tooltip si existe
        if (marker.getTooltip()) {
          marker.setTooltipContent(`Ubicación seleccionada<br>Lat: ${newPosition.lat.toFixed(6)}<br>Lng: ${newPosition.lng.toFixed(6)}`);
        }
      });
      
      // Agregar tooltip con las coordenadas
      marker.bindTooltip(
        `Ubicación seleccionada<br>Lat: ${position.lat.toFixed(6)}<br>Lng: ${position.lng.toFixed(6)}`,
        { permanent: false, sticky: true, direction: 'top' }
      ).openTooltip();
    }

    markersRef.current.push(marker);
    return marker;
  }, []);

  // Limpiar marcadores
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];
  }, []);

  // Crear ventana de información
  const createInfoWindow = useCallback((content, marker) => {
    if (!mapInstanceRef.current) return null;

    const popup = L.popup()
      .setLatLng(marker.getLatLng())
      .setContent(content)
      .openOn(mapInstanceRef.current);

    return popup;
  }, []);

  // Geocodificación: Dirección a coordenadas
  const geocodeAddress = useCallback(async (address) => {
    try {
      const response = await fetch(
        `${geocoderService}?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Error en la solicitud de geocodificación');
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('No se encontraron resultados para la dirección proporcionada');
      }

      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formatted: result.display_name,
        address_components: result.address,
        geometry: {
          location: {
            lat: () => parseFloat(result.lat),
            lng: () => parseFloat(result.lon)
          }
        }
      };
    } catch (error) {
      console.error('Error en geocodeAddress:', error);
      throw new Error('No se pudo geocodificar la dirección');
    }
  }, []);

  // Geocodificación inversa: Coordenadas a dirección
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `${reverseGeocoderService}?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Error en la solicitud de geocodificación inversa');
      }

      const data = await response.json();
      
      if (!data) {
        throw new Error('No se pudo obtener la dirección para las coordenadas proporcionadas');
      }

      return {
        formatted: data.display_name,
        address_components: data.address,
        geometry: {
          location: {
            lat: () => parseFloat(lat),
            lng: () => parseFloat(lng)
          }
        }
      };
    } catch (error) {
      console.error('Error en reverseGeocode:', error);
      throw new Error('No se pudo obtener la dirección');
    }
  }, []);

  // Centrar el mapa en una ubicación
  const centerMap = useCallback((lat, lng, zoom) => {
    if (!mapInstanceRef.current) return;
    
    mapInstanceRef.current.setView([lat, lng], zoom || mapInstanceRef.current.getZoom());
  }, []);

  // Ajustar el mapa para mostrar todos los marcadores
  const fitBounds = useCallback((bounds) => {
    if (!mapInstanceRef.current) return;

    if (!bounds) {
      // Crear bounds basado en marcadores existentes
      const markerGroup = L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(markerGroup.getBounds().pad(0.1));
    } else {
      // Usar los bounds proporcionados
      mapInstanceRef.current.fitBounds([
        [bounds._southWest.lat, bounds._southWest.lng],
        [bounds._northEast.lat, bounds._northEast.lng]
      ]);
    }
  }, []);

  // Calcular distancia entre dos puntos (en línea recta)
  const calculateDistance = useCallback((point1, point2) => {
    try {
      const lat1 = typeof point1.lat === 'function' ? point1.lat() : point1.lat;
      const lng1 = typeof point1.lng === 'function' ? point1.lng() : point1.lng || point1[1];
      const lat2 = typeof point2.lat === 'function' ? point2.lat() : point2.lat;
      const lng2 = typeof point2.lng === 'function' ? point2.lng() : point2.lng || point2[1];

      // Fórmula de Haversine para calcular distancia entre dos puntos en la Tierra
      const R = 6371; // Radio de la Tierra en km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lng2 - lng1) * (Math.PI / 180);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distancia en km

      return {
        distance: {
          text: `${distance.toFixed(2)} km`,
          value: distance * 1000 // en metros
        },
        duration: {
          text: 'No disponible', // No tenemos datos de tráfico
          value: 0
        }
      };
    } catch (error) {
      console.error('Error al calcular distancia:', error);
      throw new Error('Error al calcular la distancia');
    }
  }, []);

  // Inicializar autocompletado de direcciones
  const initializeAutocomplete = useCallback((inputElement, options = {}) => {
    if (!inputElement) return null;
    
    // Implementación de autocompletado con Nominatim
    let timeoutId = null;
    const minLength = options.minLength || 3;
    const debounceTimeMs = options.debounce || 300;
    const country = options.country || 'bo'; // Predeterminado a Bolivia
    
    // Crear contenedor para las sugerencias
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'autocomplete-suggestions';
    suggestionsContainer.style.cssText = `
      display: none;
      position: absolute;
      z-index: 1000;
      background-color: white;
      border: 1px solid #ccc;
      max-height: 200px;
      overflow-y: auto;
      width: ${inputElement.offsetWidth}px;
    `;
    
    // Insertar el contenedor después del input
    inputElement.parentNode.insertBefore(suggestionsContainer, inputElement.nextSibling);
    
    // Manejar clics fuera del contenedor para cerrar sugerencias
    const handleClickOutside = (event) => {
      if (!suggestionsContainer.contains(event.target) && event.target !== inputElement) {
        suggestionsContainer.style.display = 'none';
      }
    };
    
    // Manejar la selección de una sugerencia
    const handleSuggestionClick = (suggestion) => {
      inputElement.value = suggestion.display_name || '';
      suggestionsContainer.style.display = 'none';
      
      // Si hay un manejador de selección, llamarlo con los datos de la ubicación
      if (options.onPlaceSelected) {
        options.onPlaceSelected(suggestion);
      }
      
      // Disparar evento personalizado
      const event = new CustomEvent('place_changed');
      inputElement.dispatchEvent(event);
    };
    
    // Mostrar sugerencias
    const showSuggestions = (suggestions) => {
      // Limpiar sugerencias anteriores
      suggestionsContainer.innerHTML = '';
      
      if (!suggestions || suggestions.length === 0) {
        suggestionsContainer.innerHTML = '<div style="padding: 8px 12px; color: #666;">No se encontraron resultados</div>';
        suggestionsContainer.style.display = 'block';
        return;
      }
      
      // Crear elementos de sugerencia
      suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.className = 'autocomplete-suggestion';
        div.style.cssText = `
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
          transition: background-color 0.2s;
        `;
        div.textContent = suggestion.display_name || '';
        
        div.addEventListener('click', () => handleSuggestionClick(suggestion));
        
        div.addEventListener('mouseover', () => {
          div.style.backgroundColor = '#f5f5f5';
        });
        
        div.addEventListener('mouseout', () => {
          div.style.backgroundColor = 'white';
        });
        
        suggestionsContainer.appendChild(div);
      });
      
      suggestionsContainer.style.display = 'block';
    };
    
    // Manejar la entrada del usuario
    const handleInput = async (e) => {
      const query = e.target.value.trim();
      
      // Ocultar sugerencias si el campo está vacío
      if (query.length < minLength) {
        suggestionsContainer.style.display = 'none';
        return;
      }
      
      // Mostrar indicador de carga
      suggestionsContainer.innerHTML = '<div style="padding: 8px 12px; color: #666;">Buscando direcciones...</div>';
      suggestionsContainer.style.display = 'block';
      
      // Cancelar la búsqueda anterior si existe
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Usar debounce para no saturar el servidor
      timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(
            `${geocoderService}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=${country}`
          );
          
          if (response.ok) {
            const data = await response.json();
            showSuggestions(data);
          } else {
            console.error('Error en la respuesta del servidor:', response.status);
            suggestionsContainer.innerHTML = '<div style="padding: 8px 12px; color: #d32f2f;">Error al cargar sugerencias</div>';
          }
        } catch (error) {
          console.error('Error en la búsqueda de direcciones:', error);
          suggestionsContainer.innerHTML = '<div style="padding: 8px 12px; color: #d32f2f;">Error de conexión</div>';
        }
      }, debounceTimeMs);
    };
    
    // Agregar manejador de eventos al input
    inputElement.addEventListener('input', handleInput);
    inputElement.addEventListener('focus', handleInput);
    
    // Función de limpieza
    const cleanup = () => {
      inputElement.removeEventListener('input', handleInput);
      inputElement.removeEventListener('focus', handleInput);
      document.removeEventListener('click', handleClickOutside);
      if (timeoutId) clearTimeout(timeoutId);
      if (suggestionsContainer.parentNode) {
        suggestionsContainer.parentNode.removeChild(suggestionsContainer);
      }
    };
    
    // Agregar manejador de clics fuera del contenedor
    document.addEventListener('click', handleClickOutside);
    
    // Devolver función de limpieza
    return cleanup;
  }, [geocoderService]);

  // Obtener lugar seleccionado del autocompletado
  const getSelectedPlace = useCallback((place) => {
    if (!place) return null;
    
    return {
      geometry: {
        location: {
          lat: () => place.geometry.location.lat(),
          lng: () => place.geometry.location.lng()
        }
      },
      address_components: place.address_components,
      formatted_address: place.description,
      name: place.structured_formatting?.main_text || ''
    };
  }, []);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      clearMarkers();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [clearMarkers]);

  return {
    isLoaded,
    loadError,
    mapRef,
    initializeMap,
    createMarker,
    clearMarkers,
    createInfoWindow,
    initializeAutocomplete,
    getSelectedPlace,
    geocodeAddress,
    reverseGeocode,
    centerMap,
    fitBounds,
    calculateDistance,
    mapInstance: mapInstanceRef.current
  };
};
