// ======================================================
// src/api/usuarios.js
// ======================================================

import axios from './axios'; // Usar tu configuración existente de axios

// API para gestión de usuarios
export const usuariosApi = {
    // ========== CRUD BÁSICO ==========

    /**
     * Obtener todos los usuarios con filtros opcionales
     * @param {Object} params - Parámetros de filtro
     * @param {string} params.tipo - Filtrar por tipo (manual/migrado)
     * @param {boolean} params.activo - Filtrar por estado activo
     * @param {number} params.rol - Filtrar por ID de rol
     * @param {string} params.search - Búsqueda por nombre/código
     * @param {number} params.page - Número de página
     * @param {number} params.page_size - Cantidad por página
     * @returns {Promise} Lista de usuarios
     */
    getAll: (params = {}) => {
        console.log('🔍 Obteniendo usuarios con filtros:', params);
        return axios.get('/usuarios/usuarios/', { params })
            .then(response => {
                console.log('✅ Usuarios obtenidos:', response.data);
                return response;
            })
            .catch(error => {
                console.error('❌ Error obteniendo usuarios:', error);
                throw error;
            });
    },

    /**
     * Obtener un usuario específico por ID
     * @param {number} id - ID del usuario
     * @returns {Promise} Datos del usuario
     */
    getById: (id) => {
        if (!id) {
            throw new Error('ID del usuario es requerido');
        }

        console.log('🔍 Obteniendo usuario ID:', id);
        return axios.get(`/usuarios/usuarios/${id}/`)
            .then(response => {
                console.log('✅ Usuario obtenido:', response.data);
                return response;
            })
            .catch(error => {
                console.error(`❌ Error obteniendo usuario ${id}:`, error);
                throw error;
            });
    },

    /**
     * Crear nuevo usuario manual
     * @param {Object} data - Datos del usuario
     * @param {string} data.nombres - Nombres del usuario
     * @param {string} data.apellidopaterno - Apellido paterno
     * @param {string} data.apellidomaterno - Apellido materno
     * @param {number} data.rol - ID del rol (se convertirá a rol_id si es necesario)
     * @returns {Promise} Usuario creado
     */
    create: (data) => {
        console.log('➕ Creando usuario con datos originales:', data);

        // Validaciones básicas del frontend
        if (!data.nombres || !data.nombres.trim()) {
            throw new Error('Los nombres son obligatorios');
        }

        if (!data.apellidopaterno || !data.apellidopaterno.trim()) {
            throw new Error('El apellido paterno es obligatorio');
        }

        if (!data.apellidomaterno || !data.apellidomaterno.trim()) {
            throw new Error('El apellido materno es obligatorio');
        }

        if (!data.rol) {
            throw new Error('El rol es obligatorio');
        }

        // Preparar datos para envío - verificar si el backend necesita 'rol' o 'rol_id'
        const datosParaEnvio = {
            nombres: data.nombres,
            apellidopaterno: data.apellidopaterno,
            apellidomaterno: data.apellidomaterno,
            rol: data.rol // Mantener como 'rol' según tu serializer
        };

        console.log('📤 Datos preparados para envío:', datosParaEnvio);

        return axios.post('/usuarios/usuarios/', datosParaEnvio)
            .then(response => {
                console.log('✅ Usuario creado exitosamente:', response.data);
                return response;
            })
            .catch(error => {
                console.error('❌ Error creando usuario:', error);
                console.error('❌ Response data:', error.response?.data);
                console.error('❌ Response status:', error.response?.status);

                // Manejar errores específicos del backend
                if (error.response?.data?.nombres) {
                    throw new Error(`Nombres: ${error.response.data.nombres[0]}`);
                }

                if (error.response?.data?.apellidopaterno) {
                    throw new Error(`Apellido paterno: ${error.response.data.apellidopaterno[0]}`);
                }

                if (error.response?.data?.apellidomaterno) {
                    throw new Error(`Apellido materno: ${error.response.data.apellidomaterno[0]}`);
                }

                if (error.response?.data?.rol) {
                    throw new Error(`Rol: ${error.response.data.rol[0]}`);
                }

                throw error;
            });
    },

    /**
     * Actualizar usuario existente
     * @param {number} id - ID del usuario
     * @param {Object} data - Datos a actualizar
     * @returns {Promise} Usuario actualizado
     */
    update: (id, data) => {
        if (!id) {
            throw new Error('ID del usuario es requerido');
        }

        console.log('📝 Actualizando usuario con datos originales:', { id, data });

        // Preparar datos para envío
        const datosParaEnvio = {
            nombres: data.nombres,
            apellidopaterno: data.apellidopaterno,
            apellidomaterno: data.apellidomaterno,
            rol: data.rol // Mantener como 'rol'
        };

        console.log('📤 Datos preparados para actualización:', datosParaEnvio);

        return axios.put(`/usuarios/usuarios/${id}/`, datosParaEnvio)
            .then(response => {
                console.log('✅ Usuario actualizado exitosamente:', response.data);
                return response;
            })
            .catch(error => {
                console.error(`❌ Error actualizando usuario ${id}:`, error);
                console.error('❌ Response data:', error.response?.data);
                console.error('❌ Response status:', error.response?.status);
                throw error;
            });
    },

    /**
     * Actualización parcial de usuario
     * @param {number} id - ID del usuario
     * @param {Object} data - Datos a actualizar parcialmente
     * @returns {Promise} Usuario actualizado
     */
    partialUpdate: (id, data) => {
        if (!id) {
            throw new Error('ID del usuario es requerido');
        }

        console.log('📝 Actualización parcial del usuario:', { id, data });

        return axios.patch(`/usuarios/usuarios/${id}/`, data)
            .then(response => {
                console.log('✅ Usuario actualizado parcialmente:', response.data);
                return response;
            })
            .catch(error => {
                console.error(`❌ Error en actualización parcial del usuario ${id}:`, error);
                throw error;
            });
    },

    /**
     * Desactivar usuario (soft delete)
     * @param {number} id - ID del usuario
     * @returns {Promise} Confirmación de desactivación
     */
    delete: (id) => {
        if (!id) {
            throw new Error('ID del usuario es requerido');
        }

        console.log('🗑️ Desactivando usuario ID:', id);

        return axios.delete(`/usuarios/usuarios/${id}/`)
            .then(response => {
                console.log('✅ Usuario desactivado exitosamente');
                return response;
            })
            .catch(error => {
                console.error(`❌ Error desactivando usuario ${id}:`, error);
                throw error;
            });
    },

    // ========== ACCIONES ESPECIALES ==========

    /**
     * Activar usuario desactivado
     * @param {number} id - ID del usuario
     * @returns {Promise} Usuario activado
     */
    activar: (id) => {
        if (!id) {
            throw new Error('ID del usuario es requerido');
        }

        console.log('✅ Activando usuario ID:', id);

        return axios.post(`/usuarios/usuarios/${id}/activar/`)
            .then(response => {
                console.log('✅ Usuario activado exitosamente:', response.data);
                return response;
            })
            .catch(error => {
                console.error(`❌ Error activando usuario ${id}:`, error);
                throw error;
            });
    },

    /**
     * Resetear contraseña de usuario
     * @param {number} id - ID del usuario
     * @returns {Promise} Confirmación de reset
     */
    resetearPassword: (id) => {
        if (!id) {
            throw new Error('ID del usuario es requerido');
        }

        console.log('🔐 Reseteando contraseña del usuario ID:', id);

        return axios.post(`/usuarios/usuarios/${id}/resetear_password/`)
            .then(response => {
                console.log('✅ Contraseña reseteada exitosamente');
                return response;
            })
            .catch(error => {
                console.error(`❌ Error reseteando contraseña del usuario ${id}:`, error);
                throw error;
            });
    },

    /**
     * Cambiar rol de usuario
     * @param {number} id - ID del usuario
     * @param {number} rolId - ID del nuevo rol
     * @returns {Promise} Usuario con rol actualizado
     */
    cambiarRol: (id, rolId) => {
        if (!id) {
            throw new Error('ID del usuario es requerido');
        }

        if (!rolId) {
            throw new Error('ID del rol es requerido');
        }

        console.log('👥 Cambiando rol del usuario:', { id, rolId });

        return axios.post(`/usuarios/usuarios/${id}/cambiar_rol/`, { rol_id: rolId })
            .then(response => {
                console.log('✅ Rol cambiado exitosamente:', response.data);
                return response;
            })
            .catch(error => {
                console.error(`❌ Error cambiando rol del usuario ${id}:`, error);

                if (error.response?.status === 400) {
                    const errorMsg = error.response.data?.error || 'Error al cambiar el rol';
                    throw new Error(errorMsg);
                }

                throw error;
            });
    },

    // ========== FUNCIONES DE UTILIDAD ==========

    /**
     * Buscar usuarios por término
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Promise} Usuarios que coinciden con la búsqueda
     */
    buscar: (searchTerm) => {
        if (!searchTerm || !searchTerm.trim()) {
            return usuariosApi.getAll();
        }

        console.log('🔍 Buscando usuarios con término:', searchTerm);

        return usuariosApi.getAll({ search: searchTerm.trim() });
    },

    /**
     * Obtener usuarios por tipo
     * @param {string} tipo - 'manual' o 'migrado'
     * @returns {Promise} Usuarios del tipo especificado
     */
    getPorTipo: (tipo) => {
        console.log('📋 Obteniendo usuarios por tipo:', tipo);
        return usuariosApi.getAll({ tipo });
    },

    /**
     * Obtener usuarios por rol
     * @param {number} rolId - ID del rol
     * @returns {Promise} Usuarios con el rol especificado
     */
    getPorRol: (rolId) => {
        console.log('👥 Obteniendo usuarios por rol:', rolId);
        return usuariosApi.getAll({ rol: rolId });
    },

    /**
     * Obtener estadísticas de usuarios
     * @returns {Promise} Estadísticas del sistema de usuarios
     */
    getEstadisticas: async () => {
        try {
            console.log('📊 Obteniendo estadísticas de usuarios');

            const [todos, activos, inactivos, manuales, migrados] = await Promise.all([
                usuariosApi.getAll(),
                usuariosApi.getAll({ activo: true }),
                usuariosApi.getAll({ activo: false }),
                usuariosApi.getAll({ tipo: 'manual' }),
                usuariosApi.getAll({ tipo: 'migrado' })
            ]);

            const estadisticas = {
                total: todos.data.results?.length || todos.data?.length || 0,
                activos: activos.data.results?.length || activos.data?.length || 0,
                inactivos: inactivos.data.results?.length || inactivos.data?.length || 0,
                manuales: manuales.data.results?.length || manuales.data?.length || 0,
                migrados: migrados.data.results?.length || migrados.data?.length || 0
            };

            console.log('✅ Estadísticas obtenidas:', estadisticas);
            return estadisticas;

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            throw error;
        }
    },

    // ========== VALIDACIONES FRONTEND ==========

    /**
     * Validar datos antes de crear/actualizar usuario
     * @param {Object} data - Datos a validar
     * @param {boolean} isUpdate - Si es actualización (campos opcionales)
     * @returns {Object} Resultado de validación {isValid, errors}
     */
    validarDatos: (data, isUpdate = false) => {
        const errors = {};

        // Validar nombres
        if (!isUpdate || data.nombres !== undefined) {
            if (!data.nombres || !data.nombres.trim()) {
                errors.nombres = 'Los nombres son obligatorios';
            } else if (data.nombres.trim().length < 2) {
                errors.nombres = 'Los nombres deben tener al menos 2 caracteres';
            }
        }

        // Validar apellido paterno
        if (!isUpdate || data.apellidopaterno !== undefined) {
            if (!data.apellidopaterno || !data.apellidopaterno.trim()) {
                errors.apellidopaterno = 'El apellido paterno es obligatorio';
            } else if (data.apellidopaterno.trim().length < 2) {
                errors.apellidopaterno = 'El apellido paterno debe tener al menos 2 caracteres';
            }
        }

        // Validar apellido materno
        if (!isUpdate || data.apellidomaterno !== undefined) {
            if (!data.apellidomaterno || !data.apellidomaterno.trim()) {
                errors.apellidomaterno = 'El apellido materno es obligatorio';
            } else if (data.apellidomaterno.trim().length < 2) {
                errors.apellidomaterno = 'El apellido materno debe tener al menos 2 caracteres';
            }
        }

        // Validar rol
        if (!isUpdate || data.rol !== undefined) {
            if (!data.rol) {
                errors.rol = 'El rol es obligatorio';
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};

// Exportar por defecto también
export default usuariosApi;