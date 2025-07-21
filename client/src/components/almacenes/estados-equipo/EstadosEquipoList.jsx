import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Button, Table, TableBody, TableCell, TableHead,
    TableHeadCell, TableRow, TextInput, Modal, ModalBody,
    ModalFooter, ModalHeader, Badge, Card
} from 'flowbite-react';
import {
    HiPlus, HiPencil, HiTrash, HiExclamationTriangle
} from 'react-icons/hi2';
import { HiSearch } from 'react-icons/hi';
import { HiCog6Tooth } from 'react-icons/hi2';
import { useEstadosEquipo } from '../../../hooks/useAlmacenes';
import EstadoEquipoForm from './EstadoEquipoForm';
import { Permiso} from "../../../api/permisos.js";

const EstadosEquipoList = () => {
    // Navigation hooks para auto-refresh
    const [searchParams, setSearchParams] = useSearchParams();

    // Estados locales
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEstado, setSelectedEstado] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [estadoToDelete, setEstadoToDelete] = useState(null);

    // Hook personalizado
    const {
        data: estadosEquipo,
        loading,
        error,
        fetchData,
        createItem,
        updateItem,
        deleteItem
    } = useEstadosEquipo();

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchData();
    }, []);

    // Auto-refresh cuando cambian los searchParams (evita refresco manual)
    useEffect(() => {
        const refreshParam = searchParams.get('refresh');
        if (refreshParam) {
            fetchData();
            // Limpiar el parámetro sin recargar la página
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('refresh');
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, fetchData, setSearchParams]);

    // Filtrar estados
    const filteredEstados = useMemo(() => {
        if (!searchTerm) return estadosEquipo;

        const term = searchTerm.toLowerCase();
        return estadosEquipo.filter(estado =>
            estado.nombre.toLowerCase().includes(term) ||
            (estado.descripcion && estado.descripcion.toLowerCase().includes(term))
        );
    }, [estadosEquipo, searchTerm]);

    // Estadísticas
    const stats = useMemo(() => {
        const totalEquipos = estadosEquipo.reduce((sum, estado) => sum + (estado.equipos_count || 0), 0);
        const estadosConEquipos = estadosEquipo.filter(e => (e.equipos_count || 0) > 0).length;
        const estadosSinEquipos = estadosEquipo.filter(e => (e.equipos_count || 0) === 0).length;

        return {
            totalEstados: estadosEquipo.length,
            totalEquipos,
            estadosConEquipos,
            estadosSinEquipos
        };
    }, [estadosEquipo]);

    // Obtener color del badge según el nombre del estado
    const getEstadoColor = (nombreEstado) => {
        const nombre = nombreEstado.toLowerCase();
        if (nombre.includes('disponible') || nombre.includes('libre')) return 'green';
        if (nombre.includes('asignado') || nombre.includes('activo')) return 'blue';
        if (nombre.includes('mantenimiento') || nombre.includes('reparacion')) return 'yellow';
        if (nombre.includes('dañado') || nombre.includes('averiado')) return 'red';
        if (nombre.includes('retirado') || nombre.includes('baja')) return 'gray';
        return 'purple';
    };

    // Función para trigger refresh usando React Router
    const triggerRefresh = () => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('refresh', Date.now().toString());
        setSearchParams(currentParams, { replace: true });
    };

    // Handlers
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // CORREGIDO: handleCreateEdit mejorado
    const handleCreateEdit = async (data) => {
        try {
            // Guardar referencia local del estado seleccionado
            const estadoToEdit = selectedEstado;
            let result;

            if (estadoToEdit && estadoToEdit.id) {
                console.log('Editando estado ID:', estadoToEdit.id);
                result = await updateItem(estadoToEdit.id, data);
            } else {
                console.log('Creando nuevo estado');
                result = await createItem(data);
            }

            if (result) {
                closeModal();
                // Auto-refresh usando searchParams
                triggerRefresh();
            }

        } catch (error) {
            console.error('Error en handleCreateEdit:', error);
        }
    };

    const handleDelete = async () => {
        if (estadoToDelete) {
            try {
                const result = await deleteItem(estadoToDelete.id);
                if (result !== false) {
                    setShowDeleteConfirm(false);
                    setEstadoToDelete(null);
                    // Auto-refresh
                    triggerRefresh();
                }
            } catch (error) {
                console.error('Error al eliminar estado:', error);
            }
        }
    };

    const openEditModal = (estado) => {
        console.log('Abriendo modal para editar estado:', estado);
        setSelectedEstado(estado);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        console.log('Abriendo modal para crear estado');
        setSelectedEstado(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEstado(null);
    };

    const confirmDelete = (estado) => {
        setEstadoToDelete(estado);
        setShowDeleteConfirm(true);
    };

    if (loading && estadosEquipo.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando estados de equipo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Estados de Equipo</h1>
                    <p className="text-gray-600 mt-1">
                        Administra los estados que pueden tener los equipos en el sistema
                    </p>
                </div>
                <div className="flex gap-2">
                    <Permiso recurso="catalogo" accion="crear">
                        <Button onClick={openCreateModal} color="blue" size="sm">
                            <HiPlus className="mr-2 h-4 w-4" />
                            Nuevo Estado
                        </Button>
                    </Permiso>

                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <HiCog6Tooth className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Total Estados</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalEstados}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <HiCog6Tooth className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Con Equipos</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.estadosConEquipos}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <HiCog6Tooth className="w-5 h-5 text-yellow-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Sin Equipos</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.estadosSinEquipos}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <HiCog6Tooth className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Total Equipos</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalEquipos}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Buscador */}
            <Card>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <TextInput
                            icon={HiSearch}
                            placeholder="Buscar estados por nombre o descripción..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="text-sm text-gray-600">
                        {filteredEstados.length} estado(s) encontrado(s)
                    </div>
                </div>
            </Card>

            {/* Tabla */}
            <Card>
                <div className="overflow-x-auto">
                    <Table hoverable>
                        <TableHead>
                            <TableRow>
                                <TableHeadCell>Estado</TableHeadCell>
                                <TableHeadCell>Descripción</TableHeadCell>
                                <TableHeadCell>Equipos</TableHeadCell>
                                <TableHeadCell>Uso</TableHeadCell>
                                <TableHeadCell>Fecha Creación</TableHeadCell>
                                <TableHeadCell>
                                    <span className="sr-only">Acciones</span>
                                </TableHeadCell>
                            </TableRow>
                        </TableHead>
                        <TableBody className="divide-y">
                            {filteredEstados.map((estado, index) => (
                                <TableRow key={`estado-${estado.id || index}`} className="bg-white">
                                    <TableCell className="whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Badge color={getEstadoColor(estado.nombre)} size="sm">
                                                {estado.nombre}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                        <div className="truncate">
                                            {estado.descripcion || 'Sin descripción'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge color="blue" size="sm">
                                            {estado.equipos_count || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {(estado.equipos_count || 0) > 0 ? (
                                            <Badge color="green" size="sm">En Uso</Badge>
                                        ) : (
                                            <Badge color="gray" size="sm">Sin Usar</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                                        {new Date(estado.created_at).toLocaleDateString('es-BO', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Permiso recurso="catalogo" accion="actualizar">
                                                <Button
                                                    size="xs"
                                                    color="blue"
                                                    onClick={() => openEditModal(estado)}
                                                    title="Editar estado"
                                                >
                                                    <HiPencil className="h-3 w-3" />
                                                </Button>
                                            </Permiso>
                                            <Permiso recurso="catalogo" accion="eliminar">
                                                <Button
                                                    size="xs"
                                                    color="red"
                                                    onClick={() => confirmDelete(estado)}
                                                    title="Eliminar estado"
                                                    disabled={(estado.equipos_count || 0) > 0}
                                                >
                                                    <HiTrash className="h-3 w-3" />
                                                </Button>
                                            </Permiso>

                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {filteredEstados.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <HiCog6Tooth className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No se encontraron estados
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm ? 'Ajusta la búsqueda o crea un nuevo estado' : 'Comienza creando los estados básicos: Disponible, Asignado, En Mantenimiento'}
                            </p>
                            <div className="mt-6">
                                <Button onClick={openCreateModal} color="blue">
                                    <HiPlus className="mr-2 h-4 w-4" />
                                    Nuevo Estado
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Modal de formulario */}
            <EstadoEquipoForm
                isOpen={isModalOpen}
                onClose={closeModal}
                estado={selectedEstado}
                onSubmit={handleCreateEdit}
                loading={loading}
            />

            {/* Modal de confirmación de eliminación */}
            <Modal show={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} size="md">
                <ModalHeader>Confirmar Eliminación</ModalHeader>
                <ModalBody>
                    <div className="text-center">
                        <HiExclamationTriangle className="mx-auto mb-4 h-14 w-14 text-red-600" />
                        <h3 className="mb-5 text-lg font-normal text-gray-500">
                            ¿Estás seguro de que quieres eliminar el estado{' '}
                            <span className="font-semibold">"{estadoToDelete?.nombre}"</span>?
                        </h3>
                        {(estadoToDelete?.equipos_count || 0) > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                <p className="text-sm text-red-800">
                                    Este estado está siendo usado por {estadoToDelete.equipos_count} equipo(s).
                                    No se puede eliminar.
                                </p>
                            </div>
                        )}
                        {(estadoToDelete?.equipos_count || 0) === 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                <p className="text-sm text-red-800">
                                    Esta acción no se puede deshacer. El estado será eliminado permanentemente.
                                </p>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter className="justify-center">
                    <Button
                        color="red"
                        onClick={handleDelete}
                        disabled={loading || (estadoToDelete?.equipos_count || 0) > 0}
                    >
                        {loading ? 'Eliminando...' : 'Sí, eliminar'}
                    </Button>
                    <Button
                        color="gray"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default EstadosEquipoList;