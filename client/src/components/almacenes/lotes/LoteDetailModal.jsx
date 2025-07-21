import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Modal, ModalBody, ModalHeader, Button, Badge, Card,
    Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow
} from 'flowbite-react';
import { HiPlus } from 'react-icons/hi2';
import { HiX } from 'react-icons/hi';
import { lotesApi } from '../../../api/almacenes';
import { toast } from 'react-hot-toast';

const LoteDetailModal = ({ isOpen, onClose, lote, onRefresh }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [resumen, setResumen] = useState(null);
    const [loading, setLoading] = useState(false);

    // Función para triggear refresh automático en el componente padre
    const triggerRefresh = () => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('refresh', Date.now().toString());
        setSearchParams(currentParams);
    };

    useEffect(() => {
        if (isOpen && lote) {
            fetchResumen();
        }
    }, [isOpen, lote]);

    // Auto-refresh cuando cambian los searchParams
    useEffect(() => {
        const refreshParam = searchParams.get('refresh');
        if (refreshParam && isOpen && lote) {
            fetchResumen();
        }
    }, [searchParams, isOpen, lote]);

    const fetchResumen = async () => {
        if (!lote) return;

        setLoading(true);
        try {
            const response = await lotesApi.getResumen(lote.id);
            setResumen(response.data);
        } catch (error) {
            console.error('Error fetching resumen:', error);
            toast.error('Error al cargar el resumen del lote');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchResumen();
        triggerRefresh(); // También actualizar datos del componente padre
        onRefresh?.(); // Mantener compatibilidad con el callback existente
    };

    if (!lote) return null;

    const getProgressColor = (pendientes, total) => {
        if (total === 0) return 'gray';
        const porcentaje = ((total - pendientes) / total) * 100;
        if (porcentaje === 100) return 'green';
        if (porcentaje >= 75) return 'blue';
        if (porcentaje >= 50) return 'yellow';
        return 'red';
    };

    return (
        <Modal show={isOpen} onClose={onClose} size="4xl">
            <ModalHeader>
                <div className="flex items-center justify-between w-full">
                    <div>
                        <h3 className="text-lg font-semibold">Detalle del Lote: {lote.numero_lote}</h3>
                        <p className="text-sm text-gray-500">{lote.proveedor}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" color="gray" onClick={handleRefresh} disabled={loading}>
                            <div className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}>
                                ⟲
                            </div>
                            {loading ? 'Actualizando...' : 'Actualizar'}
                        </Button>
                    </div>
                </div>
            </ModalHeader>
            <ModalBody>
                <div className="space-y-6">
                    {/* Información General */}
                    <Card>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Información General</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm font-medium text-gray-600">Número de Lote:</span>
                                <p className="text-gray-900">{lote.numero_lote}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Proveedor:</span>
                                <p className="text-gray-900">{lote.proveedor}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Tipo de Servicio:</span>
                                <p className="text-gray-900">{resumen?.tipo_servicio || lote.tipo_servicio_nombre}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Fecha de Ingreso:</span>
                                <p className="text-gray-900">
                                    {new Date(resumen?.fecha_ingreso || lote.fecha_ingreso).toLocaleDateString('es-BO')}
                                </p>
                            </div>
                            {lote.observaciones && (
                                <div className="md:col-span-2">
                                    <span className="text-sm font-medium text-gray-600">Observaciones:</span>
                                    <p className="text-gray-900">{lote.observaciones}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Resumen de Progreso */}
                    {resumen && (
                        <Card>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-medium text-gray-900">Resumen de Progreso</h4>
                                {loading && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                                        Actualizando...
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{resumen.cantidad_total}</div>
                                    <div className="text-sm text-gray-600">Total Equipos</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{resumen.equipos_registrados}</div>
                                    <div className="text-sm text-gray-600">Registrados</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-600">{resumen.equipos_pendientes}</div>
                                    <div className="text-sm text-gray-600">Pendientes</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{resumen.porcentaje_registro}%</div>
                                    <div className="text-sm text-gray-600">Completado</div>
                                </div>
                            </div>

                            {/* Barra de progreso */}
                            <div className="mt-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Progreso de Registro</span>
                                    <span>{resumen.porcentaje_registro}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            resumen.porcentaje_registro === 100 ? 'bg-green-600' :
                                                resumen.porcentaje_registro >= 75 ? 'bg-blue-600' :
                                                    resumen.porcentaje_registro >= 50 ? 'bg-yellow-600' :
                                                        'bg-red-600'
                                        }`}
                                        style={{ width: `${resumen.porcentaje_registro}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Estado del lote basado en progreso */}
                            <div className="mt-4 flex justify-center">
                                <Badge
                                    color={
                                        resumen.porcentaje_registro === 100 ? 'green' :
                                            resumen.porcentaje_registro >= 75 ? 'blue' :
                                                resumen.porcentaje_registro >= 50 ? 'yellow' :
                                                    resumen.porcentaje_registro > 0 ? 'orange' :
                                                        'red'
                                    }
                                    size="lg"
                                >
                                    {resumen.porcentaje_registro === 100 ? '✅ Completado' :
                                        resumen.porcentaje_registro >= 75 ? '🔵 Casi Completo' :
                                            resumen.porcentaje_registro >= 50 ? '🟡 En Progreso' :
                                                resumen.porcentaje_registro > 0 ? '🟠 Iniciado' :
                                                    '🔴 Pendiente'
                                    }
                                </Badge>
                            </div>
                        </Card>
                    )}

                    {/* Detalles por Modelo */}
                    {resumen?.detalles_por_modelo && (
                        <Card>
                            <h4 className="text-lg font-medium text-gray-900 mb-4">Detalles por Modelo</h4>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableHeadCell>Código</TableHeadCell>
                                            <TableHeadCell>Modelo</TableHeadCell>
                                            <TableHeadCell>Cantidad Lote</TableHeadCell>
                                            <TableHeadCell>Registrados</TableHeadCell>
                                            <TableHeadCell>Pendientes</TableHeadCell>
                                            <TableHeadCell>Progreso</TableHeadCell>
                                            <TableHeadCell>Estado</TableHeadCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {resumen.detalles_por_modelo.map((detalle, index) => {
                                            const progreso = detalle.cantidad_lote > 0
                                                ? Math.round((detalle.equipos_registrados / detalle.cantidad_lote) * 100)
                                                : 0;

                                            return (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Badge color="gray" size="sm">
                                                            {detalle.codigo_modelo}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <div>
                                                            <div>{detalle.modelo}</div>
                                                            <div className="text-sm text-gray-500">{detalle.marca}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge color="blue" size="sm">
                                                            {detalle.cantidad_lote}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge color="green" size="sm">
                                                            {detalle.equipos_registrados}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            color={detalle.pendientes > 0 ? 'yellow' : 'gray'}
                                                            size="sm"
                                                        >
                                                            {detalle.pendientes}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                color={getProgressColor(detalle.pendientes, detalle.cantidad_lote)}
                                                                size="sm"
                                                            >
                                                                {progreso}%
                                                            </Badge>
                                                            <div className="w-16 bg-gray-200 rounded-full h-1">
                                                                <div
                                                                    className={`h-1 rounded-full transition-all duration-300 ${
                                                                        progreso === 100 ? 'bg-green-600' :
                                                                            progreso >= 75 ? 'bg-blue-600' :
                                                                                progreso >= 50 ? 'bg-yellow-600' :
                                                                                    'bg-red-600'
                                                                    }`}
                                                                    style={{ width: `${progreso}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            color={
                                                                progreso === 100 ? 'green' :
                                                                    progreso >= 75 ? 'blue' :
                                                                        progreso >= 50 ? 'yellow' :
                                                                            progreso > 0 ? 'orange' : 'red'
                                                            }
                                                            size="sm"
                                                        >
                                                            {progreso === 100 ? 'Completo' :
                                                                progreso >= 75 ? 'Casi Completo' :
                                                                    progreso >= 50 ? 'En Progreso' :
                                                                        progreso > 0 ? 'Iniciado' : 'Pendiente'
                                                            }
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Resumen de la tabla */}
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <span className="font-medium">Modelos en el lote:</span> {resumen.detalles_por_modelo.length}
                                        </div>
                                        <div>
                                            <span className="font-medium">Modelos completados:</span> {
                                            resumen.detalles_por_modelo.filter(d =>
                                                d.cantidad_lote > 0 &&
                                                Math.round((d.equipos_registrados / d.cantidad_lote) * 100) === 100
                                            ).length
                                        }
                                        </div>
                                        <div>
                                            <span className="font-medium">Modelos pendientes:</span> {
                                            resumen.detalles_por_modelo.filter(d => d.pendientes > 0).length
                                        }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Estado de carga */}
                    {loading && !resumen && (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Cargando detalles del lote...</span>
                        </div>
                    )}

                    {/* Estado sin datos */}
                    {!loading && !resumen && lote && (
                        <Card>
                            <div className="text-center py-8">
                                <div className="text-gray-400 text-4xl mb-4">📦</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No hay información de resumen disponible
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Los datos del lote pueden estar siendo procesados o no estar disponibles.
                                </p>
                                <Button color="blue" size="sm" onClick={handleRefresh}>
                                    Intentar Nuevamente
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>

                <div className="flex justify-end pt-6">
                    <Button color="gray" onClick={onClose}>
                        <HiX className="mr-2 h-4 w-4" />
                        Cerrar
                    </Button>
                </div>
            </ModalBody>
        </Modal>
    );
};

export default LoteDetailModal;