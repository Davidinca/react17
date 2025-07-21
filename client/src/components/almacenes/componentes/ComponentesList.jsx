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
import { useComponentes } from '../../../hooks/useAlmacenes';
import ComponenteForm from './ComponenteForm';
import { Permiso} from "../../../api/permisos.js";

const ComponentesList = () => {
    // Navigation hooks para auto-refresh
    const [searchParams, setSearchParams] = useSearchParams();

    // Estados locales
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedComponente, setSelectedComponente] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [componenteToDelete, setComponenteToDelete] = useState(null);

    // Hook personalizado
    const {
        data: componentes,
        loading,
        error,
        fetchData,
        createItem,
        updateItem,
        deleteItem
    } = useComponentes();

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

    // Filtrar componentes
    const filteredComponentes = useMemo(() => {
        if (!searchTerm) return componentes;

        const term = searchTerm.toLowerCase();
        return componentes.filter(componente =>
            componente.nombre.toLowerCase().includes(term) ||
            (componente.descripcion && componente.descripcion.toLowerCase().includes(term))
        );
    }, [componentes, searchTerm]);

    // Estadísticas
    const stats = useMemo(() => {
        const totalModelos = componentes.reduce((sum, componente) => sum + (componente.modelos_usando || 0), 0);

        return {
            totalComponentes: componentes.length,
            totalModelos,
            componentesEnUso: componentes.filter(c => (c.modelos_usando || 0) > 0).length,
            componentesSinUso: componentes.filter(c => (c.modelos_usando || 0) === 0).length
        };
    }, [componentes]);

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
            // Guardar referencia local del componente seleccionado
            const componenteToEdit = selectedComponente;
            let result;

            if (componenteToEdit && componenteToEdit.id) {
                console.log('Editando componente ID:', componenteToEdit.id);
                result = await updateItem(componenteToEdit.id, data);
            } else {
                console.log('Creando nuevo componente');
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
        if (componenteToDelete) {
            try {
                const result = await deleteItem(componenteToDelete.id);
                if (result !== false) {
                    setShowDeleteConfirm(false);
                    setComponenteToDelete(null);
                    // Auto-refresh
                    triggerRefresh();
                }
            } catch (error) {
                console.error('Error al eliminar componente:', error);
            }
        }
    };

    const openEditModal = (componente) => {
        console.log('Abriendo modal para editar componente:', componente);
        setSelectedComponente(componente);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        console.log('Abriendo modal para crear componente');
        setSelectedComponente(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedComponente(null);
    };

    const confirmDelete = (componente) => {
        setComponenteToDelete(componente);
        setShowDeleteConfirm(true);
    };

    if (loading && componentes.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando componentes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Componentes</h1>
                    <p className="text-gray-600 mt-1">
                        Administra los componentes que pueden formar parte de los modelos
                    </p>
                </div>
                <div className="flex gap-2">
                    <Permiso recurso="catalogo" accion="crear">
                        <Button onClick={openCreateModal} color="blue" size="sm">
                            <HiPlus className="mr-2 h-4 w-4" />
                            Nuevo Componente
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
                            <p className="text-sm font-medium text-gray-600">Total Componentes</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalComponentes}</p>
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
                            <p className="text-sm font-medium text-gray-600">En Uso</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.componentesEnUso}</p>
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
                            <p className="text-sm font-medium text-gray-600">Sin Usar</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.componentesSinUso}</p>
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
                            <p className="text-sm font-medium text-gray-600">Modelos Usando</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalModelos}</p>
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
                            placeholder="Buscar componentes por nombre o descripción..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="text-sm text-gray-600">
                        {filteredComponentes.length} componente(s) encontrado(s)
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
                                <TableHeadCell>Modelos Usando</TableHeadCell>
                                <TableHeadCell>Estado</TableHeadCell>
                                <TableHeadCell>Fecha Creación</TableHeadCell>
                                <TableHeadCell>
                                    <span className="sr-only">Acciones</span>
                                </TableHeadCell>
                            </TableRow>
                        </TableHead>
                        <TableBody className="divide-y">
                            {filteredComponentes.map((componente, index) => (
                                <TableRow key={`componente-${componente.id || index}`} className="bg-white">
                                    <TableCell className="whitespace-nowrap font-medium text-gray-900">
                                        {componente.nombre}
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                        <div className="truncate">
                                            {componente.descripcion || 'Sin descripción'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge color="purple" size="sm">
                                            {componente.modelos_usando || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {(componente.modelos_usando || 0) > 0 ? (
                                            <Badge color="green" size="sm">En Uso</Badge>
                                        ) : (
                                            <Badge color="yellow" size="sm">Sin Usar</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                                        {new Date(componente.created_at).toLocaleDateString('es-BO', {
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
                                                    onClick={() => openEditModal(componente)}
                                                    title="Editar componente"
                                                >
                                                    <HiPencil className="h-3 w-3" />
                                                </Button>
                                            </Permiso>
                                            <Permiso recurso="catalogo" accion="eliminar">
                                                <Button
                                                    size="xs"
                                                    color="red"
                                                    onClick={() => confirmDelete(componente)}
                                                    title="Eliminar componente"
                                                    disabled={(componente.modelos_usando || 0) > 0}
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

                    {filteredComponentes.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <HiCog6Tooth className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No se encontraron componentes
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm ? 'Ajusta la búsqueda o crea un nuevo componente' : 'Comienza creando un nuevo componente'}
                            </p>
                            <div className="mt-6">
                                <Button onClick={openCreateModal} color="blue">
                                    <HiPlus className="mr-2 h-4 w-4" />
                                    Nuevo Componente
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Modal de formulario */}
            <ComponenteForm
                isOpen={isModalOpen}
                onClose={closeModal}
                componente={selectedComponente}
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
                            ¿Estás seguro de que quieres eliminar el componente{' '}
                            <span className="font-semibold">"{componenteToDelete?.nombre}"</span>?
                        </h3>
                        {(componenteToDelete?.modelos_usando || 0) > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                <p className="text-sm text-red-800">
                                    Este componente está siendo usado por {componenteToDelete.modelos_usando} modelo(s).
                                    No se puede eliminar.
                                </p>
                            </div>
                        )}
                        {(componenteToDelete?.modelos_usando || 0) === 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                <p className="text-sm text-red-800">
                                    Esta acción no se puede deshacer. El componente será eliminado permanentemente.
                                </p>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter className="justify-center">
                    <Button
                        color="red"
                        onClick={handleDelete}
                        disabled={loading || (componenteToDelete?.modelos_usando || 0) > 0}
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

export default ComponentesList;