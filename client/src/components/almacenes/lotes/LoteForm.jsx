import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Modal, ModalBody, ModalHeader, Button, Label,
    TextInput, Textarea, Select, HelperText, Card
} from 'flowbite-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { HiPlus, HiTrash } from 'react-icons/hi2';
import { useMarcas, useTiposEquipo, useModelosWithFilters } from '../../../hooks/useAlmacenes';
import { useTiposServicioContratos } from '../../../hooks/useContratos';

const LoteForm = ({ isOpen, onClose, lote = null, onSubmit, loading = false }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Estados para datos de referencia
    const { marcas, fetchMarcas } = useMarcas();
    const { data: tiposEquipo, fetchData: fetchTiposEquipo } = useTiposEquipo();
    const { modelos, fetchModelos } = useModelosWithFilters();

    // Hook para tipos de servicio de contratos
    const {
        data: tiposServicio,
        loading: loadingTiposServicio,
        fetchData: fetchTiposServicio
    } = useTiposServicioContratos();

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        formState: { errors }
    } = useForm({
        defaultValues: {
            numero_lote: '',
            proveedor: '',
            tipo_servicio: '',
            observaciones: '',
            detalles: [{ modelo: '', cantidad: 1 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'detalles'
    });

    // Función para triggear refresh automático
    const triggerRefresh = () => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('refresh', Date.now().toString());
        setSearchParams(currentParams);
    };

    // Cargar datos necesarios
    useEffect(() => {
        if (isOpen) {
            fetchMarcas();
            fetchTiposEquipo();
            fetchModelos();
            fetchTiposServicio();
        }
    }, [isOpen]);

    // Auto-refresh cuando cambian los searchParams
    useEffect(() => {
        const refreshParam = searchParams.get('refresh');
        if (refreshParam && isOpen) {
            fetchMarcas();
            fetchTiposEquipo();
            fetchModelos();
            fetchTiposServicio();
        }
    }, [searchParams, isOpen, fetchMarcas, fetchTiposEquipo, fetchModelos, fetchTiposServicio]);

    // UseEffect mejorado con dependencias correctas
    useEffect(() => {
        console.log('LoteForm - isOpen:', isOpen, 'lote:', lote);

        if (isOpen && lote) {
            console.log('Reseteando form con lote ID:', lote.id);
            console.log('Detalles del lote:', lote.detalles);

            // Asegurar que los detalles tengan los valores correctos
            const detallesFormateados = lote.detalles && lote.detalles.length > 0
                ? lote.detalles.map(d => ({
                    modelo: d.modelo ? String(d.modelo) : '', // Convertir a string para Select
                    cantidad: d.cantidad ? Number(d.cantidad) : 1 // Asegurar que sea número
                }))
                : [{ modelo: '', cantidad: 1 }];

            console.log('Detalles formateados:', detallesFormateados);

            reset({
                numero_lote: lote.numero_lote || '',
                proveedor: lote.proveedor || '',
                tipo_servicio: lote.tipo_servicio ? String(lote.tipo_servicio) : '', // Convertir a string
                observaciones: lote.observaciones || '',
                detalles: detallesFormateados
            });
        } else if (isOpen && !lote) {
            console.log('Reseteando form para nuevo lote');
            reset({
                numero_lote: '',
                proveedor: '',
                tipo_servicio: '',
                observaciones: '',
                detalles: [{ modelo: '', cantidad: 1 }]
            });
        }
    }, [lote, reset, isOpen]);

    // Generar número de lote automático
    const generateLoteNumber = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
        const loteNumber = `L${year}${month}${day}-${time}`;
        setValue('numero_lote', loteNumber);
    };

    // onFormSubmit con mejor validación de tipos de datos
    const onFormSubmit = async (data) => {
        try {
            console.log('Form submit iniciado con data:', data);
            console.log('Lote actual:', lote);

            // Validar que hay al menos un detalle
            if (!data.detalles || data.detalles.length === 0) {
                console.error('No hay detalles válidos');
                return;
            }

            // Filtrar detalles válidos con validación mejorada
            const detallesValidos = data.detalles.filter(d => {
                const modeloValido = d.modelo && d.modelo !== '';
                const cantidadValida = d.cantidad && parseInt(d.cantidad) > 0;
                console.log(`Detalle validado - Modelo: ${d.modelo}, Cantidad: ${d.cantidad}, Válido: ${modeloValido && cantidadValida}`);
                return modeloValido && cantidadValida;
            });

            if (detallesValidos.length === 0) {
                console.error('No hay detalles válidos después del filtro');
                return;
            }

            const formData = {
                numero_lote: data.numero_lote.trim(),
                proveedor: data.proveedor.trim(),
                tipo_servicio: parseInt(data.tipo_servicio), // Asegurar conversión a número
                observaciones: data.observaciones ? data.observaciones.trim() : '',
                detalles: detallesValidos.map(d => ({
                    modelo: parseInt(d.modelo), // Asegurar conversión a número
                    cantidad: parseInt(d.cantidad) // Asegurar conversión a número
                }))
            };

            console.log('Enviando formData final:', formData);
            console.log('Detalles procesados:', formData.detalles);

            await onSubmit(formData);

            // Reset y close después del submit exitoso
            reset({
                numero_lote: '',
                proveedor: '',
                tipo_servicio: '',
                observaciones: '',
                detalles: [{ modelo: '', cantidad: 1 }]
            });
            onClose();

            // Triggear refresh automático después del submit exitoso
            triggerRefresh();

        } catch (error) {
            console.error('Form submit error:', error);
        }
    };

    // handleClose independiente
    const handleClose = () => {
        console.log('Cerrando modal y reseteando form');
        reset({
            numero_lote: '',
            proveedor: '',
            tipo_servicio: '',
            observaciones: '',
            detalles: [{ modelo: '', cantidad: 1 }]
        });
        onClose();
    };

    const addDetalle = () => {
        append({ modelo: '', cantidad: 1 });
    };

    const removeDetalle = (index) => {
        if (fields.length > 1) {
            remove(index);
        }
    };

    // Calcular total de equipos
    const watchedDetalles = watch('detalles');
    const totalEquipos = watchedDetalles?.reduce((sum, detalle) => {
        return sum + (parseInt(detalle.cantidad) || 0);
    }, 0) || 0;

    // Obtener información del modelo seleccionado para mostrar detalles
    const getModeloInfo = (modeloId) => {
        if (!modeloId || !modelos) return null;
        return modelos.find(m => m.id === parseInt(modeloId));
    };

    return (
        <Modal show={isOpen} onClose={handleClose} size="4xl">
            <ModalHeader>
                {lote ? `Editar Lote - ${lote.numero_lote}` : 'Nuevo Lote'}
            </ModalHeader>
            <ModalBody>
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                    {/* Información básica del lote */}
                    <Card>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Lote</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Número de Lote */}
                            <div>
                                <Label htmlFor="numero_lote" value="Número de Lote *" className="mb-2 block" />
                                <div className="flex gap-2">
                                    <TextInput
                                        id="numero_lote"
                                        type="text"
                                        placeholder="Ej: L20241201-1430"
                                        {...register('numero_lote', {
                                            required: 'El número de lote es requerido',
                                            minLength: {
                                                value: 3,
                                                message: 'El número debe tener al menos 3 caracteres'
                                            }
                                        })}
                                        color={errors.numero_lote ? 'failure' : 'gray'}
                                        className="flex-1"
                                    />
                                    {!lote && (
                                        <Button
                                            type="button"
                                            color="gray"
                                            size="sm"
                                            onClick={generateLoteNumber}
                                        >
                                            Auto
                                        </Button>
                                    )}
                                </div>
                                {errors.numero_lote && (
                                    <HelperText color="failure" className="mt-1">
                                        {errors.numero_lote.message}
                                    </HelperText>
                                )}
                            </div>

                            {/* Proveedor */}
                            <div>
                                <Label htmlFor="proveedor" value="Proveedor *" className="mb-2 block" />
                                <TextInput
                                    id="proveedor"
                                    type="text"
                                    placeholder="Nombre del proveedor o distribuidor"
                                    {...register('proveedor', {
                                        required: 'El proveedor es requerido',
                                        minLength: {
                                            value: 2,
                                            message: 'El proveedor debe tener al menos 2 caracteres'
                                        }
                                    })}
                                    color={errors.proveedor ? 'failure' : 'gray'}
                                />
                                {errors.proveedor && (
                                    <HelperText color="failure" className="mt-1">
                                        {errors.proveedor.message}
                                    </HelperText>
                                )}
                            </div>

                            {/* Tipo de Servicio */}
                            <div className="md:col-span-2">
                                <Label htmlFor="tipo_servicio" value="Tipo de Servicio *" className="mb-2 block" />
                                <Select
                                    id="tipo_servicio"
                                    {...register('tipo_servicio', {
                                        required: 'El tipo de servicio es requerido'
                                    })}
                                    color={errors.tipo_servicio ? 'failure' : 'gray'}
                                    disabled={loadingTiposServicio}
                                >
                                    <option value="">
                                        {loadingTiposServicio ? 'Cargando tipos de servicio...' : 'Seleccionar tipo de servicio...'}
                                    </option>
                                    {(tiposServicio || []).map((tipo) => (
                                        <option key={`tipo-servicio-${tipo.id}`} value={tipo.id}>
                                            {tipo.nombre}
                                            {tipo.descripcion && ` - ${tipo.descripcion}`}
                                        </option>
                                    ))}
                                </Select>
                                {errors.tipo_servicio && (
                                    <HelperText color="failure" className="mt-1">
                                        {errors.tipo_servicio.message}
                                    </HelperText>
                                )}
                                {loadingTiposServicio && (
                                    <HelperText className="mt-1">
                                        <div className="flex items-center">
                                            <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full mr-2"></div>
                                            Cargando tipos de servicio...
                                        </div>
                                    </HelperText>
                                )}
                            </div>

                            {/* Observaciones */}
                            <div className="md:col-span-2">
                                <Label htmlFor="observaciones" value="Observaciones" className="mb-2 block" />
                                <Textarea
                                    id="observaciones"
                                    placeholder="Notas adicionales sobre el lote..."
                                    rows={3}
                                    {...register('observaciones')}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Detalles del lote */}
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Detalles del Lote
                                <span className="ml-2 text-sm text-gray-500">
                                    (Total: {totalEquipos} equipos)
                                </span>
                            </h3>
                            <Button
                                type="button"
                                color="blue"
                                size="sm"
                                onClick={addDetalle}
                            >
                                <HiPlus className="mr-2 h-4 w-4" />
                                Agregar Modelo
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, index) => {
                                const watchedModelo = watch(`detalles.${index}.modelo`);
                                const modeloInfo = getModeloInfo(watchedModelo);
                                const watchedCantidad = watch(`detalles.${index}.cantidad`);

                                return (
                                    <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700">
                                                    Detalle #{index + 1}
                                                </h4>
                                                {modeloInfo && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {modeloInfo.marca_nombre} • Código: {modeloInfo.codigo_modelo}
                                                        {watchedCantidad && ` • Subtotal: ${parseInt(watchedCantidad) || 0} equipos`}
                                                    </p>
                                                )}
                                            </div>
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    color="red"
                                                    size="xs"
                                                    onClick={() => removeDetalle(index)}
                                                    title="Eliminar detalle"
                                                >
                                                    <HiTrash className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Modelo */}
                                            <div className="md:col-span-2">
                                                <Label htmlFor={`detalles.${index}.modelo`} value="Modelo *" className="mb-2 block" />
                                                <Select
                                                    id={`detalles.${index}.modelo`}
                                                    {...register(`detalles.${index}.modelo`, {
                                                        required: 'El modelo es requerido'
                                                    })}
                                                    color={errors.detalles?.[index]?.modelo ? 'failure' : 'gray'}
                                                >
                                                    <option value="">Seleccionar modelo...</option>
                                                    {(modelos || []).map((modelo) => (
                                                        <option key={`modelo-${modelo.id}`} value={modelo.id}>
                                                            {modelo.marca_nombre} {modelo.nombre} - Código: {modelo.codigo_modelo}
                                                        </option>
                                                    ))}
                                                </Select>
                                                {errors.detalles?.[index]?.modelo && (
                                                    <HelperText color="failure" className="mt-1">
                                                        {errors.detalles[index].modelo.message}
                                                    </HelperText>
                                                )}
                                            </div>

                                            {/* Cantidad */}
                                            <div>
                                                <Label htmlFor={`detalles.${index}.cantidad`} value="Cantidad *" className="mb-2 block" />
                                                <TextInput
                                                    id={`detalles.${index}.cantidad`}
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    placeholder="1"
                                                    {...register(`detalles.${index}.cantidad`, {
                                                        required: 'La cantidad es requerida',
                                                        min: {
                                                            value: 1,
                                                            message: 'La cantidad debe ser mayor a 0'
                                                        },
                                                        max: {
                                                            value: 10000,
                                                            message: 'La cantidad no puede exceder 10,000'
                                                        },
                                                        valueAsNumber: true
                                                    })}
                                                    color={errors.detalles?.[index]?.cantidad ? 'failure' : 'gray'}
                                                />
                                                {errors.detalles?.[index]?.cantidad && (
                                                    <HelperText color="failure" className="mt-1">
                                                        {errors.detalles[index].cantidad.message}
                                                    </HelperText>
                                                )}
                                            </div>
                                        </div>

                                        {/* Información adicional del modelo seleccionado */}
                                        {modeloInfo && (
                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                <div className="text-sm text-blue-800">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        <div>
                                                            <span className="font-medium">Marca:</span> {modeloInfo.marca_nombre}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Tipo:</span> {modeloInfo.tipo_equipo_nombre}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Código:</span> {modeloInfo.codigo_modelo}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Equipos:</span> {modeloInfo.equipos_count || 0} registrados
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {fields.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500 mb-4">No hay detalles agregados</p>
                                <Button
                                    type="button"
                                    color="blue"
                                    onClick={addDetalle}
                                >
                                    <HiPlus className="mr-2 h-4 w-4" />
                                    Agregar Primer Modelo
                                </Button>
                            </div>
                        )}

                        {/* Resumen del lote */}
                        {fields.length > 0 && totalEquipos > 0 && (
                            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Resumen del Lote:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                    <div>
                                        <span className="font-medium">Modelos diferentes:</span> {fields.filter(f => watch(`detalles.${fields.indexOf(f)}.modelo`)).length}
                                    </div>
                                    <div>
                                        <span className="font-medium">Total equipos:</span> {totalEquipos}
                                    </div>
                                    <div>
                                        <span className="font-medium">Promedio por modelo:</span> {Math.round(totalEquipos / fields.length)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Información adicional para edición */}
                    {lote && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Información del Registro:</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>
                                    <span className="font-semibold">ID del Lote:</span> {lote.id}
                                </p>
                                <p>
                                    <span className="font-semibold">Creado:</span> {new Date(lote.created_at).toLocaleDateString('es-BO')}
                                </p>
                                {lote.updated_at && (
                                    <p>
                                        <span className="font-semibold">Última modificación:</span> {new Date(lote.updated_at).toLocaleDateString('es-BO')}
                                    </p>
                                )}
                                {lote.equipos_registrados !== undefined && (
                                    <p>
                                        <span className="font-semibold">Progreso de registro:</span> {lote.equipos_registrados} de {lote.cantidad_total} equipos
                                        ({lote.cantidad_total > 0 ? Math.round((lote.equipos_registrados / lote.cantidad_total) * 100) : 0}%)
                                    </p>
                                )}
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
                            disabled={loading || fields.length === 0 || totalEquipos === 0}
                        >
                            {loading ? 'Procesando...' : (lote ? 'Actualizar' : 'Crear')}
                        </Button>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    );
};

export default LoteForm;