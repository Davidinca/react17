// hooks/useContratos.js
import { useState, useEffect } from 'react';
import {
    buscarContrato,
    eliminarContrato,
    crearContrato,
    actualizarContrato,
    patchContrato,
    getClientes,
    listarContratos, tiposServicioApi
} from '../api/contratos';
import { toast } from 'react-hot-toast';
import { useAuth } from "../context/useAuth.js";

export const useContratos = () => {
    // Estados principales
    const [numeroContrato, setNumeroContrato] = useState('');
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Estados de modales
    const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
    const [modalContratoAbierto, setModalContratoAbierto] = useState(false);
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false);

    // Estados de datos
    const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [listado, setListando] = useState([]);
    const [errorHandler, setErrorHandler] = useState(null);

    // Contexto de autenticación
    const { makeAuthenticatedRequest, loading: authLoading } = useAuth();

    // Cargar clientes al montar el componente
    useEffect(() => {
        if (authLoading) return;

        const fetchClientes = async () => {
            try {
                const data = await makeAuthenticatedRequest(async (validToken) => {
                    return await getClientes(validToken);
                });
                setClientes(data);
            } catch (err) {
                console.error('Error cargando clientes', err);
            }
        };
        fetchClientes();
    }, [authLoading, makeAuthenticatedRequest]);

    // Función para buscar contrato
    const buscar = async (showToast = true, numeroEspecifico = null) => {
        const numeroABuscar = numeroEspecifico || numeroContrato;

        setError('');
        setResultado(null);

        // Validar formato de 8 dígitos
        if (!/^\d{8}$/.test(numeroABuscar)) {
            setError('El número de contrato debe tener exactamente 8 dígitos.');
            return;
        }

        // Actualizar el estado si se pasa un número específico
        if (numeroEspecifico) {
            setNumeroContrato(numeroEspecifico);
        }

        const toastId = showToast ? toast.loading('Buscando contrato...') : null;
        try {
            setIsLoading(true);
            const data = await buscarContrato(numeroABuscar);
            setResultado(data);
            console.log('Contrato encontrado:', data);

            if (showToast) {
                toast.success('Contrato encontrado', { id: toastId });
            }
        } catch (err) {
            const mensaje = err.response?.data?.detail || 'No se encontró el contrato o hubo un error.';
            setError(mensaje);
            if (showToast) {
                toast.error(mensaje, { id: toastId });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Funciones para manejar modales
    const abrirModalEliminar = (contrato) => {
        setContratoSeleccionado(contrato);
        setModalEliminarAbierto(true);
    };

    const abrirNuevoContrato = () => {
        setModalContratoAbierto(true);
        setErrorHandler(null); // Limpiar handler de errores previo
    };

    const abrirEditarContrato = () => {
        setContratoSeleccionado(resultado);
        setModalEditarAbierto(true);
        setErrorHandler(null); // Limpiar handler de errores previo
    };

    const cerrarModales = () => {
        setModalEliminarAbierto(false);
        setModalContratoAbierto(false);
        setModalEditarAbierto(false);
        setContratoSeleccionado(null);
        setErrorHandler(null);
    };

    // Función para confirmar eliminación
    const confirmarEliminar = async () => {
        try {
            await eliminarContrato(contratoSeleccionado.id);
            toast.success('Contrato eliminado correctamente');
            setResultado(null);
            setModalEliminarAbierto(false);
        } catch {
            toast.error('Error al eliminar el contrato');
        }
    };

    // Función para manejar errores del backend
    const handleBackendError = (error, operation = 'operacion') => {
        console.error(`Error en ${operation}:`, error);

        if (error.response?.status === 400) {
            const errorData = error.response.data;
            console.log('Error data completo:', errorData);

            // Si tenemos un handler específico del formulario, usarlo
            if (errorHandler) {
                errorHandler(error);
                return;
            }

            // Manejo de errores específicos del cliente
            if (errorData.cliente) {
                // Errores de CI
                if (errorData.cliente.ci) {
                    const ciError = Array.isArray(errorData.cliente.ci)
                        ? errorData.cliente.ci[0]
                        : errorData.cliente.ci;
                    toast.error(`Error en CI: ${ciError}`);
                    return;
                }

                // Errores de nombres
                if (errorData.cliente.nombres) {
                    const nombresError = Array.isArray(errorData.cliente.nombres)
                        ? errorData.cliente.nombres[0]
                        : errorData.cliente.nombres;
                    toast.error(`Error en nombres: ${nombresError}`);
                    return;
                }

                // Errores de apellidos
                if (errorData.cliente.apellidos) {
                    const apellidosError = Array.isArray(errorData.cliente.apellidos)
                        ? errorData.cliente.apellidos[0]
                        : errorData.cliente.apellidos;
                    toast.error(`Error en apellidos: ${apellidosError}`);
                    return;
                }

                // Errores generales del cliente
                if (errorData.cliente.general) {
                    const generalError = Array.isArray(errorData.cliente.general)
                        ? errorData.cliente.general[0]
                        : errorData.cliente.general;
                    toast.error(`Error: ${generalError}`);
                    return;
                }

                // Si hay otros campos de error en cliente
                const firstClientError = Object.values(errorData.cliente)[0];
                if (firstClientError) {
                    const errorMsg = Array.isArray(firstClientError)
                        ? firstClientError[0]
                        : firstClientError;
                    toast.error(`Error: ${errorMsg}`);
                    return;
                }
            }

            // Error general de validación
            if (errorData.detail) {
                toast.error(errorData.detail);
                return;
            }

            // Error general
            if (errorData.general) {
                const generalError = Array.isArray(errorData.general)
                    ? errorData.general[0]
                    : errorData.general;
                toast.error(`Error: ${generalError}`);
                return;
            }
        }

        // Error genérico
        toast.error(`Error al ${operation}`);
    };

    // Función para guardar nuevo contrato
    const guardarNuevoContrato = async (datos, formErrorHandler = null) => {
        try {
            // Guardar el handler de errores del formulario
            setErrorHandler(() => formErrorHandler);

            const contratoCreado = await crearContrato(datos);
            console.log('Contrato creado:', contratoCreado);

            toast.success('Contrato creado exitosamente');
            setModalContratoAbierto(false);

            // Obtener el número del contrato
            const numeroRecibido = contratoCreado?.numero_contrato || contratoCreado?.numero;
            console.log('Numero de Contrato recibido', numeroRecibido);

            if (numeroRecibido) {
                // Formatear a 8 dígitos
                const numeroParaBuscar = numeroRecibido.toString().padStart(8, '0');
                console.log('Número para buscar:', numeroParaBuscar);

                // Buscar el contrato recién creado
                await buscar(false, numeroParaBuscar);
            } else {
                console.log('No se recibió número, mostrando contrato completo');
                // Mostrar directamente el contrato
                setResultado(contratoCreado);
                setError('');
                setNumeroContrato(contratoCreado.numero_contrato || '');
            }

        } catch (error) {
            // Si hay un handler del formulario y es error 400, dejar que lo maneje
            if (error.response?.status === 400 && formErrorHandler) {
                formErrorHandler(error);
            } else {
                handleBackendError(error, 'crear contrato');
            }
            throw error; // Re-lanzar para que el formulario pueda manejarlo también
        }
    };

    // Función para guardar edición de contrato
    const guardarEdicionContrato = async (datos, formErrorHandler = null) => {
        if (!contratoSeleccionado?.id) {
            toast.error('No se pudo identificar el contrato a editar');
            return;
        }

        try {
            setErrorHandler(() => formErrorHandler);

            console.log('=== ENVIANDO DATOS COMPLETOS AL BACKEND ===');
            console.log('Datos del formulario:', datos);
            console.log('ID del contrato:', contratoSeleccionado.id);

            // SIMPLICIDAD: Siempre enviar todos los datos
            // El backend decide qué hacer basado en si el CI cambió o no
            const respuesta = await actualizarContrato(contratoSeleccionado.id, datos);

            console.log('Respuesta exitosa:', respuesta);
            toast.success('Contrato actualizado exitosamente');
            setModalEditarAbierto(false);

            // Refrescar los datos del contrato
            const numeroActual = resultado.numero_contrato;
            if (numeroActual) {
                await buscar(false, numeroActual);
            }

        } catch (error) {
            console.error('Error al actualizar contrato:', error);

            // Si es error 400 y tenemos handler del formulario, usarlo
            if (error.response?.status === 400 && formErrorHandler) {
                formErrorHandler(error);
            } else {
                handleBackendError(error, 'actualizar contrato');
            }
        }
    };

    // Función para cargar listado completo
    const cargarListado = async () => {
        try {
            const data = await listarContratos();
            setListando(data);
        } catch {
            toast.error('No se pudo cargar el listado de contratos');
        }
    };

    // Función para manejar el submit del formulario de búsqueda
    const handleBuscarSubmit = (e) => {
        e.preventDefault();
        buscar();
    };

    return {
        // Estados
        numeroContrato,
        setNumeroContrato,
        resultado,
        error,
        isLoading,
        clientes,
        listado,
        contratoSeleccionado,

        // Estados de modales
        modalEliminarAbierto,
        modalContratoAbierto,
        modalEditarAbierto,

        // Funciones de búsqueda
        buscar,
        handleBuscarSubmit,
        cargarListado,

        // Funciones de modales
        abrirModalEliminar,
        abrirNuevoContrato,
        abrirEditarContrato,
        cerrarModales,

        // Funciones de CRUD
        confirmarEliminar,
        guardarNuevoContrato,
        guardarEdicionContrato,

        // Utilidades
        handleBackendError
    };
};
export const useTiposServicioContratos = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await tiposServicioApi.getAll();
            setData(response.data.results || response.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error al cargar tipos de servicio');
            console.error('Error fetching tipos servicio contratos:', err);
        } finally {
            setLoading(false);
        }
    };

    const createItem = async (itemData) => {
        try {
            setLoading(true);
            const response = await tiposServicioApi.create(itemData);
            setData(prev => [response.data, ...prev]);
            toast.success('Tipo de servicio creado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al crear tipo de servicio');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateItem = async (id, itemData) => {
        try {
            setLoading(true);
            const response = await tiposServicioApi.update(id, itemData);
            setData(prev => prev.map(item =>
                item.id === id ? response.data : item
            ));
            toast.success('Tipo de servicio actualizado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al actualizar tipo de servicio');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (id) => {
        try {
            setLoading(true);
            await tiposServicioApi.delete(id);
            setData(prev => prev.filter(item => item.id !== id));
            toast.success('Tipo de servicio eliminado exitosamente');
        } catch (err) {
            toast.error('Error al eliminar tipo de servicio');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        data,
        loading,
        error,
        fetchData,
        createItem,
        updateItem,
        deleteItem
    };
};
