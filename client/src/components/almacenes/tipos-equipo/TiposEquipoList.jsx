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
import { useTiposEquipo } from '../../../hooks/useAlmacenes';
import TipoEquipoForm from './TipoEquipoForm';
import { Permiso} from "../../../api/permisos.js";


const TiposEquipoList = () => {
    // Navigation hooks para auto-refresh
    const [searchParams, setSearchParams] = useSearchParams();

    // Estados locales
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTipoEquipo, setSelectedTipoEquipo] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [tipoEquipoToDelete, setTipoEquipoToDelete] = useState(null);

    // Hook personalizado
    const {
        data: tiposEquipo,
        loading,
        error,
        fetchData,
        createItem,
        updateItem,
        deleteItem
    } = useTiposEquipo();

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchData();
    }, []);

    // Auto-refresh cuando cambian los searchParams
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

    // Filtrar tipos de equipo
    const filteredTiposEquipo = useMemo(() => {
        if (!searchTerm) return tiposEquipo;

        const term = searchTerm.toLowerCase();
        return tiposEquipo.filter(tipo =>
            tipo.nombre.toLowerCase().includes(term) ||
            (tipo.descripcion && tipo.descripcion.toLowerCase().includes(term))
        );
    }, [tiposEquipo, searchTerm]);

    // Estadísticas
    const stats = useMemo(() => {
        const totalModelos = tiposEquipo.reduce((sum, tipo) => sum + (tipo.modelos_count || 0), 0);
        const totalEquipos = tiposEquipo.reduce((sum, tipo) => sum + (tipo.equipos_count || 0), 0);

        return {
            totalTipos: tiposEquipo.length,
            totalModelos,
            totalEquipos
        };
    }, [tiposEquipo]);

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
            // Guardar referencia local del tipo seleccionado
            const tipoToEdit = selectedTipoEquipo;
            let result;

            if (tipoToEdit && tipoToEdit.id) {
                console.log('Editando tipo equipo ID:', tipoToEdit.id);
                result = await updateItem(tipoToEdit.id, data);
            } else {
                console.log('Creando nuevo tipo equipo');
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
        if (tipoEquipoToDelete) {
            try {
                const result = await deleteItem(tipoEquipoToDelete.id);
                if (result !== false) {
                    setShowDeleteConfirm(false);
                    setTipoEquipoToDelete(null);
                    // Auto-refresh
                    triggerRefresh();
                }
            } catch (error) {
                console.error('Error al eliminar tipo equipo:', error);
            }
        }
    };

    const openEditModal = (tipoEquipo) => {
        console.log('Abriendo modal para editar tipo equipo:', tipoEquipo);
        setSelectedTipoEquipo(tipoEquipo);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        console.log('Abriendo modal para crear tipo equipo');
        setSelectedTipoEquipo(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTipoEquipo(null);
    };

    const confirmDelete = (tipoEquipo) => {
        setTipoEquipoToDelete(tipoEquipo);
        setShowDeleteConfirm(true);
    };

    if (loading && tiposEquipo.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando tipos de equipo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Tipos de Equipo</h1>
                    <p className="text-gray-600 mt-1">
                        Administra los tipos de equipos del sistema
                    </p>
                </div>
                <div className="flex gap-2">
                    <Permiso recurso="catalogo" accion="crear" >
                        <Button onClick={openCreateModal} color="blue" size="sm">
                            <HiPlus className="mr-2 h-4 w-4" />
                            Nuevo Tipo
                        </Button>
                    </Permiso>

                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <HiCog6Tooth className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Total Tipos</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalTipos}</p>
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
                            <p className="text-sm font-medium text-gray-600">Modelos Asociados</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalModelos}</p>
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
                            <p className="text-sm font-medium text-gray-600">Equipos Registrados</p>
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
                            placeholder="Buscar por nombre o descripción..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="text-sm text-gray-600">
                        {filteredTiposEquipo.length} tipo(s) encontrado(s)
                    </div>
                </div>
            </Card>

            {/* Tabla */}
            <Card>
                <div className="overflow-x-auto">
                    <Table hoverable>
                        <TableHead>
                            <TableRow>
                                <TableHeadCell>Nombre</TableHeadCell>
                                <TableHeadCell>Descripción</TableHeadCell>
                                <TableHeadCell>Modelos</TableHeadCell>
                                <TableHeadCell>Equipos</TableHeadCell>
                                <TableHeadCell>Fecha Creación</TableHeadCell>
                                <TableHeadCell>
                                    <span className="sr-only">Acciones</span>
                                </TableHeadCell>
                            </TableRow>
                        </TableHead>
                        <TableBody className="divide-y">
                            {filteredTiposEquipo.map((tipoEquipo, index) => (
                                <TableRow key={`tipo-${tipoEquipo.id || index}`} className="bg-white">
                                    <TableCell className="whitespace-nowrap font-medium text-gray-900">
                                        {tipoEquipo.nombre}
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                        <div className="truncate">
                                            {tipoEquipo.descripcion || 'Sin descripción'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge color="purple" size="sm">
                                            {tipoEquipo.modelos_count || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge color="blue" size="sm">
                                            {tipoEquipo.equipos_count || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                                        {new Date(tipoEquipo.created_at).toLocaleDateString('es-BO', {
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
                                                    onClick={() => openEditModal(tipoEquipo)}
                                                    title="Editar tipo de equipo"
                                                >
                                                    <HiPencil className="h-3 w-3" />
                                                </Button>
                                            </Permiso>
                                            <Permiso recurso="catalogo" accion="eliminar">
                                                <Button
                                                    size="xs"
                                                    color="red"
                                                    onClick={() => confirmDelete(tipoEquipo)}
                                                    title="Eliminar tipo de equipo"
                                                    disabled={tipoEquipo.modelos_count > 0}
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

                    {filteredTiposEquipo.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <HiCog6Tooth className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No se encontraron tipos de equipo
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm ? 'Ajusta la búsqueda o crea un nuevo tipo' : 'Comienza creando un nuevo tipo de equipo'}
                            </p>
                            <div className="mt-6">
                                <Button onClick={openCreateModal} color="blue">
                                    <HiPlus className="mr-2 h-4 w-4" />
                                    Nuevo Tipo de Equipo
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Modal de formulario */}
            <TipoEquipoForm
                isOpen={isModalOpen}
                onClose={closeModal}
                tipoEquipo={selectedTipoEquipo}
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
                            ¿Estás seguro de que quieres eliminar el tipo de equipo{' '}
                            <span className="font-semibold">"{tipoEquipoToDelete?.nombre}"</span>?
                        </h3>
                        {tipoEquipoToDelete?.modelos_count > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                <p className="text-sm text-red-800">
                                    Este tipo de equipo tiene {tipoEquipoToDelete.modelos_count} modelo(s) asociado(s).
                                    No se puede eliminar.
                                </p>
                            </div>
                        )}
                        {tipoEquipoToDelete?.modelos_count === 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                <p className="text-sm text-red-800">
                                    Esta acción no se puede deshacer. El tipo de equipo será eliminado permanentemente.
                                </p>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter className="justify-center">
                    <Button
                        color="red"
                        onClick={handleDelete}
                        disabled={loading || tipoEquipoToDelete?.modelos_count > 0}
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

export default TiposEquipoList;