import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeadCell,
    TableRow,
    TextInput,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Badge,
    Card
} from 'flowbite-react';
import {
    HiPlus,
    HiPencil,
    HiTrash,
    HiEye,
    HiExclamationTriangle
} from 'react-icons/hi2';
import { HiSearch } from 'react-icons/hi';
import { useMarcas } from '../../../hooks/useAlmacenes';
import MarcaForm from './MarcaForm';
import { Permiso} from "../../../api/permisos.js";

const MarcasList = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const {
        marcas,
        loading,
        fetchMarcas,
        createMarca,
        updateMarca,
        deleteMarca
    } = useMarcas();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMarca, setSelectedMarca] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [marcaToDelete, setMarcaToDelete] = useState(null);

    // Función para triggerar refresh automático
    const triggerRefresh = () => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('refresh', Date.now().toString());
        setSearchParams(currentParams);
    };

    // Función para actualizar el filtro de búsqueda en la URL
    const updateSearchInURL = (search) => {
        const newParams = new URLSearchParams(searchParams);

        if (search) {
            newParams.set('search', search);
        } else {
            newParams.delete('search');
        }

        setSearchParams(newParams);
    };

    // Cargar datos iniciales
    useEffect(() => {
        fetchMarcas();
    }, []);

    // Auto-refresh cuando cambian los searchParams
    useEffect(() => {
        const refreshParam = searchParams.get('refresh');
        if (refreshParam) {
            fetchMarcas();

            // Limpiar el parámetro refresh después de usarlo
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('refresh');
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, fetchMarcas, setSearchParams]);

    // Aplicar filtro de búsqueda con debounce y actualizar URL
    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            updateSearchInURL(searchTerm);
        }, 500);

        return () => clearTimeout(delayedSearch);
    }, [searchTerm]);

    // Filtrar marcas por término de búsqueda
    const filteredMarcas = marcas.filter(marca =>
        marca.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (marca.descripcion && marca.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Manejar creación y edición
    const handleCreateEdit = async (data) => {
        try {
            if (selectedMarca) {
                await updateMarca(selectedMarca.id, data);
            } else {
                await createMarca(data);
            }
            closeModal();
            // El refresh se triggea automáticamente desde el MarcaForm
        } catch (error) {
            console.error('Error creating/updating marca:', error);
        }
    };

    // Manejar eliminación
    const handleDelete = async () => {
        try {
            if (marcaToDelete) {
                await deleteMarca(marcaToDelete.id);
                setShowDeleteConfirm(false);
                setMarcaToDelete(null);
                triggerRefresh(); // Refresh automático después de eliminar
            }
        } catch (error) {
            console.error('Error deleting marca:', error);
        }
    };

    // Abrir modal de edición
    const openEditModal = (marca) => {
        setSelectedMarca(marca);
        setIsModalOpen(true);
    };

    // Abrir modal de creación
    const openCreateModal = () => {
        setSelectedMarca(null);
        setIsModalOpen(true);
    };

    // Cerrar modal
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedMarca(null);
    };

    // Confirmar eliminación
    const confirmDelete = (marca) => {
        setMarcaToDelete(marca);
        setShowDeleteConfirm(true);
    };

    // Limpiar filtros
    const clearSearch = () => {
        setSearchTerm('');
        const newParams = new URLSearchParams();
        setSearchParams(newParams);
    };

    // Loading inicial
    if (loading && marcas.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando marcas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Marcas</h1>
                    <p className="text-gray-600 mt-1">
                        Administra las marcas de equipos de telecomunicaciones
                    </p>
                </div>
                <Permiso recurso="catalogo" accion="crear">
                    <Button onClick={openCreateModal} color="blue" size="sm">
                        <HiPlus className="mr-2 h-4 w-4" />
                        Nueva Marca
                    </Button>
                </Permiso>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <HiEye className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Total Marcas</p>
                            <p className="text-2xl font-semibold text-gray-900">{marcas.length}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <HiEye className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Total Modelos</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {marcas.reduce((sum, marca) => sum + (marca.modelos_count || 0), 0)}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <HiEye className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Total Equipos</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {marcas.reduce((sum, marca) => sum + (marca.equipos_count || 0), 0)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Buscador */}
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2 w-full sm:w-96">
                        <TextInput
                            icon={HiSearch}
                            placeholder="Buscar por nombre o descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1"
                        />
                        {searchTerm && (
                            <Button size="xs" color="gray" onClick={clearSearch}>
                                Limpiar
                            </Button>
                        )}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center">
                        {filteredMarcas.length} de {marcas.length} marca(s)
                        {loading && (
                            <div className="ml-2 animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        )}
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
                            {filteredMarcas.map((marca) => (
                                <TableRow key={marca.id} className="bg-white">
                                    <TableCell className="whitespace-nowrap font-medium text-gray-900">
                                        {marca.nombre}
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                        <div className="truncate" title={marca.descripcion}>
                                            {marca.descripcion || (
                                                <span className="text-gray-400 italic">Sin descripción</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge color="blue" size="sm">
                                            {marca.modelos_count || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge color="green" size="sm">
                                            {marca.equipos_count || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                                        {new Date(marca.created_at).toLocaleDateString('es-BO', {
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
                                                    onClick={() => openEditModal(marca)}
                                                    title="Editar marca"
                                                >
                                                    <HiPencil className="h-3 w-3" />
                                                </Button>
                                            </Permiso>
                                            <Permiso recurso="catalogo" accion="eliminar">
                                                <Button
                                                    size="xs"
                                                    color="red"
                                                    onClick={() => confirmDelete(marca)}
                                                    title="Eliminar marca"
                                                    disabled={marca.modelos_count > 0 || marca.equipos_count > 0}
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

                    {/* Estado vacío */}
                    {filteredMarcas.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <HiEye className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                {searchTerm ? 'No se encontraron marcas' : 'No hay marcas registradas'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm
                                    ? 'Intenta con otros términos de búsqueda'
                                    : 'Comienza creando una nueva marca'
                                }
                            </p>
                            {!searchTerm && (
                                <div className="mt-6">
                                    <Button onClick={openCreateModal} color="blue">
                                        <HiPlus className="mr-2 h-4 w-4" />
                                        Nueva Marca
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>

            {/* Modal de formulario */}
            <MarcaForm
                isOpen={isModalOpen}
                onClose={closeModal}
                marca={selectedMarca}
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
                            ¿Estás seguro de que quieres eliminar la marca{' '}
                            <span className="font-semibold">"{marcaToDelete?.nombre}"</span>?
                        </h3>
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                            <p className="text-sm text-red-800">
                                Esta acción no se puede deshacer. La marca será eliminada permanentemente.
                            </p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter className="justify-center">
                    <Button
                        color="red"
                        onClick={handleDelete}
                        disabled={loading}
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

export default MarcasList;