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
  Alert,
  Stepper,
  Step,
  Radio,
  Chip
} from '@material-tailwind/react';
import { useLeafletMap } from './hooks/useLeafletMap';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { clienteService, planService } from './services/apiService';
import { validateCliente } from './utils/validations';
import { jsPDF } from 'jspdf';
import { 
  TIPO_VIVIENDA_OPTIONS, 
  TIPO_CLIENTE_OPTIONS,
  CLIENTE_ESTADOS 
} from './types/clienteTypes';

const ClienteForm = ({ cliente = null, onSave, onCancel, isEditing = false }) => {
  // ===========================================
  // HOOKS Y CONFIGURACIÓN DE LEAFLET MAPS
  // ===========================================
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
  } = useLeafletMap();

  // Referencia al mapa
  const mapRef = useRef(null);

  // ===========================================
  // GENERACIÓN DE PDF
  // ===========================================

  const generarPDF = () => {
    // Crear una nueva instancia de jsPDF
    const doc = new jsPDF();
    
    // Configuración inicial
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 20;
    const lineHeight = 7;

    // Función para agregar texto con estilo
    const addText = (text, x, y, options = {}) => {
      const { size = 12, style = 'normal', align = 'left', color = '#000000' } = options;
      const prevFont = doc.getFont();
      doc.setFont('helvetica', style);
      doc.setFontSize(size);
      doc.setTextColor(color);
      
      const textWidth = doc.getTextWidth(text);
      let xPos = x;
      
      if (align === 'center') {
        xPos = x - (textWidth / 2);
      } else if (align === 'right') {
        xPos = x - textWidth;
      }
      
      doc.text(text, xPos, y);
      doc.setFont(prevFont.fontName, prevFont.fontStyle);
      doc.setFontSize(12);
      return lineHeight * (size / 12);
    };

    // Función para agregar una sección con título y líneas de texto
    const addSection = (title, items, startY) => {
      let currentY = startY;
      
      // Título de la sección
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(title, margin, currentY);
      currentY += 10;
      
      // Líneas de la sección
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      
      items.forEach(([label, value]) => {
        // Etiqueta en negrita
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}`, margin, currentY);
        
        // Valor
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(value || 'No especificado', pageWidth - margin * 2 - 50);
        doc.text(lines, margin + 50, currentY);
        
        // Ajustar posición Y según la cantidad de líneas del valor
        currentY += Math.max(10, lines.length * 7);
      });
      
      return currentY + 15; // Espacio después de la sección
    };

    // Logo y Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(30, 64, 175); // Azul oscuro
    doc.text('COTEL', pageWidth / 2, yPos, { align: 'center' });
    
    doc.setFontSize(18);
    doc.text('CONTRATO DE SERVICIO', pageWidth / 2, yPos + 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Negro
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, margin, yPos + 30);
    
    yPos += 50;

    // Sección de Datos Personales
    const datosPersonalesItems = [
      ['Nombres:', datosPersonales.nombre],
      ['Apellidos:', datosPersonales.apellido],
      ['CI/NIT:', datosPersonales.ci || datosPersonales.nit],
      ['Teléfono:', datosPersonales.telefono],
      ['Email:', datosPersonales.email],
      ['Tipo de Cliente:', datosPersonales.tipo_cliente]
    ];
    
    yPos = addSection('DATOS PERSONALES', datosPersonalesItems, yPos);

    // Sección de Ubicación
    const ubicacionItems = [
      ['Dirección:', datosUbicacion.direccion_completa],
      ['Zona:', datosUbicacion.zona],
      ['Calle:', datosUbicacion.calle],
      ['Número de puerta:', datosUbicacion.numero_puerta],
      ['Tipo de vivienda:', datosUbicacion.vivienda],
      ['Piso:', datosUbicacion.piso || 'N/A'],
      ['Referencias:', datosUbicacion.referencias || 'Ninguna']
    ];
    
    yPos = addSection('UBICACIÓN', ubicacionItems, yPos);

    // Sección del Plan
    const planSeleccionado = planes.find(p => p.id === datosPlan.plan_id) || {};
    const planItems = [
      ['Plan:', planSeleccionado.descripcion || 'No seleccionado'],
      ['Código:', planSeleccionado.codigo || 'N/A'],
      ['Tipo de servicio:', datosPlan.tipo_servicio || 'No especificado'],
      ['Fecha de instalación:', datosPlan.fecha_instalacion || 'Por programar'],
      ['Estado de cobertura:', cobertura === 'CON_COBERTURA' ? 'Con Cobertura' : 'Sin Cobertura']
    ];
    
    yPos = addSection('DETALLES DEL PLAN', planItems, yPos);

    // Firma
    const firmaY = Math.max(yPos, 250); // Asegurar que esté abajo en la página
    
    doc.setLineWidth(0.5);
    doc.line(margin, firmaY, margin + 80, firmaY);
    doc.text('Firma del Cliente', margin + 40, firmaY + 10, { align: 'center' });
    
    doc.line(pageWidth - margin - 80, firmaY, pageWidth - margin, firmaY);
    doc.text('Representante COTEL', pageWidth - margin - 40, firmaY + 10, { align: 'center' });

    // Guardar el PDF
    doc.save(`contrato_${datosPersonales.nombre || 'cliente'}_${datosPersonales.apellido || ''}.pdf`);
  };

  // ===========================================
  // ESTADOS DEL FORMULARIO MULTIPASO
  // ===========================================
  const steps = [
    { title: 'Datos Personales', icon: '👤' },
    { title: 'Ubicación', icon: '📍' },
    { title: 'Plan', icon: '📋' },
    { title: 'Confirmación', icon: '✅' }
  ];
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Estados para cada paso del formulario
  const [datosPersonales, setDatosPersonales] = useState({
    nombre: '',
    apellido: '',
    ci: '',
    email: '',
    telefono: '',
    tipo_cliente: 'COMUN',
    nit: '',
    razon_social: ''
  });

  const [datosUbicacion, setDatosUbicacion] = useState({
    vivienda: 'Casa',
    piso: '',
    calle: '',
    zona: '',
    numero_puerta: '',
    direccion_completa: '',
    referencias: '',
    latitud: '',
    longitud: '',
    cobertura: ''
  });

  const [datosPlan, setDatosPlan] = useState({
    plan_id: '',
    observaciones: '',
    tipo_servicio: 'INTERNET',
    fecha_instalacion: ''
  });

  // ===========================================
  // ESTADOS AUXILIARES Y DE CONTROL
  // ===========================================
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [planes, setPlanes] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [cobertura, setCobertura] = useState(null);
  const [verificandoCobertura, setVerificandoCobertura] = useState(false);

  // Referencias para elementos del DOM
  const addressInputRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Estilos para el contenedor del mapa
  const mapContainerStyles = {
    width: '100%',
    height: '400px',
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0',
    marginTop: '1rem',
    zIndex: 1 // Asegurar que el mapa esté por encima de otros elementos
  };

  // Asegurarse de que Leaflet cargue los iconos correctamente
  useEffect(() => {
    // Solución para el error de iconos en producción
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  // ===========================================
  // FUNCIONES DE MANEJO DE EVENTOS
  // ===========================================

  /**
   * Maneja el click fuera del modal para cerrarlo
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  // ===========================================
  // EFECTOS DE INICIALIZACIÓN
  // ===========================================

  /**
   * Cargar la lista de planes disponibles
   */
  useEffect(() => {
    const cargarPlanes = async () => {
      try {
        console.log('Cargando planes...');
        const data = await planService.getAll();
        console.log('Planes cargados:', data);
        setPlanes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error al cargar los planes:', error);
        setPlanes([]);
      }
    };

    cargarPlanes();
  }, []);

  /**
   * Inicializar datos del formulario cuando cambia el cliente
   */
  useEffect(() => {
    if (cliente) {
      // Datos personales
      setDatosPersonales({
        nombre: cliente.nombre ?? '',
        apellido: cliente.apellido ?? '',
        ci: cliente.ci ?? '',
        telefono: cliente.telefono ?? '',
        email: cliente.email ?? '',
        razon_social: cliente.razon_social ?? '',
        nit: cliente.nit ?? '',
        tipo_cliente: cliente.tipo_cliente ?? 'COMUN'
      });

      // Datos de ubicación
      setDatosUbicacion(prev => ({
        ...prev,
        vivienda: cliente.vivienda ?? 'Casa',
        piso: cliente.piso ?? '',
        numero_puerta: cliente.numero_puerta ?? '',
        zona: cliente.zona ?? '',
        calle: cliente.calle ?? '',
        direccion_completa: cliente.direccion_completa ?? '',
        referencias: cliente.referencias ?? '',
        cobertura: cliente.cobertura ?? '',
        latitud: cliente.latitud ?? '',
        longitud: cliente.longitud ?? ''
      }));

      // Datos del plan
      setDatosPlan({
        plan_id: cliente.plan_id ?? '',
        tipo_servicio: cliente.tipo_servicio ?? 'INTERNET',
        fecha_instalacion: cliente.fecha_instalacion ?? ''
      });

      // Otros estados
      setCobertura(cliente.cobertura ?? '');
      setVerificandoCobertura(false);
    }
  }, [cliente?.id, isEditing]);

  /**
   * Inicializar mapa cuando el componente se monta o cambia el paso
   */
  useEffect(() => {
    let map;
    
    if (isLoaded && mapContainerRef.current && currentStep === 1) { // Solo inicializar en el paso de ubicación
      // Función para agregar un marcador en la ubicación especificada
      const agregarMarcador = async (lat, lng, zoom = 16) => {
        if (!map) return;
        
        centerMap(lat, lng, zoom);
        
        // Limpiar marcadores anteriores
        clearMarkers();
        
        // Agregar nuevo marcador
        createMarker({ lat, lng }, {
          draggable: true,
          title: 'Ubicación del cliente',
          riseOnHover: true,
          onDragEnd: async (newPosition) => {
            console.log('Arrastrando marcador a:', newPosition);
            await actualizarDireccionDesdeCoordenadas(newPosition.lat, newPosition.lng);
          }
        });
        
        // Obtener dirección mediante geocodificación inversa
        try {
          const result = await reverseGeocode(lat, lng);
          if (result) {
            setDatosUbicacion(prev => ({
              ...prev,
              direccion_completa: result.display_name || '',
              calle: result.address?.road || result.address?.pedestrian || '',
              zona: result.address?.suburb || result.address?.neighbourhood || '',
              numero_puerta: result.address?.house_number || ''
            }));
          }
        } catch (error) {
          console.error('Error al obtener la dirección:', error);
        }
      };

      // Limpiar el contenedor del mapa
      while (mapContainerRef.current.firstChild) {
        mapContainerRef.current.removeChild(mapContainerRef.current.firstChild);
      }
      
      // Asegurarse de que el contenedor tenga dimensiones
      mapContainerRef.current.style.height = '400px';
      mapContainerRef.current.style.width = '100%';
      
      // Determinar las coordenadas iniciales
      const initialLat = cliente?.latitud || -16.5000; // Coordenada por defecto para La Paz
      const initialLng = cliente?.longitud || -68.1500;
      
      // Inicializar el mapa con las coordenadas
      map = initializeMap(mapContainerRef.current, {
        center: { lat: parseFloat(initialLat), lng: parseFloat(initialLng) },
        zoom: cliente?.latitud && cliente?.longitud ? 16 : 12
      });
      
      // Guardar referencia al mapa
      mapRef.current = map;
      
      // Si hay un cliente con coordenadas, centrar el mapa y agregar marcador
      if (cliente?.latitud && cliente?.longitud) {
        agregarMarcador(parseFloat(cliente.latitud), parseFloat(cliente.longitud));
      }

      // Manejar clic en el mapa para agregar/actualizar marcador
      const handleMapClick = async (e) => {
        if (!map) {
          console.log('Mapa no está inicializado');
          return;
        }
        
        const { lat, lng } = e.latlng;
        console.log('Clic en el mapa - Coordenadas:', { lat, lng });
        
        // Limpiar marcadores anteriores
        clearMarkers();
        
        // Agregar nuevo marcador con manejador de arrastre
        createMarker({ lat, lng }, {
          draggable: true,
          title: 'Ubicación del cliente',
          onDragEnd: async (newPosition) => {
            console.log('Arrastrando marcador a:', newPosition);
            await actualizarDireccionDesdeCoordenadas(newPosition.lat, newPosition.lng);
          }
        });

        // Actualizar dirección
        console.log('Llamando a actualizarDireccionDesdeCoordenadas desde handleMapClick');
        await actualizarDireccionDesdeCoordenadas(lat, lng);
      };

      // Inicializar el autocompletado de direcciones
      if (addressInputRef.current) {
        initializeAutocomplete(addressInputRef.current, {
          onPlaceSelected: (place) => {
            if (place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              
              // Centrar el mapa en la ubicación seleccionada
              centerMap(lat, lng, 18);
              
              // Limpiar marcadores anteriores
              clearMarkers();
              
              // Agregar nuevo marcador con manejador de arrastre
              createMarker({ lat, lng }, {
                draggable: true,
                title: 'Ubicación del cliente',
                onDragEnd: async (newPosition) => {
                  await actualizarDireccionDesdeCoordenadas(newPosition.lat, newPosition.lng);
                }
              });

              // Actualizar dirección
              actualizarDireccionDesdeCoordenadas(lat, lng);
            }
          }
        });
      }

      // Si hay un cliente existente, centrar el mapa en su ubicación
      if (cliente && cliente.latitud && cliente.longitud) {
        const lat = parseFloat(cliente.latitud);
        const lng = parseFloat(cliente.longitud);
        
        // Usar un pequeño retraso para asegurar que el mapa esté completamente cargado
        setTimeout(() => {
          centerMap(lat, lng, 16);
          
          // Agregar marcador en la ubicación del cliente
          createMarker({ lat, lng }, {
            draggable: true,
            title: 'Ubicación del cliente',
            onDragEnd: async (newPosition) => {
              await actualizarDireccionDesdeCoordenadas(newPosition.lat, newPosition.lng);
            }
          });
        }, 300);
      } else if (currentStep === 1) {
        // Si es un nuevo cliente, centrar en La Paz y agregar manejador de clic
        setTimeout(() => {
          centerMap(-16.5000, -68.1193, 13);
          
          // Agregar manejador de clic al mapa
          map.on('click', handleMapClick);
          
          // Agregar un marcador en el centro si no hay uno
          if (markersRef.current.length === 0) {
            const center = map.getCenter();
            createMarker({ lat: center.lat, lng: center.lng }, {
              draggable: true,
              title: 'Ubicación del cliente',
              onDragEnd: async (newPosition) => {
                await actualizarDireccionDesdeCoordenadas(newPosition.lat, newPosition.lng);
              }
            });
          }
        }, 300);
      }

      // Limpieza al desmontar
      return () => {
        if (map) {
          map.off('click', handleMapClick);
        }
      };
    }
  }, [isLoaded, loadError, initializeMap, initializeAutocomplete, createMarker, clearMarkers, centerMap, reverseGeocode, cliente, currentStep]);

  // ===========================================
  // FUNCIONES DE CARGA DE DATOS
  // ===========================================

  /**
   * Cargar la lista de planes disponibles desde la API
   */
  const loadPlanes = async () => {
    try {
      const planesData = await planService.getAll({ estado: true });
      setPlanes(planesData.results || planesData);
    } catch (error) {
      console.error('Error al cargar planes:', error);
    }
  };

  // ===========================================
  // FUNCIONES DE MANEJO DEL MAPA
  // ===========================================

  /**
   * Actualiza los campos de dirección basados en coordenadas usando geocodificación inversa
   * @param {number} lat - Latitud
   * @param {number} lng - Longitud
   */
  const actualizarDireccionDesdeCoordenadas = async (lat, lng) => {
    console.log('Iniciando actualizarDireccionDesdeCoordenadas con:', { lat, lng });
    try {
      // Actualizar coordenadas en el estado
      setDatosUbicacion(prev => {
        console.log('Actualizando coordenadas en el estado:', { lat, lng });
        return {
          ...prev,
          latitud: lat.toString(),
          longitud: lng.toString()
        };
      });
      
      // Obtener dirección mediante geocodificación inversa
      console.log('Llamando a reverseGeocode...');
      const result = await reverseGeocode(lat, lng);
      console.log('Resultado de reverseGeocode:', result);
      
      if (result) {
        // Actualizar campos de dirección con la información obtenida
        const nuevaDireccion = {
          direccion_completa: result.formatted || '',
          calle: result.address_components?.road || result.address_components?.pedestrian || '',
          zona: result.address_components?.suburb || 
                result.address_components?.neighbourhood || 
                result.address_components?.suburb_district ||
                result.address_components?.city_district ||
                result.address_components?.city ||
                result.address_components?.town ||
                result.address_components?.village ||
                result.address_components?.municipality ||
                '',
          numero_puerta: result.address_components?.house_number || ''
        };
        
        console.log('Actualizando campos de dirección con:', nuevaDireccion);
        
        setDatosUbicacion(prev => ({
          ...prev,
          ...nuevaDireccion
        }));
      }
    } catch (error) {
      console.error('Error al actualizar la dirección desde coordenadas:', error);
    }
  };

  /**
   * Maneja el clic en el botón de ubicación actual
   */
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con tu navegador');
      return;
    }

    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Centrar el mapa en la ubicación actual
          centerMap(latitude, longitude, 18);
          
          // Limpiar marcadores anteriores
          clearMarkers();
          
          // Hacer zoom al marcador
          mapRef.current.flyTo([latitude, longitude], 18);
          
          // Limpiar marcadores anteriores
          clearMarkers();
          
          // Agregar nuevo marcador con manejador de arrastre
          createMarker(
            { lat: latitude, lng: longitude },
            {
              draggable: true,
              title: 'Ubicación actual',
              riseOnHover: true,
              onDragEnd: async (newPosition) => {
                await actualizarDireccionDesdeCoordenadas(newPosition.lat, newPosition.lng);
              }
            }
          );
          
          // Actualizar dirección usando la función centralizada
          await actualizarDireccionDesdeCoordenadas(latitude, longitude);
          
        } catch (error) {
          console.error('Error al obtener la ubicación:', error);
          alert('No se pudo obtener la dirección de la ubicación seleccionada');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error al obtener la ubicación:', error);
        alert('No se pudo obtener tu ubicación. Asegúrate de haber concedido los permisos necesarios.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  /**
   * Actualizar la visualización en el mapa
   * @param {Object} location - Coordenadas de la ubicación
   */
  const updateMapLocation = async (location) => {
    if (!mapRef.current) return;
    
    try {
      // Centrar el mapa
      centerMap(location.lat, location.lng, 16);
      
      // Limpiar marcadores anteriores
      clearMarkers();
      
      // Agregar nuevo marcador
      createMarker(location, {
        draggable: true,
        title: 'Ubicación del cliente',
        riseOnHover: true
      });
      
      // Obtener dirección mediante geocodificación inversa
      const result = await reverseGeocode(location.lat, location.lng);
      if (result) {
        setDatosUbicacion(prev => ({
          ...prev,
          direccion_completa: result.formatted || '',
          calle: result.address_components?.road || '',
          zona: result.address_components?.suburb || '',
          numero_puerta: result.address_components?.house_number || ''
        }));
      }
    } catch (error) {
      console.error('Error al actualizar la ubicación:', error);
    }
  };

  /**
   * Verificar cobertura de servicio en la ubicación (simulado)
   * @param {number} lat - Latitud
   * @param {number} lng - Longitud
   */
  const verificarCobertura = async (lat, lng) => {
    setVerificandoCobertura(true);
    try {
      // Simular verificación de cobertura
      // En un caso real, aquí se haría una llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // La cobertura se maneja manualmente por el usuario
      
    } catch (error) {
      console.error('Error al verificar cobertura:', error);
    } finally {
      setVerificandoCobertura(false);
    }
  };

  // ===========================================
  // FUNCIONES DE NAVEGACIÓN ENTRE PASOS
  // ===========================================
  
  /**
   * Avanzar al siguiente paso del formulario
   */
  const handleNext = () => {
    // Validación específica para el paso de ubicación
    if (currentStep === 1 && cobertura === null) {
      setErrors({ cobertura: 'Debe seleccionar si la zona tiene cobertura o no' });
      return;
    }
    
    // Si no hay cobertura, saltar el paso del plan y ir directo al resumen
    if (currentStep === 1 && cobertura === 'SIN_COBERTURA') {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(3); // Ir directo al resumen (paso 3)
      setErrors({});
      return;
    }
    
    // Navegación normal entre pasos
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  /**
   * Retroceder al paso anterior del formulario
   */
  const handlePrevious = () => {
    if (currentStep > 0) {
      // Si estamos en el resumen y no hay cobertura, volver al paso de ubicación
      if (currentStep === 3 && cobertura === 'SIN_COBERTURA') {
        setCurrentStep(1);
      } else {
        setCurrentStep(currentStep - 1);
      }
      setErrors({});
    }
  };

  /**
   * Enviar el formulario completo
   */
  // Función para ajustar la precisión de coordenadas a un máximo de 6 decimales
  const ajustarPrecisionCoordenada = (valor) => {
    if (valor === null || valor === undefined) return null;
    
    // Convertir a número
    const num = parseFloat(valor);
    if (isNaN(num)) return null;
    
    // Redondear a 6 decimales
    const factor = Math.pow(10, 6);
    return Math.round(num * factor) / factor;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log('Datos de ubicación originales:', datosUbicacion);
      
      // Crear una copia de los datos de ubicación para no modificar el estado directamente
      const ubicacionAjustada = { ...datosUbicacion };
      
      // Asegurarse de que los campos obligatorios tengan valores por defecto
      ubicacionAjustada.numero_puerta = datosUbicacion.numero_puerta || 'S/N';
      ubicacionAjustada.calle = datosUbicacion.calle || 'S/N';
      ubicacionAjustada.zona = datosUbicacion.zona || 'No especificada';
      ubicacionAjustada.direccion_completa = datosUbicacion.direccion_completa || 
        `${ubicacionAjustada.calle}, ${ubicacionAjustada.zona}, La Paz, Bolivia`;
      
      // Ajustar precisión de latitud y longitud
      if (datosUbicacion.latitud) {
        const latAjustada = ajustarPrecisionCoordenada(datosUbicacion.latitud);
        console.log(`Latitud ajustada: ${datosUbicacion.latitud} -> ${latAjustada}`);
        ubicacionAjustada.latitud = latAjustada;
      } else {
        ubicacionAjustada.latitud = null;
      }
      
      if (datosUbicacion.longitud) {
        const lngAjustada = ajustarPrecisionCoordenada(datosUbicacion.longitud);
        console.log(`Longitud ajustada: ${datosUbicacion.longitud} -> ${lngAjustada}`);
        ubicacionAjustada.longitud = lngAjustada;
      } else {
        ubicacionAjustada.longitud = null;
      }
      
      console.log('Ubicación ajustada:', ubicacionAjustada);

      // Preparar datos completos del cliente
      const formData = {
        ...datosPersonales,
        ...ubicacionAjustada,
        observaciones: datosPlan.observaciones || '',
        estado: cobertura === 'CON_COBERTURA' ? CLIENTE_ESTADOS.PEND_EQUIPO : CLIENTE_ESTADOS.PEND_COBERTURA,
        cobertura: cobertura
      };

      // Incluir plan_id como null si no hay cobertura, o con el valor correspondiente si hay cobertura
      formData.plan_id = cobertura === 'CON_COBERTURA' ? datosPlan.plan_id : null;
      
      // Limpiar el objeto antes de enviar
      Object.keys(formData).forEach(key => {
        // Convertir cadenas vacías a null
        if (formData[key] === '') {
          formData[key] = null;
        }
        // Eliminar campos que no deben ser enviados como null
        if (formData[key] === null && key !== 'latitud' && key !== 'longitud') {
          delete formData[key];
        }
      });

      let result;
      if (isEditing && cliente) {
        // Actualizar cliente existente
        result = await clienteService.update(cliente.id, formData);
      } else {
        // Crear nuevo cliente
        result = await clienteService.create(formData);
      }

      onSave(result);
    } catch (error) {
      // Manejar errores de validación
      if (error.fieldErrors) {
        setErrors(error.fieldErrors);
      } else {
        setErrors({ general: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // FUNCIONES DE RENDERIZADO DE CONTENIDO
  // ===========================================
  
  /**
   * Renderizar el contenido del paso actual
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderDatosPersonales();
      case 1:
        return renderUbicacion();
      case 2:
        return renderPlan();
      case 3:
        return renderResumen();
      default:
        return null;
    }
  };

  /**
   * PASO 1: Renderizar formulario de datos personales
   */
  const renderDatosPersonales = () => (
    <div className="space-y-6">
      <Typography variant="h6" color="blue-gray">
        Información Personal
      </Typography>

      {/* Selector de tipo de cliente */}
      <div>
        <Typography variant="small" color="blue-gray" className="mb-2">
          Tipo de Cliente
        </Typography>
        <div className="flex gap-4">
          {TIPO_CLIENTE_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center">
              <Radio
                name="tipo_cliente"
                value={option.value}
                checked={datosPersonales.tipo_cliente === option.value}
                onChange={(e) => setDatosPersonales(prev => ({
                  ...prev,
                  tipo_cliente: e.target.value
                }))}
                label={
                  <div className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </div>
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Campos según tipo de cliente */}
      {datosPersonales.tipo_cliente === 'COMUN' ? (
        // Formulario para cliente común (persona natural)
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre"
            value={datosPersonales.nombre}
            onChange={(e) => setDatosPersonales(prev => ({
              ...prev,
              nombre: e.target.value
            }))}
            error={!!errors.nombre}
          />
          <Input
            label="Apellido"
            value={datosPersonales.apellido}
            onChange={(e) => setDatosPersonales(prev => ({
              ...prev,
              apellido: e.target.value
            }))}
            error={!!errors.apellido}
          />
          <Input
            label="CI"
            value={datosPersonales.ci}
            onChange={(e) => setDatosPersonales(prev => ({
              ...prev,
              ci: e.target.value
            }))}
            error={!!errors.ci}
          />
          <Input
            label="Teléfono"
            value={datosPersonales.telefono}
            onChange={(e) => setDatosPersonales(prev => ({
              ...prev,
              telefono: e.target.value
            }))}
            error={!!errors.telefono}
          />
          <Input
            label="Email"
            type="email"
            value={datosPersonales.email}
            onChange={(e) => setDatosPersonales(prev => ({
              ...prev,
              email: e.target.value
            }))}
            error={!!errors.email}
          />
        </div>
      ) : (
        // Formulario para cliente empresarial
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Razón Social"
            value={datosPersonales.razon_social}
            onChange={(e) => setDatosPersonales(prev => ({
              ...prev,
              razon_social: e.target.value
            }))}
            error={!!errors.razon_social}
          />
          <Input
            label="NIT"
            value={datosPersonales.nit}
            onChange={(e) => setDatosPersonales(prev => ({
              ...prev,
              nit: e.target.value
            }))}
            error={!!errors.nit}
          />
          <Input
            label="Nombre de Contacto"
            value={datosPersonales.nombre}
            onChange={(e) => setDatosPersonales(prev => ({
              ...prev,
              nombre: e.target.value
            }))}
            error={!!errors.nombre}
          />
          <Input
            label="Apellido de Contacto"
            value={datosPersonales.apellido}
            onChange={(e) => setDatosPersonales(prev => ({
              ...prev,
              apellido: e.target.value
            }))}
            error={!!errors.apellido}
          />
          <Input
            label="Teléfono"
            value={datosPersonales.telefono}
            onChange={(e) => setDatosPersonales(prev => ({
              ...prev,
              telefono: e.target.value
            }))}
            error={!!errors.telefono}
          />
          <Input
            label="Email"
            type="email"
            value={datosPersonales.email}
            onChange={(e) => setDatosPersonales(prev => ({
              ...prev,
              email: e.target.value
            }))}
            error={!!errors.email}
          />
        </div>
      )}
    </div>
  );

  /**
   * PASO 2: Renderizar formulario de ubicación y verificación de cobertura
   */
  const renderUbicacion = () => (
    <div className="space-y-6">
      <Typography variant="h6" color="blue-gray">
        Ubicación y Cobertura
      </Typography>

      {/* Configuración de tipo de vivienda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Tipo de Vivienda"
          value={datosUbicacion.vivienda}
          onChange={(value) => setDatosUbicacion(prev => ({
            ...prev,
            vivienda: value,
            piso: value === 'Casa' ? '' : prev.piso // Limpiar piso si es casa
          }))}
        >
          {TIPO_VIVIENDA_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.icon} {option.label}
            </Option>
          ))}
        </Select>

        {/* Campo de piso solo para departamentos */}
        {datosUbicacion.vivienda === 'Departamento' && (
          <Input
            label="Piso"
            value={datosUbicacion.piso}
            onChange={(e) => setDatosUbicacion(prev => ({
              ...prev,
              piso: e.target.value
            }))}
          />
        )}

        <Input
          label="Número de Puerta"
          value={datosUbicacion.numero_puerta}
          onChange={(e) => setDatosUbicacion(prev => ({
            ...prev,
            numero_puerta: e.target.value
          }))}
        />
      </div>

      {/* Sistema de búsqueda de direcciones */}
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
      </div>

      {/* Controles del mapa */}
      <div className="mb-2 flex justify-between items-center">
        <Typography variant="small" color="gray" className="italic">
          Haga clic en el mapa o use el botón para seleccionar la ubicación
        </Typography>
        <Button
          variant="outlined"
          size="sm"
          onClick={handleUseCurrentLocation}
          className="flex items-center gap-1"
          disabled={!isLoaded}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Usar mi ubicación
        </Button>
      </div>

      {/* Mapa interactivo */}
      <div className="w-full border rounded-lg overflow-hidden mb-4" style={{ height: '400px' }}>
        {isLoaded ? (
          <div 
            ref={mapContainerRef} 
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Typography>Cargando mapa...</Typography>
          </div>
        )}
      </div>

      {/* Campos de ubicación detallada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Zona"
          value={datosUbicacion.zona}
          onChange={(e) => setDatosUbicacion(prev => ({
            ...prev,
            zona: e.target.value
          }))}
          error={!!errors.zona}
        />
        <Input
          label="Calle"
          value={datosUbicacion.calle}
          onChange={(e) => setDatosUbicacion(prev => ({
            ...prev,
            calle: e.target.value
          }))}
          error={!!errors.calle}
        />
      </div>

      <Input
        label="Dirección Completa"
        value={datosUbicacion.direccion_completa}
        onChange={(e) => setDatosUbicacion(prev => ({
          ...prev,
          direccion_completa: e.target.value
        }))}
        error={!!errors.direccion_completa}
      />

      <Textarea
        label="Referencias"
        value={datosUbicacion.referencias}
        onChange={(e) => setDatosUbicacion(prev => ({
          ...prev,
          referencias: e.target.value
        }))}
        rows={2}
      />

      {/* Indicador de verificación de cobertura */}
      {verificandoCobertura && (
        <Alert color="blue">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            Verificando disponibilidad en la zona...
          </div>
        </Alert>
      )}

      {/* Controles manuales de verificación de cobertura */}
      <div className="space-y-4">
        <Typography variant="h6" color="blue-gray">
          Verificación de Cobertura
        </Typography>
        
        <Typography variant="small" color="gray" className="mb-4">
          Seleccione si esta zona tiene cobertura de servicio:
        </Typography>

        <div className="flex gap-6">
          <div className="flex items-center">
            <Radio
              name="cobertura"
              value="CON_COBERTURA"
              checked={cobertura === 'CON_COBERTURA'}
              onChange={(e) => {
                setCobertura('CON_COBERTURA');
                setDatosUbicacion(prev => ({
                  ...prev,
                  cobertura: 'CON_COBERTURA'
                }));
                setErrors(prev => ({ ...prev, cobertura: undefined }));
              }}
              label={
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-green-700 font-medium">Con Cobertura</span>
                </div>
              }
            />
          </div>
          
          <div className="flex items-center">
            <Radio
              name="cobertura"
              value="SIN_COBERTURA"
              checked={cobertura === 'SIN_COBERTURA'}
              onChange={(e) => {
                setCobertura('SIN_COBERTURA');
                setDatosUbicacion(prev => ({
                  ...prev,
                  cobertura: 'SIN_COBERTURA'
                }));
                setErrors(prev => ({ ...prev, cobertura: undefined }));
              }}
              label={
                <div className="flex items-center gap-2">
                  <span className="text-red-600">❌</span>
                  <span className="text-red-700 font-medium">Sin Cobertura</span>
                </div>
              }
            />
          </div>
        </div>

        {/* Mostrar error si no se selecciona cobertura */}
        {errors.cobertura && (
          <Typography variant="small" color="red" className="mt-2">
            {errors.cobertura}
          </Typography>
        )}
      </div>

      {/* Mensaje informativo según la selección de cobertura */}
      {cobertura && !verificandoCobertura && (
        <Alert color={cobertura === 'CON_COBERTURA' ? 'green' : 'orange'}>
          <div className="flex items-center justify-between">
            <span>
              {cobertura === 'CON_COBERTURA' 
                ? '✅ Perfecto! Esta zona tiene cobertura. Puede continuar al siguiente paso para seleccionar un plan.' 
                : '⚠️ Esta zona no tiene cobertura. El cliente será registrado como "Pendiente por cobertura".'}
            </span>
            <Chip
              size="sm"
              value={cobertura === 'CON_COBERTURA' ? 'Con Cobertura' : 'Pendiente Cobertura'}
              color={cobertura === 'CON_COBERTURA' ? 'green' : 'orange'}
            />
          </div>
        </Alert>
      )}
    </div>
  );

  /**
   * PASO 3: Renderizar selección de plan (solo si hay cobertura)
   */
  const renderPlan = () => {
    // Si no hay cobertura, mostrar mensaje informativo
    if (cobertura !== 'CON_COBERTURA') {
      return (
        <div className="text-center py-8">
          <Alert color="red" className="mb-4">
            No se puede continuar porque la zona no tiene cobertura de servicio.
          </Alert>
          <Typography color="gray">
            El cliente quedará registrado como "Pendiente por cobertura" hasta que el servicio esté disponible en su zona.
          </Typography>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Typography variant="h6" color="blue-gray">
          Selección de Plan
        </Typography>

        {/* Grid de planes disponibles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {planes.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                datosPlan.plan_id === plan.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setDatosPlan(prev => ({
                ...prev,
                plan_id: plan.id
              }))}
            >
              <div className="flex items-center justify-between mb-2">
                <Typography variant="h6">{plan.descripcion}</Typography>
                <Radio
                  checked={datosPlan.plan_id === plan.id}
                  onChange={() => {}}
                />
              </div>
              <Typography variant="small" color="gray" className="mb-2">
                {plan.codigo} - {plan.tipo_basico}
              </Typography>
              <Typography variant="h5" color="blue">
                Bs. {plan.monto_basico}
              </Typography>
              <div className="mt-2 flex gap-2">
                <Chip
                  size="sm"
                  value={plan.forma_pago?.abreviacion || 'N/A'}
                  color="blue"
                />
                <Chip
                  size="sm"
                  value={plan.tipo_conexion?.nombre || 'N/A'}
                  color="green"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mensaje si no hay planes disponibles */}
        {planes.length === 0 && (
          <Alert color="amber">
            No hay planes disponibles en este momento.
          </Alert>
        )}

        {/* Campo de observaciones adicionales */}
        <div>
          <Typography variant="h6" color="blue-gray" className="mb-4">
            Observaciones
          </Typography>
          <Textarea
            label="Observaciones adicionales"
            value={datosPlan.observaciones}
            onChange={(e) => setDatosPlan(prev => ({
              ...prev,
              observaciones: e.target.value
            }))}
            rows={3}
          />
        </div>
      </div>
    );
  };

  /**
   * PASO 4: Renderizar resumen completo de los datos ingresados
   */
  const renderResumen = () => {
    // Buscar el plan seleccionado para mostrar detalles
    const planSeleccionado = planes.find(plan => plan.id === datosPlan.plan_id);

    return (
      <div className="space-y-6">
        <Typography variant="h6" color="blue-gray">
          Resumen de Información del Cliente
        </Typography>

        {/* Resumen de Datos Personales */}
        <Card className="border">
          <CardHeader floated={false} shadow={false} className="rounded-none bg-blue-50 py-3">
            <Typography variant="h6" color="blue-gray" className="flex items-center gap-2">
              👤 Información Personal
            </Typography>
          </CardHeader>
          <CardBody className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {datosPersonales.tipo_cliente === 'COMUN' ? (
                <>
                  <div>
                    <Typography variant="small" color="gray">Tipo de Cliente</Typography>
                    <Typography variant="small" className="font-medium">
                      Cliente Común (Persona Natural)
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="small" color="gray">Nombre Completo</Typography>
                    <Typography variant="small" className="font-medium">
                      {datosPersonales.nombre} {datosPersonales.apellido}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="small" color="gray">CI</Typography>
                    <Typography variant="small" className="font-medium">
                      {datosPersonales.ci || 'No especificado'}
                    </Typography>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Typography variant="small" color="gray">Tipo de Cliente</Typography>
                    <Typography variant="small" className="font-medium">
                      Cliente Empresarial
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="small" color="gray">Razón Social</Typography>
                    <Typography variant="small" className="font-medium">
                      {datosPersonales.razon_social}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="small" color="gray">NIT</Typography>
                    <Typography variant="small" className="font-medium">
                      {datosPersonales.nit || 'No especificado'}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="small" color="gray">Contacto</Typography>
                    <Typography variant="small" className="font-medium">
                      {datosPersonales.nombre} {datosPersonales.apellido}
                    </Typography>
                  </div>
                </>
              )}
              <div>
                <Typography variant="small" color="gray">Teléfono</Typography>
                <Typography variant="small" className="font-medium">
                  {datosPersonales.telefono || 'No especificado'}
                </Typography>
              </div>
              <div>
                <Typography variant="small" color="gray">Email</Typography>
                <Typography variant="small" className="font-medium">
                  {datosPersonales.email || 'No especificado'}
                </Typography>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Resumen de Ubicación */}
        <Card className="border">
          <CardHeader floated={false} shadow={false} className="rounded-none bg-green-50 py-3">
            <Typography variant="h6" color="blue-gray" className="flex items-center gap-2">
              📍 Ubicación y Cobertura
            </Typography>
          </CardHeader>
          <CardBody className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Typography variant="small" color="gray">Tipo de Vivienda</Typography>
                <Typography variant="small" className="font-medium">
                  {TIPO_VIVIENDA_OPTIONS.find(opt => opt.value === datosUbicacion.vivienda)?.label || datosUbicacion.vivienda}
                  {datosUbicacion.piso && ` - Piso ${datosUbicacion.piso}`}
                </Typography>
              </div>
              <div>
                <Typography variant="small" color="gray">Número de Puerta</Typography>
                <Typography variant="small" className="font-medium">
                  {datosUbicacion.numero_puerta || 'No especificado'}
                </Typography>
              </div>
              <div>
                <Typography variant="small" color="gray">Zona</Typography>
                <Typography variant="small" className="font-medium">
                  {datosUbicacion.zona || 'No especificado'}
                </Typography>
              </div>
              <div>
                <Typography variant="small" color="gray">Calle</Typography>
                <Typography variant="small" className="font-medium">
                  {datosUbicacion.calle || 'No especificado'}
                </Typography>
              </div>
            </div>
            
            <div className="mb-4">
              <Typography variant="small" color="gray">Dirección Completa</Typography>
              <Typography variant="small" className="font-medium">
                {datosUbicacion.direccion_completa || 'No especificada'}
              </Typography>
            </div>

            {datosUbicacion.referencias && (
              <div className="mb-4">
                <Typography variant="small" color="gray">Referencias</Typography>
                <Typography variant="small" className="font-medium">
                  {datosUbicacion.referencias}
                </Typography>
              </div>
            )}

            {/* Estado de Cobertura */}
            <div className="mt-4 pt-4 border-t">
              <Typography variant="small" color="gray" className="mb-2">Estado de Cobertura</Typography>
              <div className="flex items-center gap-2">
                <Chip
                  size="sm"
                  value={cobertura === 'CON_COBERTURA' ? 'Con Cobertura' : 'Sin Cobertura'}
                  color={cobertura === 'CON_COBERTURA' ? 'green' : 'red'}
                />
                <Typography variant="small" className="text-gray-600">
                  {cobertura === 'CON_COBERTURA' 
                    ? 'Zona con servicio disponible' 
                    : 'Zona pendiente de cobertura'}
                </Typography>
              </div>
            </div>

            {/* Coordenadas (si existen) */}
            {datosUbicacion.latitud && datosUbicacion.longitud && (
              <div className="mt-4 pt-4 border-t">
                <Typography variant="small" color="gray">Coordenadas GPS</Typography>
                <Typography variant="small" className="font-medium text-xs">
                  Lat: {parseFloat(datosUbicacion.latitud).toFixed(6)}, 
                  Lng: {parseFloat(datosUbicacion.longitud).toFixed(6)}
                </Typography>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Resumen del Plan (solo si hay cobertura) */}
        {cobertura === 'CON_COBERTURA' && planSeleccionado && (
          <Card className="border">
            <CardHeader floated={false} shadow={false} className="rounded-none bg-purple-50 py-3">
              <Typography variant="h6" color="blue-gray" className="flex items-center gap-2">
                📋 Plan Seleccionado
              </Typography>
            </CardHeader>
            <CardBody className="pt-4">
              <div className="space-y-4">
                <div>
                  <Typography variant="h6" color="blue-gray">
                    {planSeleccionado.descripcion}
                  </Typography>
                  <Typography variant="small" color="gray">
                    Código: {planSeleccionado.codigo}
                  </Typography>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Typography variant="small" color="gray">Precio Mensual</Typography>
                    <Typography variant="h6" color="blue">
                      Bs. {planSeleccionado.monto_basico}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="small" color="gray">Tipo de Plan</Typography>
                    <Typography variant="small" className="font-medium">
                      {planSeleccionado.tipo_basico}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="small" color="gray">Forma de Pago</Typography>
                    <Typography variant="small" className="font-medium">
                      {planSeleccionado.forma_pago?.descripcion || 'No especificado'}
                    </Typography>
                  </div>
                </div>

                <div>
                  <Typography variant="small" color="gray">Tipo de Conexión</Typography>
                  <Typography variant="small" className="font-medium">
                    {planSeleccionado.tipo_conexion?.nombre || 'No especificado'}
                  </Typography>
                </div>

                {/* Características adicionales del plan si existen */}
                {planSeleccionado.caracteristicas && (
                  <div>
                    <Typography variant="small" color="gray">Características</Typography>
                    <Typography variant="small" className="font-medium">
                      {planSeleccionado.caracteristicas}
                    </Typography>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Observaciones */}
        {datosPlan.observaciones && (
          <Card className="border">
            <CardHeader floated={false} shadow={false} className="rounded-none bg-gray-50 py-3">
              <Typography variant="h6" color="blue-gray" className="flex items-center gap-2">
                💬 Observaciones
              </Typography>
            </CardHeader>
            <CardBody className="pt-4">
              <Typography variant="small" className="leading-relaxed">
                {datosPlan.observaciones}
              </Typography>
            </CardBody>
          </Card>
        )}

        {/* Estado del Cliente */}
        <Card className="border">
          <CardHeader floated={false} shadow={false} className="rounded-none bg-yellow-50 py-3">
            <Typography variant="h6" color="blue-gray" className="flex items-center gap-2">
              📊 Estado del Cliente
            </Typography>
          </CardHeader>
          <CardBody className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="small" color="gray">El cliente será registrado con el estado:</Typography>
                <div className="flex items-center gap-2 mt-2">
                  <Chip
                    size="sm"
                    value={cobertura === 'CON_COBERTURA' ? 'Pendiente de Equipo' : 'Pendiente de Cobertura'}
                    color={cobertura === 'CON_COBERTURA' ? 'blue' : 'orange'}
                  />
                  <Typography variant="small" color="gray">
                    {cobertura === 'CON_COBERTURA' 
                      ? 'Listo para asignación de equipos e instalación' 
                      : 'En espera de expansión de cobertura en la zona'}
                  </Typography>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Alerta final */}
        <Alert color={cobertura === 'CON_COBERTURA' ? 'green' : 'orange'}>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {cobertura === 'CON_COBERTURA' ? '✅' : '⚠️'}
            </span>
            <div>
              <Typography variant="small" className="font-medium">
                {cobertura === 'CON_COBERTURA' 
                  ? 'Cliente listo para registro completo' 
                  : 'Cliente será registrado como pendiente'}
              </Typography>
              <Typography variant="small" className="opacity-80">
                {cobertura === 'CON_COBERTURA' 
                  ? 'Todos los datos han sido verificados y el cliente puede proceder con la instalación.' 
                  : 'El cliente será notificado cuando el servicio esté disponible en su zona.'}
              </Typography>
            </div>
          </div>
        </Alert>
      </div>
    );
  };

  // ===========================================
  // RENDERIZADO DEL COMPONENTE PRINCIPAL
  // ===========================================
  
  // Manejar error de carga de Google Maps
  if (loadError) {
    return (
      <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <Alert color="red">
            Error al cargar Google Maps: {loadError}
          </Alert>
          <Button className="mt-4" onClick={onCancel} variant="outlined">
            Cerrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-start justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl my-8">
        <Card className="w-full">
          {/* HEADER DEL MODAL CON STEPPER */}
          <CardHeader floated={false} shadow={false} className="rounded-none">
            <div className="flex items-center justify-between mb-4">
              <Typography variant="h4" color="blue-gray">
                {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
              </Typography>
              <Button
                variant="text"
                size="sm"
                onClick={onCancel}
                className="!p-2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>

            {/* STEPPER PERSONALIZADO MEJORADO */}
            <div className="w-full py-4">
              <div className="flex items-center justify-between mb-6 relative">
                {steps.map((step, index) => (
                  <div key={index} className="flex flex-col items-center flex-1 relative">
                    {/* Círculo del paso */}
                    <div
                      className={`
                        relative w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold cursor-pointer transition-all duration-300 z-10
                        ${completedSteps.has(index) || currentStep > index
                          ? 'bg-blue-500 text-white shadow-lg scale-110'
                          : currentStep === index
                          ? 'bg-blue-100 text-blue-600 border-2 border-blue-500 animate-pulse'
                          : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                        }
                      `}
                      onClick={() => {
                        // Permitir navegación solo a pasos completados o el actual
                        if (completedSteps.has(index) || index <= currentStep) {
                          setCurrentStep(index);
                        }
                      }}
                    >
                      {completedSteps.has(index) && currentStep > index ? (
                        <span>✓</span>
                      ) : (
                        <span>{step.icon}</span>
                      )}
                    </div>

                    {/* Línea conectora entre pasos */}
                    {index < steps.length - 1 && (
                      <div 
                        className={`
                          absolute top-6 h-1 transition-all duration-300 z-0
                          ${completedSteps.has(index) || currentStep > index
                            ? 'bg-blue-500'
                            : 'bg-gray-200'
                          }
                        `}
                        style={{ 
                          left: '3rem', 
                          right: `${100 - (100 / (steps.length - 1))}%`,
                          width: `calc(100% / ${steps.length - 1} - 3rem)`
                        }}
                      />
                    )}

                    {/* Información del paso */}
                    <div className="text-center mt-3 max-w-24">
                      <Typography 
                        variant="small" 
                        className={`font-medium transition-colors duration-300 ${
                          currentStep === index ? 'text-blue-600' : 
                          completedSteps.has(index) ? 'text-green-600' : 'text-gray-600'
                        }`}
                      >
                        {step.title}
                      </Typography>
                      <Typography 
                        variant="small" 
                        className="text-xs text-gray-400 mt-1 leading-tight"
                      >
                        {step.description}
                      </Typography>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          
          {/* CONTENIDO DEL FORMULARIO */}
          <CardBody>
            {/* Mostrar errores generales */}
            {errors.general && (
              <Alert color="red" className="mb-4">
                {errors.general}
              </Alert>
            )}

            {/* Contenido del paso actual */}
            <div className="min-h-[400px]">
              {renderStepContent()}
            </div>

            {/* BOTONES DE NAVEGACIÓN */}
            <div className="flex justify-between items-center pt-6 border-t mt-6">
              {/* Botón Anterior/Cancelar */}
              <Button
                variant="outlined"
                onClick={currentStep === 0 ? onCancel : handlePrevious}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {currentStep === 0 ? (
                  <>
                    <span>✕</span>
                    Cancelar
                  </>
                ) : (
                  <>
                    <span>←</span>
                    Anterior
                  </>
                )}
              </Button>

              {/* Botones de Siguiente/Finalizar */}
              <div className="flex gap-2">
                {/* Botón para generar PDF (solo en el último paso) */}
                {currentStep === steps.length - 1 && (
                  <Button
                    variant="outlined"
                    color="blue-gray"
                    onClick={generarPDF}
                    className="flex items-center gap-2 mr-2"
                  >
                    <i className="fas fa-file-pdf"></i>
                    Generar PDF
                  </Button>
                )}
                
                {currentStep < steps.length - 1 ? (
                  <>
                    {/* Botón Siguiente normal */}
                    {(currentStep !== 1 || cobertura === 'CON_COBERTURA') && (
                      <Button
                        onClick={handleNext}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 flex items-center gap-2"
                      >
                        Siguiente
                        <span>→</span>
                      </Button>
                    )}
                    
                    {/* Botón especial para avanzar sin cobertura */}
                    {currentStep === 1 && cobertura === 'SIN_COBERTURA' && (
                      <Button
                        onClick={handleNext}
                        disabled={loading}
                        className="bg-orange-500 hover:bg-orange-600 flex items-center gap-2"
                      >
                        Ir a Resumen
                        <span>→</span>
                      </Button>
                    )}
                  </>
                ) : (
                  /* Botón de Finalizar en el último paso */
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    loading={loading}
                    className={`flex items-center gap-2 ${
                      cobertura === 'CON_COBERTURA' 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    {loading ? (
                      'Procesando...'
                    ) : (
                      <>
                        <span>✓</span>
                        {isEditing ? 'Actualizar' : 'Crear'} Cliente
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ClienteForm;