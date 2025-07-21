import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Button, TextInput, Select, Badge, Spinner,
    Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell,
    Modal, ModalHeader, ModalBody, ModalFooter
} from 'flowbite-react';
import {
    HiCog6Tooth, HiPlus,
    HiEye, HiPencil, HiTrash, HiCog, HiCheckCircle,
    HiExclamationTriangle, HiChevronDown, HiChevronUp
} from 'react-icons/hi2';
import { HiDownload, HiFilter, HiSearch } from 'react-icons/hi';

// Lazy loading de componentes pesados
const EquipoONUForm = lazy(() => import('./EquipoONUForm.jsx'));
const EquipoDetailModal = lazy(() => import('./EquipoDetailModal.jsx'));
const CambiarEstadoModal = lazy(() => import('./CambiarEstadoModal.jsx'));

// Custom hooks optimizados
import {
    useEquiposWithFilters,
    useMarcas,
    useTiposEquipo,
    useEstadosEquipo,
    useLotes
} from '../../../hooks/useAlmacenes.js';

// Constantes para optimización
const DEBOUNCE_DELAY = 300;
const ITEMS_PER_PAGE_MOBILE = 10;
const ITEMS_PER_PAGE_DESKTOP = 25;
const MOBILE_BREAKPOINT = 768;

// Hook personalizado para detectar tamaño de pantalla
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < MOBILE_BREAKPOINT;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
            setIsMobile(prev => prev !== newIsMobile ? newIsMobile : prev);
        };

        // Throttle resize events
        let timeoutId;
        const throttledResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleResize, 100);
        };

        window.addEventListener('resize', throttledResize);
        return () => {
            window.removeEventListener('resize', throttledResize);
            clearTimeout(timeoutId);
        };
    }, []);

    return isMobile;
};

// Componente de tabla móvil optimizado
const MobileCard = React.memo(({ equipo, onView, onEdit, onDelete, onChangeState, getEstadoColor }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{equipo.codigo_interno}</h3>
                <p className="text-sm text-gray-600 truncate">{equipo.modelo_nombre}</p>
                <p className="text-xs text-gray-500">{equipo.marca_nombre}</p>
            </div>
            <Badge color={getEstadoColor(equipo.estado_nombre, equipo.esta_asignado)} size="sm">
                {equipo.esta_asignado ? 'Asignado' : (equipo.estado_nombre || '--')}
            </Badge>
        </div>

        <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs">
                <span className="text-gray-500">MAC:</span>
                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">
                    {equipo.mac_address}
                </code>
            </div>
            <div className="flex justify-between text-xs">
                <span className="text-gray-500">GPON:</span>
                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">
                    {equipo.gpon_serial}
                </code>
            </div>
            <div className="flex justify-between text-xs">
                <span className="text-gray-500">Serial Fab.:</span>
                <code className="bg-blue-50 px-1 py-0.5 rounded text-xs font-mono border border-blue-200">
                    {equipo.serial_manufacturer || 'N/A'}
                </code>
            </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
            <Button size="xs" color="gray" onClick={() => onView(equipo)} className="flex-shrink-0">
                <HiEye className="h-3 w-3 mr-1" /> Ver
            </Button>
            <Button size="xs" color="yellow" onClick={() => onChangeState(equipo)} className="flex-shrink-0">
                <HiCog className="h-3 w-3 mr-1" /> Estado
            </Button>
            <Button size="xs" color="blue" onClick={() => onEdit(equipo)} className="flex-shrink-0">
                <HiPencil className="h-3 w-3 mr-1" /> Editar
            </Button>
            <Button
                size="xs"
                color="red"
                onClick={() => onDelete(equipo)}
                disabled={equipo.esta_asignado}
                className="flex-shrink-0 disabled:opacity-50"
            >
                <HiTrash className="h-3 w-3 mr-1" /> Eliminar
            </Button>
        </div>
    </div>
));

// Componente de estadísticas optimizado
const StatsCard = React.memo(({ label, value, icon, color }) => (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 truncate">{label}</p>
                <p className={`text-xl sm:text-2xl font-bold text-${color}-600 truncate`}>
                    {value}
                </p>
            </div>
            <div className={`p-2 bg-${color}-100 rounded-lg flex-shrink-0`}>
                {React.cloneElement(icon, { className: `w-5 h-5 sm:w-6 sm:h-6 text-${color}-600` })}
            </div>
        </div>
    </div>
));

// Componente de filtros colapsible para móvil
const FilterSection = React.memo(({
                                      searchTerm, onSearchChange, marcaFilter, onMarcaChange,
                                      estadoFilter, onEstadoChange, loteFilter, onLoteChange,
                                      marcas, estadosEquipo, lotes, onClearFilters, equiposCount, loading
                                  }) => {
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const isMobile = useIsMobile();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header con toggle para móvil */}
            <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <HiFilter className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Filtros</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" color="gray" onClick={onClearFilters}>
                            Limpiar
                        </Button>
                        {isMobile && (
                            <Button
                                size="sm"
                                color="light"
                                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                                className="md:hidden"
                            >
                                {isFiltersOpen ? <HiChevronUp /> : <HiChevronDown />}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filtros - colapsibles en móvil */}
                <div className={`mt-4 transition-all duration-300 ${
                    isMobile ? (isFiltersOpen ? 'block' : 'hidden') : 'block'
                }`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <TextInput
                            icon={HiSearch}
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={onSearchChange}
                            className="w-full"
                            sizing="sm"
                        />
                        <Select
                            value={marcaFilter}
                            onChange={onMarcaChange}
                            sizing="sm"
                            className="w-full"
                        >
                            <option value="">Todas las marcas</option>
                            {marcas.map(m => (
                                <option key={m.id} value={m.id}>{m.nombre}</option>
                            ))}
                        </Select>
                        <Select
                            value={estadoFilter}
                            onChange={onEstadoChange}
                            sizing="sm"
                            className="w-full"
                        >
                            <option value="">Todos los estados</option>
                            {estadosEquipo.map(e => (
                                <option key={e.id} value={e.id}>{e.nombre}</option>
                            ))}
                        </Select>
                        <Select
                            value={loteFilter}
                            onChange={onLoteChange}
                            sizing="sm"
                            className="w-full"
                        >
                            <option value="">Todos los lotes</option>
                            {lotes.map(l => (
                                <option key={l.id} value={l.id}>{l.numero_lote}</option>
                            ))}
                        </Select>
                    </div>
                </div>

                {/* Contador de resultados */}
                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                    <span>{equiposCount} equipo(s) encontrado(s)</span>
                    {loading && (
                        <div className="flex items-center gap-1">
                            <Spinner size="sm" />
                            <span className="text-xs">Cargando...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

// Componente principal optimizado
export const GestionEquiposONU = () => {
    // Estados principales
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [marcaFilter, setMarcaFilter] = useState(searchParams.get('marca') || '');
    const [estadoFilter, setEstadoFilter] = useState(searchParams.get('estado') || '');
    const [loteFilter, setLoteFilter] = useState(searchParams.get('lote') || '');

    // Estados de modales
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isCambiarEstadoOpen, setIsCambiarEstadoOpen] = useState(false);
    const [selectedEquipo, setSelectedEquipo] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [equipoToDelete, setEquipoToDelete] = useState(null);

    // Estado de vista móvil y paginación
    const isMobileView = useIsMobile();
    const [currentPage, setCurrentPage] = useState(1);

    // Custom hooks
    const {
        equipos, loading, fetchEquipos,
        createEquipo, updateEquipo, deleteEquipo,
        cambiarEstado
    } = useEquiposWithFilters();
    const { marcas, fetchMarcas } = useMarcas();
    const { data: tiposEquipo, fetchData: fetchTiposEquipo } = useTiposEquipo();
    const { data: estadosEquipo, fetchData: fetchEstadosEquipo } = useEstadosEquipo();
    const { data: lotes, fetchData: fetchLotes } = useLotes();

    // Función optimizada para actualizar URL - memoizada para evitar re-renders
    const updateFiltersInURL = useCallback((filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            }
        });
        setSearchParams(params);
    }, [setSearchParams]);

    // Función de refresh optimizada
    const triggerRefresh = useCallback(() => {
        const params = new URLSearchParams(searchParams);
        params.set('refresh', Date.now().toString());
        setSearchParams(params);
    }, [searchParams, setSearchParams]);

    // Carga inicial optimizada
    useEffect(() => {
        const initFilters = {
            search: searchParams.get('search') || '',
            marca: searchParams.get('marca') || '',
            estado: searchParams.get('estado') || '',
            lote: searchParams.get('lote') || ''
        };

        // Cargar datos iniciales sin Promise.all para evitar problemas de loading
        fetchEquipos(initFilters);
        fetchMarcas();
        fetchTiposEquipo();
        fetchEstadosEquipo();
        fetchLotes();
    }, []); // Solo se ejecuta una vez al montar

    // Auto-refresh optimizado
    useEffect(() => {
        const refreshParam = searchParams.get('refresh');
        if (refreshParam) {
            const filters = {
                search: searchParams.get('search') || '',
                marca: searchParams.get('marca') || '',
                estado: searchParams.get('estado') || '',
                lote: searchParams.get('lote') || ''
            };

            fetchEquipos(filters);

            // Limpiar el parámetro refresh sin triggering un nuevo effect
            const params = new URLSearchParams(searchParams);
            params.delete('refresh');
            setSearchParams(params, { replace: true });
        }
    }, [searchParams.get('refresh')]); // Solo escucha cambios en refresh

    // Debounced filters con optimización - separar para evitar loops
    useEffect(() => {
        const timer = setTimeout(() => {
            const filters = {
                search: searchTerm,
                marca: marcaFilter,
                estado: estadoFilter,
                lote: loteFilter
            };
            updateFiltersInURL(filters);
            fetchEquipos(filters);
            setCurrentPage(1); // Reset page on filter change
        }, DEBOUNCE_DELAY);

        return () => clearTimeout(timer);
    }, [searchTerm, marcaFilter, estadoFilter, loteFilter]); // Remover dependencias que pueden causar loops

    // Estadísticas memoizadas
    const stats = useMemo(() => {
        if (!Array.isArray(equipos)) return {
            total: 0,
            disponibles: 0,
            asignados: 0,
            mantenimiento: 0,
            dañados: 0,
            pctDisponible: 0
        };

        const total = equipos.length;
        const disponibles = equipos.filter(e =>
            e.estado_nombre?.toLowerCase().includes('disponible')
        ).length;
        const asignados = equipos.filter(e => e.esta_asignado).length;
        const mantenimiento = equipos.filter(e =>
            e.estado_nombre?.toLowerCase().includes('mantenimiento')
        ).length;
        const dañados = equipos.filter(e =>
            e.estado_nombre?.toLowerCase().includes('dañado')
        ).length;

        return {
            total,
            disponibles,
            asignados,
            mantenimiento,
            dañados,
            pctDisponible: total > 0 ? Math.round((disponibles / total) * 100) : 0
        };
    }, [equipos]);

    // Función para obtener color de estado - memoizada
    const getEstadoColor = useCallback((nombre, asignado) => {
        if (asignado) return 'blue';
        if (!nombre) return 'gray';
        const estado = nombre.toLowerCase();
        if (estado.includes('disponible')) return 'green';
        if (estado.includes('mantenimiento')) return 'yellow';
        if (estado.includes('dañado')) return 'red';
        return 'purple';
    }, []);

    // Paginación memoizada
    const paginationData = useMemo(() => {
        const itemsPerPage = isMobileView ? ITEMS_PER_PAGE_MOBILE : ITEMS_PER_PAGE_DESKTOP;
        const totalPages = Math.ceil(equipos.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentEquipos = equipos.slice(startIndex, endIndex);

        return {
            itemsPerPage,
            totalPages,
            startIndex,
            endIndex,
            currentEquipos
        };
    }, [equipos, currentPage, isMobileView]);

    // Handlers optimizados
    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);

    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setMarcaFilter('');
        setEstadoFilter('');
        setLoteFilter('');
        setSearchParams(new URLSearchParams());
        fetchEquipos({});
        setCurrentPage(1);
    }, [setSearchParams, fetchEquipos]);

    const handleCreateEdit = useCallback(async (data) => {
        try {
            if (selectedEquipo) {
                await updateEquipo(selectedEquipo.id, data);
            } else {
                await createEquipo(data);
            }
            setIsModalOpen(false);
            triggerRefresh();
        } catch (error) {
            console.error('Error saving equipo:', error);
        }
    }, [selectedEquipo, updateEquipo, createEquipo, triggerRefresh]);

    const handleDelete = useCallback(async () => {
        if (!equipoToDelete) return;
        try {
            await deleteEquipo(equipoToDelete.id);
            setShowDeleteConfirm(false);
            setEquipoToDelete(null);
            triggerRefresh();
        } catch (error) {
            console.error('Error deleting equipo:', error);
        }
    }, [equipoToDelete, deleteEquipo, triggerRefresh]);

    const handleCambiarEstado = useCallback(async (estadoData) => {
        if (!selectedEquipo) return;
        try {
            await cambiarEstado(selectedEquipo.id, estadoData);
            setIsCambiarEstadoOpen(false);
            triggerRefresh();
        } catch (error) {
            console.error('Error changing state:', error);
        }
    }, [selectedEquipo, cambiarEstado, triggerRefresh]);

    // Modal handlers optimizados
    const openEditModal = useCallback((equipo) => {
        setSelectedEquipo(equipo);
        setIsModalOpen(true);
    }, []);

    const openCreateModal = useCallback(() => {
        setSelectedEquipo(null);
        setIsModalOpen(true);
    }, []);

    const openDetailModal = useCallback((equipo) => {
        setSelectedEquipo(equipo);
        setIsDetailModalOpen(true);
    }, []);

    const openCambiarEstadoModal = useCallback((equipo) => {
        setSelectedEquipo(equipo);
        setIsCambiarEstadoOpen(true);
    }, []);

    const confirmDelete = useCallback((equipo) => {
        setEquipoToDelete(equipo);
        setShowDeleteConfirm(true);
    }, []);

    // Loading state inicial
    if (loading && equipos.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                    <Spinner size="xl" aria-label="Cargando equipos" />
                    <p className="mt-4 text-gray-600">Cargando equipos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
                {/* Header optimizado */}
                <div className="bg-white bg-opacity-95 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl flex-shrink-0">
                                <HiCog6Tooth className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                                    Gestión de Equipos ONU
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">
                                    Administra todos los equipos ONU en el sistema
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 sm:gap-3 w-full lg:w-auto">
                            <Button
                                color="purple"
                                size={isMobileView ? "sm" : "lg"}
                                className="flex-1 lg:flex-none rounded-lg sm:rounded-xl"
                                onClick={() => {/* export logic */}}
                            >
                                <HiDownload className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                <span className="hidden sm:inline">Exportar</span>
                                <span className="sm:hidden">Export</span>
                            </Button>
                            <Button
                                onClick={openCreateModal}
                                color="blue"
                                size={isMobileView ? "sm" : "lg"}
                                className="flex-1 lg:flex-none rounded-lg sm:rounded-xl"
                            >
                                <HiPlus className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                <span className="hidden sm:inline">Registrar Equipo</span>
                                <span className="sm:hidden">Nuevo</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Estadísticas optimizadas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                    <StatsCard
                        label="Total"
                        value={stats.total}
                        icon={<HiCog6Tooth />}
                        color="blue"
                    />
                    <StatsCard
                        label="Disponibles"
                        value={stats.disponibles}
                        icon={<HiCheckCircle />}
                        color="green"
                    />
                    <StatsCard
                        label="Asignados"
                        value={stats.asignados}
                        icon={<HiCog />}
                        color="blue"
                    />
                    <StatsCard
                        label="Mantenimiento"
                        value={stats.mantenimiento}
                        icon={<HiCog />}
                        color="yellow"
                    />
                    <StatsCard
                        label="Dañados"
                        value={stats.dañados}
                        icon={<HiExclamationTriangle />}
                        color="red"
                    />
                    <StatsCard
                        label="% Disponible"
                        value={`${stats.pctDisponible}%`}
                        icon={<HiCheckCircle />}
                        color="teal"
                    />
                </div>

                {/* Filtros optimizados */}
                <FilterSection
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    marcaFilter={marcaFilter}
                    onMarcaChange={(e) => setMarcaFilter(e.target.value)}
                    estadoFilter={estadoFilter}
                    onEstadoChange={(e) => setEstadoFilter(e.target.value)}
                    loteFilter={loteFilter}
                    onLoteChange={(e) => setLoteFilter(e.target.value)}
                    marcas={marcas || []}
                    estadosEquipo={estadosEquipo || []}
                    lotes={lotes || []}
                    onClearFilters={clearFilters}
                    equiposCount={equipos.length}
                    loading={loading}
                />

                {/* Vista de datos - adaptativa */}
                {isMobileView ? (
                    // Vista móvil con cards
                    <div className="space-y-3">
                        {paginationData.currentEquipos.map((equipo) => (
                            <MobileCard
                                key={equipo.id}
                                equipo={equipo}
                                onView={openDetailModal}
                                onEdit={openEditModal}
                                onDelete={confirmDelete}
                                onChangeState={openCambiarEstadoModal}
                                getEstadoColor={getEstadoColor}
                            />
                        ))}

                        {/* Paginación móvil */}
                        {paginationData.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-4">
                                <Button
                                    size="sm"
                                    color="gray"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                >
                                    Anterior
                                </Button>
                                <span className="text-sm text-gray-600 px-3">
                                    {currentPage} de {paginationData.totalPages}
                                </span>
                                <Button
                                    size="sm"
                                    color="gray"
                                    disabled={currentPage === paginationData.totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(paginationData.totalPages, prev + 1))}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    // Vista desktop con tabla
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table hoverable>
                                <TableHead className="bg-gray-50">
                                    <TableHeadCell className="whitespace-nowrap">Código</TableHeadCell>
                                    <TableHeadCell className="whitespace-nowrap">Modelo / Marca</TableHeadCell>
                                    <TableHeadCell className="whitespace-nowrap">MAC</TableHeadCell>
                                    <TableHeadCell className="whitespace-nowrap">GPON</TableHeadCell>
                                    <TableHeadCell className="whitespace-nowrap">Serial Fab.</TableHeadCell>
                                    <TableHeadCell className="whitespace-nowrap">Estado</TableHeadCell>
                                    <TableHeadCell className="text-center whitespace-nowrap">Acciones</TableHeadCell>
                                </TableHead>
                                <TableBody>
                                    {paginationData.currentEquipos.map((equipo, idx) => (
                                        <TableRow
                                            key={equipo.id}
                                            className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                                        >
                                            <TableCell className="font-medium">
                                                {equipo.codigo_interno}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-gray-900">
                                                    {equipo.modelo_nombre}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {equipo.marca_nombre}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                                    {equipo.mac_address}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                                    {equipo.gpon_serial}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                                    {equipo.serial_manufacturer || 'N/A'}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    color={getEstadoColor(equipo.estado_nombre, equipo.esta_asignado)}
                                                    size="sm"
                                                >
                                                    {equipo.esta_asignado ? 'Asignado' : (equipo.estado_nombre || '--')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center items-center gap-1">
                                                    <Button
                                                        size="xs"
                                                        color="gray"
                                                        onClick={() => openDetailModal(equipo)}
                                                        className="px-2"
                                                    >
                                                        <HiEye className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        color="yellow"
                                                        onClick={() => openCambiarEstadoModal(equipo)}
                                                        className="px-2"
                                                    >
                                                        <HiCog className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        color="blue"
                                                        onClick={() => openEditModal(equipo)}
                                                        className="px-2"
                                                    >
                                                        <HiPencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        color="red"
                                                        onClick={() => confirmDelete(equipo)}
                                                        disabled={equipo.esta_asignado}
                                                        className="px-2 disabled:opacity-50"
                                                    >
                                                        <HiTrash className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Paginación desktop */}
                        {paginationData.totalPages > 1 && (
                            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
                                <div className="text-sm text-gray-600">
                                    Mostrando {paginationData.startIndex + 1} a {Math.min(paginationData.endIndex, equipos.length)} de {equipos.length} equipos
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        color="gray"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    >
                                        Anterior
                                    </Button>

                                    {/* Números de página */}
                                    {Array.from({ length: Math.min(5, paginationData.totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (paginationData.totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= paginationData.totalPages - 2) {
                                            pageNum = paginationData.totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                size="sm"
                                                color={currentPage === pageNum ? "blue" : "light"}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className="min-w-[2.5rem]"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}

                                    <Button
                                        size="sm"
                                        color="gray"
                                        disabled={currentPage === paginationData.totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(paginationData.totalPages, prev + 1))}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Estado vacío */}
                {equipos.length === 0 && !loading && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
                        <HiCog6Tooth className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                            No se encontraron equipos
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {searchTerm || marcaFilter || estadoFilter || loteFilter
                                ? 'Intenta ajustar los filtros de búsqueda'
                                : 'Comienza registrando tu primer equipo ONU'
                            }
                        </p>
                        <Button
                            onClick={openCreateModal}
                            color="blue"
                            size={isMobileView ? "sm" : "lg"}
                            className="rounded-xl"
                        >
                            <HiPlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                            Registrar Equipo
                        </Button>
                    </div>
                )}
            </div>

            {/* Modales con lazy loading */}
            <Suspense fallback={
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <div className="flex items-center gap-3">
                            <Spinner size="lg" />
                            <span className="text-gray-700">Cargando...</span>
                        </div>
                    </div>
                </div>
            }>
                {isModalOpen && (
                    <EquipoONUForm
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        equipo={selectedEquipo}
                        onSubmit={handleCreateEdit}
                        loading={loading}
                    />
                )}

                {isDetailModalOpen && (
                    <EquipoDetailModal
                        isOpen={isDetailModalOpen}
                        onClose={() => setIsDetailModalOpen(false)}
                        equipo={selectedEquipo}
                    />
                )}

                {isCambiarEstadoOpen && (
                    <CambiarEstadoModal
                        isOpen={isCambiarEstadoOpen}
                        onClose={() => setIsCambiarEstadoOpen(false)}
                        equipo={selectedEquipo}
                        onSubmit={handleCambiarEstado}
                        loading={loading}
                    />
                )}
            </Suspense>

            {/* Modal de confirmación de eliminación */}
            <Modal
                show={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                size="md"
                className="p-0"
            >
                <div className="relative bg-white rounded-xl max-w-md mx-auto">
                    <ModalHeader className="border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <HiExclamationTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Confirmar Eliminación
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Esta acción no se puede deshacer
                                </p>
                            </div>
                        </div>
                    </ModalHeader>

                    <ModalBody className="p-6">
                        <div className="text-center">
                            <p className="text-gray-700 mb-2">
                                ¿Estás seguro de que deseas eliminar el equipo?
                            </p>
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <p className="font-medium text-gray-900">
                                    {equipoToDelete?.codigo_interno}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {equipoToDelete?.modelo_nombre} - {equipoToDelete?.marca_nombre}
                                </p>
                            </div>

                            {equipoToDelete?.esta_asignado && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                    <p className="text-sm text-yellow-800">
                                        <HiExclamationTriangle className="inline h-4 w-4 mr-1" />
                                        Este equipo está asignado y no puede ser eliminado
                                    </p>
                                </div>
                            )}
                        </div>
                    </ModalBody>

                    <ModalFooter className="border-t border-gray-200 p-4">
                        <div className="flex gap-3 w-full">
                            <Button
                                color="gray"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={loading}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                color="red"
                                onClick={handleDelete}
                                disabled={loading || equipoToDelete?.esta_asignado}
                                className="flex-1"
                            >
                                {loading ? (
                                    <>
                                        <Spinner size="sm" className="mr-2" />
                                        Eliminando...
                                    </>
                                ) : (
                                    <>
                                        <HiTrash className="mr-2 h-4 w-4" />
                                        Eliminar
                                    </>
                                )}
                            </Button>
                        </div>
                    </ModalFooter>
                </div>
            </Modal>
        </div>
    );
};

export default GestionEquiposONU;