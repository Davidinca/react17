import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Modal, ModalBody, ModalHeader, Button, Label,
    Select, Textarea, HelperText, Badge
} from 'flowbite-react';
import { useForm } from 'react-hook-form';
import { useEstadosEquipo } from '../../../hooks/useAlmacenes';

const CambiarEstadoModal = ({ isOpen, onClose, equipo, onSubmit, loading = false }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { data: estadosEquipo, fetchData: fetchEstadosEquipo } = useEstadosEquipo();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors }
    } = useForm({
        defaultValues: {
            estado_id: '',
            observaciones: ''
        }
    });

    const estadoSeleccionado = watch('estado_id');

    // Función para triggear refresh automático
    const triggerRefresh = () => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('refresh', Date.now().toString());
        setSearchParams(currentParams);
    };

    // Cargar estados al abrir el modal
    useEffect(() => {
        if (isOpen) {
            fetchEstadosEquipo();
        }
    }, [isOpen]);

    // Auto-refresh cuando cambian los searchParams
    useEffect(() => {
        const refreshParam = searchParams.get('refresh');
        if (refreshParam && isOpen) {
            fetchEstadosEquipo();
        }
    }, [searchParams, isOpen, fetchEstadosEquipo]);

    useEffect(() => {
        if (equipo) {
            reset({
                estado_id: equipo.estado || '',
                observaciones: ''
            });
        } else {
            reset({
                estado_id: '',
                observaciones: ''
            });
        }
    }, [equipo, reset, isOpen]);

    const onFormSubmit = async (data) => {
        try {
            const formData = {
                estado_id: parseInt(data.estado_id),
                observaciones: data.observaciones.trim()
            };

            await onSubmit(formData);
            reset();

            // Triggear refresh automático después del submit exitoso
            triggerRefresh();
        } catch (error) {
            console.error('Form submit error:', error);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // Obtener color del estado
    const getEstadoColor = (estadoNombre) => {
        if (!estadoNombre) return 'gray';

        const nombre = estadoNombre.toLowerCase();
        if (nombre.includes('disponible')) return 'green';
        if (nombre.includes('mantenimiento') || nombre.includes('reparacion')) return 'yellow';
        if (nombre.includes('dañado') || nombre.includes('averiado')) return 'red';
        if (nombre.includes('retirado') || nombre.includes('baja')) return 'gray';
        return 'purple';
    };

    const estadoActual = estadosEquipo.find(e => e.id == equipo?.estado);
    const estadoNuevo = estadosEquipo.find(e => e.id == estadoSeleccionado);

    if (!equipo) return null;

    return (
        <Modal show={isOpen} onClose={handleClose} size="lg">
            <ModalHeader>
                Cambiar Estado del Equipo: {equipo.codigo_interno}
            </ModalHeader>
            <ModalBody>
                <div className="space-y-6">
                    {/* Información del equipo */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-gray-900 mb-3">Información del Equipo</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm font-medium text-gray-600">Código:</span>
                                <p className="text-gray-900 font-mono">{equipo.codigo_interno}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Modelo:</span>
                                <p className="text-gray-900">{equipo.modelo_nombre}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Estado Actual:</span>
                                <div className="mt-1">
                                    <Badge
                                        color={estadoActual ? getEstadoColor(estadoActual.nombre) : 'gray'}
                                        size="sm"
                                    >
                                        {estadoActual?.nombre || 'Sin Estado'}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Asignación:</span>
                                <div className="mt-1">
                                    <Badge color={equipo.esta_asignado ? 'blue' : 'green'} size="sm">
                                        {equipo.esta_asignado ? 'Asignado' : 'Disponible'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                        {/* Nuevo Estado */}
                        <div>
                            <Label htmlFor="estado_id" value="Nuevo Estado *" className="mb-2 block" />
                            <Select
                                id="estado_id"
                                {...register('estado_id', {
                                    required: 'Debe seleccionar un estado'
                                })}
                                color={errors.estado_id ? 'failure' : 'gray'}
                            >
                                <option value="">Seleccionar nuevo estado...</option>
                                {estadosEquipo.map((estado) => (
                                    <option key={estado.id} value={estado.id}>
                                        {estado.nombre}
                                        {estado.descripcion && ` - ${estado.descripcion}`}
                                    </option>
                                ))}
                            </Select>
                            {errors.estado_id && (
                                <HelperText color="failure" className="mt-1">
                                    {errors.estado_id.message}
                                </HelperText>
                            )}
                        </div>

                        {/* Vista previa del cambio */}
                        {estadoNuevo && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h5 className="text-sm font-medium text-blue-800 mb-2">Vista Previa del Cambio:</h5>
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-600 mb-1">Estado Actual</div>
                                        <Badge
                                            color={estadoActual ? getEstadoColor(estadoActual.nombre) : 'gray'}
                                            size="sm"
                                        >
                                            {estadoActual?.nombre || 'Sin Estado'}
                                        </Badge>
                                    </div>
                                    <div className="text-blue-600">→</div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-600 mb-1">Nuevo Estado</div>
                                        <Badge
                                            color={getEstadoColor(estadoNuevo.nombre)}
                                            size="sm"
                                        >
                                            {estadoNuevo.nombre}
                                        </Badge>
                                    </div>
                                </div>
                                {estadoNuevo.descripcion && (
                                    <div className="mt-3">
                                        <div className="text-xs text-blue-700 font-medium">Descripción del estado:</div>
                                        <div className="text-sm text-blue-600">{estadoNuevo.descripcion}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Observaciones */}
                        <div>
                            <Label htmlFor="observaciones" value="Observaciones del Cambio" className="mb-2 block" />
                            <Textarea
                                id="observaciones"
                                placeholder="Motivo del cambio de estado, condiciones especiales, etc..."
                                rows={4}
                                {...register('observaciones', {
                                    maxLength: {
                                        value: 500,
                                        message: 'Las observaciones no pueden exceder 500 caracteres'
                                    }
                                })}
                                color={errors.observaciones ? 'failure' : 'gray'}
                            />
                            {errors.observaciones && (
                                <HelperText color="failure" className="mt-1">
                                    {errors.observaciones.message}
                                </HelperText>
                            )}
                            <HelperText className="mt-1">
                                Se agregará automáticamente la fecha y hora del cambio
                            </HelperText>
                        </div>

                        {/* Advertencias */}
                        {equipo.esta_asignado && estadoNuevo && !estadoNuevo.nombre.toLowerCase().includes('asignado') && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex">
                                    <div className="text-yellow-600">⚠️</div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">
                                            Advertencia
                                        </h3>
                                        <div className="mt-2 text-sm text-yellow-700">
                                            Este equipo está actualmente asignado a un servicio.
                                            Cambiar su estado podría afectar la prestación del servicio.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {estadoNuevo && estadoNuevo.nombre.toLowerCase().includes('dañado') && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex">
                                    <div className="text-red-600">🔧</div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">
                                            Estado de Daño
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            Al marcar este equipo como dañado, se retirará de la disponibilidad
                                            para nuevas asignaciones hasta que sea reparado.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                color="gray"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                color="blue"
                                disabled={loading || !estadoSeleccionado}
                            >
                                {loading ? 'Cambiando Estado...' : 'Cambiar Estado'}
                            </Button>
                        </div>
                    </form>
                </div>
            </ModalBody>
        </Modal>
    );
};

export default CambiarEstadoModal;