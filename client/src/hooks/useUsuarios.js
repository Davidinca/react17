// hooks/useUsuarios.js
import { useState, useEffect } from 'react';
import { usuariosApi } from '../api/usuariosApi.js';
import { rolesApi } from '../api/roles'; // Importar tu API de roles real
import { toast } from 'react-hot-toast';
import { useAuth } from "../context/useAuth.js";

export const useUsuarios = () => {
    // Estados principales
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados de modales
    const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
    const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
    const [modalCambiarRolAbierto, setModalCambiarRolAbierto] = useState(false);

    // Estados de datos
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [rolesDisponibles, setRolesDisponibles] = useState([]);
    const [errorHandler, setErrorHandler] = useState(null);

    // Estados de filtros
    const [filtros, setFiltros] = useState({
        tipo: '',
        activo: '',
        rol: '',
        search: ''
    });

    // Contexto de autenticación
    const { makeAuthenticatedRequest, loading: authLoading } = useAuth();

    // Cargar datos iniciales al montar
    useEffect(() => {
        if (authLoading) return;
        fetchData();
        cargarRolesDisponibles();
    }, [authLoading, makeAuthenticatedRequest]);

    // Re-enriquecer usuarios cuando se cargan los roles
    useEffect(() => {
        if (rolesDisponibles.length > 0 && data.length > 0) {
            console.log('🔄 Re-enriqueciendo usuarios con roles cargados');
            const usuariosEnriquecidos = data.map(usuario => {
                if (usuario.rol && !usuario.rol_nombre) {
                    const rolInfo = rolesDisponibles.find(r =>
                        r.id === usuario.rol ||
                        r.id === parseInt(usuario.rol) ||
                        (usuario.rol?.id && r.id === usuario.rol.id)
                    );
                    if (rolInfo) {
                        return {
                            ...usuario,
                            rol_nombre: rolInfo.nombre,
                            rol_info: rolInfo
                        };
                    }
                }
                return usuario;
            });
            setData(usuariosEnriquecidos);
        }
    }, [rolesDisponibles]);

    // Función principal para cargar usuarios
    const fetchData = async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const filtrosActivos = { ...filtros, ...params };

            // Limpiar filtros vacíos
            const filtrosLimpios = Object.fromEntries(
                Object.entries(filtrosActivos).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
            );

            console.log('🔍 Cargando usuarios con filtros:', filtrosLimpios);

            const response = await makeAuthenticatedRequest(async () => {
                return await usuariosApi.getAll(filtrosLimpios);
            });

            let usuarios = response.data.results || response.data;

            // Enriquecer usuarios con información de roles
            usuarios = usuarios.map(usuario => {
                if (usuario.rol && rolesDisponibles.length > 0) {
                    const rolInfo = rolesDisponibles.find(r =>
                        r.id === usuario.rol ||
                        r.id === parseInt(usuario.rol) ||
                        (usuario.rol?.id && r.id === usuario.rol.id)
                    );
                    if (rolInfo) {
                        return {
                            ...usuario,
                            rol_nombre: rolInfo.nombre,
                            rol_info: rolInfo
                        };
                    }
                }
                return usuario;
            });

            setData(usuarios);
            console.log('✅ Usuarios cargados y enriquecidos:', usuarios);

        } catch (err) {
            const mensaje = err.response?.data?.message || err.message || 'Error al cargar usuarios';
            setError(mensaje);
            console.error('❌ Error cargando usuarios:', err);
            toast.error(mensaje);
        } finally {
            setLoading(false);
        }
    };

    // Cargar roles disponibles
    const cargarRolesDisponibles = async () => {
        try {
            console.log('📋 Cargando roles disponibles...');

            const response = await makeAuthenticatedRequest(async () => {
                return await rolesApi.getActivos(); // Usar tu API real de roles
            });

            const roles = response.data.results || response.data;
            setRolesDisponibles(roles);
            console.log('✅ Roles disponibles cargados:', roles);

        } catch (err) {
            console.error('❌ Error cargando roles:', err);
            // Fallback a roles vacíos si hay error
            setRolesDisponibles([]);

            // Solo mostrar error si es crítico (no es auth)
            if (err.response?.status !== 403) {
                toast.error('Error al cargar roles disponibles');
            }
        }
    };

    // Función para crear usuario
    const createItem = async (itemData) => {
        try {
            setErrorHandler(null);
            setLoading(true);

            console.log('➕ Hook: Creando usuario con datos:', itemData);
            console.log('🔍 Hook: Tipo de rol:', typeof itemData.rol, 'Valor:', itemData.rol);

            // Validación frontend
            const validacion = usuariosApi.validarDatos(itemData);
            if (!validacion.isValid) {
                console.log('❌ Validación frontend falló:', validacion.errors);
                Object.keys(validacion.errors).forEach(campo => {
                    toast.error(`${campo}: ${validacion.errors[campo]}`);
                });
                return false;
            }

            const response = await makeAuthenticatedRequest(async () => {
                return await usuariosApi.create(itemData);
            });

            // Enriquecer el usuario con información del rol
            const usuarioCreado = response.data;
            if (usuarioCreado.rol && rolesDisponibles.length > 0) {
                const rolInfo = rolesDisponibles.find(r => r.id === usuarioCreado.rol || r.id === parseInt(usuarioCreado.rol));
                if (rolInfo) {
                    usuarioCreado.rol_nombre = rolInfo.nombre;
                    usuarioCreado.rol_info = rolInfo;
                }
            }

            // Agregar al inicio de la lista local
            setData(prev => [usuarioCreado, ...prev]);

            console.log('✅ Usuario creado exitosamente en hook:', usuarioCreado);
            toast.success(`Usuario ${usuarioCreado.nombre_completo || usuarioCreado.nombres} creado exitosamente`);

            return usuarioCreado;

        } catch (error) {
            console.error('❌ Error en hook creando usuario:', error);
            console.error('❌ Error response:', error.response?.data);

            // Manejo específico de errores del backend
            if (error.response?.status === 400) {
                const errorData = error.response.data;
                console.log('❌ Errores del backend:', errorData);

                // Errores de campos específicos
                if (errorData.nombres) {
                    toast.error(`Nombres: ${errorData.nombres[0]}`);
                }
                else if (errorData.apellidopaterno) {
                    toast.error(`Apellido paterno: ${errorData.apellidopaterno[0]}`);
                }
                else if (errorData.apellidomaterno) {
                    toast.error(`Apellido materno: ${errorData.apellidomaterno[0]}`);
                }
                else if (errorData.rol) {
                    toast.error(`Rol: ${errorData.rol[0]}`);
                }
                else {
                    toast.error('Error de validación en el formulario');
                }
            } else {
                toast.error('Error al crear usuario');
            }

            return false;
        } finally {
            setLoading(false);
        }
    };

    // Función para actualizar usuario
    const updateItem = async (id, itemData) => {
        try {
            setErrorHandler(null);
            setLoading(true);

            console.log('📝 Hook: Actualizando usuario:', { id, itemData });

            // Validación frontend para actualización
            const validacion = usuariosApi.validarDatos(itemData, true);
            if (!validacion.isValid) {
                console.log('❌ Validación frontend falló:', validacion.errors);
                Object.keys(validacion.errors).forEach(campo => {
                    toast.error(`${campo}: ${validacion.errors[campo]}`);
                });
                return false;
            }

            const response = await makeAuthenticatedRequest(async () => {
                return await usuariosApi.update(id, itemData);
            });

            // Enriquecer el usuario con información del rol
            const usuarioActualizado = response.data;
            if (usuarioActualizado.rol && rolesDisponibles.length > 0) {
                const rolInfo = rolesDisponibles.find(r => r.id === usuarioActualizado.rol || r.id === parseInt(usuarioActualizado.rol));
                if (rolInfo) {
                    usuarioActualizado.rol_nombre = rolInfo.nombre;
                    usuarioActualizado.rol_info = rolInfo;
                }
            }

            // Actualizar en la lista local
            setData(prev => prev.map(item =>
                item.id === id ? usuarioActualizado : item
            ));

            console.log('✅ Usuario actualizado exitosamente en hook:', usuarioActualizado);
            toast.success(`Usuario ${usuarioActualizado.nombre_completo || usuarioActualizado.nombres} actualizado exitosamente`);

            return usuarioActualizado;

        } catch (error) {
            console.error('❌ Error actualizando usuario:', error);

            if (error.response?.status === 400) {
                const errorData = error.response.data;

                if (errorData.nombres || errorData.apellidopaterno || errorData.apellidomaterno || errorData.rol) {
                    // Mostrar errores específicos
                    Object.keys(errorData).forEach(campo => {
                        if (errorData[campo]) {
                            toast.error(`${campo}: ${errorData[campo][0]}`);
                        }
                    });
                } else {
                    toast.error('Error de validación en el formulario');
                }
            } else {
                toast.error('Error al actualizar usuario');
            }

            return false;
        } finally {
            setLoading(false);
        }
    };

    // Función para desactivar usuario (soft delete)
    const deleteItem = async (id) => {
        try {
            setLoading(true);

            console.log('🗑️ Desactivando usuario ID:', id);

            await makeAuthenticatedRequest(async () => {
                return await usuariosApi.delete(id);
            });

            // Actualizar estado en la lista local (marcar como inactivo)
            setData(prev => prev.map(item =>
                item.id === id ? { ...item, is_active: false } : item
            ));

            console.log('✅ Usuario desactivado exitosamente');
            toast.success('Usuario desactivado exitosamente');

            return true;

        } catch (error) {
            console.error('❌ Error desactivando usuario:', error);
            toast.error('Error al desactivar usuario');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Función para activar usuario
    const activarUsuario = async (id) => {
        try {
            setLoading(true);

            console.log('✅ Activando usuario ID:', id);

            const response = await makeAuthenticatedRequest(async () => {
                return await usuariosApi.activar(id);
            });

            // Actualizar en la lista local
            setData(prev => prev.map(item =>
                item.id === id ? { ...item, is_active: true } : item
            ));

            console.log('✅ Usuario activado exitosamente');
            toast.success('Usuario activado exitosamente');

            return response.data;

        } catch (error) {
            console.error('❌ Error activando usuario:', error);
            toast.error('Error al activar usuario');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Función para resetear contraseña
    const resetearPassword = async (id) => {
        try {
            setLoading(true);

            console.log('🔐 Reseteando contraseña del usuario ID:', id);

            await makeAuthenticatedRequest(async () => {
                return await usuariosApi.resetearPassword(id);
            });

            // Actualizar estado en la lista local (marcar como requiere cambio)
            setData(prev => prev.map(item =>
                item.id === id ? { ...item, password_changed: false } : item
            ));

            console.log('✅ Contraseña reseteada exitosamente');
            toast.success('Contraseña reseteada exitosamente. El usuario deberá cambiarla en su próximo login.');

            return true;

        } catch (error) {
            console.error('❌ Error reseteando contraseña:', error);
            toast.error('Error al resetear contraseña');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Función para cambiar rol
    const cambiarRol = async (id, rolId) => {
        try {
            setLoading(true);

            console.log('👥 Cambiando rol del usuario:', { id, rolId });

            const response = await makeAuthenticatedRequest(async () => {
                return await usuariosApi.cambiarRol(id, rolId);
            });

            // Actualizar en la lista local
            setData(prev => prev.map(item =>
                item.id === id ? response.data : item
            ));

            console.log('✅ Rol cambiado exitosamente');
            toast.success('Rol del usuario cambiado exitosamente');

            return response.data;

        } catch (error) {
            console.error('❌ Error cambiando rol:', error);

            if (error.message) {
                toast.error(error.message);
            } else {
                toast.error('Error al cambiar el rol del usuario');
            }

            return false;
        } finally {
            setLoading(false);
        }
    };

    // Función para buscar usuarios
    const buscarUsuarios = async (searchTerm) => {
        try {
            setLoading(true);
            console.log('🔍 Buscando usuarios:', searchTerm);

            const response = await makeAuthenticatedRequest(async () => {
                return await usuariosApi.buscar(searchTerm);
            });

            const usuarios = response.data.results || response.data;
            setData(usuarios);

            console.log('✅ Búsqueda completada:', usuarios);

        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            toast.error('Error al buscar usuarios');
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener estadísticas con datos reales
    const getEstadisticas = async () => {
        try {
            console.log('📊 Calculando estadísticas de usuarios');

            // Calcular estadísticas basadas en los datos locales
            const totalUsuarios = data.length;
            const usuariosActivos = data.filter(u => u.is_active).length;
            const usuariosInactivos = totalUsuarios - usuariosActivos;
            const usuariosManuales = data.filter(u => u.codigocotel >= 9000).length;
            const usuariosMigrados = totalUsuarios - usuariosManuales;
            const usuariosRequierenCambioPassword = data.filter(u => !u.password_changed).length;

            const estadisticas = {
                totalUsuarios,
                usuariosActivos,
                usuariosInactivos,
                usuariosManuales,
                usuariosMigrados,
                usuariosRequierenCambioPassword
            };

            console.log('✅ Estadísticas calculadas:', estadisticas);
            return estadisticas;

        } catch (error) {
            console.error('❌ Error calculando estadísticas:', error);
            return {
                totalUsuarios: 0,
                usuariosActivos: 0,
                usuariosInactivos: 0,
                usuariosManuales: 0,
                usuariosMigrados: 0,
                usuariosRequierenCambioPassword: 0
            };
        }
    };

    // Funciones para manejar modales
    const abrirModalNuevo = () => {
        setUsuarioSeleccionado(null);
        setModalUsuarioAbierto(true);
        setErrorHandler(null);
    };

    const abrirModalEditar = (usuario) => {
        console.log('Abriendo modal para editar usuario:', usuario);
        setUsuarioSeleccionado(usuario);
        setModalEditarAbierto(true);
        setErrorHandler(null);
    };

    const abrirModalEliminar = (usuario) => {
        setUsuarioSeleccionado(usuario);
        setModalEliminarAbierto(true);
    };

    const abrirModalCambiarRol = (usuario) => {
        setUsuarioSeleccionado(usuario);
        setModalCambiarRolAbierto(true);
    };

    const cerrarModales = () => {
        setModalUsuarioAbierto(false);
        setModalEditarAbierto(false);
        setModalEliminarAbierto(false);
        setModalCambiarRolAbierto(false);
        setUsuarioSeleccionado(null);
        setErrorHandler(null);
    };

    // Función para confirmar eliminación
    const confirmarEliminar = async () => {
        if (!usuarioSeleccionado?.id) {
            toast.error('No se pudo identificar el usuario a desactivar');
            return;
        }

        const resultado = await deleteItem(usuarioSeleccionado.id);
        if (resultado) {
            cerrarModales();
        }
    };

    // Función para confirmar cambio de rol
    const confirmarCambioRol = async (rolId) => {
        if (!usuarioSeleccionado?.id) {
            toast.error('No se pudo identificar el usuario');
            return;
        }

        const resultado = await cambiarRol(usuarioSeleccionado.id, rolId);
        if (resultado) {
            cerrarModales();
        }
    };

    // Función para guardar nuevo usuario
    const guardarNuevoUsuario = async (datos, formErrorHandler = null) => {
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

    // Función para guardar edición de usuario
    const guardarEdicionUsuario = async (datos, formErrorHandler = null) => {
        if (!usuarioSeleccionado?.id) {
            toast.error('No se pudo identificar el usuario a editar');
            return;
        }

        try {
            setErrorHandler(() => formErrorHandler);
            const resultado = await updateItem(usuarioSeleccionado.id, datos);

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
            tipo: '',
            activo: '',
            rol: '',
            search: ''
        };
        setFiltros(filtrosVacios);
        fetchData(filtrosVacios);
    };

    // Función para verificar si un usuario puede ser eliminado
    const puedeEliminar = (usuario) => {
        return usuario.is_active; // Solo usuarios activos pueden ser desactivados
    };

    // Función para verificar si un usuario puede ser activado
    const puedeActivar = (usuario) => {
        return !usuario.is_active; // Solo usuarios inactivos pueden ser activados
    };

    // Función para verificar si un usuario puede resetear contraseña
    const puedeResetearPassword = (usuario) => {
        return usuario.is_active; // Solo usuarios activos pueden resetear contraseña
    };

    // Función para obtener el nombre del rol por ID
    const getNombreRol = (rolId) => {
        const rol = rolesDisponibles.find(r => r.id === rolId);
        return rol?.nombre || 'Sin rol';
    };

    return {
        // Estados principales
        data,
        loading,
        error,
        filtros,

        // Estados de modales
        modalUsuarioAbierto,
        modalEditarAbierto,
        modalEliminarAbierto,
        modalCambiarRolAbierto,
        usuarioSeleccionado,

        // Datos auxiliares
        rolesDisponibles,

        // Funciones principales
        fetchData,
        createItem,
        updateItem,
        deleteItem,

        // Funciones especiales
        activarUsuario,
        resetearPassword,
        cambiarRol,

        // Funciones de búsqueda y filtros
        buscarUsuarios,
        aplicarFiltros,
        limpiarFiltros,
        getEstadisticas,

        // Funciones de modales
        abrirModalNuevo,
        abrirModalEditar,
        abrirModalEliminar,
        abrirModalCambiarRol,
        cerrarModales,

        // Funciones de CRUD con modales
        confirmarEliminar,
        confirmarCambioRol,
        guardarNuevoUsuario,
        guardarEdicionUsuario,

        // Utilidades
        puedeEliminar,
        puedeActivar,
        puedeResetearPassword,
        getNombreRol,
        cargarRolesDisponibles,

        // Función para refrescar roles (útil cuando se crean nuevos roles)
        refrescarRoles: cargarRolesDisponibles
    };
};

export default useUsuarios;
