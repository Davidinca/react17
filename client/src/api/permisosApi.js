// ======================================================
// src/api/permisos.js
// ======================================================

import axios from './axios'; // Usar tu configuración existente de axios

// API para gestión de permisos
export const permisosApi = {
    // ========== CRUD BÁSICO ==========

    /**
     * Obtener todos los permisos con filtros opcionales
     * @param {Object} params - Parámetros de filtro
     * @param {string} params.recurso - Filtrar por recurso
     * @param {string} params.accion - Filtrar por acción
     * @param {boolean} params.en_uso - Filtrar por uso en roles (true/false)
     * @param {number} params.page - Número de página
     * @param {number} params.page_size - Cantidad por página
     * @returns {Promise} Lista de permisos
     */
    getAll: (params = {}) => {
        console.log('🔍 Obteniendo permisos con filtros:', params);
        return axios.get('/usuarios/permisos/', { params })
            .then(response => {
                console.log('✅ Permisos obtenidos:', response.data);
                return response;
            })
            .catch(error => {
                console.error('❌ Error obteniendo permisos:', error);
                throw error;
            });
    },

    /**
     * Obtener un permiso específico por ID
     * @param {number} id - ID del permiso
     * @returns {Promise} Datos del permiso
     */
    getById: (id) => {
        if (!id) {
            throw new Error('ID del permiso es requerido');
        }

        console.log('🔍 Obteniendo permiso ID:', id);
        return axios.get(`/usuarios/permisos/${id}/`)
            .then(response => {
                console.log('✅ Permiso obtenido:', response.data);
                return response;
            })
            .catch(error => {
                console.error(`❌ Error obteniendo permiso ${id}:`, error);
                throw error;
            });
    },

    /**
     * Crear nuevo permiso
     * @param {Object} data - Datos del permiso
     * @param {string} data.recurso - Nombre del recurso (ej: "usuarios")
     * @param {string} data.accion - Acción permitida (ej: "crear", "leer", "actualizar", "eliminar")
     * @returns {Promise} Permiso creado
     */
    create: (data) => {
        console.log('➕ Creando permiso:', data);

        // Validaciones básicas del frontend
        if (!data.recurso || !data.recurso.trim()) {
            throw new Error('El recurso es obligatorio');
        }

        if (!data.accion || !data.accion.trim()) {
            throw new Error('La acción es obligatoria');
        }

        const accionesValidas = ['crear', 'leer', 'actualizar', 'eliminar'];
        if (!accionesValidas.includes(data.accion)) {
            throw new Error(`La acción debe ser una de: ${accionesValidas.join(', ')}`);
        }

        return axios.post('/usuarios/permisos/', data)
            .then(response => {
                console.log('✅ Permiso creado exitosamente:', response.data);
                return response;
            })
            .catch(error => {
                console.error('❌ Error creando permiso:', error);

                // Manejar errores específicos del backend
                if (error.response?.data?.non_field_errors) {
                    throw new Error(error.response.data.non_field_errors[0]);
                }

                if (error.response?.data?.recurso) {
                    throw new Error(`Recurso: ${error.response.data.recurso[0]}`);
                }

                if (error.response?.data?.accion) {
                    throw new Error(`Acción: ${error.response.data.accion[0]}`);
                }

                throw error;
            });
    },

    /**
     * Actualizar permiso existente
     * @param {number} id - ID del permiso
     * @param {Object} data - Datos a actualizar
     * @returns {Promise} Permiso actualizado
     */
    update: (id, data) => {
        if (!id) {
            throw new Error('ID del permiso es requerido');
        }

        console.log('📝 Actualizando permiso:', { id, data });

        // Validaciones básicas si se proporcionan
        if (data.accion) {
            const accionesValidas = ['crear', 'leer', 'actualizar', 'eliminar'];
            if (!accionesValidas.includes(data.accion)) {
                throw new Error(`La acción debe ser una de: ${accionesValidas.join(', ')}`);
            }
        }

        return axios.put(`/usuarios/permisos/${id}/`, data)
            .then(response => {
                console.log('✅ Permiso actualizado exitosamente:', response.data);
                return response;
            })
            .catch(error => {
                console.error(`❌ Error actualizando permiso ${id}:`, error);

                // Manejar errores específicos del backend
                if (error.response?.data?.non_field_errors) {
                    throw new Error(error.response.data.non_field_errors[0]);
                }

                throw error;
            });
    },

    /**
     * Actualización parcial de permiso
     * @param {number} id - ID del permiso
     * @param {Object} data - Datos a actualizar parcialmente
     * @returns {Promise} Permiso actualizado
     */
    partialUpdate: (id, data) => {
        if (!id) {
            throw new Error('ID del permiso es requerido');
        }

        console.log('📝 Actualización parcial del permiso:', { id, data });

        return axios.patch(`/usuarios/permisos/${id}/`, data)
            .then(response => {
                console.log('✅ Permiso actualizado parcialmente:', response.data);
                return response;
            })
            .catch(error => {
                console.error(`❌ Error en actualización parcial del permiso ${id}:`, error);
                throw error;
            });
    },

    /**
     * Eliminar permiso
     * @param {number} id - ID del permiso
     * @returns {Promise} Confirmación de eliminación
     */
    delete: (id) => {
        if (!id) {
            throw new Error('ID del permiso es requerido');
        }

        console.log('🗑️ Eliminando permiso ID:', id);

        return axios.delete(`/usuarios/permisos/${id}/`)
            .then(response => {
                console.log('✅ Permiso eliminado exitosamente');
                return response;
            })
            .catch(error => {
                console.error(`❌ Error eliminando permiso ${id}:`, error);

                // Manejar error específico de permiso en uso
                if (error.response?.status === 400 &&
                    error.response?.data?.error?.includes('asignado a uno o más roles')) {
                    throw new Error('No se puede eliminar el permiso porque está asignado a uno o más roles');
                }

                throw error;
            });
    },

    // ========== FUNCIONES ESPECIALES ==========

    /**
     * Obtener lista de recursos únicos disponibles
     * @returns {Promise} Array de nombres de recursos
     */
    getRecursosDisponibles: () => {
        console.log('📋 Obteniendo recursos disponibles');
        return axios.get('/usuarios/permisos/recursos_disponibles/')
            .then(response => {
                console.log('✅ Recursos disponibles:', response.data);
                return response;
            })
            .catch(error => {
                console.error('❌ Error obteniendo recursos disponibles:', error);
                throw error;
            });
    },

    /**
     * Obtener lista de acciones válidas del sistema
     * @returns {Promise} Array de acciones válidas
     */
    getAccionesDisponibles: () => {
        console.log('📋 Obteniendo acciones disponibles');
        return axios.get('/usuarios/permisos/acciones_disponibles/')
            .then(response => {
                console.log('✅ Acciones disponibles:', response.data);
                return response;
            })
            .catch(error => {
                console.error('❌ Error obteniendo acciones disponibles:', error);
                throw error;
            });
    },

    // ========== FUNCIONES DE UTILIDAD ==========

    /**
     * Verificar si un permiso específico existe
     * @param {string} recurso - Nombre del recurso
     * @param {string} accion - Acción a verificar
     * @returns {Promise<boolean>} True si existe, False si no
     */
    verificarExistencia: async (recurso, accion) => {
        try {
            const response = await permisosApi.getAll({
                recurso: recurso,
                accion: accion
            });

            return response.data.results?.length > 0;
        } catch (error) {
            console.error('❌ Error verificando existencia del permiso:', error);
            return false;
        }
    },

    /**
     * Obtener permisos agrupados por recurso
     * @returns {Promise} Objeto con permisos agrupados por recurso
     */
    getPermisosPorRecurso: async () => {
        try {
            console.log('📊 Obteniendo permisos agrupados por recurso');
            const response = await permisosApi.getAll();

            const permisosPorRecurso = {};

            response.data.results?.forEach(permiso => {
                if (!permisosPorRecurso[permiso.recurso]) {
                    permisosPorRecurso[permiso.recurso] = [];
                }
                permisosPorRecurso[permiso.recurso].push(permiso);
            });

            console.log('✅ Permisos agrupados:', permisosPorRecurso);
            return permisosPorRecurso;
        } catch (error) {
            console.error('❌ Error agrupando permisos por recurso:', error);
            throw error;
        }
    },

    /**
     * Buscar permisos por texto
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Promise} Permisos que coinciden con la búsqueda
     */
    buscar: (searchTerm) => {
        if (!searchTerm || !searchTerm.trim()) {
            return permisosApi.getAll();
        }

        console.log('🔍 Buscando permisos con término:', searchTerm);

        // Buscar tanto en recurso como en acción
        return Promise.all([
            permisosApi.getAll({ recurso: searchTerm }),
            permisosApi.getAll({ accion: searchTerm })
        ]).then(([porRecurso, porAccion]) => {
            // Combinar y deduplicar resultados
            const todosLosPermisos = [
                ...porRecurso.data.results || [],
                ...porAccion.data.results || []
            ];

            // Eliminar duplicados por ID
            const permisosUnicos = todosLosPermisos.filter((permiso, index, arr) =>
                arr.findIndex(p => p.id === permiso.id) === index
            );

            console.log('✅ Permisos encontrados:', permisosUnicos);

            return {
                data: {
                    results: permisosUnicos,
                    count: permisosUnicos.length
                }
            };
        });
    },

    // ========== VALIDACIONES FRONTEND ==========

    /**
     * Validar datos antes de crear/actualizar permiso
     * @param {Object} data - Datos a validar
     * @param {boolean} isUpdate - Si es actualización (campos opcionales)
     * @returns {Object} Resultado de validación {isValid, errors}
     */
    validarDatos: (data, isUpdate = false) => {
        const errors = {};

        // Validar recurso
        if (!isUpdate || data.recurso !== undefined) {
            if (!data.recurso || !data.recurso.trim()) {
                errors.recurso = 'El recurso es obligatorio';
            } else if (!/^[a-z0-9-_]+$/.test(data.recurso.trim())) {
                errors.recurso = 'El recurso solo puede contener letras minúsculas, números, guiones y guiones bajos';
            }
        }

        // Validar acción
        if (!isUpdate || data.accion !== undefined) {
            const accionesValidas = ['crear', 'leer', 'actualizar', 'eliminar'];
            if (!data.accion || !data.accion.trim()) {
                errors.accion = 'La acción es obligatoria';
            } else if (!accionesValidas.includes(data.accion)) {
                errors.accion = `La acción debe ser una de: ${accionesValidas.join(', ')}`;
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};

// Exportar por defecto también
export default permisosApi;