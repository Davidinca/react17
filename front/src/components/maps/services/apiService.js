// src/components/maps/services/apiService.js
import axios from 'axios';
import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Configuración de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para manejo de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Servicios para Formas de Pago
export const formaPagoService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/planes/formas-pago/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener formas de pago');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/planes/formas-pago/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener forma de pago');
    }
  },

  create: async (formaPagoData) => {
    try {
      const response = await apiClient.post('/planes/formas-pago/', formaPagoData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al crear forma de pago';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  update: async (id, formaPagoData) => {
    try {
      const response = await apiClient.put(`/planes/formas-pago/${id}/`, formaPagoData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar forma de pago';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  partialUpdate: async (id, formaPagoData) => {
    try {
      const response = await apiClient.patch(`/planes/formas-pago/${id}/`, formaPagoData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar forma de pago';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/planes/formas-pago/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar forma de pago');
    }
  }
};

// Servicios para Tipos de Conexión
export const tipoConexionService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/planes/tipos-conexion/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener tipos de conexión');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/planes/tipos-conexion/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener tipo de conexión');
    }
  },

  create: async (tipoConexionData) => {
    try {
      const response = await apiClient.post('/planes/tipos-conexion/', tipoConexionData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al crear tipo de conexión';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  update: async (id, tipoConexionData) => {
    try {
      const response = await apiClient.put(`/planes/tipos-conexion/${id}/`, tipoConexionData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar tipo de conexión';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  partialUpdate: async (id, tipoConexionData) => {
    try {
      const response = await apiClient.patch(`/planes/tipos-conexion/${id}/`, tipoConexionData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar tipo de conexión';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/planes/tipos-conexion/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar tipo de conexión');
    }
  }
};

// Servicios para Planes
export const planService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/planes/planes/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener planes');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/planes/planes/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener plan');
    }
  },

  create: async (planData) => {
    try {
      const response = await apiClient.post('/planes/planes/', planData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al crear plan';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  update: async (id, planData) => {
    try {
      const response = await apiClient.put(`/planes/planes/${id}/`, planData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar plan';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  partialUpdate: async (id, planData) => {
    try {
      const response = await apiClient.patch(`/planes/planes/${id}/`, planData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar plan';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/planes/planes/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar plan');
    }
  }
};

// Servicios para Clientes
export const clienteService = {
  getAll: async (params = {}) => {
    try {
      console.log('Solicitando clientes a:', `${API_BASE_URL}/planes/clientes/`);
      const response = await apiClient.get('/planes/clientes/', { params });
      console.log('Respuesta de la API (clientes):', response);
      return response.data;
    } catch (error) {
      console.error('Error en la petición a la API:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params
        }
      });
      
      let errorMessage = 'Error al obtener clientes';
      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        errorMessage = error.response.data?.message || 
                      `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión o que el servidor esté en ejecución.';
      }
      
      throw new Error(errorMessage);
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/planes/clientes/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener cliente');
    }
  },

  create: async (clienteData) => {
    try {
      // Crear una copia del objeto para no modificar el original
      const payload = { ...clienteData };
      
      // Asegurarse de que los campos numéricos sean números
      if (payload.latitud) payload.latitud = Number(payload.latitud);
      if (payload.longitud) payload.longitud = Number(payload.longitud);
      if (payload.plan_id) payload.plan_id = Number(payload.plan_id);
      
      console.log('Enviando datos al servidor:', JSON.stringify(payload, null, 2));
      
      const response = await apiClient.post('/planes/clientes/', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Forzar el envío incluso con campos null/undefined
        transformRequest: [(data) => JSON.stringify(data, (key, value) => 
          value === null ? null : value
        )]
      });
      
      return response.data;
    } catch (error) {
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        request: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers
        },
        errorMessage: error.message,
        stack: error.stack
      };
      
      console.error('Error detallado en la petición:', errorDetails);
      
      let errorMessage = 'Error al crear cliente';
      let fieldErrors = {};
      
      if (error.response) {
        // El servidor respondió con un error de validación
        if (error.response.status === 400) {
          errorMessage = 'Error de validación. Por favor, verifica los datos del formulario.';
          fieldErrors = error.response.data;
          console.error('Errores de validación detallados:', JSON.stringify(fieldErrors, null, 2));
          
          // Mostrar errores específicos de campos
          if (fieldErrors) {
            Object.entries(fieldErrors).forEach(([field, errors]) => {
              console.error(`Campo: ${field}`, errors);
            });
          }
        } else {
          errorMessage = error.response.data?.detail || 
                        error.response.data?.message || 
                        `Error ${error.response.status}: ${error.response.statusText}`;
        }
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión o que el servidor esté en ejecución.';
      } else {
        // Error al configurar la petición
        errorMessage = error.message || 'Error al procesar la solicitud';
      }
      
      const errorToThrow = new Error(errorMessage);
      errorToThrow.fieldErrors = fieldErrors;
      errorToThrow.originalError = error;
      errorToThrow.details = errorDetails;
      
      throw errorToThrow;
    }
  },

  update: async (id, clienteData) => {
    try {
      console.log('Enviando datos de actualización:', { id, clienteData });
      const response = await apiClient.put(`/planes/clientes/${id}/`, clienteData);
      return response.data;
    } catch (error) {
      console.error('Error en la actualización del cliente:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      
      const errorMessage = error.response?.data?.message || 'Error al actualizar cliente';
      const fieldErrors = error.response?.data;
      
      // Si hay errores de validación, mostrarlos en la consola
      if (fieldErrors) {
        console.error('Errores de validación:', fieldErrors);
      }
      
      const errorToThrow = new Error(errorMessage);
      errorToThrow.fieldErrors = fieldErrors;
      errorToThrow.originalError = error;
      throw errorToThrow;
    }
  },

  partialUpdate: async (id, clienteData) => {
    try {
      const response = await apiClient.patch(`/planes/clientes/${id}/`, clienteData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar cliente';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/planes/clientes/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar cliente');
    }
  },

  // Métodos específicos basados en el modelo Cliente
  getByEstado: async (estado) => {
    try {
      const response = await apiClient.get('/planes/clientes/', { 
        params: { estado } 
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || `Error al obtener clientes ${estado}`);
    }
  },

  getByCobertura: async (cobertura) => {
    try {
      const response = await apiClient.get('/planes/clientes/', { 
        params: { cobertura } 
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || `Error al obtener clientes con cobertura ${cobertura}`);
    }
  },

  getByTipoCliente: async (tipoCliente) => {
    try {
      const response = await apiClient.get('/planes/clientes/', { 
        params: { tipo_cliente: tipoCliente } 
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || `Error al obtener clientes tipo ${tipoCliente}`);
    }
  },

  buscarPorUbicacion: async (zona = '', calle = '') => {
    try {
      const params = {};
      if (zona) params.zona = zona;
      if (calle) params.calle = calle;

      const response = await apiClient.get('/planes/clientes/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error en búsqueda por ubicación');
    }
  },

  buscarPorCI: async (ci) => {
    try {
      const response = await apiClient.get('/planes/clientes/', { 
        params: { ci } 
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al buscar por CI');
    }
  },

  buscarPorNIT: async (nit) => {
    try {
      const response = await apiClient.get('/planes/clientes/', { 
        params: { nit } 
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al buscar por NIT');
    }
  },

  cambiarEstado: async (id, estado, observaciones = '') => {
    try {
      const response = await apiClient.patch(`/planes/clientes/${id}/`, {
        estado,
        observaciones
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al cambiar estado');
    }
  },

  asignarPlan: async (id, planId) => {
    try {
      const response = await apiClient.patch(`/planes/clientes/${id}/`, {
        plan_id: planId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al asignar plan');
    }
  },
  
  getEstadisticas: async () => {
    try {
      console.log('Solicitando estadísticas a:', `${API_BASE_URL}/planes/clientes/estadisticas/`);
      const response = await apiClient.get('/planes/clientes/estadisticas/');
      console.log('Respuesta de estadísticas:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method
        }
      });
      
      let errorMessage = 'Error al obtener estadísticas';
      if (error.response) {
        errorMessage = error.response.data?.message || 
                     `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión o que el servidor esté en ejecución.';
      }
      
      throw new Error(errorMessage);
    }
  }
};

// Constantes para los choices del modelo
export const CLIENTE_ESTADOS = [
  { value: 'PEND_COBERTURA', label: 'Pendiente por cobertura' },
  { value: 'PEND_EQUIPO', label: 'Pendiente por equipo' },
  { value: 'PEND_INSTALACION', label: 'Pendiente por instalación' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'SUSPENDIDO', label: 'Suspendido' }
];

export const COBERTURA_CHOICES = [
  { value: 'CON_COBERTURA', label: 'Con cobertura' },
  { value: 'SIN_COBERTURA', label: 'Sin cobertura' }
];

export const TIPO_CLIENTE_CHOICES = [
  { value: 'COMUN', label: 'Usuario común' },
  { value: 'EMPRESA', label: 'Empresa' }
];

export const VIVIENDA_CHOICES = [
  { value: 'Casa', label: 'Casa' },
  { value: 'Departamento', label: 'Departamento' }
];

// Hook personalizado para manejar loading y errores
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeApiCall = async (apiCall) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      setError(err.message || 'Error en la operación');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { loading, error, executeApiCall, clearError };
};

// Función auxiliar para formatear errores de validación
export const formatValidationErrors = (fieldErrors) => {
  if (!fieldErrors || typeof fieldErrors !== 'object') return {};
  
  const formattedErrors = {};
  Object.keys(fieldErrors).forEach(field => {
    if (Array.isArray(fieldErrors[field])) {
      formattedErrors[field] = fieldErrors[field].join(', ');
    } else {
      formattedErrors[field] = fieldErrors[field];
    }
  });
  
  return formattedErrors;
};