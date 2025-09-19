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
  Tab,
  Spinner
} from '@material-tailwind/react';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MapPinIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  UserIcon,
  HomeIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { useLeafletMap } from './hooks/useLeafletMap';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { jsPDF } from 'jspdf';
import { 
  clienteService, 
  CLIENTE_ESTADOS, 
  COBERTURA_CHOICES, 
  TIPO_CLIENTE_CHOICES, 
  VIVIENDA_CHOICES 
} from '../maps/services/apiService';

// Función para formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return 'No especificada';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-ES', options);
};

/**
 * Funciones auxiliares para obtener información de estados y tipos
 * Estas funciones proporcionan información visual para los chips y elementos de la UI
 */
const getEstadoInfo = (estado) => {
  const estadosMap = {
    'PEND_COBERTURA': {
      label: 'Pend. Cobertura',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800'
    },
    'PEND_EQUIPO': {
      label: 'Pend. Equipo',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800'
    },
    'PEND_INSTALACION': {
      label: 'Pend. Instalación',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800'
    },
    'ACTIVO': {
      label: 'Activo',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800'
    },
    'SUSPENDIDO': {
      label: 'Suspendido',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800'
    }
  };
  return estadosMap[estado] || { label: estado, bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
};

const getCoberturaInfo = (cobertura) => {
  const coberturaMap = {
    'CON_COBERTURA': {
      label: 'Con Cobertura',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800'
    },
    'SIN_COBERTURA': {
      label: 'Sin Cobertura',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800'
    }
  };
  return coberturaMap[cobertura] || { label: cobertura, bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
};

const getTipoClienteInfo = (tipoCliente) => {
  const tipoMap = {
    'COMUN': {
      label: 'Usuario Común',
      icon: <UserIcon className="h-4 w-4" />,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800'
    },
    'EMPRESA': {
      label: 'Empresa',
      icon: <BuildingOfficeIcon className="h-4 w-4" />,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800'
    }
  };
  return tipoMap[tipoCliente] || { label: tipoCliente, icon: null, bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
};

// Función auxiliar para obtener el color del marcador según el estado
const getMarkerColor = (estado) => {
  const colors = {
    'PEND_COBERTURA': 'orange',
    'PEND_EQUIPO': 'yellow',
    'PEND_INSTALACION': 'blue',
    'ACTIVO': 'green',
    'SUSPENDIDO': 'red'
  };
  return colors[estado] || 'gray';
};

/**
 * Componente principal ClienteList
 * Maneja la visualización y filtrado de la lista de clientes
 * 
 * @param {Function} onEdit - Callback para editar cliente
 * @param {Function} onView - Callback para ver detalles del cliente
 * @param {Function} onDelete - Callback para eliminar cliente
 * @param {number} refreshTrigger - Trigger para refrescar la lista
 */
const ClienteList = ({ onEdit, onView, onDelete, refreshTrigger }) => {
  // Estados principales
  const [clientes, setClientes] = useState([]);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para el mapa
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  // Estado para navegación por tabs
  const [activeTab, setActiveTab] = useState('todos');

  // Estados para filtros
  const [filters, setFilters] = useState({
    search: '',           // Búsqueda general por texto
    estado: '',          // Filtro por estado del cliente
    cobertura: '',       // Filtro por tipo de cobertura
    tipo_cliente: '',    // Filtro por tipo de cliente (común/empresa)
    zona: '',           // Filtro por zona geográfica
    vivienda: ''        // Filtro por tipo de vivienda
  });

  // Referencias para el mapa
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  // Hook personalizado para Leaflet
  const {
    isLoaded,
    initializeMap,
    createMarker,
    clearMarkers,
    centerMap
  } = useLeafletMap();

  /**
   * Efecto para inicializar el mapa cuando se abre el modal
   * Se ejecuta cuando cambia showMap, isLoaded o selectedCliente
   */
  useEffect(() => {
    if (showMap && isLoaded && mapContainerRef.current) {
      const timer = setTimeout(() => {
        // Determinar centro del mapa basado en si hay un cliente seleccionado
        const center = selectedCliente?.latitud && selectedCliente?.longitud 
          ? [
              parseFloat(selectedCliente.latitud), 
              parseFloat(selectedCliente.longitud)
            ]
          : [-16.5000, -68.1193]; // La Paz centro como fallback

        const map = initializeMap(mapContainerRef.current, {
          center,
          zoom: selectedCliente ? 16 : 12 // Zoom más cercano si hay cliente específico
        });

        // Configurar iconos de Leaflet
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });

        mapInstanceRef.current = map;
        setMapReady(true);
      }, 100); // Pequeño delay para asegurar que el DOM esté listo

      return () => {
        clearTimeout(timer);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, [showMap, isLoaded, selectedCliente, initializeMap]);

  /**
   * Efecto para actualizar el marcador en el mapa
   * Se ejecuta cuando el mapa está listo y hay un cliente seleccionado
   */
  useEffect(() => {
    if (mapReady && selectedCliente && selectedCliente.latitud && selectedCliente.longitud) {
      clearMarkers(); // Limpiar marcadores anteriores

      const position = {
        lat: parseFloat(selectedCliente.latitud),
        lng: parseFloat(selectedCliente.longitud)
      };
      
      // Centrar el mapa en la posición del cliente
      centerMap(position.lat, position.lng, 16);

      // Crear marcador para el cliente
      const marker = createMarker(position, {
        title: selectedCliente.tipo_cliente === 'EMPRESA' 
          ? selectedCliente.razon_social 
          : `${selectedCliente.nombre} ${selectedCliente.apellido}`,
        draggable: false
      });

      // Crear contenido para la ventana de información
      // Crear marcador con tooltip
      createMarker(position, {
        title: selectedCliente.nombre_completo || 'Cliente',
        popup: `
          <div class="p-2 max-w-xs">
            <h3 class="font-bold text-lg mb-2">${selectedCliente.nombre_completo || 'Sin nombre'}</h3>
            <div class="space-y-1 text-sm">
              <p><strong>Email:</strong> ${selectedCliente.email || 'No disponible'}</p>
              <p><strong>Teléfono:</strong> ${selectedCliente.telefono || 'No disponible'}</p>
              <p><strong>Dirección:</strong> ${selectedCliente.direccion_completa || 'No disponible'}</p>
              <p><strong>Estado:</strong> ${selectedCliente.estado_display || selectedCliente.estado || 'No especificado'}</p>
            </div>
          </div>
        `,
        icon: L.icon({
          iconUrl: `https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png`,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          tooltipAnchor: [16, -28],
          shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
          shadowSize: [41, 41],
          shadowAnchor: [12, 41],
          className: `marker-${getMarkerColor(selectedCliente.estado)}`,
        }),
      });
    }
  }, [selectedCliente, mapReady, clearMarkers, createMarker, centerMap]);

  /**
   * Efecto para cargar clientes al montar el componente y cuando cambie refreshTrigger
   */
  useEffect(() => {
    loadClientes();
  }, [refreshTrigger]);

  /**
   * Efecto para aplicar filtros cuando cambien los clientes o los filtros
   */
  useEffect(() => {
    applyFilters();
  }, [clientes, filters, activeTab]);

  /**
   * Función para cargar la lista de clientes desde la API
   */
  const loadClientes = async () => {
    console.log('Iniciando carga de clientes...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('Realizando petición a la API...');
      const data = await clienteService.getAll();
      console.log('Respuesta de la API:', data);
      
      // Manejar diferentes formatos de respuesta de la API
      const clientesArray = Array.isArray(data) ? data : (data.results || []);
      console.log('Clientes procesados:', clientesArray);
      
      if (!Array.isArray(clientesArray)) {
        console.error('Formato de datos inválido recibido del servidor:', data);
        throw new Error('Formato de datos inválido recibido del servidor');
      }

      // Formatear clientes para facilitar su uso en la UI
      const formattedClientes = clientesArray.map(cliente => ({
        ...cliente,
        // Crear nombre completo combinando nombre y apellido
        nombre_completo: `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim(),
        // Crear dirección completa si no existe
        direccion_completa: cliente.direccion_completa || 
                           `${cliente.calle || ''}, ${cliente.zona || ''}`.trim().replace(/^,\s*/, ''),
        // Agregar información formateada para la UI
        estado_info: getEstadoInfo(cliente.estado),
        cobertura_info: getCoberturaInfo(cliente.cobertura),
        tipo_cliente_info: getTipoClienteInfo(cliente.tipo_cliente)
      }));
      
      setClientes(formattedClientes);
      
    } catch (err) {
      console.error('Error cargando clientes:', err);
      setError(err.message || 'Error al cargar clientes');
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función para aplicar todos los filtros a la lista de clientes
   */
  const applyFilters = () => {
    if (!Array.isArray(clientes)) {
      setFilteredClientes([]);
      return;
    }

    let filtered = [...clientes];

    // Filtro por tab activo (estado específico)
    if (activeTab !== 'todos') {
      filtered = filtered.filter(cliente => cliente.estado === activeTab);
    }

    // Filtro por búsqueda general (múltiples campos)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase().trim();
      filtered = filtered.filter(cliente =>
        // Buscar en campos de nombre y datos personales
        (cliente.nombre || '').toLowerCase().includes(searchLower) ||
        (cliente.apellido || '').toLowerCase().includes(searchLower) ||
        (cliente.razon_social || '').toLowerCase().includes(searchLower) ||
        // Buscar en datos de contacto
        (cliente.email || '').toLowerCase().includes(searchLower) ||
        (cliente.telefono || '').toLowerCase().includes(searchLower) ||
        // Buscar en documentos de identidad
        (cliente.ci || '').toString().toLowerCase().includes(searchLower) ||
        (cliente.nit || '').toString().toLowerCase().includes(searchLower) ||
        // Buscar en ubicación
        (cliente.zona || '').toLowerCase().includes(searchLower) ||
        (cliente.calle || '').toLowerCase().includes(searchLower) ||
        (cliente.direccion_completa || '').toLowerCase().includes(searchLower)
      );
    }

    // Filtros específicos por campo
    if (filters.estado) {
      filtered = filtered.filter(cliente => cliente.estado === filters.estado);
    }

    if (filters.cobertura) {
      filtered = filtered.filter(cliente => cliente.cobertura === filters.cobertura);
    }

    if (filters.tipo_cliente) {
      filtered = filtered.filter(cliente => cliente.tipo_cliente === filters.tipo_cliente);
    }

    if (filters.zona) {
      const zonaLower = filters.zona.toLowerCase().trim();
      filtered = filtered.filter(cliente => 
        (cliente.zona || '').toLowerCase().includes(zonaLower)
      );
    }

    if (filters.vivienda) {
      filtered = filtered.filter(cliente => cliente.vivienda === filters.vivienda);
    }

    setFilteredClientes(filtered);
  };

  /**
   * Maneja el cambio de un filtro específico
   * @param {string} name - Nombre del filtro
   * @param {string} value - Nuevo valor del filtro
   */
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value || '' // Asegurar que no sea null/undefined
    }));
  };

  /**
   * Limpia todos los filtros aplicados
   */
  const clearFilters = () => {
    setFilters({
      search: '',
      estado: '',
      cobertura: '',
      tipo_cliente: '',
      zona: '',
      vivienda: ''
    });
    setActiveTab('todos'); // También resetear el tab activo
  };

  /**
   * Muestra un cliente específico en el mapa
   * @param {Object} cliente - Cliente a mostrar
   */
  const showClienteOnMap = (cliente) => {
    setSelectedCliente(cliente);
    setShowMap(true);
    setMapReady(false);
    mapInstanceRef.current = null;
  };

  /**
   * Maneja el cambio de estado de un cliente
   * @param {number} clienteId - ID del cliente
   * @param {string} nuevoEstado - Nuevo estado
   * @param {string} observaciones - Observaciones opcionales
   */
  const handleEstadoChange = async (clienteId, nuevoEstado, observaciones = '') => {
    if (!clienteId || !nuevoEstado) return;

    try {
      setError(null);
      await clienteService.cambiarEstado(clienteId, nuevoEstado, observaciones);
      
      // Actualizar el cliente en el estado local inmediatamente
      setClientes(prevClientes => 
        prevClientes.map(cliente => 
          cliente.id === clienteId 
            ? { 
                ...cliente, 
                estado: nuevoEstado, 
                estado_info: getEstadoInfo(nuevoEstado),
                observaciones: observaciones || cliente.observaciones
              }
            : cliente
        )
      );
      
    } catch (err) {
      console.error('Error cambiando estado:', err);
      setError(`Error al cambiar estado: ${err.message}`);
    }
  };

  /**
   * Genera un PDF para el cliente
   */
  const generatePDF = async (cliente) => {
    try {
      setGeneratingPDF(true);
      
      // Crear una nueva instancia de jsPDF
      const doc = new jsPDF();
      
      // Configuración inicial
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = 20;
      const primaryColor = [30, 64, 175]; // Azul corporativo
      const watermarkColor = [200, 200, 200]; // Color gris claro para la marca de agua
      
      // Función para la marca de agua
      const addWatermark = () => {
        const fontSize = 60; // Reducir tamaño de la marca de agua
        const text = 'COTEL';
        
        doc.setFontSize(fontSize);
        doc.setTextColor(watermarkColor[0], watermarkColor[1], watermarkColor[2]);
        doc.setFont('helvetica', 'bold');
        
        const textWidth = doc.getTextWidth(text);
        const x = (pageWidth - textWidth) / 2;
        const y = pageHeight / 2;
        
        doc.setGState(doc.GState({opacity: 0.08})); // Reducir opacidad
        doc.text(text, x, y, { angle: 30 });
        
        // Restaurar configuración
        doc.setGState(doc.GState({opacity: 1}));
        doc.setFontSize(10); // Tamaño de fuente más pequeño
        doc.setTextColor(0, 0, 0);
      };
      
      // Función para agregar texto con estilo
      const addText = (text, x, y, options = {}) => {
        const { 
          size = 11, 
          style = 'normal', 
          align = 'left', 
          color = [0, 0, 0],
          maxWidth = pageWidth - margin * 2
        } = options;
        
        const prevFont = doc.getFont();
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(...color);
        
        const lines = doc.splitTextToSize(text, maxWidth);
        let xPos = x;
        
        lines.forEach((line, i) => {
          const textWidth = doc.getTextWidth(line);
          
          if (align === 'center') {
            xPos = (pageWidth - textWidth) / 2;
          } else if (align === 'right') {
            xPos = pageWidth - margin - textWidth;
          }
          
          doc.text(line, xPos, y + (i * (size * 0.35 + 2)));
        });
        
        doc.setFont(prevFont.fontName, prevFont.fontStyle);
        return lines.length * (size * 0.35 + 2);
      };

      // Función para agregar una sección con título y líneas de texto
      const addSection = (title, items, startY) => {
        let currentY = startY;
        
        // Verificar si hay suficiente espacio para la sección
        const sectionHeight = items.length * 10 + 15; // Reducir altura estimada
        if (currentY + sectionHeight > pageHeight - 50) {
          // Agregar pie de página a la página actual
          addFooter(1);
          // Agregar nueva página
          doc.addPage();
          // Agregar marca de agua en la nueva página
          addWatermark();
          currentY = 30; // Resetear posición Y para la nueva página
        }
        
        // Título de sección con fondo
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(margin, currentY, pageWidth - margin * 2, 10, 2, 2, 'F');
        addText(title, margin + 8, currentY + 7, { 
          size: 10, 
          style: 'bold',
          color: primaryColor
        });
        
        currentY += 12;
        
        // Contenido de la sección
        items.forEach(([label, value]) => {
          const labelText = `${label}:`;
          const labelWidth = doc.getTextWidth(labelText) + 5;
          
          // Etiqueta
          addText(labelText, margin + 5, currentY + 5, { 
            style: 'bold',
            size: 10
          });
          
          // Valor con fondo
          const valueText = value || 'No especificado';
          const valueLines = doc.splitTextToSize(
            valueText, 
            pageWidth - margin * 2 - labelWidth - 10
          );
          
          // Calcular altura del valor
          const valueHeight = Math.max(8, valueLines.length * 4);
          
          // Fondo del valor
          doc.setFillColor(250, 250, 250);
          doc.roundedRect(
            margin + labelWidth, 
            currentY, 
            pageWidth - margin * 2 - labelWidth - 5, 
            valueHeight + 4, 
            2, 2, 'FD'
          );
          
          // Borde sutil
          doc.setDrawColor(220, 220, 220);
          doc.roundedRect(
            margin + labelWidth, 
            currentY, 
            pageWidth - margin * 2 - labelWidth - 5, 
            valueHeight + 4, 
            2, 2, 'S'
          );
          
          // Texto del valor
          addText(
            valueText, 
            margin + labelWidth + 5, 
            currentY + 5, 
            { 
              size: 10,
              color: [80, 80, 80],
              maxWidth: pageWidth - margin * 2 - labelWidth - 15
            }
          );
          
          currentY += valueHeight + 6; // Reducir espacio entre líneas
        });
        
        return currentY + 5; // Reducir espacio después de la sección
      };

      // Función para el pie de página
      const addFooter = (pageNumber) => {
        const footerY = pageHeight - 15;
        doc.setFontSize(7); // Fuente más pequeña
        doc.setTextColor(100, 100, 100);
        doc.setLineWidth(0.1); // Línea más delgada
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
        doc.text(
          `Página ${pageNumber} • Documento generado el ${new Date().toLocaleDateString()}`,
          pageWidth / 2,
          footerY,
          { align: 'center' }
        );
      };

      // Agregar marca de agua
      addWatermark();
      
      // Encabezado
      addText('COTEL S.A.', pageWidth / 2, yPos, {
        size: 16,
        style: 'bold',
        align: 'center',
        color: primaryColor
      });
      
      addText('INFORMACIÓN DEL CLIENTE', pageWidth / 2, yPos + 8, {
        size: 12,
        style: 'bold',
        align: 'center'
      });
      
      // Línea decorativa más delgada
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos + 16, pageWidth - margin, yPos + 16);
      
      // Fecha
      addText(
        `Fecha: ${new Date().toLocaleDateString('es-ES', { 
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        })}`,
        pageWidth - margin,
        yPos + 25,
        { align: 'right', size: 9 }
      );
      
      yPos += 20; // Menor espacio después del encabezado

      // Sección de Datos Personales
      const datosPersonalesItems = [
        ['Nombres', `${cliente.nombre || ''} ${cliente.apellido_paterno || ''} ${cliente.apellido_materno || ''}`.trim()],
        ['CI/NIT', cliente.ci_nit || 'No especificado'],
        ['Teléfono', cliente.telefono || 'No especificado'],
        ['Email', cliente.email || 'No especificado'],
        ['Tipo de Cliente', getTipoClienteInfo(cliente.tipo_cliente).label],
        ['Estado', getEstadoInfo(cliente.estado).label],
        ['Fecha de Registro', formatDate(cliente.fecha_registro)]
      ];
      
      // Sección de Ubicación
      const ubicacionItems = [
        ['Dirección', cliente.direccion || 'No especificada'],
        ['Zona', cliente.zona || 'No especificada'],
        ['Referencia', cliente.referencia || 'No especificada']
      ];
      
      // Agregar secciones
      yPos = addSection('DATOS PERSONALES', datosPersonalesItems, yPos);
      yPos = addSection('UBICACIÓN', ubicacionItems, yPos);
      
      // Agregar observaciones si existen
      if (cliente.observaciones) {
        yPos = addSection('OBSERVACIONES', [['', cliente.observaciones]], yPos);
      }
      
      // Agregar pie de página
      addFooter(1);
      
      // Guardar el PDF
      doc.save(`cliente_${cliente.ci_nit || cliente.id}.pdf`);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setError('Error al generar el PDF: ' + (error.message || 'Error desconocido'));
    } finally {
      setGeneratingPDF(false);
    }
  };

  /**
   * Cierra el modal del mapa y limpia referencias
   */
  const handleCloseMap = () => {
    setShowMap(false);
    setSelectedCliente(null);
    setMapReady(false);
    if (mapInstanceRef.current) {
      clearMarkers();
      mapInstanceRef.current = null;
    }
  };

  /**
   * Calcula estadísticas para los tabs de estado
   */
  const tabsData = [
    { label: 'Todos', value: 'todos', count: clientes.length },
    { label: 'Pend. Cobertura', value: 'PEND_COBERTURA', count: clientes.filter(c => c.estado === 'PEND_COBERTURA').length },
    { label: 'Pend. Equipo', value: 'PEND_EQUIPO', count: clientes.filter(c => c.estado === 'PEND_EQUIPO').length },
    { label: 'Pend. Instalación', value: 'PEND_INSTALACION', count: clientes.filter(c => c.estado === 'PEND_INSTALACION').length },
    { label: 'Activos', value: 'ACTIVO', count: clientes.filter(c => c.estado === 'ACTIVO').length },
    { label: 'Suspendidos', value: 'SUSPENDIDO', count: clientes.filter(c => c.estado === 'SUSPENDIDO').length }
  ];

  // Mostrar spinner mientras carga
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
    <div className="space-y-6">
      <Card>
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="flex items-center justify-between">
            <Typography variant="h4" color="blue-gray">
              Lista de Clientes
            </Typography>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outlined"
                className="flex items-center gap-2"
                onClick={() => setShowMap(true)}
                disabled={!isLoaded}
              >
                <MapPinIcon className="h-4 w-4" />
                {isLoaded ? 'Ver Todos en Mapa' : 'Cargando Mapa...'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          {/* Mensaje de error */}
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
                onClick={() => setError(null)}
              >
                Cerrar
              </Button>
            </Alert>
          )}

          {/* Sección de filtros mejorada */}
          <div className="mb-8 bg-gray-50 p-5 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <Typography variant="h6" color="blue-gray" className="font-medium text-lg">
                Filtros de Búsqueda
              </Typography>
              <Button
                variant="outlined"
                size="sm"
                color="blue-gray"
                className="flex items-center gap-1 px-3 py-2 text-sm whitespace-nowrap"
                onClick={clearFilters}
                disabled={!Object.values(filters).some(f => f) && activeTab === 'todos'}
              >
                <FunnelIcon className="h-4 w-4" />
                Limpiar Filtros
              </Button>
            </div>
            
            {/* Barra de búsqueda */}
            <div className="mb-5">
              <Input
                label="Buscar cliente"
                icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Nombre, email, CI, NIT, teléfono, zona..."
                className="bg-white border-gray-300 focus:border-blue-500"
                labelProps={{
                  className: "text-sm"
                }}
                containerProps={{
                  className: "min-w-0"
                }}
              />
            </div>

            {/* Filtros específicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 -mx-1">
              {/* Filtro por Estado */}
              <div className="w-full">
                <Typography variant="small" color="blue-gray" className="mb-1 font-medium">
                  Estado
                </Typography>
                <Select
                  value={filters.estado}
                  onChange={(value) => handleFilterChange('estado', value)}
                  className="w-full bg-white border border-gray-300 rounded-md text-sm"
                  containerProps={{ 
                    className: "min-w-0"
                  }}
                  labelProps={{ 
                    className: "hidden" 
                  }}
                  menuProps={{
                    className: "z-50"
                  }}
                >
                  <Option value="" className="text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                      <span>Todos los estados</span>
                    </div>
                  </Option>
                  {CLIENTE_ESTADOS.map(option => {
                    const estadoInfo = getEstadoInfo(option.value);
                    return (
                      <Option key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${estadoInfo.color}`}></div>
                          <span>{option.label}</span>
                        </div>
                      </Option>
                    );
                  })}
                </Select>
              </div>

              {/* Filtro por Cobertura */}
              <div className="w-full">
                <Typography variant="small" color="blue-gray" className="mb-1 font-medium">
                  Cobertura
                </Typography>
                <Select
                  value={filters.cobertura}
                  onChange={(value) => handleFilterChange('cobertura', value)}
                  className="w-full bg-white border border-gray-300 rounded-md text-sm"
                  containerProps={{ 
                    className: "min-w-0"
                  }}
                  labelProps={{ 
                    className: "hidden" 
                  }}
                  menuProps={{
                    className: "z-50"
                  }}
                >
                  <Option value="" className="text-gray-600">Todas las coberturas</Option>
                  {COBERTURA_CHOICES.map(option => {
                    const coberturaInfo = getCoberturaInfo(option.value);
                    return (
                      <Option key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${coberturaInfo.color}`}></div>
                          <span>{option.label}</span>
                        </div>
                      </Option>
                    );
                  })}
                </Select>
              </div>

              {/* Filtro por Tipo de Cliente */}
              <div className="w-full">
                <Typography variant="small" color="blue-gray" className="mb-1 font-medium">
                  Tipo de Cliente
                </Typography>
                <Select
                  value={filters.tipo_cliente}
                  onChange={(value) => handleFilterChange('tipo_cliente', value)}
                  className="w-full bg-white border border-gray-300 rounded-md text-sm"
                  containerProps={{ 
                    className: "min-w-0"
                  }}
                  labelProps={{ 
                    className: "hidden" 
                  }}
                  menuProps={{
                    className: "z-50"
                  }}
                >
                  <Option value="" className="text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 flex items-center justify-center">
                        <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <span>Todos los tipos</span>
                    </div>
                  </Option>
                  {TIPO_CLIENTE_CHOICES.map(option => {
                    const tipoInfo = getTipoClienteInfo(option.value);
                    return (
                      <Option key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.value === 'EMPRESA' ? (
                            <BuildingOfficeIcon className="h-4 w-4 text-blue-500" />
                          ) : (
                            <UserIcon className="h-4 w-4 text-green-500" />
                          )}
                          <span>{option.label}</span>
                        </div>
                      </Option>
                    );
                  })}
                </Select>
              </div>

              {/* Filtro por Tipo de Vivienda */}
              <div className="w-full">
                <Typography variant="small" color="blue-gray" className="mb-1 font-medium">
                  Tipo de Vivienda
                </Typography>
                <Select
                  value={filters.vivienda}
                  onChange={(value) => handleFilterChange('vivienda', value)}
                  className="w-full bg-white border border-gray-300 rounded-md text-sm"
                  containerProps={{ 
                    className: "min-w-0"
                  }}
                  labelProps={{ 
                    className: "hidden" 
                  }}
                  menuProps={{
                    className: "z-50"
                  }}
                >
                  <Option value="" className="text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 flex items-center justify-center">
                        <HomeIcon className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <span>Todos los tipos</span>
                    </div>
                  </Option>
                  {VIVIENDA_CHOICES.map(option => (
                    <Option key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <HomeIcon className="h-4 w-4 text-purple-500" />
                        <span>{option.label}</span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </div>

              {/* Filtro por Zona */}
              <div className="w-full">
                <Typography variant="small" color="blue-gray" className="mb-1 font-medium">
                  Zona
                </Typography>
                <Input
                  value={filters.zona}
                  onChange={(e) => handleFilterChange('zona', e.target.value)}
                  placeholder="Filtrar por zona"
                  className="w-full bg-white border border-gray-300 rounded-md text-sm focus:border-blue-500"
                  icon={<MapPinIcon className="h-5 w-5 text-gray-500" />}
                  labelProps={{
                    className: "hidden"
                  }}
                  containerProps={{
                    className: "min-w-0"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tabs por estado con contadores */}
          <Tabs value={activeTab} className="mb-6">
            <TabsHeader className="grid w-full grid-cols-3 lg:grid-cols-6">
              {tabsData.map(({ label, value, count }) => (
                <Tab 
                  key={value} 
                  value={value}
                  onClick={() => setActiveTab(value)}
                  className="text-xs"
                >
                  {label} ({count})
                </Tab>
              ))}
            </TabsHeader>
          </Tabs>

          {/* Lista de clientes o mensajes de estado vacío */}
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
              <Typography variant="small" color="gray" className="mb-4">
                Total de clientes: {clientes.length}
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
            <div className="space-y-1">
              {/* Información de resultados */}
              <div className="flex items-center justify-between mb-4">
                <Typography variant="small" color="gray">
                  Mostrando {filteredClientes.length} de {clientes.length} clientes
                </Typography>
                {(Object.values(filters).some(f => f) || activeTab !== 'todos') && (
                  <Button
                    variant="text"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-1"
                  >
                    <FunnelIcon className="h-3 w-3" />
                    Limpiar filtros
                  </Button>
                )}
              </div>

              {/* Grid de tarjetas de clientes */}
              <div className="grid gap-4">
                {filteredClientes.map((cliente) => (
                  <Card key={cliente.id} className="border hover:shadow-md transition-shadow">
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between">
                        {/* Información principal del cliente */}
                        <div className="flex-1">
                          {/* Encabezado con nombre y chips de estado */}
                          <div className="flex items-center gap-3 mb-3">
                            {getTipoClienteInfo(cliente.tipo_cliente).icon}
                            <Typography variant="h6" color="blue-gray">
                              {cliente.tipo_cliente === 'EMPRESA' 
                                ? (cliente.razon_social || 'Empresa sin nombre')
                                : (cliente.nombre_completo || 'Nombre no disponible')
                              }
                            </Typography>
                            <div className="flex gap-2">
                              <Chip
                                size="sm"
                                value={cliente.estado_info.label}
                                className={`${cliente.estado_info.bgColor} ${cliente.estado_info.textColor}`}
                              />
                              <Chip
                                size="sm"
                                value={cliente.cobertura_info.label}
                                className={`${cliente.cobertura_info.bgColor} ${cliente.cobertura_info.textColor}`}
                              />
                            </div>
                          </div>
                          
                          {/* Grid de información detallada */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-3">
                            {cliente.tipo_cliente === 'EMPRESA' ? (
                              <>
                                <div>
                                  <Typography variant="small" color="gray">NIT:</Typography>
                                  <Typography variant="small" className="font-medium">
                                    {cliente.nit || 'No disponible'}
                                  </Typography>
                                </div>
                                <div>
                                  <Typography variant="small" color="gray">Contacto:</Typography>
                                  <Typography variant="small" className="font-medium">
                                    {cliente.nombre_completo || 'No disponible'}
                                  </Typography>
                                </div>
                              </>
                            ) : (
                              <div>
                                <Typography variant="small" color="gray">CI:</Typography>
                                <Typography variant="small" className="font-medium">
                                  {cliente.ci || 'No disponible'}
                                </Typography>
                              </div>
                            )}
                            
                            <div>
                              <Typography variant="small" color="gray">Email:</Typography>
                              <Typography variant="small" className="font-medium">
                                {cliente.email || 'No disponible'}
                              </Typography>
                            </div>
                            <div>
                              <Typography variant="small" color="gray">Teléfono:</Typography>
                              <Typography variant="small" className="font-medium">
                                {cliente.telefono || 'No disponible'}
                              </Typography>
                            </div>
                            <div>
                              <Typography variant="small" color="gray">Vivienda:</Typography>
                              <Typography variant="small" className="font-medium">
                                {cliente.vivienda || 'No especificado'}
                                {cliente.piso && ` - Piso ${cliente.piso}`}
                              </Typography>
                            </div>
                          </div>
                          
                          {/* Información de dirección */}
                          <div className="mb-2">
                            <Typography variant="small" color="gray">Dirección:</Typography>
                            <Typography variant="small" className="font-medium">
                              {cliente.direccion_completa || 'Dirección no disponible'}
                            </Typography>
                            {cliente.numero_puerta && (
                              <Typography variant="small" color="gray">
                                Puerta: {cliente.numero_puerta}
                              </Typography>
                            )}
                          </div>

                          {/* Información del plan */}
                          {cliente.plan && (
                            <div className="mb-2">
                              <Typography variant="small" color="gray">Plan:</Typography>
                              <Typography variant="small" className="font-medium text-blue-600">
                                {cliente.plan.descripcion} - Bs. {cliente.plan.monto_basico}
                              </Typography>
                            </div>
                          )}
                          
                          {/* Observaciones */}
                          {cliente.observaciones && (
                            <div className="mt-2">
                              <Typography variant="small" color="gray">Observaciones:</Typography>
                              <Typography variant="small" className="text-gray-600">
                                {cliente.observaciones}
                              </Typography>
                            </div>
                          )}
                        </div>

                        {/* Panel de acciones lateral */}
                        <div className="flex flex-col gap-2 ml-4">
                          {/* Botones de acción */}
                          <div className="flex gap-1">
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
                            
                            <IconButton
                              size="sm"
                              variant="text"
                              color="blue"
                              onClick={() => generatePDF(cliente)}
                              title="Generar PDF"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4" />
                            </IconButton>
                          </div>

                          {/* Selector de cambio rápido de estado */}
                          <Select
                            size="sm"
                            value={cliente.estado || ''}
                            onChange={(value) => handleEstadoChange(cliente.id, value)}
                            className="min-w-[150px]"
                            label="Cambiar estado"
                          >
                            {CLIENTE_ESTADOS.map(option => (
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
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal del Mapa */}
      <Dialog
        size="xl"
        open={showMap}
        handler={handleCloseMap}
        className="max-w-6xl"
      >
        <DialogHeader>
          <Typography variant="h5">
            {selectedCliente 
              ? `Ubicación de ${
                  selectedCliente.tipo_cliente === 'EMPRESA' 
                    ? selectedCliente.razon_social 
                    : selectedCliente.nombre_completo
                }` 
              : 'Ubicaciones de Clientes'
            }
          </Typography>
        </DialogHeader>
        
        <DialogBody className="p-0">
          <div className="h-96 w-full relative">
            {!isLoaded ? (
              <div className="flex items-center justify-center h-full">
                <Typography>Cargando mapa...</Typography>
              </div>
            ) : (
              <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />
            )}
            {!mapReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <Spinner className="h-6 w-6 mr-2" />
                <Typography>Inicializando mapa...</Typography>
              </div>
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
  ); 
};

export default ClienteList;