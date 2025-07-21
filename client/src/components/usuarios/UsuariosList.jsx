// components/usuarios/UsuariosList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Button, Table, TableBody, TableCell, TableHead,
    TableHeadCell, TableRow, TextInput, Modal, ModalBody,
    ModalFooter, ModalHeader, Badge, Card, Select
} from 'flowbite-react';
import {
    HiPlus, HiPencil, HiTrash, HiExclamationTriangle, HiKey, HiUserGroup
} from 'react-icons/hi2';
import { HiSearch, HiFilter } from 'react-icons/hi';
import { HiUsers } from 'react-icons/hi2';

import { useUsuarios } from '../../hooks/useUsuarios.js';
import UsuarioForm from './UsuarioForm.jsx';

const UsuariosList = () => {
    // Navigation hooks para auto-refresh
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Estados locales para filtros y paginación
    const [searchTerm, setSearchTerm] = useState('');
    const [tipoFilter, setTipoFilter] = useState('');
    const [activoFilter, setActivoFilter] = useState('');
    const [rolFilter, setRolFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUsuario, setSelectedUsuario] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [usuarioToDelete, setUsuarioToDelete] = useState(null);

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6); // 6 registros por página

    // Hook personalizado de usuarios
    const {
        data: usuarios,
        loading,
        error,
        rolesDisponibles, // Obtener desde el hook que ya tiene la API real
        fetchData,
        createItem,
        updateItem,
        deleteItem,
        activarUsuario,
        resetearPassword,
        cambiarRol
    } = useUsuarios();

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

    // Filtrar usuarios localmente
    const filteredUsuarios = useMemo(() => {
        let filtered = usuarios;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(usuario =>
                usuario.nombres?.toLowerCase().includes(term) ||
                usuario.apellidopaterno?.toLowerCase().includes(term) ||
                usuario.apellidomaterno?.toLowerCase().includes(term) ||
                usuario.codigocotel?.toString().includes(term)
            );
        }

        if (tipoFilter) {
            if (tipoFilter === 'manual') {
                filtered = filtered.filter(usuario => usuario.codigocotel >= 9000);
            } else if (tipoFilter === 'migrado') {
                filtered = filtered.filter(usuario => usuario.codigocotel < 9000);
            }
        }

        if (activoFilter !== '') {
            const activo = activoFilter === 'true';
            filtered = filtered.filter(usuario => usuario.is_active === activo);
        }

        if (rolFilter) {
            filtered = filtered.filter(usuario =>
                usuario.rol?.id?.toString() === rolFilter ||
                usuario.rol?.toString() === rolFilter
            );
        }

        return filtered;
    }, [usuarios, searchTerm, tipoFilter, activoFilter, rolFilter]);

    // Paginación
    const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredUsuarios.slice(startIndex, endIndex);

    // Reset página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, tipoFilter, activoFilter, rolFilter]);

    // Estadísticas
    const stats = useMemo(() => {
        const totalUsuarios = usuarios.length;
        const usuariosActivos = usuarios.filter(u => u.is_active).length;
        const usuariosInactivos = totalUsuarios - usuariosActivos;
        const usuariosManuales = usuarios.filter(u => u.codigocotel >= 9000).length;
        const usuariosMigrados = totalUsuarios - usuariosManuales;
        const usuariosRequierenCambioPassword = usuarios.filter(u => !u.password_changed).length;

        return {
            totalUsuarios,
            usuariosActivos,
            usuariosInactivos,
            usuariosManuales,
            usuariosMigrados,
            usuariosRequierenCambioPassword
        };
    }, [usuarios]);

    // Handlers para filtros
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleTipoFilterChange = (e) => {
        setTipoFilter(e.target.value);
    };

    const handleActivoFilterChange = (e) => {
        setActivoFilter(e.target.value);
    };

    const handleRolFilterChange = (e) => {
        setRolFilter(e.target.value);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setTipoFilter('');
        setActivoFilter('');
        setRolFilter('');
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
            const usuarioToEdit = selectedUsuario;
            let result;

            if (usuarioToEdit && usuarioToEdit.id) {
                console.log('=== EDITANDO USUARIO ===');
                console.log('Usuario a editar:', usuarioToEdit);
                console.log('Datos a enviar:', data);

                result = await updateItem(usuarioToEdit.id, data);
            } else {
                console.log('=== CREANDO USUARIO ===');
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
        if (usuarioToDelete) {
            try {
                const result = await deleteItem(usuarioToDelete.id);
                if (result !== false) {
                    setShowDeleteConfirm(false);
                    setUsuarioToDelete(null);
                    triggerRefresh();
                }
            } catch (error) {
                console.error('Error al desactivar usuario:', error);
            }
        }
    };

    const handleActivar = async (usuario) => {
        try {
            const result = await activarUsuario(usuario.id);
            if (result !== false) {
                triggerRefresh();
            }
        } catch (error) {
            console.error('Error al activar usuario:', error);
        }
    };

    const handleResetPassword = async (usuario) => {
        try {
            const result = await resetearPassword(usuario.id);
            if (result !== false) {
                triggerRefresh();
            }
        } catch (error) {
            console.error('Error al resetear contraseña:', error);
        }
    };

    // Funciones para manejar modales
    const openEditModal = (usuario) => {
        console.log('Abriendo modal para editar usuario:', usuario);
        setSelectedUsuario(usuario);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        console.log('Abriendo modal para crear usuario');
        setSelectedUsuario(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUsuario(null);
    };

    const confirmDelete = (usuario) => {
        setUsuarioToDelete(usuario);
        setShowDeleteConfirm(true);
    };

    // Función para obtener color del badge según el tipo
    const getTipoBadgeColor = (codigocotel) => {
        return codigocotel >= 9000 ? 'blue' : 'green';
    };

    // Función para obtener color del badge según el estado
    const getEstadoBadgeColor = (isActive) => {
        return isActive ? 'green' : 'red';
    };

    // Función para obtener color del badge según contraseña
    const getPasswordBadgeColor = (passwordChanged) => {
        return passwordChanged ? 'green' : 'yellow';
    };

    if (loading && usuarios.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando usuarios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="text-gray-600 mt-1">
                        Administra usuarios manuales y migrados del sistema
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={openCreateModal} color="blue" size="sm">
                        <HiPlus className="mr-2 h-4 w-4" />
                        Nuevo Usuario
                    </Button>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <HiUsers className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Total</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalUsuarios}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <HiUsers className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Activos</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.usuariosActivos}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <HiUsers className="w-5 h-5 text-red-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Inactivos</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.usuariosInactivos}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <HiUsers className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Manuales</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.usuariosManuales}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <HiUsers className="w-5 h-5 text-indigo-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Migrados</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.usuariosMigrados}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <HiKey className="w-5 h-5 text-yellow-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Req. Cambio</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.usuariosRequierenCambioPassword}</p>
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
                            placeholder="Buscar por nombre o código..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />

                        <Select
                            value={tipoFilter}
                            onChange={handleTipoFilterChange}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="manual">Usuarios manuales</option>
                            <option value="migrado">Usuarios migrados</option>
                        </Select>

                        <Select
                            value={activoFilter}
                            onChange={handleActivoFilterChange}
                        >
                            <option value="">Todos los estados</option>
                            <option value="true">Activos</option>
                            <option value="false">Inactivos</option>
                        </Select>

                        <Select
                            value={rolFilter}
                            onChange={handleRolFilterChange}
                        >
                            <option value="">Todos los roles</option>
                            {rolesDisponibles.length > 0 ? (
                                rolesDisponibles.map((rol) => (
                                    <option key={rol.id} value={rol.id}>
                                        {rol.nombre}
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>Cargando roles...</option>
                            )}
                        </Select>
                    </div>

                    <div className="text-sm text-gray-600 flex items-center">
                        {filteredUsuarios.length} usuario(s) encontrado(s)
                        {filteredUsuarios.length > itemsPerPage && (
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
                                <TableHeadCell>Código COTEL</TableHeadCell>
                                <TableHeadCell>Usuario</TableHeadCell>
                                <TableHeadCell>Tipo</TableHeadCell>
                                <TableHeadCell>Estado</TableHeadCell>
                                <TableHeadCell>Rol</TableHeadCell>
                                <TableHeadCell>Contraseña</TableHeadCell>
                                <TableHeadCell>Fecha Creación</TableHeadCell>
                                <TableHeadCell>
                                    <span className="sr-only">Acciones</span>
                                </TableHeadCell>
                            </TableRow>
                        </TableHead>
                        <TableBody className="divide-y">
                            {currentItems.map((usuario, index) => (
                                <TableRow key={`usuario-${usuario.id || index}`} className="bg-white">
                                    <TableCell className="whitespace-nowrap font-medium text-gray-900">
                                        <Badge color="gray" size="sm">
                                            {usuario.codigocotel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {usuario.nombres} {usuario.apellidopaterno}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {usuario.apellidomaterno}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            color={getTipoBadgeColor(usuario.codigocotel)}
                                            size="sm"
                                        >
                                            {usuario.codigocotel >= 9000 ? 'Manual' : 'Migrado'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            color={getEstadoBadgeColor(usuario.is_active)}
                                            size="sm"
                                        >
                                            {usuario.is_active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        <Badge color="indigo" size="sm">
                                            {usuario.rol_nombre || usuario.rol?.nombre || 'Sin rol'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            color={getPasswordBadgeColor(usuario.password_changed)}
                                            size="sm"
                                        >
                                            {usuario.password_changed ? 'OK' : 'Requiere cambio'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                                        {usuario.fecha_creacion ?
                                            new Date(usuario.fecha_creacion).toLocaleDateString('es-BO', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            }) : 'N/A'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                size="xs"
                                                color="blue"
                                                onClick={() => openEditModal(usuario)}
                                                title="Editar usuario"
                                            >
                                                <HiPencil className="h-3 w-3" />
                                            </Button>

                                            {usuario.is_active ? (
                                                <Button
                                                    size="xs"
                                                    color="red"
                                                    onClick={() => confirmDelete(usuario)}
                                                    title="Desactivar usuario"
                                                >
                                                    <HiTrash className="h-3 w-3" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="xs"
                                                    color="green"
                                                    onClick={() => handleActivar(usuario)}
                                                    title="Activar usuario"
                                                >
                                                    <HiUsers className="h-3 w-3" />
                                                </Button>
                                            )}

                                            <Button
                                                size="xs"
                                                color="yellow"
                                                onClick={() => handleResetPassword(usuario)}
                                                title="Resetear contraseña"
                                                disabled={!usuario.is_active}
                                            >
                                                <HiKey className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {filteredUsuarios.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <HiUsers className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No se encontraron usuarios
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm || tipoFilter || activoFilter || rolFilter ?
                                    'Ajusta los filtros o crea un nuevo usuario' :
                                    'Comienza creando tu primer usuario del sistema'
                                }
                            </p>
                            <div className="mt-6">
                                <Button onClick={openCreateModal} color="blue">
                                    <HiPlus className="mr-2 h-4 w-4" />
                                    Nuevo Usuario
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
                                    <span className="font-medium">{Math.min(endIndex, filteredUsuarios.length)}</span>
                                    {' '}de{' '}
                                    <span className="font-medium">{filteredUsuarios.length}</span>
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
            <UsuarioForm
                isOpen={isModalOpen}
                onClose={closeModal}
                usuario={selectedUsuario}
                onSubmit={handleCreateEdit}
                loading={loading}
                rolesDisponibles={rolesDisponibles}
            />

            {/* Modal de confirmación de eliminación */}
            <Modal show={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} size="md">
                <ModalHeader>Confirmar Desactivación</ModalHeader>
                <ModalBody>
                    <div className="text-center">
                        <HiExclamationTriangle className="mx-auto mb-4 h-14 w-14 text-red-600" />
                        <h3 className="mb-5 text-lg font-normal text-gray-500">
                            ¿Estás seguro de que quieres desactivar al usuario{' '}
                            <span className="font-semibold">
                                "{usuarioToDelete?.nombres} {usuarioToDelete?.apellidopaterno}"
                            </span>?
                        </h3>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                            <p className="text-sm text-yellow-800">
                                El usuario será desactivado pero no eliminado.
                                Podrás reactivarlo posteriormente si es necesario.
                            </p>
                        </div>

                        {usuarioToDelete && (
                            <div className="text-left bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p><span className="font-medium">Código COTEL:</span> {usuarioToDelete.codigocotel}</p>
                                    <p><span className="font-medium">Tipo:</span> {usuarioToDelete.codigocotel >= 9000 ? 'Manual' : 'Migrado'}</p>
                                    <p><span className="font-medium">Rol:</span> {usuarioToDelete.rol?.nombre || 'Sin rol'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter className="justify-center">
                    <Button
                        color="red"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading ? 'Desactivando...' : 'Sí, desactivar'}
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

export default UsuariosList;
