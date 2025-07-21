// hooks/useRoles.js
import { useState, useEffect } from 'react';
import { rolesApi } from '../api/roles';
import { permisosApi } from '../api/permisosApi.js';
import { toast } from 'react-hot-toast';
import { useAuth } from "../context/useAuth.js";

export const useRoles = () => {
    // Estados principales
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados de modales
    const [modalRolAbierto, setModalRolAbierto] = useState(false);
    const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
    const [modalUsuariosAbierto, setModalUsuariosAbierto] = useState(false);
    const [modalClonarAbierto, setModalClonarAbierto] = useState(false);

    // Estados de datos
    const [rolSeleccionado, setRolSeleccionado] = useState(null);
    const [usuariosDelRol, setUsuariosDelRol] = useState([]);
    const [permisosDisponibles, setPermisosDisponibles] = useState([]);
    const [errorHandler, setErrorHandler] = useState(null);

    // Estados de filtros
    const [filtros, setFiltros] = useState({
        nombre: '',
        activo: '',
        con_usuarios: '',
        search: ''
    });

    // Contexto de autenticación
    const { makeAuthenticatedRequest, loading: authLoading } = useAuth();

    // Cargar datos iniciales al montar
    useEffect(() => {
        if (authLoading) return;
        fetchData();
        cargarPermisosDisponibles();
    }, [authLoading, makeAuthenticatedRequest]);

    // Función principal para cargar roles
    const fetchData = async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const filtrosActivos = { ...filtros, ...params };

            // Limpiar filtros vacíos
            const filtrosLimpios = Object.fromEntries(
                Object.entries(filtrosActivos).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
            );

            console.log('🔍 Cargando roles con filtros:', filtrosLimpios);

            const response = await makeAuthenticatedRequest(async () => {
                return await rolesApi.getAll(filtrosLimpios);
            });

            const roles = response.data.results || response.data;
            setData(roles);
            console.log('✅ Roles cargados:', roles);

        } catch (err) {
            const mensaje = err.response?.data?.message || err.message || 'Error al cargar roles';
            setError(mensaje);
            console.error('❌ Error cargando roles:', err);
            toast.error(mensaje);
        } finally {
            setLoading(false);
        }
    };

    // Cargar permisos disponibles para asignar a roles
    const cargarPermisosDisponibles = async () => {
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await permisosApi.getAll();
            });

            const permisos = response.data.results || response.data;
            setPermisosDisponibles(permisos);

            console.log('📋 Permisos disponibles cargados:', permisos);

        } catch (err) {
            console.error('❌ Error cargando permisos disponibles:', err);
            // No mostrar toast aquí para no sobrecargar con errores
        }
    };

    // Función para crear rol
    const createItem = async (itemData) => {
        try {
            setErrorHandler(null);
            setLoading(true);

            console.log('➕ Creando rol:', itemData);

            // Validación frontend
            const validacion = rolesApi.validarDatos(itemData);
            if (!validacion.isValid) {
                console.log('❌ Validación frontend falló:', validacion.errors);
                Object.keys(validacion.errors).forEach(campo => {
                    toast.error(`${campo}: ${validacion.errors[campo]}`);
                });
                return false;
            }

            const response = await makeAuthenticatedRequest(async () => {
                return await rolesApi.create(itemData);
            });

            // Agregar al inicio de la lista local
            setData(prev => [response.data, ...prev]);

            console.log('✅ Rol creado exitosamente:', response.data);
            toast.success('Rol creado exitosamente');

            return response.data;

        } catch (error) {
            console.error('❌ Error creando rol:', error);

            // Manejo específico de errores del backend
            if (error.response?.status === 400) {
                const errorData = error.response.data;

                if (errorData.nombre) {
                    toast.error(`Nombre: ${errorData.nombre[0]}`);
                }
                else if (errorData.permisos_ids) {
                    toast.error(`Permisos: ${errorData.permisos_ids[0]}`);
                }
                else {
                    toast.error('Error de validación en el formulario');
                }
            } else {
                toast.error('Error al crear rol');
            }

            return false;
        } finally {
            setLoading(false);
        }
    };

    // Función para actualizar rol
    const updateItem = async (id, itemData) => {
        try {
            setErrorHandler(null);
            setLoading(true);

            console.log('📝 Actualizando rol:', { id, itemData });

            // Validación frontend para actualización
            const validacion = rolesApi.validarDatos(itemData, true);
            if (!validacion.isValid) {
                console.log('❌ Validación frontend falló:', validacion.errors);
                Object.keys(validacion.errors).forEach(campo => {
                    toast.error(`${campo}: ${validacion.errors[campo]}`);
                });
                return false;
            }

            const response = await makeAuthenticatedRequest(async () => {
                return await rolesApi.update(id, itemData);
            });

            // Actualizar en la lista local
            setData(prev => prev.map(item =>
                item.id === id ? response.data : item
            ));

            console.log('✅ Rol actualizado exitosamente:', response.data);
            toast.success('Rol actualizado exitosamente');

            return response.data;

        } catch (error) {
            console.error('❌ Error actualizando rol:', error);

            // Manejo específico de errores
            if (error.response?.status === 400) {
                const errorData = error.response.data;

                if (errorData.nombre) {
                    toast.error(`Nombre: ${errorData.nombre[0]}`);
                } else {
                    toast.error('Error de validación en el formulario');
                }
            } else {
                toast.error('Error al actualizar rol');
            }

            return false;
        } finally {
            setLoading(false);
        }
    };

    // Función para eliminar rol
    const deleteItem = async (id) => {
        try {
            setLoading(true);

            console.log('🗑️ Eliminando rol ID:', id);

            await makeAuthenticatedRequest(async () => {
                return await rolesApi.delete(id);
            });

            // Remover de la lista local
            setData(prev => prev.filter(item => item.id !== id));

            console.log('✅ Rol eliminado exitosamente');
            toast.success('Rol eliminado exitosamente');

            return true;

        } catch (error) {
            console.error('❌ Error eliminando rol:', error);

            // Error específico de rol con usuarios
            if (error.response?.status === 400 &&
                error.response?.data?.error?.includes('usuario(s) asignado(s)')) {
                toast.error('No se puede eliminar el rol porque tiene usuarios asignados');
            } else {
                toast.error('Error al eliminar rol');
            }

            return false;
        } finally {
            setLoading(false);
        }
    };

    // Función para cargar usuarios de un rol
    const cargarUsuariosDelRol = async (rolId) => {
        try {
            setLoading(true);
            console.log('👥 Cargando usuarios del rol:', rolId);

            const response = await makeAuthenticatedRequest(async () => {
                return await rolesApi.getUsuarios(rolId);
            });

            const usuarios = response.data;
            setUsuariosDelRol(usuarios);

            console.log('✅ Usuarios del rol cargados:', usuarios);
            return usuarios;

        } catch (error) {
            console.error('❌ Error cargando usuarios del rol:', error);
            toast.error('Error al cargar usuarios del rol');
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Función para clonar rol
    const clonarRol = async (rolId, nuevoNombre) => {
        try {
            setLoading(true);
            console.log('📄 Clonando rol:', { rolId, nuevoNombre });

            const response = await makeAuthenticatedRequest(async () => {
                return await rolesApi.clonar(rolId, nuevoNombre);
            });

            // Agregar al inicio de la lista local
            setData(prev => [response.data, ...prev]);

            console.log('✅ Rol clonado exitosamente:', response.data);
            toast.success(`Rol clonado como "${nuevoNombre}"`);

            return response.data;

        } catch (error) {
            console.error('❌ Error clonando rol:', error);

            if (error.response?.data?.error?.includes('Ya existe un rol')) {
                toast.error(`Ya existe un rol con el nombre "${nuevoNombre}"`);
            } else {
                toast.error('Error al clonar rol');
            }

            return false;
        } finally {
            setLoading(false);
        }
    };

    // Función para buscar roles
    const buscarRoles = async (searchTerm) => {
        try {
            setLoading(true);
            console.log('🔍 Buscando roles:', searchTerm);

            const response = await makeAuthenticatedRequest(async () => {
                return await rolesApi.buscar(searchTerm);
            });

            const roles = response.data.results || response.data;
            setData(roles);

            console.log('✅ Búsqueda completada:', roles);

        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            toast.error('Error al buscar roles');
        } finally {
            setLoading(false);
        }
    };

    // Funciones para manejar modales
    const abrirModalNuevo = () => {
        setRolSeleccionado(null);
        setModalRolAbierto(true);
        setErrorHandler(null);
    };

    const abrirModalEditar = (rol) => {
        console.log('Abriendo modal para editar rol:', rol);
        setRolSeleccionado(rol);
        setModalEditarAbierto(true);
        setErrorHandler(null);
    };

    const abrirModalEliminar = (rol) => {
        setRolSeleccionado(rol);
        setModalEliminarAbierto(true);
    };

    const abrirModalUsuarios = async (rol) => {
        setRolSeleccionado(rol);
        setModalUsuariosAbierto(true);
        await cargarUsuariosDelRol(rol.id);
    };

    const abrirModalClonar = (rol) => {
        setRolSeleccionado(rol);
        setModalClonarAbierto(true);
    };

    const cerrarModales = () => {
        setModalRolAbierto(false);
        setModalEditarAbierto(false);
        setModalEliminarAbierto(false);
        setModalUsuariosAbierto(false);
        setModalClonarAbierto(false);
        setRolSeleccionado(null);
        setUsuariosDelRol([]);
        setErrorHandler(null);
    };

    // Función para confirmar eliminación
    const confirmarEliminar = async () => {
        if (!rolSeleccionado?.id) {
            toast.error('No se pudo identificar el rol a eliminar');
            return;
        }

        const resultado = await deleteItem(rolSeleccionado.id);
        if (resultado) {
            cerrarModales();
        }
    };

    // Función para guardar nuevo rol
    const guardarNuevoRol = async (datos, formErrorHandler = null) => {
        try {
            setErrorHandler(() => formErrorHandler);
            const resultado = await createItem(datos);

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

    // Función para guardar edición de rol
    const guardarEdicionRol = async (datos, formErrorHandler = null) => {
        if (!rolSeleccionado?.id) {
            toast.error('No se pudo identificar el rol a editar');
            return;
        }

        try {
            setErrorHandler(() => formErrorHandler);
            const resultado = await updateItem(rolSeleccionado.id, datos);

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
            nombre: '',
            activo: '',
            con_usuarios: '',
            search: ''
        };
        setFiltros(filtrosVacios);
        fetchData(filtrosVacios);
    };

    // Función para verificar si un rol puede ser eliminado
    const puedeEliminar = (rol) => {
        return (rol.cantidad_usuarios || 0) === 0;
    };

    return {
        // Estados principales
        data,
        loading,
        error,
        filtros,

        // Estados de modales
        modalRolAbierto,
        modalEditarAbierto,
        modalEliminarAbierto,
        modalUsuariosAbierto,
        modalClonarAbierto,
        rolSeleccionado,
        usuariosDelRol,

        // Datos auxiliares
        permisosDisponibles,

        // Funciones principales
        fetchData,
        createItem,
        updateItem,
        deleteItem,

        // Funciones específicas de roles
        cargarUsuariosDelRol,
        clonarRol,

        // Funciones de búsqueda y filtros
        buscarRoles,
        aplicarFiltros,
        limpiarFiltros,

        // Funciones de modales
        abrirModalNuevo,
        abrirModalEditar,
        abrirModalEliminar,
        abrirModalUsuarios,
        abrirModalClonar,
        cerrarModales,

        // Funciones de CRUD con modales
        confirmarEliminar,
        guardarNuevoRol,
        guardarEdicionRol,

        // Utilidades
        puedeEliminar,
        cargarPermisosDisponibles
    };
};

export default useRoles;
