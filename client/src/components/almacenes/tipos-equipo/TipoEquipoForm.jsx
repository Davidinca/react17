import React, { useEffect } from 'react';
import {
    Modal, ModalBody, ModalHeader, Button, Label,
    TextInput, Textarea, HelperText
} from 'flowbite-react';
import { useForm } from 'react-hook-form';

const TipoEquipoForm = ({ isOpen, onClose, tipoEquipo = null, onSubmit, loading = false }) => {
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
        console.log('TipoEquipoForm - isOpen:', isOpen, 'tipoEquipo:', tipoEquipo);

        if (isOpen) {
            if (tipoEquipo) {
                console.log('Reseteando form con tipo equipo ID:', tipoEquipo.id);
                reset({
                    nombre: tipoEquipo.nombre || '',
                    descripcion: tipoEquipo.descripcion || ''
                });
            } else {
                console.log('Reseteando form para nuevo tipo equipo');
                reset({
                    nombre: '',
                    descripcion: ''
                });
            }
        }
    }, [tipoEquipo, reset, isOpen]);

    // CORREGIDO: onFormSubmit sin reset ni close
    const onFormSubmit = async (data) => {
        try {
            console.log('Form submit iniciado con data:', data);
            console.log('TipoEquipo actual:', tipoEquipo);

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

    return (
        <Modal show={isOpen} onClose={handleClose} size="lg">
            <ModalHeader>
                {tipoEquipo ? `Editar Tipo de Equipo - ${tipoEquipo.nombre}` : 'Nuevo Tipo de Equipo'}
            </ModalHeader>
            <ModalBody>
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    {/* Nombre */}
                    <div>
                        <Label htmlFor="nombre" value="Nombre *" className="mb-2 block" />
                        <TextInput
                            id="nombre"
                            type="text"
                            placeholder="Ej: ONU, Router, Switch, ONT..."
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

                    {/* Descripción */}
                    <div>
                        <Label htmlFor="descripcion" value="Descripción" className="mb-2 block" />
                        <Textarea
                            id="descripcion"
                            placeholder="Describe las características y uso del tipo de equipo..."
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
                    </div>

                    {/* Información adicional para edición */}
                    {tipoEquipo && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>
                                    <span className="font-semibold">ID del Tipo:</span> {tipoEquipo.id}
                                </p>
                                <p>
                                    <span className="font-semibold">Creado:</span> {new Date(tipoEquipo.created_at).toLocaleDateString('es-BO')}
                                </p>
                                {tipoEquipo.updated_at && (
                                    <p>
                                        <span className="font-semibold">Última modificación:</span> {new Date(tipoEquipo.updated_at).toLocaleDateString('es-BO')}
                                    </p>
                                )}
                                {tipoEquipo.modelos_count !== undefined && (
                                    <p>
                                        <span className="font-semibold">Modelos asociados:</span> {tipoEquipo.modelos_count}
                                    </p>
                                )}
                                {tipoEquipo.equipos_count !== undefined && (
                                    <p>
                                        <span className="font-semibold">Equipos registrados:</span> {tipoEquipo.equipos_count}
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
                            {loading ? 'Procesando...' : (tipoEquipo ? 'Actualizar' : 'Crear')}
                        </Button>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    );
};

export default TipoEquipoForm;