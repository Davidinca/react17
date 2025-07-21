import React, { useEffect } from 'react';
import {
    Modal, ModalBody, ModalHeader, Button, Label,
    TextInput, Textarea, HelperText
} from 'flowbite-react';
import { useForm } from 'react-hook-form';

const EstadoEquipoForm = ({ isOpen, onClose, estado = null, onSubmit, loading = false }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        defaultValues: {
            nombre: '',
            descripcion: ''
        }
    });

    // CORREGIDO: UseEffect mejorado con mejor logging
    useEffect(() => {
        console.log('EstadoEquipoForm - isOpen:', isOpen, 'estado:', estado);

        if (isOpen) {
            if (estado) {
                console.log('Reseteando form con estado ID:', estado.id);
                reset({
                    nombre: estado.nombre || '',
                    descripcion: estado.descripcion || ''
                });
            } else {
                console.log('Reseteando form para nuevo estado');
                reset({
                    nombre: '',
                    descripcion: ''
                });
            }
        }
    }, [estado, reset, isOpen]);

    // CORREGIDO: onFormSubmit sin reset ni close
    const onFormSubmit = async (data) => {
        try {
            console.log('Form submit iniciado con data:', data);
            console.log('Estado actual:', estado);

            // NO resetear ni cerrar aquí - dejar que el padre maneje
            await onSubmit(data);

        } catch (error) {
            console.error('Form submit error:', error);
        }
    };

    // CORREGIDO: handleClose independiente
    const handleClose = () => {
        console.log('Cerrando modal y reseteando form');
        reset({
            nombre: '',
            descripcion: ''
        });
        onClose();
    };

    // Estados sugeridos
    const estadosSugeridos = [
        'Disponible',
        'Asignado',
        'En Mantenimiento',
        'En Reparación',
        'Dañado',
        'Retirado',
        'En Tránsito',
        'Reservado'
    ];

    return (
        <Modal show={isOpen} onClose={handleClose} size="lg">
            <ModalHeader>
                {estado ? `Editar Estado - ${estado.nombre}` : 'Nuevo Estado de Equipo'}
            </ModalHeader>
            <ModalBody>
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    {/* Nombre */}
                    <div>
                        <Label htmlFor="nombre" value="Nombre del Estado *" className="mb-2 block" />
                        <TextInput
                            id="nombre"
                            type="text"
                            placeholder="Ej: Disponible, Asignado, En Mantenimiento..."
                            {...register('nombre', {
                                required: 'El nombre es requerido',
                                minLength: {
                                    value: 2,
                                    message: 'El nombre debe tener al menos 2 caracteres'
                                },
                                maxLength: {
                                    value: 50,
                                    message: 'El nombre no puede exceder 50 caracteres'
                                }
                            })}
                            color={errors.nombre ? 'failure' : 'gray'}
                        />
                        {errors.nombre && (
                            <HelperText color="failure" className="mt-1">
                                {errors.nombre.message}
                            </HelperText>
                        )}
                    </div>

                    {/* Estados sugeridos */}
                    {!estado && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-blue-800 mb-2">Estados sugeridos:</p>
                            <div className="flex flex-wrap gap-2">
                                {estadosSugeridos.map((sugerido, index) => (
                                    <button
                                        key={`sugerido-${index}-${sugerido}`}
                                        type="button"
                                        onClick={() => {
                                            reset({ nombre: sugerido, descripcion: '' });
                                        }}
                                        className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
                                    >
                                        {sugerido}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Descripción */}
                    <div>
                        <Label htmlFor="descripcion" value="Descripción" className="mb-2 block" />
                        <Textarea
                            id="descripcion"
                            placeholder="Describe cuándo se usa este estado y qué implica para el equipo..."
                            rows={4}
                            {...register('descripcion', {
                                maxLength: {
                                    value: 500,
                                    message: 'La descripción no puede exceder 500 caracteres'
                                }
                            })}
                            color={errors.descripcion ? 'failure' : 'gray'}
                        />
                        {errors.descripcion && (
                            <HelperText color="failure" className="mt-1">
                                {errors.descripcion.message}
                            </HelperText>
                        )}
                        <div className="mt-1 text-xs text-gray-500">
                            Explica las condiciones de uso, disponibilidad o restricciones de este estado.
                        </div>
                    </div>

                    {/* Información adicional para edición */}
                    {estado && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>
                                    <span className="font-semibold">ID del Estado:</span> {estado.id}
                                </p>
                                <p>
                                    <span className="font-semibold">Creado:</span> {new Date(estado.created_at).toLocaleDateString('es-BO')}
                                </p>
                                {estado.updated_at && (
                                    <p>
                                        <span className="font-semibold">Última modificación:</span> {new Date(estado.updated_at).toLocaleDateString('es-BO')}
                                    </p>
                                )}
                                {estado.equipos_count !== undefined && (
                                    <p>
                                        <span className="font-semibold">Equipos con este estado:</span> {estado.equipos_count}
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
                            disabled={loading}
                        >
                            {loading ? 'Procesando...' : (estado ? 'Actualizar' : 'Crear')}
                        </Button>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    );
};

export default EstadoEquipoForm;