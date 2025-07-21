// components/permisos/PermisosList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Button, Table, TableBody, TableCell, TableHead,
    TableHeadCell, TableRow, TextInput, Modal, ModalBody,
    ModalFooter, ModalHeader, Badge, Card, Select
} from 'flowbite-react';
import {
    HiPlus, HiPencil, HiTrash, HiExclamationTriangle
} from 'react-icons/hi2';
import { HiSearch, HiFilter } from 'react-icons/hi';
import { HiShieldCheck } from 'react-icons/hi2';

import { usePermisos } from '../../hooks/usePermisos.js';
import PermisoForm from './PermisoForm.jsx';

const PermisosList = () => {
    // Navigation hooks para auto-refresh
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Estados locales para filtros y paginación
    const [searchTerm, setSearchTerm] = useState('');
    const [recursoFilter, setRecursoFilter] = useState('');
    const [accionFilter, setAccionFilter] = useState('');
    const [enUsoFilter, setEnUsoFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPermiso, setSelectedPermiso] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [permisoToDelete, setPermisoToDelete] = useState(null);

    // Estados de paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(4); // 4 registros por página

    // Hook personalizado de permisos
    const {
        data: permisos,
        loading,
        error,
        recursosDisponibles,
        accionesDisponibles,
        fetchData,
        createItem,
        updateItem,
        deleteItem
    } = usePermisos();

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

    // Filtrar permisos localmente
    const filteredPermisos = useMemo(() => {
        let filtered = permisos;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(permiso =>
                permiso.recurso.toLowerCase().includes(term) ||
                permiso.accion.toLowerCase().includes(term)
            );
        }

        if (recursoFilter) {
            filtered = filtered.filter(permiso =>
                permiso.recurso === recursoFilter
            );
        }

        if (accionFilter) {
            filtered = filtered.filter(permiso =>
                permiso.accion === accionFilter
            );
        }

        if (enUsoFilter !== '') {
            const enUso = enUsoFilter === 'true';
            filtered = filtered.filter(permiso =>
                permiso.esta_en_uso === enUso
            );
        }

        return filtered;
    }, [permisos, searchTerm, recursoFilter, accionFilter, enUsoFilter]);

    // Paginación
    const totalPages = Math.ceil(filteredPermisos.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredPermisos.slice(startIndex, endIndex);

    // Reset página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, recursoFilter, accionFilter, enUsoFilter]);

    // Estadísticas
    const stats = useMemo(() => {
        const totalPermisos = permisos.length;
        const permisosEnUso = permisos.filter(p => p.esta_en_uso).length;
        const recursosUnicos = [...new Set(permisos.map(p => p.recurso))].length;
        const accionesPorRecurso = permisos.reduce((acc, permiso) => {
            if (!acc[permiso.recurso]) {
                acc[permiso.recurso] = new Set();
            }
            acc[permiso.recurso].add(permiso.accion);
            return acc;
        }, {});

        return {
            totalPermisos,
            permisosEnUso,
            permisosNoUsados: totalPermisos - permisosEnUso,
            recursosUnicos,
            recursoCompleto: Object.keys(accionesPorRecurso).filter(
                recurso => accionesPorRecurso[recurso].size === 4
            ).length
        };
    }, [permisos]);

    // Handlers para filtros
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleRecursoFilterChange = (e) => {
        setRecursoFilter(e.target.value);
    };

    const handleAccionFilterChange = (e) => {
        setAccionFilter(e.target.value);
    };

    const handleEnUsoFilterChange = (e) => {
        setEnUsoFilter(e.target.value);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setRecursoFilter('');
        setAccionFilter('');
        setEnUsoFilter('');
        setCurrentPage(1); // Reset página también
    };

    // Función para trigger refresh usando React Router
    const triggerRefresh = () => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('refresh', Date.now().toString());
        setSearchParams(currentParams, { replace: true });
    };

    // Handlers para CRUD
    const handleCreateEdit = async (data) => {
        try {
            const permisoToEdit = selectedPermiso;
            let result;

            if (permisoToEdit && permisoToEdit.id) {
                console.log('=== EDITANDO PERMISO ===');
                console.log('Permiso a editar:', permisoToEdit);
                console.log('Datos a enviar:', data);

                result = await updateItem(permisoToEdit.id, data);
            } else {
                console.log('=== CREANDO PERMISO ===');
                console.log('Datos a enviar:', data);
                result = await createItem(data);
            }

            // Solo cerrar si la operación fue exitosa
            if (result && result !== false) {
                console.log('✅ Operación exitosa, cerrando modal');
                closeModal();
                triggerRefresh();
            } else {
                console.error('❌ Operación falló, manteniendo modal abierto');
            }

        } catch (error) {
            console.error('💥 ERROR en handleCreateEdit:', error);
            // NO cerrar modal si hay error
        }
    };

    const handleDelete = async () => {
        if (permisoToDelete) {
            try {
                const result = await deleteItem(permisoToDelete.id);
                if (result !== false) {
                    setShowDeleteConfirm(false);
                    setPermisoToDelete(null);
                    triggerRefresh();
                }
            } catch (error) {
                console.error('Error al eliminar permiso:', error);
            }
        }
    };

    // Funciones para manejar modales
    const openEditModal = (permiso) => {
        console.log('Abriendo modal para editar permiso:', permiso);
        setSelectedPermiso(permiso);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        console.log('Abriendo modal para crear permiso');
        setSelectedPermiso(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedPermiso(null);
    };

    const confirmDelete = (permiso) => {
        setPermisoToDelete(permiso);
        setShowDeleteConfirm(true);
    };

    // Función para obtener color del badge según el uso
    const getBadgeColor = (enUso) => {
        return enUso ? 'green' : 'gray';
    };

    // Función para obtener color del badge según la acción
    const getAccionBadgeColor = (accion) => {
        const colors = {
            'crear': 'blue',
            'leer': 'green',
            'actualizar': 'yellow',
            'eliminar': 'red'
        };
        return colors[accion] || 'gray';
    };

    if (loading && permisos.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando permisos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Permisos</h1>
                    <p className="text-gray-600 mt-1">
                        Administra los permisos del sistema por recursos y acciones
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={openCreateModal} color="blue" size="sm">
                        <HiPlus className="mr-2 h-4 w-4" />
                        Nuevo Permiso
                    </Button>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <HiShieldCheck className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Total Permisos</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalPermisos}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <HiShieldCheck className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">En Uso</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.permisosEnUso}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <HiShieldCheck className="w-5 h-5 text-gray-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Sin Usar</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.permisosNoUsados}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <HiShieldCheck className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Recursos</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.recursosUnicos}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <HiShieldCheck className="w-5 h-5 text-indigo-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Completos</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.recursoCompleto}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filtros */}
            <Card>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <HiFilter className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
                        <Button size="xs" color="gray" onClick={clearFilters}>
                            Limpiar
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <TextInput
                            icon={HiSearch}
                            placeholder="Buscar por recurso o acción..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />

                        <Select
                            value={recursoFilter}
                            onChange={handleRecursoFilterChange}
                        >
                            <option value="">Todos los recursos</option>
                            {recursosDisponibles.map((recurso) => (
                                <option key={recurso} value={recurso}>
                                    {recurso}
                                </option>
                            ))}
                        </Select>

                        <Select
                            value={accionFilter}
                            onChange={handleAccionFilterChange}
                        >
                            <option value="">Todas las acciones</option>
                            {accionesDisponibles.map((accion) => (
                                <option key={accion} value={accion}>
                                    {accion.charAt(0).toUpperCase() + accion.slice(1)}
                                </option>
                            ))}
                        </Select>

                        <Select
                            value={enUsoFilter}
                            onChange={handleEnUsoFilterChange}
                        >
                            <option value="">Todos los estados</option>
                            <option value="true">En uso</option>
                            <option value="false">Sin usar</option>
                        </Select>
                    </div>

                    <div className="text-sm text-gray-600 flex items-center">
                        {filteredPermisos.length} permiso(s) encontrado(s)
                    </div>
                </div>
            </Card>

            {/* Tabla */}
            <Card>
                <div className="overflow-x-auto">
                    <Table hoverable>
                        <TableHead>
                            <TableRow>
                                <TableHeadCell>Recurso</TableHeadCell>
                                <TableHeadCell>Acción</TableHeadCell>
                                <TableHeadCell>Estado</TableHeadCell>
                                <TableHeadCell>Permiso Completo</TableHeadCell>
                                <TableHeadCell>
                                    <span className="sr-only">Acciones</span>
                                </TableHeadCell>
                            </TableRow>
                        </TableHead>
                        <TableBody className="divide-y">
                            {currentItems.map((permiso, index) => (
                                <TableRow key={`permiso-${permiso.id || index}`} className="bg-white">
                                    <TableCell className="whitespace-nowrap font-medium text-gray-900">
                                        <Badge color="indigo" size="sm">
                                            {permiso.recurso}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        <Badge
                                            color={getAccionBadgeColor(permiso.accion)}
                                            size="sm"
                                        >
                                            {permiso.accion.charAt(0).toUpperCase() + permiso.accion.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            color={getBadgeColor(permiso.esta_en_uso)}
                                            size="sm"
                                        >
                                            {permiso.esta_en_uso ? 'En uso' : 'Sin usar'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-sm text-gray-900">
                                        {permiso.recurso}:{permiso.accion}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                size="xs"
                                                color="blue"
                                                onClick={() => openEditModal(permiso)}
                                                title="Editar permiso"
                                            >
                                                <HiPencil className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="xs"
                                                color="red"
                                                onClick={() => confirmDelete(permiso)}
                                                title="Eliminar permiso"
                                                disabled={permiso.esta_en_uso}
                                            >
                                                <HiTrash className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {filteredPermisos.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <HiShieldCheck className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No se encontraron permisos
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm || recursoFilter || accionFilter || enUsoFilter ?
                                    'Ajusta los filtros o crea un nuevo permiso' :
                                    'Comienza creando tu primer permiso del sistema'
                                }
                            </p>
                            <div className="mt-6">
                                <Button onClick={openCreateModal} color="blue">
                                    <HiPlus className="mr-2 h-4 w-4" />
                                    Nuevo Permiso
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <Button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                color="gray"
                                size="sm"
                            >
                                Anterior
                            </Button>
                            <Button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                color="gray"
                                size="sm"
                            >
                                Siguiente
                            </Button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Mostrando{' '}
                                    <span className="font-medium">{startIndex + 1}</span>
                                    {' '}-{' '}
                                    <span className="font-medium">{Math.min(endIndex, filteredPermisos.length)}</span>
                                    {' '}de{' '}
                                    <span className="font-medium">{filteredPermisos.length}</span>
                                    {' '}resultados
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    {/* Botón Anterior */}
                                    <Button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        color="gray"
                                        size="sm"
                                        className="relative inline-flex items-center rounded-l-md"
                                    >
                                        Anterior
                                    </Button>

                                    {/* Números de página */}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            color={currentPage === page ? "blue" : "gray"}
                                            size="sm"
                                            className="relative inline-flex items-center"
                                        >
                                            {page}
                                        </Button>
                                    ))}

                                    {/* Botón Siguiente */}
                                    <Button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        color="gray"
                                        size="sm"
                                        className="relative inline-flex items-center rounded-r-md"
                                    >
                                        Siguiente
                                    </Button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Modal de formulario */}
            <PermisoForm
                isOpen={isModalOpen}
                onClose={closeModal}
                permiso={selectedPermiso}
                onSubmit={handleCreateEdit}
                loading={loading}
                recursosDisponibles={recursosDisponibles}
                accionesDisponibles={accionesDisponibles}
            />

            {/* Modal de confirmación de eliminación */}
            <Modal show={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} size="md">
                <ModalHeader>Confirmar Eliminación</ModalHeader>
                <ModalBody>
                    <div className="text-center">
                        <HiExclamationTriangle className="mx-auto mb-4 h-14 w-14 text-red-600" />
                        <h3 className="mb-5 text-lg font-normal text-gray-500">
                            ¿Estás seguro de que quieres eliminar el permiso{' '}
                            <span className="font-semibold">
                                "{permisoToDelete?.recurso}:{permisoToDelete?.accion}"
                            </span>?
                        </h3>

                        {permisoToDelete?.esta_en_uso ? (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                <p className="text-sm text-red-800">
                                    Este permiso está siendo usado por uno o más roles.
                                    No se puede eliminar.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                                <p className="text-sm text-yellow-800">
                                    Esta acción no se puede deshacer. El permiso será eliminado permanentemente.
                                </p>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter className="justify-center">
                    <Button
                        color="red"
                        onClick={handleDelete}
                        disabled={loading || permisoToDelete?.esta_en_uso}
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

export default PermisosList;