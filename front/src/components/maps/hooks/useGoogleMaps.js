// src/components/maps/hooks/useGoogleMaps.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { GOOGLE_MAPS_CONFIG } from '../config/mapsConfig';
import { formatAddress } from '../utils/formatters';

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const autocompleteRef = useRef(null);
  const markersRef = useRef([]);

  // Cargar Google Maps API
  useEffect(() => {
    if (window.google) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=${GOOGLE_MAPS_CONFIG.libraries.join(',')}&language=es`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setLoadError('Error al cargar Google Maps API');
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Inicializar mapa
  const initializeMap = useCallback((mapElement, options = {}) => {
    if (!isLoaded || !mapElement) return null;

    const mapOptions = {
      center: options.center || GOOGLE_MAPS_CONFIG.defaultCenter,
      zoom: options.zoom || GOOGLE_MAPS_CONFIG.defaultZoom,
      ...GOOGLE_MAPS_CONFIG.mapOptions,
      ...options
    };

    const map = new window.google.maps.Map(mapElement, mapOptions);
    mapInstanceRef.current = map;
    return map;
  }, [isLoaded]);

  // Crear marcador
  const createMarker = useCallback((position, options = {}) => {
    if (!mapInstanceRef.current) return null;

    const marker = new window.google.maps.Marker({
      position,
      map: mapInstanceRef.current,
      draggable: options.draggable || false,
      title: options.title || '',
      icon: options.icon || null,
      ...options
    });

    markersRef.current.push(marker);
    return marker;
  }, []);

  // Limpiar marcadores
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
  }, []);

  // Crear InfoWindow
  const createInfoWindow = useCallback((content, marker) => {
    if (!mapInstanceRef.current) return null;

    const infoWindow = new window.google.maps.InfoWindow({
      content: content
    });

    if (marker) {
      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });
    }

    return infoWindow;
  }, []);

  // Configurar Autocomplete
  const initializeAutocomplete = useCallback((inputElement, options = {}) => {
    if (!isLoaded || !inputElement) return null;

    const autocompleteOptions = {
      types: ['address'],
      componentRestrictions: { country: 'bo' }, // Bolivia
      fields: ['formatted_address', 'geometry', 'address_components'],
      ...options
    };

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputElement,
      autocompleteOptions
    );

    autocompleteRef.current = autocomplete;
    return autocomplete;
  }, [isLoaded]);

  // Obtener lugar seleccionado del autocomplete
  const getSelectedPlace = useCallback(() => {
    if (!autocompleteRef.current) return null;

    const place = autocompleteRef.current.getPlace();
    if (!place.geometry) return null;

    return formatAddress(place);
  }, []);

  // Geocoding - obtener coordenadas de una dirección
  const geocodeAddress = useCallback(async (address) => {
    if (!isLoaded) throw new Error('Google Maps no está cargado');

    return new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve({
            ...results[0],
            formatted: formatAddress(results[0])
          });
        } else {
          reject(new Error('No se pudo geocodificar la dirección'));
        }
      });
    });
  }, [isLoaded]);

  // Reverse Geocoding - obtener dirección de coordenadas
  const reverseGeocode = useCallback(async (lat, lng) => {
    if (!isLoaded) throw new Error('Google Maps no está cargado');

    return new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };
      
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve({
            ...results[0],
            formatted: formatAddress(results[0])
          });
        } else {
          reject(new Error('No se pudo obtener la dirección'));
        }
      });
    });
  }, [isLoaded]);

  // Centrar mapa en una ubicación
  const centerMap = useCallback((lat, lng, zoom) => {
    if (!mapInstanceRef.current) return;

    const position = { lat: parseFloat(lat), lng: parseFloat(lng) };
    mapInstanceRef.current.setCenter(position);
    
    if (zoom) {
      mapInstanceRef.current.setZoom(zoom);
    }
  }, []);

  // Ajustar mapa para mostrar todos los marcadores
  const fitBounds = useCallback((bounds) => {
    if (!mapInstanceRef.current) return;

    if (!bounds) {
      // Crear bounds basado en marcadores existentes
      const boundsList = new window.google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        boundsList.extend(marker.getPosition());
      });
      bounds = boundsList;
    }

    mapInstanceRef.current.fitBounds(bounds);
  }, []);

  // Calcular distancia entre dos puntos
  const calculateDistance = useCallback((point1, point2) => {
    if (!isLoaded) return null;

    const service = new window.google.maps.DistanceMatrixService();
    
    return new Promise((resolve, reject) => {
      service.getDistanceMatrix({
        origins: [point1],
        destinations: [point2],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC
      }, (response, status) => {
        if (status === 'OK') {
          resolve(response.rows[0].elements[0]);
        } else {
          reject(new Error('Error al calcular distancia'));
        }
      });
    });
  }, [isLoaded]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearMarkers();
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
      if (mapInstanceRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(mapInstanceRef.current);
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