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

// Servicios para Clientes
export const clienteService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/maps/clientes/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener clientes');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/maps/clientes/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener cliente');
    }
  },

  create: async (clienteData) => {
    try {
      const response = await apiClient.post('/maps/clientes/', clienteData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al crear cliente';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  update: async (id, clienteData) => {
    try {
      const response = await apiClient.put(`/maps/clientes/${id}/`, clienteData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar cliente';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  partialUpdate: async (id, clienteData) => {
    try {
      const response = await apiClient.patch(`/maps/clientes/${id}/`, clienteData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar cliente';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/maps/clientes/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar cliente');
    }
  },

  getByEstado: async (estado) => {
    try {
      const response = await apiClient.get(`/maps/clientes/estado/${estado}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || `Error al obtener clientes ${estado}`);
    }
  },

  cambiarEstado: async (id, estado, observaciones = '') => {
    try {
      const response = await apiClient.patch(`/maps/clientes/${id}/cambiar_estado/`, {
        estado,
        observaciones
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al cambiar estado');
    }
  },

  buscarPorUbicacion: async (zona = '', calle = '') => {
    try {
      const params = {};
      if (zona) params.zona = zona;
      if (calle) params.calle = calle;

      const response = await apiClient.get('/maps/clientes/buscar_por_ubicacion/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error en búsqueda por ubicación');
    }
  },

  getEstadisticas: async () => {
    try {
      const response = await apiClient.get('/maps/clientes/estadisticas/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
    }
  }
};

// Servicios para Tipos de Servicio
export const tipoServicioService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/maps/tipos-servicio/', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener tipos de servicio');
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/maps/tipos-servicio/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener tipo de servicio');
    }
  },

  create: async (tipoServicioData) => {
    try {
      const response = await apiClient.post('/maps/tipos-servicio/', tipoServicioData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al crear tipo de servicio';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  update: async (id, tipoServicioData) => {
    try {
      const response = await apiClient.put(`/maps/tipos-servicio/${id}/`, tipoServicioData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar tipo de servicio';
      const fieldErrors = error.response?.data;
      throw { message: errorMessage, fieldErrors };
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/maps/tipos-servicio/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar tipo de servicio');
    }
  }
};

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

  return { loading, error, executeApiCall, setError };
};
