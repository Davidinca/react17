// ======================================================
// src/api/roles.js
// ======================================================

import axios from './axios'; // Usar tu configuración existente de axios

// API para gestión de roles
export const rolesApi = {
    // ========== CRUD BÁSICO ==========

    /**
     * Obtener todos los roles con filtros opcionales
     * @param {Object} params - Parámetros de filtro
     * @param {string} params.nombre - Filtrar por nombre
     * @param {boolean} params.activo - Filtrar por estado activo
     * @param {boolean} params.con_usuarios - Filtrar por roles con/sin usuarios
     * @param {number} params.page - Número de página
     * @param {number} params.page_size - Cantidad por página
     * @returns {Promise} Lista de roles
     */
    getAll: (params = {}) => {
        console.log('🔍 Obteniendo roles con filtros:', params);
        return axios.get('/usuarios/roles/', { params })
            .then(response => {
                console.log('✅ Roles obtenidos:', response.data);
                return response;
            })
            .catch(error => {
                console.error('❌ Error obteniendo roles:', error);
                throw error;
            });
    },

    /**
     * Obtener un rol específico por ID
     * @param {number} id - ID del rol
     * @returns {Promise} Datos del rol
     */
    getById: (id) => {
        if (!id) {
            throw new Error('ID del rol es requerido');
        }

        console.log('🔍 Obteniendo rol ID:', id);
        return axios.get(`/usuarios/roles/${id}/`)
            .then(response => {
                console.log('✅ Rol obtenido:', response.data);
                return response;
            })
            .catch(error => {
                console.error(`❌ Error obteniendo rol ${id}:`, error);
                throw error;
            });
    },

    /**
     * Crear nuevo rol
     * @param {Object} data - Datos del rol
     * @param {string} data.nombre - Nombre del rol
     * @param {Array} data.permisos_ids - Array de IDs de permisos
     * @param {boolean} data.activo - Estado activo del rol
     * @returns {Promise} Rol creado
     */
    create: (data) => {
        console.log('➕ Creando rol:', data);

        // Validaciones básicas del frontend
        if (!data.nombre || !data.nombre.trim()) {
            throw new Error('El nombre del rol es obligatorio');
        }

        return axios.post('/usuarios/roles/', data)
            .then(response => {
                console.log('✅ Rol creado exitosamente:', response.data);
                return response;
            })
            .catch(error => {
                console.error('❌ Error creando rol:', error);

                // Manejar errores específicos del backend
                if (error.response?.data?.nombre) {
                    throw new Error(`Nombre: ${error.response.data.nombre[0]}`);
                }

                if (error.response?.data?.permisos_ids) {
                    throw new Error(`Permisos: ${error.response.data.permisos_ids[0]}`);
                }

                throw error;
            });
    },

    /**
     * Actualizar rol existente
     * @param {number} id - ID del rol
     * @param {Object} data - Datos a actualizar
     * @returns {Promise} Rol actualizado
     */
    update: (id, data) => {
        if (!id) {
            throw new Error('ID del rol es requerido');
        }

        console.log('📝 Actualizando rol:', { id, data });

        return axios.put(`/usuarios/roles/${id}/`, data)
            .then(response => {
                console.log('✅ Rol actualizado exitosamente:', response.data);
                return response;
            })
            .catch(error => {
                console.error(`❌ Error actualizando rol ${id}:`, error);

                // Manejar errores específicos del backend
                if (error.response?.data?.nombre) {
                    throw new Error(`Nombre: ${error.response.data.nombre[0]}`);
                }

                throw error;
            });
    },

    /**
     * Actualización parcial de rol
     * @param {number} id - ID del rol
     * @param {Object} data - Datos a actualizar parcialmente
     * @returns {Promise} Rol actualizado
     */
    partialUpdate: (id, data) => {
        if (!id) {
            throw new Error('ID del rol es requerido');
        }

        console.log('📝 Actualización parcial del rol:', { id, data });

        return axios.patch(`/usuarios/roles/${id}/`, data)
            .then(response => {
                console.log('✅ Rol actualizado parcialmente:', response.data);
                return response;
            })
            .catch(error => {
                console.error(`❌ Error en actualización parcial del rol ${id}:`, error);
                throw error;
            });
    },

    /**
     * Eliminar rol
     * @param {number} id - ID del rol
     * @returns {Promise} Confirmación de eliminación
     */
    delete: (id) => {
        if (!id) {
            throw new Error('ID del rol es requerido');
        }

        console.log('🗑️ Eliminando rol ID:', id);

        return axios.delete(`/usuarios/roles/${id}/`)
            .then(response => {
                console.log('✅ Rol eliminado exitosamente');
                return response;
            })
            .catch(error => {
                console.error(`❌ Error eliminando rol ${id}:`, error);

                // Manejar error específico de rol con usuarios
                if (error.response?.status === 400 &&
                    error.response?.data?.error?.includes('usuario(s) asignado(s)')) {
                    throw new Error('No se puede eliminar el rol porque tiene usuarios asignados');
                }

                throw error;
            });
    },

    // ========== FUNCIONES ESPECIALES ==========

    /**
     * Obtener usuarios de un rol específico
     * @param {number} id - ID del rol
     * @returns {Promise} Array de usuarios con este rol
     */
    getUsuarios: (id) => {
        if (!id) {
            throw new Error('ID del rol es requerido');
        }

        console.log('👥 Obteniendo usuarios del rol:', id);
        return axios.get(`/usuarios/roles/${id}/usuarios/`)
            .then(response => {
                console.log('✅ Usuarios del rol obtenidos:', response.data);
                return response;
            })
            .catch(error => {
                console.error('❌ Error obteniendo usuarios del rol:', error);
                throw error;
            });
    },

    /**
     * Clonar rol existente con nuevo nombre
     * @param {number} id - ID del rol a clonar
     * @param {string} nombre - Nombre del nuevo rol
     * @returns {Promise} Nuevo rol clonado
     */
    clonar: (id, nombre) => {
        if (!id) {
            throw new Error('ID del rol es requerido');
        }

        if (!nombre || !nombre.trim()) {
            throw new Error('El nombre del nuevo rol es requerido');
        }

        console.log('📄 Clonando rol:', { id, nombre });
        return axios.post(`/usuarios/roles/${id}/clonar/`, { nombre })
            .then(response => {
                console.log('✅ Rol clonado exitosamente:', response.data);
                return response;
            })
            .catch(error => {
                console.error('❌ Error clonando rol:', error);

                if (error.response?.data?.error?.includes('Ya existe un rol')) {
                    throw new Error(`Ya existe un rol con el nombre '${nombre}'`);
                }

                throw error;
            });
    },

    // ========== FUNCIONES DE UTILIDAD ==========

    /**
     * Buscar roles por nombre
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Promise} Roles que coinciden con la búsqueda
     */
    buscar: (searchTerm) => {
        if (!searchTerm || !searchTerm.trim()) {
            return rolesApi.getAll();
        }

        console.log('🔍 Buscando roles con término:', searchTerm);

        return rolesApi.getAll({ nombre: searchTerm })
            .then((response) => {
                console.log('✅ Roles encontrados:', response.data);
                return response;
            });
    },
    /**
     * Obtener solo roles activos (para selects y formularios)
     * @returns {Promise} Lista de roles activos
     */
    getActivos: () => {
        console.log('📋 Obteniendo roles activos');
        return rolesApi.getAll({ activo: true });
    },

    /**
     * Obtener estadísticas de roles
     * @returns {Promise} Estadísticas del sistema de roles
     */
    getEstadisticas: async () => {
        try {
            console.log('📊 Obteniendo estadísticas de roles');
            const response = await rolesApi.getAll();

            const roles = response.data.results || response.data;

            const estadisticas = {
                totalRoles: roles.length,
                rolesActivos: roles.filter(r => r.activo).length,
                rolesInactivos: roles.filter(r => !r.activo).length,
                rolesConUsuarios: roles.filter(r => (r.cantidad_usuarios || 0) > 0).length,
                rolesSinUsuarios: roles.filter(r => (r.cantidad_usuarios || 0) === 0).length,
                totalUsuariosConRol: roles.reduce((sum, r) => sum + (r.cantidad_usuarios || 0), 0),
                promedioUsuariosPorRol: roles.length > 0 ?
                    Math.round(roles.reduce((sum, r) => sum + (r.cantidad_usuarios || 0), 0) / roles.length) : 0
            };

            console.log('✅ Estadísticas calculadas:', estadisticas);
            return estadisticas;

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            throw error;
        }
    },

    /**
     * Obtener roles agrupados por estado
     * @returns {Promise} Objeto con roles agrupados por activo/inactivo
     */
    getRolesPorEstado: async () => {
        try {
            console.log('📊 Obteniendo roles agrupados por estado');
            const response = await rolesApi.getAll();

            const roles = response.data.results || response.data;

            const rolesPorEstado = {
                activos: roles.filter(r => r.activo),
                inactivos: roles.filter(r => !r.activo)
            };

            console.log('✅ Roles agrupados:', rolesPorEstado);
            return rolesPorEstado;

        } catch (error) {
            console.error('❌ Error agrupando roles por estado:', error);
            throw error;
        }
    },

    // ========== VALIDACIONES FRONTEND ==========

    /**
     * Validar datos antes de crear/actualizar rol
     * @param {Object} data - Datos a validar
     * @param {boolean} isUpdate - Si es actualización (campos opcionales)
     * @returns {Object} Resultado de validación {isValid, errors}
     */
    validarDatos: (data, isUpdate = false) => {
        const errors = {};

        // Validar nombre
        if (!isUpdate || data.nombre !== undefined) {
            if (!data.nombre || !data.nombre.trim()) {
                errors.nombre = 'El nombre del rol es obligatorio';
            } else if (data.nombre.trim().length < 2) {
                errors.nombre = 'El nombre debe tener al menos 2 caracteres';
            } else if (data.nombre.trim().length > 50) {
                errors.nombre = 'El nombre no puede exceder 50 caracteres';
            }
        }

        // Validar permisos (opcional pero si se envía debe ser array)
        if (data.permisos_ids !== undefined) {
            if (!Array.isArray(data.permisos_ids)) {
                errors.permisos_ids = 'Los permisos deben ser un array';
            } else if (data.permisos_ids.some(id => !Number.isInteger(id) || id <= 0)) {
                errors.permisos_ids = 'Los IDs de permisos deben ser números enteros positivos';
            }
        }

        // Validar estado activo
        if (data.activo !== undefined && typeof data.activo !== 'boolean') {
            errors.activo = 'El estado activo debe ser verdadero o falso';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Verificar si un nombre de rol ya existe
     * @param {string} nombre - Nombre a verificar
     * @param {number} excludeId - ID a excluir (para edición)
     * @returns {Promise<boolean>} True si existe, False si no
     */
    verificarNombreExistente: async (nombre, excludeId = null) => {
        try {
            const response = await rolesApi.buscar(nombre);
            const roles = response.data.results || response.data;

            // Filtrar el rol actual si estamos editando
            const rolesEncontrados = excludeId ?
                roles.filter(r => r.id !== excludeId) :
                roles;

            return rolesEncontrados.some(r =>
                r.nombre.toLowerCase() === nombre.trim().toLowerCase()
            );
        } catch (error) {
            console.error('❌ Error verificando nombre del rol:', error);
            return false;
        }
    }

};

// Exportar por defecto también
export default rolesApi;