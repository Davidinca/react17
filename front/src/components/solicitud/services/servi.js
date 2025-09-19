// src/services/apiService.js
import axios from 'axios';

// === CONFIGURACIÓN BASE ===
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// === INTERCEPTORES ===
// Request interceptor - para autenticación
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log de requests en desarrollo
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - manejo de errores global
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase()
    };
    
    console.error('❌ API Error:', errorDetails);
    
    // Manejo de errores específicos
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // Opcional: redirigir a login
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// === CLASE BASE PARA SERVICIOS ===
class BaseService {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async getAll(params = {}) {
    try {
      const response = await apiClient.get(`${this.endpoint}/`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Error al obtener ${this.endpoint}`);
    }
  }

  async getById(id) {
    try {
      const response = await apiClient.get(`${this.endpoint}/${id}/`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Error al obtener ${this.endpoint} con ID ${id}`);
    }
  }

  async create(data) {
    try {
      const response = await apiClient.post(`${this.endpoint}/`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Error al crear ${this.endpoint}`, true);
    }
  }

  async update(id, data) {
    try {
      const response = await apiClient.put(`${this.endpoint}/${id}/`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Error al actualizar ${this.endpoint}`, true);
    }
  }

  async partialUpdate(id, data) {
    try {
      const response = await apiClient.patch(`${this.endpoint}/${id}/`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Error al actualizar parcialmente ${this.endpoint}`, true);
    }
  }

  async delete(id) {
    try {
      await apiClient.delete(`${this.endpoint}/${id}/`);
      return { success: true, message: `${this.endpoint} eliminado correctamente` };
    } catch (error) {
      throw this.handleError(error, `Error al eliminar ${this.endpoint}`);
    }
  }

  // Manejo de errores personalizado
  handleError(error, defaultMessage, includeFieldErrors = false) {
    const errorResponse = {
      message: error.response?.data?.detail || 
               error.response?.data?.message || 
               defaultMessage,
      status: error.response?.status,
      timestamp: new Date().toISOString()
    };

    if (includeFieldErrors && error.response?.data) {
      // Formatear errores de campo para formularios
      const fieldErrors = {};
      Object.keys(error.response.data).forEach(field => {
        if (field !== 'detail' && field !== 'message') {
          const fieldError = error.response.data[field];
          fieldErrors[field] = Array.isArray(fieldError) ? fieldError.join(', ') : fieldError;
        }
      });
      errorResponse.fieldErrors = fieldErrors;
    }

    return errorResponse;
  }
}

// === SERVICIOS ESPECÍFICOS ===

class ClienteService extends BaseService {
  constructor() {
    super('/solicitud/clientes'); // Removed duplicate /api since it's already in the base URL
  }

  async getEstadisticas() {
    try {
      const response = await this.apiClient.get(`${this.endpoint}/estadisticas`);
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Error al obtener estadísticas');
    }
  }

  async buscarPorCI(ci) {
    try {
      const response = await apiClient.get(`${this.endpoint}/`, { 
        params: { CI: ci } 
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al buscar cliente por CI');
    }
  }

  async buscarPorNombre(nombre, apellido = '') {
    try {
      const params = { NOMBRE__icontains: nombre };
      if (apellido) params.APELLIDO__icontains = apellido;
      
      const response = await apiClient.get(`${this.endpoint}/`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al buscar cliente por nombre');
    }
  }

  async obtenerConUbicacion(lat, lng, radio = 1000) {
    try {
      const response = await apiClient.get(`${this.endpoint}/cerca/`, {
        params: { lat, lng, radio }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener clientes cercanos');
    }
  }
}

class SolicitudService extends BaseService {
  constructor() {
    super('/api/solicitud/solicitudes');
  }

  async cambiarEstado(id, estadoId, observaciones = '') {
    try {
      const response = await apiClient.patch(`${this.endpoint}/${id}/cambiar-estado/`, {
        COD_ESTADO: estadoId,
        observaciones,
        fecha: new Date().toISOString().split('T')[0]
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al cambiar estado de solicitud');
    }
  }

  async obtenerEstadisticas(fechaInicio = null, fechaFin = null) {
    try {
      const params = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;
      
      const response = await apiClient.get('/solicitud/estadisticas/', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener estadísticas');
    }
  }

  async obtenerPorCliente(clienteId) {
    try {
      const response = await apiClient.get(`${this.endpoint}/`, {
        params: { COD_CLIENTE: clienteId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener solicitudes del cliente');
    }
  }

  async obtenerPorEstado(estadoId) {
    try {
      const response = await apiClient.get(`${this.endpoint}/`, {
        params: { COD_ESTADO: estadoId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener solicitudes por estado');
    }
  }

  async obtenerPendientes() {
    return this.obtenerPorEstado('PENDIENTE');
  }

  async obtenerEnProceso() {
    return this.obtenerPorEstado('EN_PROCESO');
  }

  async obtenerVencidas() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiClient.get(`${this.endpoint}/`, {
        params: { 
          F_PREVISTA__lt: today,
          COD_ESTADO__in: 'PENDIENTE,EN_PROCESO'
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener solicitudes vencidas');
    }
  }
}

class ContratoService extends BaseService {
  constructor() {
    super('/api/solicitud/contratos');
  }

  async crearDesdeolicitud(solicitudId, datosAdicionales = {}) {
    try {
      const response = await apiClient.post(`${this.endpoint}/desde-solicitud/`, {
        SOLICITUD_ID: solicitudId,
        ...datosAdicionales
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al crear contrato desde solicitud', true);
    }
  }

  async obtenerPorCliente(clienteId) {
    try {
      const response = await apiClient.get(`${this.endpoint}/`, {
        params: { COD_CLIENTE: clienteId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener contratos del cliente');
    }
  }

  async cambiarEstadoServicio(id, estadoId) {
    try {
      const response = await apiClient.patch(`${this.endpoint}/${id}/estado-servicio/`, {
        COD_ESTADO_SERVICIO: estadoId
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al cambiar estado del servicio');
    }
  }

  async suspenderServicio(id, motivo = '') {
    return this.cambiarEstadoServicio(id, 'SUSPENDIDO');
  }

  async reactivarServicio(id) {
    return this.cambiarEstadoServicio(id, 'ACTIVO');
  }
}

class PlanService extends BaseService {
  constructor() {
    super('/solicitud/planes'); // Eliminamos el /api duplicado
  }

  // Alias para mantener compatibilidad con el código existente
  async getAll(params = {}) {
    return await this.obtenerActivos(params);
  }

  async obtenerPorTipoConexion(tipoConexionId) {
    try {
      const response = await apiClient.get(`${this.endpoint}/tipo-conexion/${tipoConexionId}/`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener planes por tipo de conexión');
    }
  }

  async obtenerActivos() {
    try {
      const response = await apiClient.get(`${this.endpoint}/activos/`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener planes activos');
    }
  }

  async obtenerPorRangoPrecio(precioMin, precioMax) {
    try {
      const response = await apiClient.get(`${this.endpoint}/rango-precio/`, {
        params: { precio_min: precioMin, precio_max: precioMax }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener planes por rango de precio');
    }
  }
}

class EquipoONUService extends BaseService {
  constructor() {
    super('/api/almacenes/equipos');
  }

  async obtenerDisponibles(tipo = 'ONU', estado = 'DISPONIBLE') {
    try {
      const response = await apiClient.get(`${this.endpoint}/disponibles/`, {
        params: { tipo, estado }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener equipos disponibles');
    }
  }

  async asignarEquipo(equipoId, solicitudId) {
    try {
      const response = await apiClient.patch(`${this.endpoint}/${equipoId}/`, {
        estado: 'ASIGNADO',
        solicitud_id: solicitudId
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al asignar equipo');
    }
  }

  async obtenerPorSolicitud(solicitudId) {
    try {
      const response = await apiClient.get(`${this.endpoint}/solicitud/${solicitudId}/`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener equipo por solicitud');
    }
  }
}

class SeguimientoService extends BaseService {
  constructor() {
    super('/api/solicitud/seguimientos');
  }

  async obtenerPorSolicitud(solicitudId) {
    try {
      const response = await apiClient.get(`${this.endpoint}/solicitud/${solicitudId}/`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener seguimientos de la solicitud');
    }
  }

  async crearSeguimiento(solicitudId, estadoId, userId = null) {
    try {
      const data = {
        solicitud_id: solicitudId,
        estado_id: estadoId,
        usuario_id: userId,
        fecha_inicio: new Date().toISOString()
      };
      const response = await apiClient.post(this.endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al crear seguimiento', true);
    }
  }

  async finalizarSeguimiento(id, userId = null) {
    try {
      const data = {
        fecha_fin: new Date().toISOString(),
        usuario_fin_id: userId
      };
      const response = await apiClient.patch(`${this.endpoint}/${id}/`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al finalizar seguimiento');
    }
  }
}

class CatalogoService extends BaseService {
  async obtenerActivos() {
    try {
      const response = await apiClient.get(`${this.endpoint}/`, {
        params: { ESTADO_ACTIVO: '1' }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Error al obtener ${this.endpoint} activos`);
    }
  }
}

// === INSTANCIAS DE SERVICIOS ===
const clienteService = new ClienteService();
const solicitudService = new SolicitudService();
const contratoService = new ContratoService();
const planService = new PlanService();
const seguimientoService = new SeguimientoService();
const equipoONUService = new EquipoONUService();

export {
  clienteService,
  solicitudService,
  contratoService,
  planService,
  seguimientoService,
  equipoONUService
};

// Servicios de catálogo
export const tipoTrabajoService = new CatalogoService('/solicitud/tipostrabajo');
export const claseTrabajoService = new CatalogoService('/solicitud/clasestrabajo');
export const estadoService = new CatalogoService('/solicitud/estados');
export const tipoPagoService = new CatalogoService('/solicitud/tipopagos');
export const categoriaService = new CatalogoService('/solicitud/categorias');
export const formaPagoService = new CatalogoService('/solicitud/formaspago');
export const tipoConexionService = new CatalogoService('/solicitud/tipoconexiones');

// === HOOKS PERSONALIZADOS ===
import { useState, useEffect } from 'react';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = async (apiCall, options = {}) => {
    const { 
      showLoader = true, 
      resetError = true,
      onSuccess,
      onError 
    } = options;

    if (showLoader) setLoading(true);
    if (resetError) setError(null);

    try {
      const result = await apiCall();
      setData(result);
      
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      const errorObj = {
        message: err.message || 'Error desconocido',
        status: err.status,
        fieldErrors: err.fieldErrors || {},
        timestamp: err.timestamp
      };
      
      setError(errorObj);
      if (onError) onError(errorObj);
      throw errorObj;
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setData(null);
  };

  return { loading, error, data, execute, reset };
};

// Hook para manejar listas paginadas
export const usePaginatedApi = (service, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    page: 1,
    pageSize: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await service.getAll({ 
        ...initialParams, 
        ...params,
        page: params.page || pagination.page,
        page_size: params.page_size || pagination.pageSize
      });
      
      setData(result.results || result);
      setPagination(prev => ({
        ...prev,
        count: result.count || result.length,
        next: result.next,
        previous: result.previous,
        page: params.page || prev.page
      }));
    } catch (err) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const nextPage = () => {
    if (pagination.next) {
      fetchData({ page: pagination.page + 1 });
    }
  };

  const previousPage = () => {
    if (pagination.previous) {
      fetchData({ page: pagination.page - 1 });
    }
  };

  const goToPage = (page) => {
    fetchData({ page });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    pagination,
    loading,
    error,
    fetchData,
    nextPage,
    previousPage,
    goToPage,
    refresh: () => fetchData({ page: pagination.page })
  };
};

// === CONSTANTES Y UTILIDADES ===

// Estados de clientes
export const CLIENTE_ESTADOS = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'orange' },
  { value: 'ACTIVO', label: 'Activo', color: 'green' },
  { value: 'INACTIVO', label: 'Inactivo', color: 'red' },
  { value: 'SUSPENDIDO', label: 'Suspendido', color: 'yellow' },
  { value: 'PENDIENTE_COBERTURA', label: 'Pendiente Cobertura', color: 'blue' }
];

// Opciones de cobertura
export const COBERTURA_CHOICES = [
  { value: 'CON_COBERTURA', label: 'Con Cobertura' },
  { value: 'SIN_COBERTURA', label: 'Sin Cobertura' },
  { value: 'PENDIENTE_VERIFICACION', label: 'Pendiente Verificación' }
];

// Tipos de cliente
export const TIPO_CLIENTE_CHOICES = [
  { value: 'RESIDENCIAL', label: 'Residencial' },
  { value: 'EMPRESARIAL', label: 'Empresarial' },
  { value: 'GUBERNAMENTAL', label: 'Gubernamental' },
  { value: 'EDUCATIVO', label: 'Educativo' }
];

// Tipos de vivienda
export const VIVIENDA_CHOICES = [
  { value: 'CASA', label: 'Casa' },
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'OFICINA', label: 'Oficina' },
  { value: 'LOCAL_COMERCIAL', label: 'Local Comercial' },
  { value: 'OTRO', label: 'Otro' }
];

export const ESTADOS_SOLICITUD = {
  PENDIENTE: { value: 'PENDIENTE', label: 'Pendiente', color: 'orange' },
  EN_PROCESO: { value: 'EN_PROCESO', label: 'En Proceso', color: 'blue' },
  COMPLETADA: { value: 'COMPLETADA', label: 'Completada', color: 'green' },
  CANCELADA: { value: 'CANCELADA', label: 'Cancelada', color: 'red' },
};

export const TIPOS_CLIENTE = {
  NATURAL: { value: 'NATURAL', label: 'Persona Natural' },
  JURIDICO: { value: 'JURIDICO', label: 'Persona Jurídica' },
};

// Utilidades para formateo
export const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-BO');
};

export const formatearMoneda = (monto) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB'
  }).format(monto);
};

export const formatearTelefono = (telefono) => {
  if (!telefono) return '';
  return telefono.replace(/(\d{3})(\d{4})/, '$1-$2');
};

// === EXPORTACIÓN DEFAULT ===
export default {
  // Servicios principales
  clienteService,
  solicitudService,
  contratoService,
  planService,
  seguimientoService,
  equipoONUService,
  
  // Servicios de catálogo
  tipoTrabajoService,
  claseTrabajoService,
  estadoService,
  tipoPagoService,
  categoriaService,
  formaPagoService,
  tipoConexionService,
  
  // Hooks
  useApi,
  usePaginatedApi,
  
  // Constantes
  ESTADOS_SOLICITUD,
  TIPOS_CLIENTE,
  
  // Utilidades
  formatearFecha,
  formatearMoneda,
  formatearTelefono,
  
  // Cliente axios para casos especiales
  apiClient
};