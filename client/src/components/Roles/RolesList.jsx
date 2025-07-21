// components/roles/RolesList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Button, Table, TableBody, TableCell, TableHead,
    TableHeadCell, TableRow, TextInput, Modal, ModalBody,
    ModalFooter, ModalHeader, Badge, Card, Select, Label
} from 'flowbite-react';
import {
    HiPlus, HiPencil, HiTrash, HiExclamationTriangle, HiEye, HiDocumentDuplicate
} from 'react-icons/hi2';
import { HiSearch, HiFilter } from 'react-icons/hi';
import { HiUserGroup } from 'react-icons/hi2';

import { useRoles } from '../../hooks/useRoles.js';
import RolForm from './RolForm.jsx';

const RolesList = () => {
    // Navigation hooks para auto-refresh
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Estados locales para filtros y paginación
    const [searchTerm, setSearchTerm] = useState('');
    const [activoFilter, setActivoFilter] = useState('');
    const [conUsuariosFilter, setConUsuariosFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRol, setSelectedRol] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [rolToDelete, setRolToDelete] = useState(null);

    // Estados adicionales para modales específicos
    const [showUsuariosModal, setShowUsuariosModal] = useState(false);
    const [showClonarModal, setShowClonarModal] = useState(false);
    const [nombreClon, setNombreClon] = useState('');

    // Estados de paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(4);

    // Hook personalizado de roles
    const {
        data: roles,
        loading,
        error,
        permisosDisponibles,
        fetchData,
        createItem,
        updateItem,
        deleteItem,
        cargarUsuariosDelRol,
        clonarRol,
        usuariosDelRol
    } = useRoles();

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

    // Filtrar roles localmente
    const filteredRoles = useMemo(() => {
        let filtered = roles;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(rol =>
                rol.nombre.toLowerCase().includes(term)
            );
        }

        if (activoFilter !== '') {
            const activo = activoFilter === 'true';
            filtered = filtered.filter(rol =>
                rol.activo === activo
            );
        }

        if (conUsuariosFilter !== '') {
            const conUsuarios = conUsuariosFilter === 'true';
            filtered = filtered.filter(rol =>
                conUsuarios ? (rol.cantidad_usuarios || 0) > 0 : (rol.cantidad_usuarios || 0) === 0
            );
        }

        return filtered;
    }, [roles, searchTerm, activoFilter, conUsuariosFilter]);

    // Paginación
    const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredRoles.slice(startIndex, endIndex);

    // Reset página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activoFilter, conUsuariosFilter]);

    // Estadísticas
    const stats = useMemo(() => {
        const totalRoles = roles.length;
        const rolesActivos = roles.filter(r => r.activo).length;
        const rolesConUsuarios = roles.filter(r => (r.cantidad_usuarios || 0) > 0).length;
        const totalUsuarios = roles.reduce((sum, r) => sum + (r.cantidad_usuarios || 0), 0);

        return {
            totalRoles,
            rolesActivos,
            rolesInactivos: totalRoles - rolesActivos,
            rolesConUsuarios,
            rolesSinUsuarios: totalRoles - rolesConUsuarios,
            totalUsuarios
        };
    }, [roles]);

    // Handlers para filtros
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleActivoFilterChange = (e) => {
        setActivoFilter(e.target.value);
    };

    const handleConUsuariosFilterChange = (e) => {
        setConUsuariosFilter(e.target.value);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setActivoFilter('');
        setConUsuariosFilter('');
        setCurrentPage(1);
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
            const rolToEdit = selectedRol;
            let result;

            if (rolToEdit && rolToEdit.id) {
                console.log('=== EDITANDO ROL ===');
                console.log('Rol a editar:', rolToEdit);
                console.log('Datos a enviar:', data);

                result = await updateItem(rolToEdit.id, data);
            } else {
                console.log('=== CREANDO ROL ===');
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
        if (rolToDelete) {
            try {
                const result = await deleteItem(rolToDelete.id);
                if (result !== false) {
                    setShowDeleteConfirm(false);
                    setRolToDelete(null);
                    triggerRefresh();
                }
            } catch (error) {
                console.error('Error al eliminar rol:', error);
            }
        }
    };

    const handleClonar = async () => {
        if (selectedRol && nombreClon.trim()) {
            try {
                const result = await clonarRol(selectedRol.id, nombreClon.trim());
                if (result !== false) {
                    setShowClonarModal(false);
                    setSelectedRol(null);
                    setNombreClon('');
                    triggerRefresh();
                }
            } catch (error) {
                console.error('Error al clonar rol:', error);
            }
        }
    };

    // Funciones para manejar modales
    const openEditModal = (rol) => {
        console.log('Abriendo modal para editar rol:', rol);
        setSelectedRol(rol);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        console.log('Abriendo modal para crear rol');
        setSelectedRol(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRol(null);
    };

    const openUsuariosModal = async (rol) => {
        setSelectedRol(rol);
        await cargarUsuariosDelRol(rol.id);
        setShowUsuariosModal(true);
    };

    const openClonarModal = (rol) => {
        setSelectedRol(rol);
        setNombreClon(`${rol.nombre} - Copia`);
        setShowClonarModal(true);
    };

    const confirmDelete = (rol) => {
        setRolToDelete(rol);
        setShowDeleteConfirm(true);
    };

    // Función para obtener color del badge según el estado
    const getEstadoBadgeColor = (activo) => {
        return activo ? 'green' : 'red';
    };

    // Función para obtener color del badge según usuarios
    const getUsuariosBadgeColor = (cantidad) => {
        if (cantidad === 0) return 'gray';
        if (cantidad <= 5) return 'blue';
        if (cantidad <= 10) return 'yellow';
        return 'green';
    };

    if (loading && roles.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando roles...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Roles</h1>
                    <p className="text-gray-600 mt-1">
                        Administra los roles del sistema y sus permisos asociados
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={openCreateModal} color="blue" size="sm">
                        <HiPlus className="mr-2 h-4 w-4" />
                        Nuevo Rol
                    </Button>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <HiUserGroup className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Total Roles</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalRoles}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <HiUserGroup className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Activos</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.rolesActivos}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <HiUserGroup className="w-5 h-5 text-red-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Inactivos</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.rolesInactivos}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <HiUserGroup className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Con Usuarios</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.rolesConUsuarios}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <HiUserGroup className="w-5 h-5 text-gray-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Sin Usuarios</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.rolesSinUsuarios}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <HiUserGroup className="w-5 h-5 text-indigo-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalUsuarios}</p>
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <TextInput
                            icon={HiSearch}
                            placeholder="Buscar por nombre..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />

                        <Select
                            value={activoFilter}
                            onChange={handleActivoFilterChange}
                        >
                            <option value="">Todos los estados</option>
                            <option value="true">Solo activos</option>
                            <option value="false">Solo inactivos</option>
                        </Select>

                        <Select
                            value={conUsuariosFilter}
                            onChange={handleConUsuariosFilterChange}
                        >
                            <option value="">Todos los roles</option>
                            <option value="true">Con usuarios</option>
                            <option value="false">Sin usuarios</option>
                        </Select>
                    </div>

                    <div className="text-sm text-gray-600 flex items-center">
                        {filteredRoles.length} rol(es) encontrado(s)
                        {filteredRoles.length > itemsPerPage && (
                            <span className="ml-2">
                                • Página {currentPage} de {totalPages}
                            </span>
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
                                <TableHeadCell>Estado</TableHeadCell>
                                <TableHeadCell>Usuarios</TableHeadCell>
                                <TableHeadCell>Permisos</TableHeadCell>
                                <TableHeadCell>Fecha Creación</TableHeadCell>
                                <TableHeadCell>
                                    <span className="sr-only">Acciones</span>
                                </TableHeadCell>
                            </TableRow>
                        </TableHead>
                        <TableBody className="divide-y">
                            {currentItems.map((rol, index) => (
                                <TableRow key={`rol-${rol.id || index}`} className="bg-white">
                                    <TableCell className="whitespace-nowrap font-medium text-gray-900">
                                        <div className="flex items-center space-x-2">
                                            <Badge color="indigo" size="sm">
                                                {rol.nombre}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            color={getEstadoBadgeColor(rol.activo)}
                                            size="sm"
                                        >
                                            {rol.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            color={getUsuariosBadgeColor(rol.cantidad_usuarios || 0)}
                                            size="sm"
                                        >
                                            {rol.cantidad_usuarios || 0} usuario(s)
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge color="purple" size="sm">
                                            {rol.cantidad_permisos || 0} permiso(s)
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                                        {rol.fecha_creacion ?
                                            new Date(rol.fecha_creacion).toLocaleDateString('es-BO', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            }) : 'N/A'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            {(rol.cantidad_usuarios || 0) > 0 && (
                                                <Button
                                                    size="xs"
                                                    color="purple"
                                                    onClick={() => openUsuariosModal(rol)}
                                                    title="Ver usuarios con este rol"
                                                >
                                                    <HiEye className="h-3 w-3" />
                                                </Button>
                                            )}
                                            <Button
                                                size="xs"
                                                color="green"
                                                onClick={() => openClonarModal(rol)}
                                                title="Clonar rol"
                                            >
                                                <HiDocumentDuplicate className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="xs"
                                                color="blue"
                                                onClick={() => openEditModal(rol)}
                                                title="Editar rol"
                                            >
                                                <HiPencil className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="xs"
                                                color="red"
                                                onClick={() => confirmDelete(rol)}
                                                title="Eliminar rol"
                                                disabled={(rol.cantidad_usuarios || 0) > 0}
                                            >
                                                <HiTrash className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {filteredRoles.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <HiUserGroup className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No se encontraron roles
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm || activoFilter || conUsuariosFilter ?
                                    'Ajusta los filtros o crea un nuevo rol' :
                                    'Comienza creando tu primer rol del sistema'
                                }
                            </p>
                            <div className="mt-6">
                                <Button onClick={openCreateModal} color="blue">
                                    <HiPlus className="mr-2 h-4 w-4" />
                                    Nuevo Rol
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
                                    <span className="font-medium">{Math.min(endIndex, filteredRoles.length)}</span>
                                    {' '}de{' '}
                                    <span className="font-medium">{filteredRoles.length}</span>
                                    {' '}resultados
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <Button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        color="gray"
                                        size="sm"
                                        className="relative inline-flex items-center rounded-l-md"
                                    >
                                        Anterior
                                    </Button>

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
            <RolForm
                isOpen={isModalOpen}
                onClose={closeModal}
                rol={selectedRol}
                onSubmit={handleCreateEdit}
                loading={loading}
                permisosDisponibles={permisosDisponibles}
            />

            {/* Modal de usuarios del rol */}
            <Modal show={showUsuariosModal} onClose={() => setShowUsuariosModal(false)} size="lg">
                <ModalHeader>
                    Usuarios con el rol: {selectedRol?.nombre}
                </ModalHeader>
                <ModalBody>
                    {usuariosDelRol.length > 0 ? (
                        <div className="space-y-3">
                            {usuariosDelRol.map((usuario, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {usuario.nombre_completo || `${usuario.nombres} ${usuario.apellidopaterno}`}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Código: {usuario.codigocotel}
                                        </p>
                                    </div>
                                    <Badge color={usuario.is_active ? 'green' : 'red'} size="sm">
                                        {usuario.is_active ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <HiUserGroup className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">
                                No hay usuarios con este rol
                            </p>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="gray" onClick={() => setShowUsuariosModal(false)}>
                        Cerrar
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Modal de clonar rol */}
            <Modal show={showClonarModal} onClose={() => setShowClonarModal(false)} size="md">
                <ModalHeader>Clonar Rol: {selectedRol?.nombre}</ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="nombreClon" value="Nombre del nuevo rol" />
                            <TextInput
                                id="nombreClon"
                                value={nombreClon}
                                onChange={(e) => setNombreClon(e.target.value)}
                                placeholder="Nombre del rol clonado"
                            />
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                El nuevo rol tendrá los mismos permisos que "{selectedRol?.nombre}"
                                y estará activo por defecto.
                            </p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        color="blue"
                        onClick={handleClonar}
                        disabled={!nombreClon.trim() || loading}
                    >
                        {loading ? 'Clonando...' : 'Clonar Rol'}
                    </Button>
                    <Button
                        color="gray"
                        onClick={() => {
                            setShowClonarModal(false);
                            setNombreClon('');
                        }}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Modal de confirmación de eliminación */}
            <Modal show={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} size="md">
                <ModalHeader>Confirmar Eliminación</ModalHeader>
                <ModalBody>
                    <div className="text-center">
                        <HiExclamationTriangle className="mx-auto mb-4 h-14 w-14 text-red-600" />
                        <h3 className="mb-5 text-lg font-normal text-gray-500">
                            ¿Estás seguro de que quieres eliminar el rol{' '}
                            <span className="font-semibold">"{rolToDelete?.nombre}"</span>?
                        </h3>

                        {(rolToDelete?.cantidad_usuarios || 0) > 0 ? (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                <p className="text-sm text-red-800">
                                    Este rol tiene {rolToDelete.cantidad_usuarios} usuario(s) asignado(s).
                                    No se puede eliminar.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                                <p className="text-sm text-yellow-800">
                                    Esta acción no se puede deshacer. El rol y su configuración de permisos serán eliminados permanentemente.
                                </p>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter className="justify-center">
                    <Button
                        color="red"
                        onClick={handleDelete}
                        disabled={loading || (rolToDelete?.cantidad_usuarios || 0) > 0}
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

export default RolesList;