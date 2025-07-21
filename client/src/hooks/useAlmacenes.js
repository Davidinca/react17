// ======================================================
// src/hooks/useAlmacenes.js - Con Autenticación (Sin Validaciones de Permisos)
// ======================================================

import { useState, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import {
    componentesApi,
    equiposApi,
    estadosEquipoApi,
    lotesApi,
    marcasApi,
    modelosApi,
    tiposEquipoApi
} from "../api/almacenes.js";

// ======================================================
// HOOK PARA AUTENTICACIÓN - useAuth
// ======================================================

export const useAuth = () => useContext(AuthContext);

// ======================================================
// HOOK GENÉRICO PARA OPERACIONES CRUD CON AUTENTICACIÓN
// ======================================================

export const useApi = (apiService) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { makeAuthenticatedRequest } = useAuth();

    const fetchData = async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await apiService.getAll(params);
            });
            setData(response.data.results || response.data);
        } catch (err) {
            setError(err.message);
            toast.error('Error al cargar datos');
            console.error('API Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const createItem = async (itemData) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(async () => {
                return await apiService.create(itemData);
            });
            setData(prev => [response.data, ...prev]);
            toast.success('Creado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al crear');
            console.error('Create Error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateItem = async (id, itemData) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(async () => {
                return await apiService.update(id, itemData);
            });
            setData(prev => prev.map(item =>
                item.id === id ? response.data : item
            ));
            toast.success('Actualizado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al actualizar');
            console.error('Update Error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (id) => {
        try {
            setLoading(true);
            await makeAuthenticatedRequest(async () => {
                return await apiService.delete(id);
            });
            setData(prev => prev.filter(item => item.id !== id));
            toast.success('Eliminado exitosamente');
        } catch (err) {
            toast.error('Error al eliminar');
            console.error('Delete Error:', err);
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
        deleteItem,
        setData
    };
};

// ======================================================
// HOOK ESPECÍFICO PARA MARCAS CON AUTENTICACIÓN
// ======================================================

export const useMarcas = () => {
    const [marcas, setMarcas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { makeAuthenticatedRequest } = useAuth();

    const fetchMarcas = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await marcasApi.getAll();
            });
            setMarcas(response.data.results || response.data);
        } catch (err) {
            setError(err.message);
            toast.error('Error al cargar marcas');
            console.error('Error fetching marcas:', err);
        } finally {
            setLoading(false);
        }
    };

    const createMarca = async (marcaData) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(async () => {
                return await marcasApi.create(marcaData);
            });
            setMarcas(prev => [response.data, ...prev]);
            toast.success('Marca creada exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al crear marca');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateMarca = async (id, marcaData) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(async () => {
                return await marcasApi.update(id, marcaData);
            });
            setMarcas(prev => prev.map(marca =>
                marca.id === id ? response.data : marca
            ));
            toast.success('Marca actualizada exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al actualizar marca');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteMarca = async (id) => {
        try {
            setLoading(true);
            await makeAuthenticatedRequest(async () => {
                return await marcasApi.delete(id);
            });
            setMarcas(prev => prev.filter(marca => marca.id !== id));
            toast.success('Marca eliminada exitosamente');
        } catch (err) {
            toast.error('Error al eliminar marca');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        marcas,
        loading,
        error,
        fetchMarcas,
        createMarca,
        updateMarca,
        deleteMarca
    };
};

// ======================================================
// HOOK PARA TIPOS DE EQUIPO CON AUTENTICACIÓN
// ======================================================

export const useTiposEquipo = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { makeAuthenticatedRequest } = useAuth();

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await tiposEquipoApi.getAll();
            });
            setData(response.data.results || response.data);
        } catch (err) {
            setError(err.message);
            toast.error('Error al cargar tipos de equipo');
            console.error('Error fetching tipos equipo:', err);
        } finally {
            setLoading(false);
        }
    };

    const createItem = async (itemData) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(async () => {
                return await tiposEquipoApi.create(itemData);
            });
            setData(prev => [response.data, ...prev]);
            toast.success('Tipo de equipo creado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al crear tipo de equipo');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateItem = async (id, itemData) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(async () => {
                return await tiposEquipoApi.update(id, itemData);
            });
            setData(prev => prev.map(item =>
                item.id === id ? response.data : item
            ));
            toast.success('Tipo de equipo actualizado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al actualizar tipo de equipo');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (id) => {
        try {
            setLoading(true);
            await makeAuthenticatedRequest(async () => {
                return await tiposEquipoApi.delete(id);
            });
            setData(prev => prev.filter(item => item.id !== id));
            toast.success('Tipo de equipo eliminado exitosamente');
        } catch (err) {
            toast.error('Error al eliminar tipo de equipo');
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

// ======================================================
// HOOK PARA ESTADOS DE EQUIPO CON AUTENTICACIÓN
// ======================================================

export const useEstadosEquipo = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { makeAuthenticatedRequest } = useAuth();

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await estadosEquipoApi.getAll();
            });
            setData(response.data.results || response.data);
        } catch (err) {
            setError(err.message);
            toast.error('Error al cargar estados de equipo');
            console.error('Error fetching estados equipo:', err);
        } finally {
            setLoading(false);
        }
    };

    const createItem = async (itemData) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(async () => {
                return await estadosEquipoApi.create(itemData);
            });
            setData(prev => [response.data, ...prev]);
            toast.success('Estado de equipo creado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al crear estado de equipo');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateItem = async (id, itemData) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(async () => {
                return await estadosEquipoApi.update(id, itemData);
            });
            setData(prev => prev.map(item =>
                item.id === id ? response.data : item
            ));
            toast.success('Estado de equipo actualizado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al actualizar estado de equipo');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (id) => {
        try {
            setLoading(true);
            await makeAuthenticatedRequest(async () => {
                return await estadosEquipoApi.delete(id);
            });
            setData(prev => prev.filter(item => item.id !== id));
            toast.success('Estado de equipo eliminado exitosamente');
        } catch (err) {
            toast.error('Error al eliminar estado de equipo');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Función especial para obtener distribución de equipos por estado
    const getDistribucion = async () => {
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await estadosEquipoApi.getDistribucion();
            });
            return response.data;
        } catch (err) {
            toast.error('Error al obtener distribución de estados');
            throw err;
        }
    };

    return {
        data,
        loading,
        error,
        fetchData,
        createItem,
        updateItem,
        deleteItem,
        getDistribucion
    };
};

// ======================================================
// HOOK PARA COMPONENTES CON AUTENTICACIÓN
// ======================================================

export const useComponentes = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { makeAuthenticatedRequest } = useAuth();

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await componentesApi.getAll();
            });
            setData(response.data.results || response.data);
        } catch (err) {
            setError(err.message);
            toast.error('Error al cargar componentes');
            console.error('Error fetching componentes:', err);
        } finally {
            setLoading(false);
        }
    };

    const createItem = async (itemData) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(async () => {
                return await componentesApi.create(itemData);
            });
            setData(prev => [response.data, ...prev]);
            toast.success('Componente creado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al crear componente');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateItem = async (id, itemData) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(async () => {
                return await componentesApi.update(id, itemData);
            });
            setData(prev => prev.map(item =>
                item.id === id ? response.data : item
            ));
            toast.success('Componente actualizado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al actualizar componente');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (id) => {
        try {
            setLoading(true);
            await makeAuthenticatedRequest(async () => {
                return await componentesApi.delete(id);
            });
            setData(prev => prev.filter(item => item.id !== id));
            toast.success('Componente eliminado exitosamente');
        } catch (err) {
            toast.error('Error al eliminar componente');
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

// ======================================================
// HOOK PARA MODELOS CON FILTROS AVANZADOS Y AUTENTICACIÓN
// ======================================================

export const useModelosWithFilters = () => {
    const [modelos, setModelos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        marca: '',
        tipo_equipo: ''
    });
    const { makeAuthenticatedRequest } = useAuth();

    const fetchModelos = async (newFilters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const params = { ...filters, ...newFilters };
            const response = await makeAuthenticatedRequest(async () => {
                return await modelosApi.getAll(params);
            });
            setModelos(response.data.results || response.data);
            setFilters({ ...filters, ...newFilters });
        } catch (err) {
            setError(err.message);
            toast.error('Error al cargar modelos');
            console.error('Error fetching modelos:', err);
        } finally {
            setLoading(false);
        }
    };

    const createModelo = async (modeloData) => {
        try {
            setLoading(true);

            console.log('🔍 === DEBUG CREAR MODELO ===');
            console.log('📤 Datos enviados:', modeloData);

            // Separar datos del modelo y componentes
            const { componentes, ...datosModelo } = modeloData;

            console.log('📝 Datos del modelo:', datosModelo);
            console.log('🔧 Componentes:', componentes);

            // Primero crear el modelo
            const response = await makeAuthenticatedRequest(async () => {
                return await modelosApi.create(datosModelo);
            });

            const modeloCreado = response.data;
            console.log('✅ Modelo creado:', modeloCreado);

            // Si hay componentes, agregarlos uno por uno
            if (componentes && componentes.length > 0) {
                console.log('🔧 Agregando componentes...');

                for (const componente of componentes) {
                    try {
                        console.log('➕ Agregando componente:', componente);

                        await makeAuthenticatedRequest(async () => {
                            return await modelosApi.agregarComponente(modeloCreado.id, {
                                componente_id: componente.componente,
                                cantidad: componente.cantidad
                            });
                        });

                        console.log('✅ Componente agregado exitosamente');
                    } catch (compError) {
                        console.error('❌ Error agregando componente:', compError);
                        toast.error(`Error agregando componente: ${compError.message}`);
                    }
                }
            }

            // Recargar el modelo completo con componentes
            const modeloCompleto = await makeAuthenticatedRequest(async () => {
                return await modelosApi.getById(modeloCreado.id);
            });

            setModelos(prev => [modeloCompleto.data, ...prev]);
            toast.success('Modelo creado exitosamente');
            return modeloCompleto.data;

        } catch (err) {
            toast.error('Error al crear modelo');
            console.error('Create modelo error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateModelo = async (id, modeloData) => {
        try {
            setLoading(true);

            console.log('🔍 === DEBUG ACTUALIZAR MODELO ===');
            console.log('📤 Datos enviados:', modeloData);

            // Separar datos del modelo y componentes
            const { componentes, ...datosModelo } = modeloData;

            console.log('📝 Datos del modelo:', datosModelo);
            console.log('🔧 Componentes:', componentes);

            // Actualizar datos básicos del modelo
            const response = await makeAuthenticatedRequest(async () => {
                return await modelosApi.update(id, datosModelo);
            });

            console.log('✅ Modelo actualizado:', response.data);

            // Para la actualización de componentes, necesitarías implementar
            // un endpoint específico o manejar la eliminación y re-creación
            // Por ahora, mostraremos un mensaje informativo
            if (componentes && componentes.length > 0) {
                console.log('ℹ️ Los componentes deben actualizarse manualmente por ahora');
                toast.info('Modelo actualizado. Los componentes deben gestionarse por separado.');
            }

            setModelos(prev => prev.map(modelo =>
                modelo.id === id ? response.data : modelo
            ));

            toast.success('Modelo actualizado exitosamente');
            return response.data;

        } catch (err) {
            toast.error('Error al actualizar modelo');
            console.error('Update modelo error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteModelo = async (id) => {
        try {
            setLoading(true);
            await makeAuthenticatedRequest(async () => {
                return await modelosApi.delete(id);
            });
            setModelos(prev => prev.filter(modelo => modelo.id !== id));
            toast.success('Modelo eliminado exitosamente');
        } catch (err) {
            toast.error('Error al eliminar modelo');
            console.error('Delete modelo error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const agregarComponenteAModelo = async (modeloId, componenteData) => {
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await modelosApi.agregarComponente(modeloId, componenteData);
            });

            // Actualizar el modelo en el estado
            setModelos(prev => prev.map(modelo =>
                modelo.id === modeloId
                    ? { ...modelo, componentes: [...modelo.componentes, response.data] }
                    : modelo
            ));

            toast.success('Componente agregado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al agregar componente');
            throw err;
        }
    };

    const removerComponenteDeModelo = async (modeloId, componenteId) => {
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await modelosApi.removerComponente(modeloId, { componente_id: componenteId });
            });

            // Actualizar el modelo en el estado
            setModelos(prev => prev.map(modelo =>
                modelo.id === modeloId ? response.data : modelo
            ));

            toast.success('Componente removido exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al remover componente');
            throw err;
        }
    };

    return {
        modelos,
        loading,
        error,
        filters,
        fetchModelos,
        createModelo,
        updateModelo,
        deleteModelo,
        agregarComponenteAModelo,
        removerComponenteDeModelo
    };
};

export const useComponentesBasic = () => {
    const [componentes, setComponentes] = useState([]);
    const [loading, setLoading] = useState(false);
    const { makeAuthenticatedRequest } = useAuth();

    const fetchComponentes = async () => {
        setLoading(true);
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await componentesApi.getAll();
            });
            setComponentes(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching componentes:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        componentes,
        loading,
        fetchComponentes
    };
};

// ======================================================
// HOOK PARA LOTES CON AUTENTICACIÓN
// ======================================================

export const useLotes = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { makeAuthenticatedRequest } = useAuth();

    const fetchData = async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await lotesApi.getAll(params);
            });
            setData(response.data.results || response.data);
        } catch (err) {
            setError(err.message);
            toast.error('Error al cargar lotes');
            console.error('Error fetching lotes:', err);
        } finally {
            setLoading(false);
        }
    };

    const createItem = async (itemData) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(async () => {
                return await lotesApi.create(itemData);
            });
            setData(prev => [response.data, ...prev]);
            toast.success('Lote creado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al crear lote');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateItem = async (id, itemData) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(async () => {
                return await lotesApi.update(id, itemData);
            });
            setData(prev => prev.map(item =>
                item.id === id ? response.data : item
            ));
            toast.success('Lote actualizado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al actualizar lote');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (id) => {
        try {
            setLoading(true);
            await makeAuthenticatedRequest(async () => {
                return await lotesApi.delete(id);
            });
            setData(prev => prev.filter(item => item.id !== id));
            toast.success('Lote eliminado exitosamente');
        } catch (err) {
            toast.error('Error al eliminar lote');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Función especial para obtener resumen de un lote
    const getResumen = async (loteId) => {
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await lotesApi.getResumen(loteId);
            });
            return response.data;
        } catch (err) {
            toast.error('Error al obtener resumen del lote');
            throw err;
        }
    };

    // Función para agregar detalle a un lote
    const agregarDetalle = async (loteId, detalleData) => {
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await lotesApi.agregarDetalle(loteId, detalleData);
            });
            // Refrescar los datos después de agregar el detalle
            await fetchData();
            toast.success('Detalle agregado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al agregar detalle al lote');
            throw err;
        }
    };

    // Función para obtener estadísticas de lotes
    const getEstadisticas = async () => {
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await lotesApi.getEstadisticas();
            });
            return response.data;
        } catch (err) {
            toast.error('Error al obtener estadísticas de lotes');
            throw err;
        }
    };

    return {
        data,
        loading,
        error,
        fetchData,
        createItem,
        updateItem,
        deleteItem,
        getResumen,
        agregarDetalle,
        getEstadisticas
    };
};

// ======================================================
// HOOK PARA EQUIPOS CON FILTROS AVANZADOS Y AUTENTICACIÓN
// ======================================================

export const useEquiposWithFilters = () => {
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        modelo: '',
        marca: '',
        estado: '',
        lote: '',
        disponible: ''
    });
    const { makeAuthenticatedRequest } = useAuth();

    const fetchEquipos = async (newFilters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const params = { ...filters, ...newFilters };
            const response = await makeAuthenticatedRequest(async () => {
                return await equiposApi.getAll(params);
            });
            setEquipos(response.data.results || response.data);
            setFilters({ ...filters, ...newFilters });
        } catch (err) {
            setError(err.message);
            toast.error('Error al cargar equipos');
            console.error('Error fetching equipos:', err);
        } finally {
            setLoading(false);
        }
    };

    const createEquipo = async (equipoData) => {
        try {
            setLoading(true);

            console.log('🔍 === DEBUG CREAR EQUIPO ===');
            console.log('📤 Datos enviados:', equipoData);

            const response = await makeAuthenticatedRequest(async () => {
                return await equiposApi.create(equipoData);
            });

            setEquipos(prev => [response.data, ...prev]);
            toast.success('Equipo registrado exitosamente');
            return response.data;
        } catch (err) {
            // *** AGREGAR ESTOS LOGS DETALLADOS ***
            console.error('❌ === ERROR COMPLETO ===');
            console.error('❌ Error response:', err.response);
            console.error('❌ Error response data:', err.response?.data);
            console.error('❌ Error response status:', err.response?.status);

            toast.error('Error al registrar equipo');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateEquipo = async (id, equipoData) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(async () => {
                return await equiposApi.update(id, equipoData);
            });
            setEquipos(prev => prev.map(equipo =>
                equipo.id === id ? response.data : equipo
            ));
            toast.success('Equipo actualizado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al actualizar equipo');
            console.error('Update equipo error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteEquipo = async (id) => {
        try {
            setLoading(true);
            await makeAuthenticatedRequest(async () => {
                return await equiposApi.delete(id);
            });
            setEquipos(prev => prev.filter(equipo => equipo.id !== id));
            toast.success('Equipo eliminado exitosamente');
        } catch (err) {
            toast.error('Error al eliminar equipo');
            console.error('Delete equipo error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const cambiarEstado = async (id, estadoData) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(async () => {
                return await equiposApi.cambiarEstado(id, estadoData);
            });
            setEquipos(prev => prev.map(equipo =>
                equipo.id === id ? response.data : equipo
            ));
            toast.success('Estado cambiado exitosamente');
            return response.data;
        } catch (err) {
            toast.error('Error al cambiar estado');
            console.error('Cambiar estado error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener equipos disponibles
    const getEquiposDisponibles = async (params = {}) => {
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await equiposApi.getDisponibles(params);
            });
            return response.data;
        } catch (err) {
            toast.error('Error al obtener equipos disponibles');
            throw err;
        }
    };

    // Función para obtener historial de un equipo
    const getHistorialEquipo = async (equipoId) => {
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await equiposApi.getHistorial(equipoId);
            });
            return response.data;
        } catch (err) {
            toast.error('Error al obtener historial del equipo');
            throw err;
        }
    };

    // Función para obtener estadísticas
    const getEstadisticas = async () => {
        try {
            const response = await makeAuthenticatedRequest(async () => {
                return await equiposApi.getEstadisticas();
            });
            return response.data;
        } catch (err) {
            toast.error('Error al obtener estadísticas de equipos');
            throw err;
        }
    };

    return {
        equipos,
        loading,
        error,
        filters,
        fetchEquipos,
        createEquipo,
        updateEquipo,
        deleteEquipo,
        cambiarEstado,
        getEquiposDisponibles,
        getHistorialEquipo,
        getEstadisticas
    };
};

// ======================================================
// COMPONENTE PERMISO PARA USAR EN JSX (Opcional)
// ======================================================

export const Permiso = ({ recurso, accion, children, fallback = null }) => {
    const { hasPermission } = useAuth();

    if (!hasPermission(recurso, accion)) {
        return fallback;
    }

    return children;
};

// ======================================================
// EXPORTS ADICIONALES PARA COMPATIBILIDAD
// ======================================================

// Re-exportar hooks genéricos para casos específicos
export const useTipoEquipo = () => useTiposEquipo();
export const useEstadoEquipo = () => useEstadosEquipo();
export const useComponente = () => useComponentes();
export const useLote = () => useLotes();
export const useEquipo = () => useEquiposWithFilters();
