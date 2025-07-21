import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Button, Table, TableBody, TableCell, TableHead,
    TableHeadCell, TableRow, TextInput, Modal, ModalBody,
    ModalFooter, ModalHeader, Badge, Card, Select, Alert,
    Tooltip, Spinner
} from 'flowbite-react';
import {
    HiPlus, HiPencil, HiTrash, HiEye,
    HiExclamationTriangle, HiCog
} from 'react-icons/hi2';
import { HiFilter, HiSearch, HiX, HiInformationCircle } from 'react-icons/hi';
import { useModelosWithFilters, useMarcas, useTiposEquipo } from '../../../hooks/useAlmacenes';
import ModeloForm from './ModeloForm';
import toast, { Toaster } from 'react-hot-toast';
import { Permiso} from "../../../api/permisos.js";


const ModelosList = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const {
        modelos,
        loading,
        fetchModelos,
        createModelo,
        updateModelo,
        deleteModelo,
        filters
    } = useModelosWithFilters();

    const { marcas, fetchMarcas, loading: marcasLoading } = useMarcas();
    const { data: tiposEquipo, fetchData: fetchTiposEquipo, loading: tiposLoading } = useTiposEquipo();

    // Estados del formulario
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedMarca, setSelectedMarca] = useState(searchParams.get('marca') || '');
    const [selectedTipoEquipo, setSelectedTipoEquipo] = useState(searchParams.get('tipo_equipo') || '');

    // Estados del modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedModelo, setSelectedModelo] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [modeloToDelete, setModeloToDelete] = useState(null);

    // Estados de UI
    const [showFilters, setShowFilters] = useState(true);

    // Estadísticas calculadas
    const stats = {
        totalModelos: modelos.length,
        totalEquipos: modelos.reduce((sum, modelo) => sum + (modelo.equipos_count || 0), 0),
        equiposDisponibles: modelos.reduce((sum, modelo) => sum + (modelo.equipos_disponibles || 0), 0),
        totalMarcas: new Set(modelos.map(m => m.marca_nombre)).size
    };

    // Función para actualizar los filtros en la URL
    const updateFiltersInURL = (filters) => {
        const newParams = new URLSearchParams(searchParams);

        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                newParams.set(key, value);
            } else {
                newParams.delete(key);
            }
        });

        setSearchParams(newParams);
    };

    // Cargar datos iniciales
    useEffect(() => {
        const initialFilters = {
            search: searchParams.get('search') || '',
            marca: searchParams.get('marca') || '',
            tipo_equipo: searchParams.get('tipo_equipo') || ''
        };

        fetchModelos(initialFilters);
        fetchMarcas();
        fetchTiposEquipo();
    }, []);

    // Auto-refresh cuando cambian los searchParams
    useEffect(() => {
        const refreshParam = searchParams.get('refresh');
        if (refreshParam) {
            const currentFilters = {
                search: searchParams.get('search') || '',
                marca: searchParams.get('marca') || '',
                tipo_equipo: searchParams.get('tipo_equipo') || ''
            };

            fetchModelos(currentFilters);
            fetchMarcas();
            fetchTiposEquipo();

            // Limpiar el parámetro refresh después de usarlo
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('refresh');
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, fetchModelos, fetchMarcas, fetchTiposEquipo, setSearchParams]);

    // Aplicar filtros con debounce y actualizar URL
    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            const filters = {
                search: searchTerm,
                marca: selectedMarca,
                tipo_equipo: selectedTipoEquipo
            };

            updateFiltersInURL(filters);
            fetchModelos(filters);
        }, 500);

        return () => clearTimeout(delayedSearch);
    }, [searchTerm, selectedMarca, selectedTipoEquipo]);

    // Estados para prevenir duplicados
    const [toastShown, setToastShown] = useState(false);

    // Handlers para modelos - DEFINITIVAMENTE SIN DUPLICADOS
    const handleCreateEdit = async (data) => {
        if (toastShown) return; // Prevenir ejecución múltiple

        try {
            setToastShown(true);
            if (selectedModelo) {
                await updateModelo(selectedModelo.id, data);
                toast.success('Modelo actualizado exitosamente');
            } else {
                await createModelo(data);
                toast.success('Modelo creado exitosamente');
            }
            closeModal();
        } catch (error) {
            console.error('Error creating/updating modelo:', error);
            toast.error(selectedModelo ? 'Error al actualizar el modelo' : 'Error al crear el modelo');
        } finally {
            // Reset después de 2 segundos
            setTimeout(() => setToastShown(false), 2000);
        }
    };

    const handleDelete = async () => {
        if (!modeloToDelete) return;

        try {
            await deleteModelo(modeloToDelete.id);
            setTimeout(() => {
                toast.success('Modelo eliminado exitosamente');
            }, 100);
            setShowDeleteConfirm(false);
            setModeloToDelete(null);
        } catch (error) {
            console.error('Error deleting modelo:', error);
            setTimeout(() => {
                toast.error('Error al eliminar el modelo');
            }, 100);
        }
    };

    // Handlers para modales
    const openEditModal = (modelo) => {
        setSelectedModelo(modelo);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setSelectedModelo(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedModelo(null);
        setToastShown(false); // Reset del toast flag
    };

    const confirmDelete = (modelo) => {
        if (modelo.equipos_count > 0) {
            toast.error('No se puede eliminar un modelo que tiene equipos registrados');
            return;
        }
        setModeloToDelete(modelo);
        setShowDeleteConfirm(true);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedMarca('');
        setSelectedTipoEquipo('');
        setSearchParams(new URLSearchParams());
        fetchModelos({ search: '', marca: '', tipo_equipo: '' });
        toast.success('Filtros limpiados');
    };

    // Función para obtener color del badge según la cantidad
    const getBadgeColor = (count, type = 'default') => {
        if (type === 'disponible') {
            if (count === 0) return 'failure';
            if (count < 5) return 'warning';
            return 'success';
        }
        if (count === 0) return 'gray';
        if (count < 10) return 'info';
        return 'success';
    };

    // Loading state inicial
    if (loading && modelos.length === 0 && !searchParams.get('search')) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando modelos...</h3>
                    <p className="text-gray-600">Esto puede tomar unos segundos</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Toaster para las notificaciones */}
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerStyle={{
                    top: 20,
                    right: 20,
                }}
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        maxWidth: '350px',
                    },
                    success: {
                        duration: 3000,
                        style: {
                            background: '#10b981',
                            color: '#fff',
                        },
                    },
                    error: {
                        duration: 4000,
                        style: {
                            background: '#ef4444',
                            color: '#fff',
                        },
                    },
                }}
            />

            <div className="w-full mx-auto px-1 py-8 space-y-8">
                <div className="bg-white bg-opacity-90 rounded-2xl shadow-sm p-6 space-y-8 w-full">

                    {/* Header con título y botón de acción */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <HiCog className="w-6 h-6 text-white" />
                                </div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                    Gestión de Modelos
                                </h1>
                            </div>
                            <p className="text-gray-600 ml-13">
                                Administra los modelos de equipos, sus marcas, tipos y componentes
                            </p>
                        </div>
                        <Permiso recurso="catalogo" accion="crear" >
                            <Button
                                onClick={openCreateModal}
                                size="lg"
                                className="w-full lg:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                <HiPlus className="mr-2 h-5 w-5" />
                                Crear Nuevo Modelo
                            </Button>
                        </Permiso>

                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                        <HiCog className="w-7 h-7" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-blue-100 text-sm font-medium">Total Modelos</p>
                                    <p className="text-3xl font-bold text-white">{stats.totalModelos}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-gradient-to-r from-green-500 to-green-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                        <HiEye className="w-7 h-7" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-green-100 text-sm font-medium">Total Equipos</p>
                                    <p className="text-3xl font-bold text-white">{stats.totalEquipos}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                        <HiEye className="w-7 h-7" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-purple-100 text-sm font-medium">Disponibles</p>
                                    <p className="text-3xl font-bold text-white">{stats.equiposDisponibles}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                        <HiEye className="w-7 h-7" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-orange-100 text-sm font-medium">Marcas</p>
                                    <p className="text-3xl font-bold text-white">{stats.totalMarcas}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Sección de Filtros */}
                    <Card className="shadow-xl border-0 bg-white">
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Button
                                        color="gray"
                                        size="sm"
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200"
                                    >
                                        <HiFilter className="h-4 w-4 mr-2" />
                                        {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                                    </Button>
                                    {(searchTerm || selectedMarca || selectedTipoEquipo) && (
                                        <Button
                                            size="sm"
                                            className="bg-red-500 hover:bg-red-600 text-white border-0"
                                            onClick={clearFilters}
                                        >
                                            <HiX className="h-3 w-3 mr-2" />
                                            Limpiar Filtros
                                        </Button>
                                    )}
                                </div>

                                <div className="flex items-center text-sm bg-blue-50 px-4 py-2 rounded-lg">
                                    <span className="font-semibold text-blue-700">{modelos.length}</span>
                                    <span className="ml-1 text-blue-600">modelo(s) encontrado(s)</span>
                                    {loading && (
                                        <div className="ml-3 animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                    )}
                                </div>
                            </div>

                            {showFilters && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            🔍 Buscar modelos
                                        </label>
                                        <TextInput
                                            icon={HiSearch}
                                            placeholder="Escribe nombre, código o marca..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            disabled={loading}
                                            className="focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            🏷️ Filtrar por marca
                                        </label>
                                        <Select
                                            value={selectedMarca}
                                            onChange={(e) => setSelectedMarca(e.target.value)}
                                            disabled={marcasLoading || loading}
                                            className="focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Todas las marcas disponibles</option>
                                            {marcas.map((marca) => (
                                                <option key={marca.id} value={marca.id}>
                                                    {marca.nombre}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            ⚙️ Filtrar por tipo
                                        </label>
                                        <Select
                                            value={selectedTipoEquipo}
                                            onChange={(e) => setSelectedTipoEquipo(e.target.value)}
                                            disabled={tiposLoading || loading}
                                            className="focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Todos los tipos disponibles</option>
                                            {tiposEquipo.map((tipo) => (
                                                <option key={tipo.id} value={tipo.id}>
                                                    {tipo.nombre}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Tabla de Modelos */}
                    <Card className="shadow-xl border-0 bg-white">
                        <div className="overflow-x-auto">
                            <Table hoverable>
                                <TableHead className="bg-gray-50">
                                    <TableRow>
                                        <TableHeadCell className="text-gray-700 font-semibold">Código</TableHeadCell>
                                        <TableHeadCell className="text-gray-700 font-semibold">Modelo</TableHeadCell>
                                        <TableHeadCell className="hidden md:table-cell text-gray-700 font-semibold">Marca</TableHeadCell>
                                        <TableHeadCell className="hidden lg:table-cell text-gray-700 font-semibold">Tipo</TableHeadCell>
                                        <TableHeadCell className="text-center text-gray-700 font-semibold">Equipos</TableHeadCell>
                                        <TableHeadCell className="text-center text-gray-700 font-semibold">Disponibles</TableHeadCell>
                                        <TableHeadCell className="hidden xl:table-cell text-gray-700 font-semibold">Fecha</TableHeadCell>
                                        <TableHeadCell className="text-center text-gray-700 font-semibold">
                                            Acciones
                                        </TableHeadCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody className="divide-y divide-gray-100">
                                    {modelos.map((modelo) => (
                                        <TableRow key={modelo.id} className="bg-white hover:bg-blue-50 transition-colors duration-200">
                                            <TableCell className="whitespace-nowrap">
                                                <Badge className="bg-gray-100 text-gray-800 font-mono text-sm px-3 py-1 rounded-full border border-gray-200">
                                                    #{modelo.codigo_modelo}
                                                </Badge>
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-semibold text-gray-900 text-lg">
                                                        {modelo.nombre}
                                                    </div>
                                                    <div className="md:hidden text-sm text-gray-500 flex items-center gap-2">
                                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                            {modelo.marca_nombre}
                                                        </span>
                                                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                                            {modelo.tipo_equipo_nombre}
                                                        </span>
                                                    </div>
                                                    {modelo.componentes && modelo.componentes.length > 0 && (
                                                        <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full w-fit">
                                                            <HiInformationCircle className="h-3 w-3 mr-1" />
                                                            {modelo.componentes.length} componente(s)
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell className="hidden md:table-cell whitespace-nowrap">
                                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                                    {modelo.marca_nombre}
                                                </span>
                                            </TableCell>

                                            <TableCell className="hidden lg:table-cell whitespace-nowrap">
                                                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                                                    {modelo.tipo_equipo_nombre}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <Badge
                                                    color={getBadgeColor(modelo.equipos_count || 0)}
                                                    size="lg"
                                                    className="px-3 py-1 text-sm font-semibold"
                                                >
                                                    {modelo.equipos_count || 0}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <Badge
                                                    color={getBadgeColor(modelo.equipos_disponibles || 0, 'disponible')}
                                                    size="lg"
                                                    className="px-3 py-1 text-sm font-semibold"
                                                >
                                                    {modelo.equipos_disponibles || 0}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="hidden xl:table-cell whitespace-nowrap text-sm text-gray-500 font-medium">
                                                {new Date(modelo.created_at).toLocaleDateString('es-BO', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Tooltip content="Editar este modelo">
                                                        <Permiso recurso="catalogo" accion="actualizar" >
                                                            <Button
                                                                size="sm"
                                                                onClick={() => openEditModal(modelo)}
                                                                disabled={loading}
                                                                className="bg-blue-500 hover:bg-blue-600 text-white border-0 px-3 py-2"
                                                            >
                                                                <HiPencil className="h-4 w-4 mr-1" />
                                                                Editar
                                                            </Button>
                                                        </Permiso>

                                                    </Tooltip>

                                                    <Tooltip content={
                                                        modelo.equipos_count > 0
                                                            ? "No se puede eliminar: tiene equipos registrados"
                                                            : "Eliminar este modelo permanentemente"
                                                    }>
                                                        <Permiso recurso="catalogo" accion="eliminar">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => confirmDelete(modelo)}
                                                                disabled={modelo.equipos_count > 0 || loading}
                                                                className={`border-0 px-3 py-2 ${
                                                                    modelo.equipos_count > 0
                                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                        : 'bg-red-500 hover:bg-red-600 text-white'
                                                                }`}
                                                            >
                                                                <HiTrash className="h-4 w-4 mr-1" />
                                                                Eliminar
                                                            </Button>
                                                        </Permiso>

                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Estado vacío */}
                            {modelos.length === 0 && !loading && (
                                <div className="text-center py-16">
                                    <div className="mx-auto h-32 w-32 text-gray-300 mb-6">
                                        <HiCog className="h-full w-full" />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                                        {searchTerm || selectedMarca || selectedTipoEquipo
                                            ? 'No se encontraron modelos'
                                            : 'No hay modelos registrados'
                                        }
                                    </h3>
                                    <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
                                        {searchTerm || selectedMarca || selectedTipoEquipo
                                            ? 'Ajusta los filtros para encontrar más resultados o crea un nuevo modelo.'
                                            : 'Comienza creando tu primer modelo de equipo para organizar tu inventario.'
                                        }
                                    </p>
                                    <div className="space-y-4">
                                        <Button
                                            onClick={openCreateModal}
                                            size="lg"
                                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 text-white font-semibold px-8 py-3"
                                        >
                                            <HiPlus className="mr-2 h-5 w-5" />
                                            Crear Primer Modelo
                                        </Button>
                                        {(searchTerm || selectedMarca || selectedTipoEquipo) && (
                                            <div>
                                                <Button
                                                    onClick={clearFilters}
                                                    size="sm"
                                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200"
                                                >
                                                    <HiX className="mr-2 h-4 w-4" />
                                                    Limpiar Filtros
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Modal de formulario */}
                    <ModeloForm
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        modelo={selectedModelo}
                        onSubmit={handleCreateEdit}
                        loading={loading}
                    />

                    {/* Modal de confirmación de eliminación */}
                    <Modal show={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} size="lg">
                        <ModalHeader className="border-b border-gray-200 bg-red-50">
                            <div className="flex items-center text-red-700">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                    <HiExclamationTriangle className="h-6 w-6 text-red-600" />
                                </div>
                                <h3 className="text-xl font-semibold">Confirmar Eliminación</h3>
                            </div>
                        </ModalHeader>
                        <ModalBody className="space-y-6">
                            <div className="text-center">
                                <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <HiExclamationTriangle className="h-10 w-10 text-red-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                    ¿Eliminar modelo "{modeloToDelete?.nombre}"?
                                </h3>
                                <p className="text-gray-600 mb-6 text-lg">
                                    Esta acción no se puede deshacer. El modelo será eliminado permanentemente.
                                </p>
                            </div>

                            {modeloToDelete && (
                                <Alert color="warning" className="text-left">
                                    <HiInformationCircle className="h-5 w-5" />
                                    <div className="ml-3">
                                        <div className="text-sm font-semibold mb-2">
                                            Información del modelo:
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium">Código:</span> #{modeloToDelete.codigo_modelo}
                                            </div>
                                            <div>
                                                <span className="font-medium">Marca:</span> {modeloToDelete.marca_nombre}
                                            </div>
                                            <div>
                                                <span className="font-medium">Tipo:</span> {modeloToDelete.tipo_equipo_nombre}
                                            </div>
                                            <div>
                                                <span className="font-medium">Equipos:</span> {modeloToDelete.equipos_count || 0}
                                            </div>
                                        </div>
                                    </div>
                                </Alert>
                            )}
                        </ModalBody>
                        <ModalFooter className="border-t border-gray-200 bg-gray-50">
                            <div className="flex flex-col sm:flex-row justify-center w-full space-y-3 sm:space-y-0 sm:space-x-4">
                                <Button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-0 font-semibold px-6 py-3"
                                    size="lg"
                                >
                                    {loading ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                            Eliminando...
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <HiTrash className="mr-2 h-5 w-5" />
                                            Sí, Eliminar Modelo
                                        </div>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={loading}
                                    className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200 font-semibold px-6 py-3"
                                    size="lg"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </ModalFooter>
                    </Modal>
                </div>
            </div>
        </>
    );
};

export default ModelosList;
