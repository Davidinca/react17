import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal, ModalBody, ModalFooter, ModalHeader, Button, Label, TextInput, Textarea, HelperText } from 'flowbite-react';
import { useForm } from 'react-hook-form';

const MarcaForm = ({ isOpen, onClose, marca = null, onSubmit, loading = false }) => {
    const [searchParams, setSearchParams] = useSearchParams();

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

    // Función para triggerar refresh automático
    const triggerRefresh = () => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('refresh', Date.now().toString());
        setSearchParams(currentParams);
    };

    useEffect(() => {
        if (marca) {
            reset({
                nombre: marca.nombre || '',
                descripcion: marca.descripcion || ''
            });
        } else {
            reset({
                nombre: '',
                descripcion: ''
            });
        }
    }, [marca, reset, isOpen]);

    const onFormSubmit = async (data) => {
        try {
            await onSubmit(data);
            reset();
            onClose();

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

    return (
        <Modal show={isOpen} onClose={handleClose} size="md">
            <ModalHeader>
                {marca ? 'Editar Marca' : 'Nueva Marca'}
            </ModalHeader>
            <ModalBody>
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    <div>
                        <Label htmlFor="nombre" value="Nombre de la Marca *" className="mb-2 block" />
                        <TextInput
                            id="nombre"
                            type="text"
                            placeholder="Ej: ZTE, Huawei, Nokia..."
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

                    <div>
                        <Label htmlFor="descripcion" value="Descripción" className="mb-2 block" />
                        <Textarea
                            id="descripcion"
                            placeholder="Descripción opcional de la marca..."
                            rows={3}
                            {...register('descripcion', {
                                maxLength: {
                                    value: 500,
                                    message: 'La descripción no puede exceder 500 caracteres'
                                }
                            })}
                        />
                        {errors.descripcion && (
                            <HelperText color="failure" className="mt-1">
                                {errors.descripcion.message}
                            </HelperText>
                        )}
                    </div>

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
                            {loading ? 'Procesando...' : (marca ? 'Actualizar' : 'Crear')}
                        </Button>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    );
};

export default MarcaForm;