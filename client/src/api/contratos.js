import axios from './axios'; // Usar tu configuración existente de axios

// Tipos de Servicio
export const tiposServicioApi = {
    getAll: () => axios.get('/contratos/tipos-servicio/'),
    getById: (id) => axios.get(`/contratos/tipos-servicio/${id}/`),
    create: (data) => axios.post('/contratos/tipos-servicio/', data),
    update: (id, data) => axios.put(`/contratos/tipos-servicio/${id}/`, data),
    delete: (id) => axios.delete(`/contratos/tipos-servicio/${id}/`),
};

// Planes Comerciales
export const planesApi = {
    getAll: (params) => axios.get('/contratos/planes-comerciales/', { params }),
    getById: (id) => axios.get(`/contratos/planes-comerciales/${id}/`),
    create: (data) => axios.post('/contratos/planes-comerciales/', data),
    update: (id, data) => axios.put(`/contratos/planes-comerciales/${id}/`, data),
    delete: (id) => axios.delete(`/contratos/planes-comerciales/${id}/`),
    getByTipoServicio: (tipoServicioId) => axios.get(`/contratos/planes-comerciales/?tipo_servicio=${tipoServicioId}`),
};

// Clientes
export const clientesApi = {
    getAll: (params) => axios.get('/contratos/clientes/', { params }),
    getById: (id) => axios.get(`/contratos/clientes/${id}/`),
    create: (data) => axios.post('/contratos/clientes/', data),
    update: (id, data) => axios.put(`/contratos/clientes/${id}/`, data),
    delete: (id) => axios.delete(`/contratos/clientes/${id}/`),
};

// Contratos
export const contratosApi = {
    getAll: (params) => axios.get('/contratos/contratos/', { params }),
    getById: (id) => axios.get(`/contratos/contratos/${id}/`),
    create: (data) => axios.post('/contratos/contratos/', data),
    update: (id, data) => axios.put(`/contratos/contratos/${id}/`, data),
    delete: (id) => axios.delete(`/contratos/contratos/${id}/`),
    getServicios: (id) => axios.get(`/contratos/contratos/${id}/servicios/`),
};

// Servicios
export const serviciosApi = {
    getAll: (params) => axios.get('/contratos/servicios/', { params }),
    getById: (id) => axios.get(`/contratos/servicios/${id}/`),
    create: (data) => axios.post('/contratos/servicios/', data),
    update: (id, data) => axios.put(`/contratos/servicios/${id}/`, data),
    delete: (id) => axios.delete(`/contratos/servicios/${id}/`),
};

// Órdenes de Trabajo
export const ordenesTrabajoApi = {
    getAll: (params) => axios.get('/contratos/ordenes-trabajo/', { params }),
    getById: (id) => axios.get(`/contratos/ordenes-trabajo/${id}/`),
    create: (data) => axios.post('/contratos/ordenes-trabajo/', data),
    update: (id, data) => axios.put(`/contratos/ordenes-trabajo/${id}/`, data),
    delete: (id) => axios.delete(`/contratos/ordenes-trabajo/${id}/`),
};













// Buscar contrato
export const buscarContrato = async (numeroContrato) => {
    const { data } = await axios.get(`/contratos/buscar/?numero_contrato=${numeroContrato}`);
    return data;
};

// Eliminar contrato
export const eliminarContrato = async (id) => {
    const { data } = await axios.delete(`/contratos/${id}/`);
    return data;
};

// Listar clientes
export const getClientes = async () => {
    const { data } = await axios.get('/clientes/');
    return data;
};

// Crear contrato completo
export const crearContrato = async (datos) => {
    const { data } = await axios.post('/contratos/', datos);
    return data;
};

// Actualizar contrato completo (PUT)
export const actualizarContrato = async (id, datos) => {
    const { data } = await axios.put(`/contratos/${id}/`, datos);
    return data;
};

// Actualizar contrato parcialmente (PATCH)
export const patchContrato = async (id, datosParciales) => {
    const { data } = await axios.patch(`/contratos/${id}/`, datosParciales);
    return data;
};

// Listar contratos
export  const listarContratos = async () => {
    const { data } = await axios.get('/contratos/');
    return data;
}