// EquipoDetailModal.jsx - Optimizado con carga automática
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Modal, ModalBody, ModalHeader, Button, Badge, Card,
    Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Spinner
} from 'flowbite-react';
import { HiCheckCircle } from 'react-icons/hi2';
import { HiClock, HiX, HiRefresh } from 'react-icons/hi';
import { equiposApi } from '../../../api/almacenes';
import { toast } from 'react-hot-toast';

// Hook personalizado para detectar móvil
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            const newIsMobile = window.innerWidth < 768;
            setIsMobile(prev => prev !== newIsMobile ? newIsMobile : prev);
        };

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

// Componente de información para móvil
const MobileInfoCard = React.memo(({ label, value, className = "" }) => (
    <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
        <span className="text-xs font-medium text-gray-600 block mb-1">{label}</span>
        <p className="text-sm text-gray-900 font-medium break-all">{value}</p>
    </div>
));

// Componente de información técnica para móvil
const TechnicalInfoMobile = React.memo(({ equipo }) => (
    <Card className="p-3">
        <h4 className="text-base font-medium text-gray-900 mb-3">Información Técnica</h4>
        <div className="space-y-3">
            <MobileInfoCard
                label="MAC Address"
                value={equipo.mac_address || 'N/A'}
            />
            <MobileInfoCard
                label="GPON Serial"
                value={equipo.gpon_serial || 'N/A'}
            />
            <MobileInfoCard
                label="Serial del Fabricante"
                value={equipo.serial_manufacturer || 'N/A'}
                className="bg-blue-50 border border-blue-200"
            />
        </div>
    </Card>
));

// Componente de información general para móvil
const GeneralInfoMobile = React.memo(({ equipo, getEstadoColor }) => (
    <Card className="p-3">
        <h4 className="text-base font-medium text-gray-900 mb-3">Información General</h4>
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <MobileInfoCard
                    label="Código Interno"
                    value={equipo.codigo_interno || 'N/A'}
                />
                <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs font-medium text-gray-600 block mb-1">Estado</span>
                    <Badge color={getEstadoColor(equipo.estado_nombre, equipo.esta_asignado)} size="sm">
                        {equipo.esta_asignado ? 'Asignado' : (equipo.estado_nombre || 'Sin Estado')}
                    </Badge>
                </div>
            </div>

            <MobileInfoCard
                label="Modelo"
                value={equipo.modelo_nombre || 'N/A'}
            />
            <MobileInfoCard
                label="Marca"
                value={equipo.marca_nombre || 'N/A'}
            />
            <MobileInfoCard
                label="Tipo de Equipo"
                value={equipo.tipo_equipo_nombre || 'N/A'}
            />
            <MobileInfoCard
                label="Lote"
                value={equipo.lote_numero || 'N/A'}
            />

            <div className="grid grid-cols-1 gap-3">
                <MobileInfoCard
                    label="Fecha de Ingreso"
                    value={equipo.fecha_ingreso ? new Date(equipo.fecha_ingreso).toLocaleDateString('es-BO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) : 'N/A'}
                />
                <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs font-medium text-gray-600 block mb-1">Estado de Asignación</span>
                    {equipo.esta_asignado ? (
                        <Badge color="blue" size="sm">
                            <HiCheckCircle className="mr-1 h-3 w-3" />
                            Asignado a Servicio
                        </Badge>
                    ) : (
                        <Badge color="green" size="sm">
                            <HiClock className="mr-1 h-3 w-3" />
                            Disponible
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    </Card>
));

// Componente de historial para móvil
const HistorialMobile = React.memo(({ historial, loading }) => (
    <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-medium text-gray-900">Historial de Asignaciones</h4>
            {loading && (
                <div className="flex items-center text-xs text-gray-600">
                    <Spinner size="sm" className="mr-1" />
                    Cargando...
                </div>
            )}
        </div>

        {historial.length > 0 ? (
            <div className="space-y-3">
                {historial.map((asignacion, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {asignacion.contrato_numero || 'N/A'}
                                </p>
                                <p className="text-xs text-gray-600 truncate">
                                    {asignacion.servicio || 'N/A'}
                                </p>
                            </div>
                            <Badge
                                color={
                                    asignacion.estado_asignacion === 'ACTIVO' ? 'green' :
                                        asignacion.estado_asignacion === 'SUSPENDIDO' ? 'yellow' :
                                            'gray'
                                }
                                size="sm"
                            >
                                {asignacion.estado_asignacion}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-gray-500">Asignado:</span>
                                <p className="text-gray-900">
                                    {asignacion.fecha_asignacion ?
                                        new Date(asignacion.fecha_asignacion).toLocaleDateString('es-BO')
                                        : 'N/A'
                                    }
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500">Desasignado:</span>
                                <p className="text-gray-900">
                                    {asignacion.fecha_desasignacion
                                        ? new Date(asignacion.fecha_desasignacion).toLocaleDateString('es-BO')
                                        : 'Activo'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-6">
                <HiClock className="mx-auto h-8 w-8 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sin historial</h3>
                <p className="mt-1 text-xs text-gray-500">
                    No hay asignaciones registradas
                </p>
            </div>
        )}
    </Card>
));

const EquipoDetailModal = ({ isOpen, onClose, equipo }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);
    const isMobile = useIsMobile();

    // Función para triggear refresh automático en el componente padre
    const triggerRefresh = useCallback(() => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('refresh', Date.now().toString());
        setSearchParams(currentParams);
    }, [searchParams, setSearchParams]);

    const fetchHistorial = useCallback(async (showInitialLoading = false) => {
        if (!equipo?.id) return;

        if (showInitialLoading) {
            setInitialLoading(true);
        } else {
            setLoading(true);
        }

        try {
            const response = await equiposApi.getHistorial(equipo.id);
            setHistorial(response.data || []);
        } catch (error) {
            console.error('Error fetching historial:', error);
            toast.error('Error al cargar el historial del equipo');
            setHistorial([]); // Asegurar que tenemos un array vacío en caso de error
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    }, [equipo?.id]);

    // Carga inicial automática cuando se abre el modal
    useEffect(() => {
        if (isOpen && equipo?.id) {
            // Resetear historial y cargar datos
            setHistorial([]);
            fetchHistorial(true);
        }
    }, [isOpen, equipo?.id, fetchHistorial]);

    // Auto-refresh del historial cuando cambian los searchParams
    useEffect(() => {
        const refreshParam = searchParams.get('refresh');
        if (refreshParam && isOpen && equipo?.id) {
            fetchHistorial(false);
        }
    }, [searchParams.get('refresh'), isOpen, equipo?.id, fetchHistorial]);

    const handleRefresh = useCallback(() => {
        fetchHistorial(false);
        triggerRefresh();
    }, [fetchHistorial, triggerRefresh]);

    const getEstadoColor = useCallback((estadoNombre, estaAsignado) => {
        if (estaAsignado) return 'blue';
        if (!estadoNombre) return 'gray';

        const nombre = estadoNombre.toLowerCase();
        if (nombre.includes('disponible')) return 'green';
        if (nombre.includes('mantenimiento') || nombre.includes('reparacion')) return 'yellow';
        if (nombre.includes('dañado') || nombre.includes('averiado')) return 'red';
        if (nombre.includes('retirado') || nombre.includes('baja')) return 'gray';
        return 'purple';
    }, []);

    if (!equipo) return null;

    // Loading inicial
    if (initialLoading) {
        return (
            <Modal
                show={isOpen}
                onClose={onClose}
                size={isMobile ? "xl" : "4xl"}
                className={isMobile ? "p-2" : ""}
            >
                <ModalBody className="p-8">
                    <div className="flex flex-col items-center justify-center py-8">
                        <Spinner size="xl" />
                        <p className="mt-4 text-gray-600">Cargando información del equipo...</p>
                    </div>
                </ModalBody>
            </Modal>
        );
    }

    return (
        <Modal
            show={isOpen}
            onClose={onClose}
            size={isMobile ? "xl" : "4xl"}
            className={isMobile ? "p-2" : ""}
        >
            <ModalHeader className={isMobile ? "p-3" : ""}>
                <div className="flex items-center justify-between w-full">
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate ${isMobile ? 'text-base' : 'text-lg'}`}>
                            Detalle: {equipo.codigo_interno || 'N/A'}
                        </h3>
                        <p className={`text-gray-500 truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            {equipo.modelo_nombre || 'N/A'} - {equipo.marca_nombre || 'N/A'}
                        </p>
                    </div>
                    {!isMobile && (
                        <Button
                            size="xs"
                            color="gray"
                            onClick={handleRefresh}
                            disabled={loading}
                            className="ml-2"
                        >
                            <HiRefresh className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    )}
                </div>
            </ModalHeader>

            <ModalBody className={isMobile ? "p-3" : ""}>
                <div className={isMobile ? "space-y-4" : "space-y-6"}>
                    {isMobile ? (
                        // Vista móvil optimizada
                        <>
                            <GeneralInfoMobile equipo={equipo} getEstadoColor={getEstadoColor} />
                            <TechnicalInfoMobile equipo={equipo} />

                            {equipo.observaciones && (
                                <Card className="p-3">
                                    <h4 className="text-base font-medium text-gray-900 mb-3">Observaciones</h4>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {equipo.observaciones}
                                        </p>
                                    </div>
                                </Card>
                            )}

                            <HistorialMobile historial={historial} loading={loading} />

                            <Card className="p-3">
                                <h4 className="text-base font-medium text-gray-900 mb-3">Información de Registro</h4>
                                <div className="space-y-3">
                                    <MobileInfoCard
                                        label="Fecha de Creación"
                                        value={equipo.created_at ? new Date(equipo.created_at).toLocaleDateString('es-BO', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'N/A'}
                                    />
                                    {equipo.updated_at && (
                                        <MobileInfoCard
                                            label="Última Modificación"
                                            value={new Date(equipo.updated_at).toLocaleDateString('es-BO', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        />
                                    )}
                                </div>
                            </Card>
                        </>
                    ) : (
                        // Vista desktop (original mejorada)
                        <>
                            {/* Información General */}
                            <Card>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-medium text-gray-900">Información General</h4>
                                    <Button
                                        size="xs"
                                        color="gray"
                                        onClick={handleRefresh}
                                        disabled={loading}
                                    >
                                        <HiRefresh className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                                        Actualizar
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Código Interno:</span>
                                        <p className="text-gray-900 font-mono">{equipo.codigo_interno || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Estado Actual:</span>
                                        <div className="mt-1">
                                            <Badge color={getEstadoColor(equipo.estado_nombre, equipo.esta_asignado)} size="sm">
                                                {equipo.esta_asignado ? 'Asignado' : (equipo.estado_nombre || 'Sin Estado')}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Modelo:</span>
                                        <p className="text-gray-900">{equipo.modelo_nombre || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Marca:</span>
                                        <p className="text-gray-900">{equipo.marca_nombre || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Tipo de Equipo:</span>
                                        <p className="text-gray-900">{equipo.tipo_equipo_nombre || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Lote:</span>
                                        <p className="text-gray-900">{equipo.lote_numero || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Fecha de Ingreso:</span>
                                        <p className="text-gray-900">
                                            {equipo.fecha_ingreso ? new Date(equipo.fecha_ingreso).toLocaleDateString('es-BO', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Estado de Asignación:</span>
                                        <div className="mt-1">
                                            {equipo.esta_asignado ? (
                                                <Badge color="blue" size="sm">
                                                    <HiCheckCircle className="mr-1 h-3 w-3" />
                                                    Asignado a Servicio
                                                </Badge>
                                            ) : (
                                                <Badge color="green" size="sm">
                                                    <HiClock className="mr-1 h-3 w-3" />
                                                    Disponible para Asignación
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Información Técnica */}
                            <Card>
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Información Técnica</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">MAC Address:</span>
                                        <p className="text-gray-900 font-mono">{equipo.mac_address || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">GPON Serial:</span>
                                        <p className="text-gray-900 font-mono">{equipo.gpon_serial || 'N/A'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <span className="text-sm font-medium text-gray-600">Serial del Fabricante:</span>
                                        <p className="text-gray-900 font-mono">{equipo.serial_manufacturer || 'N/A'}</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Observaciones */}
                            {equipo.observaciones && (
                                <Card>
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Observaciones</h4>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <p className="text-gray-700 whitespace-pre-wrap">{equipo.observaciones}</p>
                                    </div>
                                </Card>
                            )}

                            {/* Historial de Asignaciones */}
                            <Card>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-medium text-gray-900">Historial de Asignaciones</h4>
                                    {loading && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Spinner size="sm" className="mr-2" />
                                            Actualizando...
                                        </div>
                                    )}
                                </div>

                                {historial.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableHeadCell>Contrato</TableHeadCell>
                                                    <TableHeadCell>Servicio</TableHeadCell>
                                                    <TableHeadCell>Fecha Asignación</TableHeadCell>
                                                    <TableHeadCell>Fecha Desasignación</TableHeadCell>
                                                    <TableHeadCell>Estado</TableHeadCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {historial.map((asignacion, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">
                                                            {asignacion.contrato_numero || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {asignacion.servicio || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {asignacion.fecha_asignacion ?
                                                                new Date(asignacion.fecha_asignacion).toLocaleDateString('es-BO')
                                                                : 'N/A'
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {asignacion.fecha_desasignacion
                                                                ? new Date(asignacion.fecha_desasignacion).toLocaleDateString('es-BO')
                                                                : 'Activo'
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                color={
                                                                    asignacion.estado_asignacion === 'ACTIVO' ? 'green' :
                                                                        asignacion.estado_asignacion === 'SUSPENDIDO' ? 'yellow' :
                                                                            'gray'
                                                                }
                                                                size="sm"
                                                            >
                                                                {asignacion.estado_asignacion}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <HiClock className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                                            Sin historial de asignaciones
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Este equipo no ha sido asignado a ningún servicio aún.
                                        </p>
                                    </div>
                                )}
                            </Card>

                            {/* Información de Fechas */}
                            <Card>
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Información de Registro</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Fecha de Creación:</span>
                                        <p className="text-gray-900">
                                            {equipo.created_at ? new Date(equipo.created_at).toLocaleDateString('es-BO', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : 'N/A'}
                                        </p>
                                    </div>
                                    {equipo.updated_at && (
                                        <div>
                                            <span className="text-sm font-medium text-gray-600">Última Modificación:</span>
                                            <p className="text-gray-900">
                                                {new Date(equipo.updated_at).toLocaleDateString('es-BO', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </>
                    )}
                </div>

                <div className={`flex justify-end ${isMobile ? 'pt-4' : 'pt-6'}`}>
                    {isMobile && (
                        <Button
                            size="sm"
                            color="light"
                            onClick={handleRefresh}
                            disabled={loading}
                            className="mr-2"
                        >
                            <HiRefresh className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                    )}
                    <Button
                        color="gray"
                        onClick={onClose}
                        size={isMobile ? "sm" : "md"}
                    >
                        <HiX className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                        Cerrar
                    </Button>
                </div>
            </ModalBody>
        </Modal>
    );
};

export default EquipoDetailModal;