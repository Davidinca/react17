// src/components/solicitud/services/apiServiceSolicitud.js
import axios from 'axios';

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

// Servicios para Tipos de Trabajo
export const tipoTrabajoService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/solicitud/tipos-trabajo/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener tipos de trabajo');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/solicitud/tipos-trabajo/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener tipo de trabajo');
    }
  }
};

// Servicios para Clases de Trabajo
export const claseTrabajoService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/solicitud/clases-trabajo/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener clases de trabajo');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/solicitud/clases-trabajo/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener clase de trabajo');
    }
  }
};

// Servicios para Estados
export const estadoService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/solicitud/estados/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener estados');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/solicitud/estados/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener estado');
    }
  }
};

// Servicios para Solicitudes
export const solicitudService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/solicitud/solicitudes/', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params
        }
      });
      throw new Error(error.response?.data?.message || 'Error al obtener solicitudes');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/solicitud/solicitudes/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener la solicitud');
    }
  },

  create: async (solicitudData) => {
    try {
      const response = await apiClient.post('/solicitud/solicitudes/', solicitudData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al crear la solicitud';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  update: async (id, solicitudData) => {
    try {
      const response = await apiClient.put(`/solicitud/solicitudes/${id}/`, solicitudData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar la solicitud';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/solicitud/solicitudes/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar la solicitud');
    }
  },

  // Métodos específicos para solicitudes
  cambiarEstado: async (id, estadoId, observaciones = '') => {
    try {
      const response = await apiClient.patch(`/solicitud/solicitudes/${id}/cambiar-estado/`, {
        estado: estadoId,
        observaciones
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al cambiar el estado de la solicitud');
    }
  },

  getEstadisticas: async () => {
    try {
      const response = await apiClient.get('/solicitud/estadisticas/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error('Error al obtener estadísticas de solicitudes');
    }
  }
};

// Servicios para Contratos
export const contratoService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/solicitud/contratos/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener contratos');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/solicitud/contratos/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener el contrato');
    }
  },

  create: async (contratoData) => {
    try {
      const response = await apiClient.post('/solicitud/contratos/', contratoData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al crear el contrato';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  update: async (id, contratoData) => {
    try {
      const response = await apiClient.put(`/solicitud/contratos/${id}/`, contratoData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar el contrato';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/solicitud/contratos/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar el contrato');
    }
  }
};

// Servicios para Clientes
export const clienteService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/solicitud/clientes/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener clientes');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/solicitud/clientes/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener el cliente');
    }
  },

  create: async (clienteData) => {
    try {
      const response = await apiClient.post('/solicitud/clientes/', clienteData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear el cliente');
    }
  },

  update: async (id, clienteData) => {
    try {
      const response = await apiClient.put(`/solicitud/clientes/${id}/`, clienteData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar el cliente');
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/solicitud/clientes/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar el cliente');
    }
  }
};

// Servicios para Tipos de Pago
export const tipoPagoService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/solicitud/tipos-pago/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener tipos de pago');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/solicitud/tipos-pago/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener el tipo de pago');
    }
  },

  create: async (tipoPagoData) => {
    try {
      const response = await apiClient.post('/solicitud/tipos-pago/', tipoPagoData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear el tipo de pago');
    }
  },

  update: async (id, tipoPagoData) => {
    try {
      const response = await apiClient.put(`/solicitud/tipos-pago/${id}/`, tipoPagoData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar el tipo de pago');
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/solicitud/tipos-pago/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar el tipo de pago');
    }
  }
};

// Servicios para Categorías
export const categoriaService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/solicitud/categorias/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener categorías');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/solicitud/categorias/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener la categoría');
    }
  },

  create: async (categoriaData) => {
    try {
      const response = await apiClient.post('/solicitud/categorias/', categoriaData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear la categoría');
    }
  },

  update: async (id, categoriaData) => {
    try {
      const response = await apiClient.put(`/solicitud/categorias/${id}/`, categoriaData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar la categoría');
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/solicitud/categorias/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar la categoría');
    }
  }
};

// Servicios para Formas de Pago
export const formaPagoService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/solicitud/formas-pago/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener formas de pago');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/solicitud/formas-pago/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener la forma de pago');
    }
  },

  create: async (formaPagoData) => {
    try {
      const response = await apiClient.post('/solicitud/formas-pago/', formaPagoData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear la forma de pago');
    }
  },

  update: async (id, formaPagoData) => {
    try {
      const response = await apiClient.put(`/solicitud/formas-pago/${id}/`, formaPagoData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar la forma de pago');
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/solicitud/formas-pago/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar la forma de pago');
    }
  }
};

// Servicios para Tipos de Conexión
export const tipoConexionService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/solicitud/tipos-conexion/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener tipos de conexión');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/solicitud/tipos-conexion/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener el tipo de conexión');
    }
  },

  create: async (tipoConexionData) => {
    try {
      const response = await apiClient.post('/solicitud/tipos-conexion/', tipoConexionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear el tipo de conexión');
    }
  },

  update: async (id, tipoConexionData) => {
    try {
      const response = await apiClient.put(`/solicitud/tipos-conexion/${id}/`, tipoConexionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar el tipo de conexión');
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/solicitud/tipos-conexion/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar el tipo de conexión');
    }
  }
};

// Servicios para Planes
export const planService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/solicitud/planes/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener planes');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/solicitud/planes/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener el plan');
    }
  },

  getByTipoConexion: async (tipoConexionId) => {
    try {
      const response = await apiClient.get(`/solicitud/planes/?cod_tipo_conexion=${tipoConexionId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener planes por tipo de conexión');
    }
  },

  create: async (planData) => {
    try {
      const response = await apiClient.post('/solicitud/planes/', planData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear el plan');
    }
  },

  update: async (id, planData) => {
    try {
      const response = await apiClient.put(`/solicitud/planes/${id}/`, planData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar el plan');
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/solicitud/planes/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar el plan');
    }
  }
};

// Servicios para Seguimientos
export const seguimientoService = {
  getBySolicitud: async (solicitudId) => {
    try {
      const response = await apiClient.get(`/solicitud/seguimientos/?solicitud=${solicitudId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener el seguimiento de la solicitud');
    }
  },

  create: async (seguimientoData) => {
    try {
      const response = await apiClient.post('/solicitud/seguimientos/', seguimientoData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear el seguimiento');
    }
  },

  update: async (id, seguimientoData) => {
    try {
      const response = await apiClient.put(`/solicitud/seguimientos/${id}/`, seguimientoData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar el seguimiento');
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/solicitud/seguimientos/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar el seguimiento');
    }
  }
};

// Constantes para los choices del modelo
export const ESTADOS_SOLICITUD = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PROCESO', label: 'En Proceso' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

export const TIPOS_CLIENTE = [
  { value: 'NATURAL', label: 'Persona Natural' },
  { value: 'JURIDICO', label: 'Persona Jurídica' },
];

// Hook personalizado para manejar llamadas a la API
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = async (apiCall) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      setError(err.message || 'Ocurrió un error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, makeRequest };
};

// Función auxiliar para formatear errores de validación
export const formatValidationErrors = (fieldErrors) => {
  if (!fieldErrors) return {};
  
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

export default {
  // Servicios
  clienteService,
  tipoPagoService,
  categoriaService,
  formaPagoService,
  tipoTrabajoService,
  claseTrabajoService,
  estadoService,
  tipoConexionService,
  planService,
  solicitudService,
  contratoService,
  seguimientoService,
  
  // Utilidades
  useApi,
  formatValidationErrors,
  
  // Constantes
  ESTADOS_SOLICITUD,
  TIPOS_CLIENTE,
};
