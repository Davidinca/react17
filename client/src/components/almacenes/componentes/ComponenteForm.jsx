import React, { useEffect } from 'react';
import {
    Modal, ModalBody, ModalHeader, Button, Label,
    TextInput, Textarea, HelperText
} from 'flowbite-react';
import { useForm } from 'react-hook-form';
import { Permiso} from "../../../api/permisos.js";

const ComponenteForm = ({ isOpen, onClose, componente = null, onSubmit, loading = false }) => {
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
        console.log('ComponenteForm - isOpen:', isOpen, 'componente:', componente);

        if (isOpen) {
            if (componente) {
                console.log('Reseteando form con componente ID:', componente.id);
                reset({
                    nombre: componente.nombre || '',
                    descripcion: componente.descripcion || ''
                });
            } else {
                console.log('Reseteando form para nuevo componente');
                reset({
                    nombre: '',
                    descripcion: ''
                });
            }
        }
    }, [componente, reset, isOpen]);

    // CORREGIDO: onFormSubmit sin reset ni close
    const onFormSubmit = async (data) => {
        try {
            console.log('Form submit iniciado con data:', data);
            console.log('Componente actual:', componente);

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
                {componente ? `Editar Componente - ${componente.nombre}` : 'Nuevo Componente'}
            </ModalHeader>
            <ModalBody>
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    {/* Nombre */}
                    <div>
                        <Label htmlFor="nombre" value="Nombre del Componente *" className="mb-2 block" />
                        <TextInput
                            id="nombre"
                            type="text"
                            placeholder="Ej: Puerto Ethernet, Antena WiFi, Procesador, Memoria RAM..."
                            {...register('nombre', {
                                required: 'El nombre es requerido',
                                minLength: {
                                    value: 2,
                                    message: 'El nombre debe tener al menos 2 caracteres'
                                },
                                maxLength: {
                                    value: 100,
                                    message: 'El nombre no puede exceder 100 caracteres'
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
                            placeholder="Describe las características técnicas, especificaciones o función del componente..."
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
                            Incluye especificaciones técnicas, velocidad, capacidad, etc.
                        </div>
                    </div>

                    {/* Información adicional para edición */}
                    {componente && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>
                                    <span className="font-semibold">ID del Componente:</span> {componente.id}
                                </p>
                                <p>
                                    <span className="font-semibold">Creado:</span> {new Date(componente.created_at).toLocaleDateString('es-BO')}
                                </p>
                                {componente.updated_at && (
                                    <p>
                                        <span className="font-semibold">Última modificación:</span> {new Date(componente.updated_at).toLocaleDateString('es-BO')}
                                    </p>
                                )}
                                {componente.modelos_usando !== undefined && (
                                    <p>
                                        <span className="font-semibold">Usado en modelos:</span> {componente.modelos_usando}
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
                            {loading ? 'Procesando...' : (componente ? 'Actualizar' : 'Crear')}
                        </Button>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    );
};

export default ComponenteForm;