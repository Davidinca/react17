import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/soli'; // Ajusta según tu backend

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const consultaApi = {
  // 1. Consultar y migrar cliente por documento
  consultarCliente: async (nroDocumento) => {
    const response = await api.get(`/consulta-cliente/`, {
      params: { nro_documento: nroDocumento }
    });
    return response.data;
  },

  // 2. Consultar y migrar servicios del cliente
  consultarServicios: async (codCliente) => {
    const response = await api.get(`/consulta-servicio/`, { // ✅ Corregido
      params: { cod_cliente: codCliente }
    });
    return response.data;
  },

  // 3. Consultar y migrar facturas del cliente
  consultarFacturas: async (codCliente) => {
    const response = await api.get(`/consulta-factura-cliente/`, { // ✅ Corregido
      params: { cod_cliente: codCliente }
    });
    return response.data;
  },

  // 4. Obtener resumen completo del cliente
  obtenerResumenCliente: async (nroDocumento) => {
    const response = await api.get(`/cliente-servicios-facturas-resumido/`, { // ✅ Corregido
      params: { nro_documento: nroDocumento }
    });
    return response.data;
  },

  // Endpoints adicionales de listado
  listarClientesLocales: async () => {
    const response = await api.get(`/clientes-locales/`); // ✅ Corregido
    return response.data;
  },

  buscarClientePorNombre: async (nombre) => {
    const response = await api.get(`/clientes-buscar/`, { // ✅ Corregido
      params: { nombre }
    });
    return response.data;
  }
};