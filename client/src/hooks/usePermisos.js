// hooks/usePermisos.js
import { useState, useEffect } from 'react';
import { permisosApi } from '../api/permisosApi.js';
import { toast } from 'react-hot-toast';
import { useAuth } from "../context/useAuth.js";

export const usePermisos = () => {
    // Estados principales
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados de modales
    const [modalPermisoAbierto, setModalPermisoAbierto] = useState(false);
    const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false);

    // Estados de datos
    const [permisoSeleccionado, setPermisoSeleccionado] = useState(null);
    const [recursosDisponibles, setRecursosDisponibles] = useState([]);
    const [accionesDisponibles, setAccionesDisponibles] = useState([]);
    const [errorHandler, setErrorHandler] = useState(null);

    // Estados de filtros
    const [filtros, setFiltros] = useState({
        recurso: '',
        accion: '',
        en_uso: '',
        search: ''
    });

    // Contexto de autenticación
    const { makeAuthenticatedRequest, loading: authLoading } = useAuth();

    // Cargar datos iniciales al montar
    useEffect(() => {
        if (authLoading) return;
        fetchData();
        cargarRecursosYAcciones();
    }, [authLoading, makeAuthenticatedRequest]);

    // Función principal para cargar permisos
    const fetchData = async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const filtrosActivos = { ...filtros, ...params };

            // Limpiar filtros vacíos
            const filtrosLimpios = Object.fromEntries(
                Object.entries(filtrosActivos).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
            );

            console.log('🔍 Cargando permisos con filtros:', filtrosLimpios);

            const response = await makeAuthenticatedRequest(async () => {
                return await permisosApi.getAll(filtrosLimpios);
            });

            const permisos = response.data.results || response.data;
            setData(permisos);
            console.log('✅ Permisos cargados:', permisos);

        } catch (err) {
            const mensaje = err.response?.data?.message || err.message || 'Error al cargar permisos';
            setError(mensaje);
            console.error('❌ Error cargando permisos:', err);
            toast.error(mensaje);
        } finally {
            setLoading(false);
        }
    };

    // Cargar recursos y acciones disponibles
    const cargarRecursosYAcciones = async () => {
        try {
            const [recursosRes, accionesRes] = await Promise.all([
                makeAuthenticatedRequest(async () => permisosApi.getRecursosDisponibles()),
                makeAuthenticatedRequest(async () => permisosApi.getAccionesDisponibles())
            ]);

            setRecursosDisponibles(recursosRes.data || []);
            setAccionesDisponibles(accionesRes.data || []);

            console.log('📋 Recursos disponibles:', recursosRes.data);
            console.log('📋 Acciones disponibles:', accionesRes.data);

        } catch (err) {
            console.error('❌ Error cargando recursos/acciones:', err);
        }
    };

    // Función para crear permiso
    const createItem = async (itemData) => {
        try {
            // Guardar el handler de errores del formulario
            setErrorHandler(null);
            setLoading(true);

            console.log('➕ Creando permiso:', itemData);

            // Validación frontend
            const validacion = permisosApi.validarDatos(itemData);
            if (!validacion.isValid) {
                console.log('❌ Validación frontend falló:', validacion.errors);
                Object.keys(validacion.errors).forEach(campo => {
                    toast.error(`${campo}: ${validacion.errors[campo]}`);
                });
                return false;
            }

            const response = await makeAuthenticatedRequest(async () => {
                return await permisosApi.create(itemData);
            });

            // Agregar al inicio de la lista local
            setData(prev => [response.data, ...prev]);

            console.log('✅ Permiso creado exitosamente:', response.data);
            toast.success('Permiso creado exitosamente');

            // Recargar recursos disponibles (puede haber nuevo recurso)
            await cargarRecursosYAcciones();

            return response.data;

        } catch (error) {
            console.error('❌ Error creando permiso:', error);

            // Manejo específico de errores del backend
            if (error.response?.status === 400) {
                const errorData = error.response.data;

                // Error de unicidad
                if (errorData.non_field_errors) {
                    toast.error(errorData.non_field_errors[0]);
                }
                // Errores de campos específicos
                else if (errorData.recurso) {
                    toast.error(`Recurso: ${errorData.recurso[0]}`);
                }
                else if (errorData.accion) {
                    toast.error(`Acción: ${errorData.accion[0]}`);
                }
                else {
                    toast.error('Error de validación en el formulario');
                }
            } else {
                toast.error('Error al crear permiso');
            }

            return false;
        } finally {
            setLoading(false);
        }
    };

    // Función para actualizar permiso
    const updateItem = async (id, itemData) => {
        try {
            setErrorHandler(null);
            setLoading(true);

            console.log('📝 Actualizando permiso:', { id, itemData });

            // Validación frontend para actualización
            const validacion = permisosApi.validarDatos(itemData, true);
            if (!validacion.isValid) {
                console.log('❌ Validación frontend falló:', validacion.errors);
                Object.keys(validacion.errors).forEach(campo => {
                    toast.error(`${campo}: ${validacion.errors[campo]}`);
                });
                return false;
            }

            const response = await makeAuthenticatedRequest(async () => {
                return await permisosApi.update(id, itemData);
            });

            // Actualizar en la lista local
            setData(prev => prev.map(item =>
                item.id === id ? response.data : item
            ));

            console.log('✅ Permiso actualizado exitosamente:', response.data);
            toast.success('Permiso actualizado exitosamente');

            // Recargar recursos disponibles
            await cargarRecursosYAcciones();

            return response.data;

        } catch (error) {
            console.error('❌ Error actualizando permiso:', error);

            // Manejo específico de errores
            if (error.response?.status === 400) {
                const errorData = error.response.data;

                if (errorData.non_field_errors) {
                    toast.error(errorData.non_field_errors[0]);
                } else {
                    toast.error('Error de validación en el formulario');
                }
            } else {
                toast.error('Error al actualizar permiso');
            }

            return false;
        } finally {
            setLoading(false);
        }
    };

    // Función para eliminar permiso
    const deleteItem = async (id) => {
        try {
            setLoading(true);

            console.log('🗑️ Eliminando permiso ID:', id);

            await makeAuthenticatedRequest(async () => {
                return await permisosApi.delete(id);
            });

            // Remover de la lista local
            setData(prev => prev.filter(item => item.id !== id));

            console.log('✅ Permiso eliminado exitosamente');
            toast.success('Permiso eliminado exitosamente');

            // Recargar recursos disponibles
            await cargarRecursosYAcciones();

            return true;

        } catch (error) {
            console.error('❌ Error eliminando permiso:', error);

            // Error específico de permiso en uso
            if (error.response?.status === 400 &&
                error.response?.data?.error?.includes('asignado a uno o más roles')) {
                toast.error('No se puede eliminar el permiso porque está asignado a uno o más roles');
            } else {
                toast.error('Error al eliminar permiso');
            }

            return false;
        } finally {
            setLoading(false);
        }
    };

    // Función para buscar permisos
    const buscarPermisos = async (searchTerm) => {
        try {
            setLoading(true);
            console.log('🔍 Buscando permisos:', searchTerm);

            const response = await makeAuthenticatedRequest(async () => {
                return await permisosApi.buscar(searchTerm);
            });

            const permisos = response.data.results || response.data;
            setData(permisos);

            console.log('✅ Búsqueda completada:', permisos);

        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            toast.error('Error al buscar permisos');
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener permisos agrupados por recurso
    const getPermisosPorRecurso = async () => {
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await permisosApi.getPermisosPorRecurso();
            });

            return response;
        } catch (error) {
            console.error('❌ Error obteniendo permisos por recurso:', error);
            toast.error('Error al agrupar permisos');
            return {};
        }
    };

    // Funciones para manejar modales
    const abrirModalNuevo = () => {
        setPermisoSeleccionado(null);
        setModalPermisoAbierto(true);
        setErrorHandler(null);
    };

    const abrirModalEditar = (permiso) => {
        console.log('Abriendo modal para editar permiso:', permiso);
        setPermisoSeleccionado(permiso);
        setModalEditarAbierto(true);
        setErrorHandler(null);
    };

    const abrirModalEliminar = (permiso) => {
        setPermisoSeleccionado(permiso);
        setModalEliminarAbierto(true);
    };

    const cerrarModales = () => {
        setModalPermisoAbierto(false);
        setModalEditarAbierto(false);
        setModalEliminarAbierto(false);
        setPermisoSeleccionado(null);
        setErrorHandler(null);
    };

    // Función para confirmar eliminación
    const confirmarEliminar = async () => {
        if (!permisoSeleccionado?.id) {
            toast.error('No se pudo identificar el permiso a eliminar');
            return;
        }

        const resultado = await deleteItem(permisoSeleccionado.id);
        if (resultado) {
            cerrarModales();
        }
    };

    // Función para guardar nuevo permiso
    const guardarNuevoPermiso = async (datos, formErrorHandler = null) => {
        try {
            setErrorHandler(() => formErrorHandler);
            const resultado = await createItem(datos);

            if (resultado) {
                cerrarModales();
                return resultado;
            }
        } catch (error) {
            // Si hay handler del formulario y es error 400, dejar que lo maneje
            if (error.response?.status === 400 && formErrorHandler) {
                formErrorHandler(error);
            }
            throw error;
        }
    };

    // Función para guardar edición de permiso
    const guardarEdicionPermiso = async (datos, formErrorHandler = null) => {
        if (!permisoSeleccionado?.id) {
            toast.error('No se pudo identificar el permiso a editar');
            return;
        }

        try {
            setErrorHandler(() => formErrorHandler);
            const resultado = await updateItem(permisoSeleccionado.id, datos);

            if (resultado) {
                cerrarModales();
                return resultado;
            }
        } catch (error) {
            if (error.response?.status === 400 && formErrorHandler) {
                formErrorHandler(error);
            }
            throw error;
        }
    };

    // Función para aplicar filtros
    const aplicarFiltros = (nuevosFiltros) => {
        console.log('🔍 Aplicando filtros:', nuevosFiltros);
        setFiltros(nuevosFiltros);
        fetchData(nuevosFiltros);
    };

    // Función para limpiar filtros
    const limpiarFiltros = () => {
        const filtrosVacios = {
            recurso: '',
            accion: '',
            en_uso: '',
            search: ''
        };
        setFiltros(filtrosVacios);
        fetchData(filtrosVacios);
    };

    // Función para verificar si un permiso puede ser eliminado
    const puedeEliminar = (permiso) => {
        return !permiso.esta_en_uso;
    };

    return {
        // Estados principales
        data,
        loading,
        error,
        filtros,

        // Estados de modales
        modalPermisoAbierto,
        modalEditarAbierto,
        modalEliminarAbierto,
        permisoSeleccionado,

        // Datos auxiliares
        recursosDisponibles,
        accionesDisponibles,

        // Funciones principales
        fetchData,
        createItem,
        updateItem,
        deleteItem,

        // Funciones de búsqueda y filtros
        buscarPermisos,
        aplicarFiltros,
        limpiarFiltros,
        getPermisosPorRecurso,

        // Funciones de modales
        abrirModalNuevo,
        abrirModalEditar,
        abrirModalEliminar,
        cerrarModales,

        // Funciones de CRUD con modales
        confirmarEliminar,
        guardarNuevoPermiso,
        guardarEdicionPermiso,

        // Utilidades
        puedeEliminar,
        cargarRecursosYAcciones
    };
};

export default usePermisos;