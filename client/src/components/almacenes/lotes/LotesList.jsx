import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Button, Table, TableBody, TableCell, TableHead,
    TableHeadCell, TableRow, TextInput, Modal, ModalBody,
    ModalFooter, ModalHeader, Badge, Card, Select
} from 'flowbite-react';
import {
    HiPlus, HiPencil, HiTrash, HiExclamationTriangle, HiEye
} from 'react-icons/hi2';
import { HiSearch, HiFilter } from 'react-icons/hi';
import { HiCog6Tooth } from 'react-icons/hi2';
import { useLotes } from '../../../hooks/useAlmacenes';
import LoteForm from './LoteForm';
import LoteDetailModal from './LoteDetailModal';
import { Permiso} from "../../../api/permisos.js";


const LotesList = () => {
    // Navigation hooks para auto-refresh
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Estados locales
    const [searchTerm, setSearchTerm] = useState('');
    const [proveedorFilter, setProveedorFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedLote, setSelectedLote] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [loteToDelete, setLoteToDelete] = useState(null);

    // Hook personalizado
    const {
        data: lotes,
        loading,
        error,
        fetchData,
        createItem,
        updateItem,
        deleteItem
    } = useLotes();

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

    // Filtrar lotes
    const filteredLotes = useMemo(() => {
        let filtered = lotes;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(lote =>
                lote.numero_lote.toLowerCase().includes(term) ||
                lote.proveedor.toLowerCase().includes(term) ||
                (lote.observaciones && lote.observaciones.toLowerCase().includes(term))
            );
        }

        if (proveedorFilter) {
            filtered = filtered.filter(lote =>
                lote.proveedor.toLowerCase().includes(proveedorFilter.toLowerCase())
            );
        }

        return filtered;
    }, [lotes, searchTerm, proveedorFilter]);

    // Obtener lista única de proveedores (CORREGIDO)
    const proveedores = useMemo(() => {
        const uniqueProveedores = [...new Set(
            lotes
                .map(lote => lote.proveedor)
                .filter(proveedor => proveedor && proveedor.trim() !== '')
        )];
        return uniqueProveedores.sort();
    }, [lotes]);

    // Estadísticas
    const stats = useMemo(() => {
        const totalEquipos = lotes.reduce((sum, lote) => sum + (lote.cantidad_total || 0), 0);
        const equiposRegistrados = lotes.reduce((sum, lote) => sum + (lote.equipos_registrados || 0), 0);
        const lotesPendientes = lotes.filter(lote => (lote.equipos_pendientes || 0) > 0).length;
        const lotesCompletos = lotes.filter(lote => (lote.equipos_pendientes || 0) === 0 && (lote.cantidad_total || 0) > 0).length;

        return {
            totalLotes: lotes.length,
            totalEquipos,
            equiposRegistrados,
            lotesPendientes,
            lotesCompletos,
            porcentajeRegistro: totalEquipos > 0 ? Math.round((equiposRegistrados / totalEquipos) * 100) : 0
        };
    }, [lotes]);

    // Obtener color del progreso
    const getProgressColor = (pendientes, total) => {
        if (total === 0) return 'gray';
        const porcentaje = ((total - pendientes) / total) * 100;
        if (porcentaje === 100) return 'green';
        if (porcentaje >= 75) return 'blue';
        if (porcentaje >= 50) return 'yellow';
        return 'red';
    };

    // Handlers
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleProveedorChange = (e) => {
        setProveedorFilter(e.target.value);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setProveedorFilter('');
    };

    // CORREGIDO: handleCreateEdit con debug intensivo
    const handleCreateEdit = async (data) => {
        try {
            // Guardar referencia local del lote seleccionado
            const loteToEdit = selectedLote;
            let result;

            if (loteToEdit && loteToEdit.id) {
                console.log('=== INICIANDO EDICIÓN ===');
                console.log('Lote a editar:', loteToEdit);
                console.log('ID del lote:', loteToEdit.id);
                console.log('Datos a enviar:', data);
                console.log('Llamando updateItem...');

                result = await updateItem(loteToEdit.id, data);

                console.log('=== RESULTADO DE EDICIÓN ===');
                console.log('Resultado:', result);
                console.log('Tipo de resultado:', typeof result);
                console.log('¿Es truthy?', !!result);
            } else {
                console.log('=== INICIANDO CREACIÓN ===');
                console.log('Datos a enviar:', data);
                result = await createItem(data);
                console.log('Resultado de creación:', result);
            }

            // Solo cerrar si la operación fue exitosa
            if (result && result !== false) {
                console.log('✅ Operación exitosa, cerrando modal');
                closeModal();
                // Auto-refresh usando searchParams
                triggerRefresh();
            } else {
                console.error('❌ Operación falló, manteniendo modal abierto');
                console.log('Resultado falló:', result);
            }

        } catch (error) {
            console.error('💥 ERROR en handleCreateEdit:', error);
            console.log('Stack trace:', error.stack);
            // NO cerrar modal si hay error
        }
    };

    const handleDelete = async () => {
        if (loteToDelete) {
            try {
                const result = await deleteItem(loteToDelete.id);
                if (result !== false) {
                    setShowDeleteConfirm(false);
                    setLoteToDelete(null);
                    // Auto-refresh
                    triggerRefresh();
                }
            } catch (error) {
                console.error('Error al eliminar lote:', error);
            }
        }
    };

    // Función para trigger refresh usando React Router
    const triggerRefresh = () => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('refresh', Date.now().toString());
        setSearchParams(currentParams, { replace: true });
    };

    const openEditModal = (lote) => {
        console.log('Abriendo modal para editar lote:', lote);
        setSelectedLote(lote);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        console.log('Abriendo modal para crear lote');
        setSelectedLote(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedLote(null);
    };

    const openDetailModal = (lote) => {
        setSelectedLote(lote);
        setIsDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedLote(null);
    };

    const confirmDelete = (lote) => {
        setLoteToDelete(lote);
        setShowDeleteConfirm(true);
    };

    // ELIMINADO: handleRefresh (ya no se usa botón de actualizar)

    if (loading && lotes.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando lotes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Lotes</h1>
                    <p className="text-gray-600 mt-1">
                        Administra los lotes de equipos ingresados al almacén
                    </p>
                </div>
                <div className="flex gap-2">
                    <Permiso recurso="catalogo" accion="crear">
                        <Button onClick={openCreateModal} color="blue" size="sm">
                            <HiPlus className="mr-2 h-4 w-4" />
                            Nuevo Lote
                        </Button>
                    </Permiso>

                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <HiCog6Tooth className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Total Lotes</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalLotes}</p>
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
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <HiCog6Tooth className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Registrados</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.equiposRegistrados}</p>
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
                            <p className="text-sm font-medium text-gray-600">Pendientes</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.lotesPendientes}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <HiCog6Tooth className="w-5 h-5 text-indigo-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">Completos</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.lotesCompletos}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                                <HiCog6Tooth className="w-5 h-5 text-teal-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">% Registro</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.porcentajeRegistro}%</p>
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
                            placeholder="Buscar por número de lote, proveedor..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />

                        <Select
                            value={proveedorFilter}
                            onChange={handleProveedorChange}
                        >
                            <option value="">Todos los proveedores</option>
                            {proveedores.map((proveedor, index) => (
                                <option key={`proveedor-${index}-${proveedor || 'empty'}`} value={proveedor}>
                                    {proveedor}
                                </option>
                            ))}
                        </Select>

                        <div className="text-sm text-gray-600 flex items-center">
                            {filteredLotes.length} lote(s) encontrado(s)
                        </div>
                    </div>
                </div>
            </Card>

            {/* Tabla */}
            <Card>
                <div className="overflow-x-auto">
                    <Table hoverable>
                        <TableHead>
                            <TableRow>
                                <TableHeadCell>Número Lote</TableHeadCell>
                                <TableHeadCell>Proveedor</TableHeadCell>
                                <TableHeadCell>Tipo Servicio</TableHeadCell>
                                <TableHeadCell>Total Equipos</TableHeadCell>
                                <TableHeadCell>Registrados</TableHeadCell>
                                <TableHeadCell>Pendientes</TableHeadCell>
                                <TableHeadCell>Progreso</TableHeadCell>
                                <TableHeadCell>Fecha Ingreso</TableHeadCell>
                                <TableHeadCell>
                                    <span className="sr-only">Acciones</span>
                                </TableHeadCell>
                            </TableRow>
                        </TableHead>
                        <TableBody className="divide-y">
                            {filteredLotes.map((lote, index) => (
                                <TableRow key={`lote-${lote.id || index}`} className="bg-white">
                                    <TableCell className="whitespace-nowrap font-medium text-gray-900">
                                        {lote.numero_lote}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {lote.proveedor}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {lote.tipo_servicio_nombre || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge color="blue" size="sm">
                                            {lote.cantidad_total || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge color="green" size="sm">
                                            {lote.equipos_registrados || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            color={lote.equipos_pendientes > 0 ? 'yellow' : 'gray'}
                                            size="sm"
                                        >
                                            {lote.equipos_pendientes || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            color={getProgressColor(lote.equipos_pendientes, lote.cantidad_total)}
                                            size="sm"
                                        >
                                            {lote.cantidad_total > 0
                                                ? Math.round(((lote.cantidad_total - (lote.equipos_pendientes || 0)) / lote.cantidad_total) * 100)
                                                : 0
                                            }%
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                                        {new Date(lote.fecha_ingreso).toLocaleDateString('es-BO', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Permiso recurso="catalogo" accion="leer">
                                                <Button
                                                    size="xs"
                                                    color="purple"
                                                    onClick={() => openDetailModal(lote)}
                                                    title="Ver detalles del lote"
                                                >
                                                    <HiEye className="h-3 w-3" />
                                                </Button>
                                            </Permiso>
                                            <Permiso recurso="catalogo" accion="actualizar">
                                                <Button
                                                    size="xs"
                                                    color="blue"
                                                    onClick={() => openEditModal(lote)}
                                                    title="Editar lote"
                                                >
                                                    <HiPencil className="h-3 w-3" />
                                                </Button>
                                            </Permiso>
                                            <Permiso recurso="catalogo" accion="eliminar">
                                                <Button
                                                    size="xs"
                                                    color="red"
                                                    onClick={() => confirmDelete(lote)}
                                                    title="Eliminar lote"
                                                    disabled={(lote.equipos_registrados || 0) > 0}
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

                    {filteredLotes.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <HiCog6Tooth className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No se encontraron lotes
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm || proveedorFilter ? 'Ajusta los filtros o crea un nuevo lote' : 'Comienza creando tu primer lote de equipos'}
                            </p>
                            <div className="mt-6">
                                <Button onClick={openCreateModal} color="blue">
                                    <HiPlus className="mr-2 h-4 w-4" />
                                    Nuevo Lote
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Modal de formulario */}
            <LoteForm
                isOpen={isModalOpen}
                onClose={closeModal}
                lote={selectedLote}
                onSubmit={handleCreateEdit}
                loading={loading}
            />

            {/* Modal de detalles */}
            <LoteDetailModal
                isOpen={isDetailModalOpen}
                onClose={closeDetailModal}
                lote={selectedLote}
                onRefresh={fetchData}
            />

            {/* Modal de confirmación de eliminación */}
            <Modal show={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} size="md">
                <ModalHeader>Confirmar Eliminación</ModalHeader>
                <ModalBody>
                    <div className="text-center">
                        <HiExclamationTriangle className="mx-auto mb-4 h-14 w-14 text-red-600" />
                        <h3 className="mb-5 text-lg font-normal text-gray-500">
                            ¿Estás seguro de que quieres eliminar el lote{' '}
                            <span className="font-semibold">"{loteToDelete?.numero_lote}"</span>?
                        </h3>
                        {(loteToDelete?.equipos_registrados || 0) > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                <p className="text-sm text-red-800">
                                    Este lote tiene {loteToDelete.equipos_registrados} equipo(s) registrado(s).
                                    No se puede eliminar.
                                </p>
                            </div>
                        )}
                        {(loteToDelete?.equipos_registrados || 0) === 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                <p className="text-sm text-red-800">
                                    Esta acción no se puede deshacer. El lote y todos sus detalles serán eliminados permanentemente.
                                </p>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter className="justify-center">
                    <Button
                        color="red"
                        onClick={handleDelete}
                        disabled={loading || (loteToDelete?.equipos_registrados || 0) > 0}
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

export default LotesList;
