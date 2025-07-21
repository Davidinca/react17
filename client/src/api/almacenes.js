// ======================================================
// 1. src/api/almacenes.js - NUEVO ARCHIVO
// ======================================================

import axios from './axios'; // Usar tu configuración existente de axios

// Marcas
export const marcasApi = {
    getAll: () => axios.get('/almacenes/marcas/'),
    getById: (id) => axios.get(`/almacenes/marcas/${id}/`),
    create: (data) => axios.post('/almacenes/marcas/', data),
    update: (id, data) => axios.put(`/almacenes/marcas/${id}/`, data),
    delete: (id) => axios.delete(`/almacenes/marcas/${id}/`),
    getModelos: (id) => axios.get(`/almacenes/marcas/${id}/modelos/`),
    getEstadisticas: () => axios.get('/almacenes/marcas/estadisticas/'),
};

// Tipos de Equipo
export const tiposEquipoApi = {
    getAll: () => axios.get('/almacenes/tipos-equipo/'),
    getById: (id) => axios.get(`/almacenes/tipos-equipo/${id}/`),
    create: (data) => axios.post('/almacenes/tipos-equipo/', data),
    update: (id, data) => axios.put(`/almacenes/tipos-equipo/${id}/`, data),
    delete: (id) => axios.delete(`/almacenes/tipos-equipo/${id}/`),
    getModelos: (id) => axios.get(`/almacenes/tipos-equipo/${id}/modelos/`),
};

// Estados de Equipo
export const estadosEquipoApi = {
    getAll: () => axios.get('/almacenes/estados-equipo/'),
    getById: (id) => axios.get(`/almacenes/estados-equipo/${id}/`),
    create: (data) => axios.post('/almacenes/estados-equipo/', data),
    update: (id, data) => axios.put(`/almacenes/estados-equipo/${id}/`, data),
    delete: (id) => axios.delete(`/almacenes/estados-equipo/${id}/`),
    getDistribucion: () => axios.get('/almacenes/estados-equipo/distribucion/'),
};

// Componentes
export const componentesApi = {
    getAll: () => axios.get('/almacenes/componentes/'),
    getById: (id) => axios.get(`/almacenes/componentes/${id}/`),
    create: (data) => axios.post('/almacenes/componentes/', data),
    update: (id, data) => axios.put(`/almacenes/componentes/${id}/`, data),
    delete: (id) => axios.delete(`/almacenes/componentes/${id}/`),

};

// Modelos
export const modelosApi = {
    getAll: (params) => axios.get('/almacenes/modelos/', { params }),
    getById: (id) => axios.get(`/almacenes/modelos/${id}/`),
    create: (data) => axios.post('/almacenes/modelos/', data),
    update: (id, data) => axios.put(`/almacenes/modelos/${id}/`, data),
    delete: (id) => axios.delete(`/almacenes/modelos/${id}/`),
    getEquipos: (id) => axios.get(`/almacenes/modelos/${id}/equipos/`),
    getDisponibles: (id) => axios.get(`/almacenes/modelos/${id}/disponibles/`),
    agregarComponente: (id, data) => axios.post(`/almacenes/modelos/${id}/agregar_componente/`, data),
    removerComponente: (id, data) => axios.delete(`/almacenes/modelos/${id}/remover_componente/`, { data }),
    actualizarComponente: (id, data) => axios.patch(`/almacenes/modelos/${id}/actualizar_componente/`, data),
};

// Lotes
export const lotesApi = {
    getAll: (params) => axios.get('/almacenes/lotes/', { params }),
    getById: (id) => axios.get(`/almacenes/lotes/${id}/`),
    create: (data) => axios.post('/almacenes/lotes/', data),
    //update: (id, data) => axios.put(`/almacenes/lotes/${id}/`, data),
    delete: (id) => axios.delete(`/almacenes/lotes/${id}/`),
    getResumen: (id) => axios.get(`/almacenes/lotes/${id}/resumen/`),
    agregarDetalle: (id, data) => axios.post(`/almacenes/lotes/${id}/agregar_detalle/`, data),
    getEstadisticas: () => axios.get('/almacenes/lotes/estadisticas/'),
    update: (id, data) => {
        console.log('🚀 lotesApi.update llamado con:', { id, data });
        console.log('URL que se va a llamar:', `/almacenes/lotes/${id}/`);

        return axios.put(`/almacenes/lotes/${id}/`, data)
            .then(response => {
                console.log('✅ Respuesta del servidor:', response);
                return response;
            })
            .catch(error => {
                console.error('❌ Error en petición:', error);
                throw error;
            });
    },
};

// Equipos
export const equiposApi = {
    getAll: (params) => axios.get('/almacenes/equipos/', { params }),
    getById: (id) => axios.get(`/almacenes/equipos/${id}/`),
    create: (data) => axios.post('/almacenes/equipos/', data),
    update: (id, data) => axios.put(`/almacenes/equipos/${id}/`, data),
    delete: (id) => axios.delete(`/almacenes/equipos/${id}/`),
    getDisponibles: (params) => axios.get('/almacenes/equipos/disponibles/', { params }),
    cambiarEstado: (id, data) => axios.post(`/almacenes/equipos/${id}/cambiar_estado/`, data),
    getHistorial: (id) => axios.get(`/almacenes/equipos/${id}/historial/`),
    getEstadisticas: () => axios.get('/almacenes/equipos/estadisticas/'),
};
