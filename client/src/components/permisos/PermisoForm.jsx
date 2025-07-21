// components/permisos/PermisoForm.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Label, TextInput, Select, Alert
} from 'flowbite-react';
import { HiExclamationTriangle } from 'react-icons/hi2';

const PermisoForm = ({
                         isOpen,
                         onClose,
                         permiso = null,
                         onSubmit,
                         loading = false,
                         recursosDisponibles = [],
                         accionesDisponibles = []
                     }) => {
    const [formErrors, setFormErrors] = useState({});
    const [showCustomRecurso, setShowCustomRecurso] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
        clearErrors
    } = useForm({
        defaultValues: {
            recurso: '',
            recurso_custom: '',
            accion: ''
        }
    });

    const recursoValue = watch('recurso');

    // Resetear formulario cuando cambia el permiso o se abre/cierra
    useEffect(() => {
        if (isOpen) {
            if (permiso) {
                // Modo edición
                console.log('🔧 Modo edición, cargando permiso:', permiso);

                // Verificar si el recurso existe en la lista
                const recursoExiste = recursosDisponibles.includes(permiso.recurso);

                if (recursoExiste) {
                    setValue('recurso', permiso.recurso);
                    setValue('recurso_custom', '');
                    setShowCustomRecurso(false);
                } else {
                    setValue('recurso', 'custom');
                    setValue('recurso_custom', permiso.recurso);
                    setShowCustomRecurso(true);
                }

                setValue('accion', permiso.accion);
            } else {
                // Modo creación
                console.log('➕ Modo creación');
                reset({
                    recurso: '',
                    recurso_custom: '',
                    accion: ''
                });
                setShowCustomRecurso(false);
            }

            // Limpiar errores
            setFormErrors({});
            clearErrors();
        }
    }, [isOpen, permiso, setValue, reset, clearErrors, recursosDisponibles]);

    // Manejar cambio de recurso
    useEffect(() => {
        if (recursoValue === 'custom') {
            setShowCustomRecurso(true);
        } else {
            setShowCustomRecurso(false);
            setValue('recurso_custom', '');
        }
    }, [recursoValue, setValue]);

    // Función para manejar errores del backend
    const handleBackendError = (error) => {
        console.error('❌ Error del backend:', error);

        if (error.response?.status === 400) {
            const errorData = error.response.data;

            // Errores de validación por campo
            const newFormErrors = {};

            if (errorData.recurso) {
                newFormErrors.recurso = Array.isArray(errorData.recurso)
                    ? errorData.recurso[0]
                    : errorData.recurso;
            }

            if (errorData.accion) {
                newFormErrors.accion = Array.isArray(errorData.accion)
                    ? errorData.accion[0]
                    : errorData.accion;
            }

            // Error de unicidad
            if (errorData.non_field_errors) {
                newFormErrors.general = Array.isArray(errorData.non_field_errors)
                    ? errorData.non_field_errors[0]
                    : errorData.non_field_errors;
            }

            setFormErrors(newFormErrors);
            console.log('Errores del formulario:', newFormErrors);
        }
    };

    // Función para enviar formulario
    const onFormSubmit = async (data) => {
        try {
            console.log('📝 Enviando formulario:', data);

            // Limpiar errores previos
            setFormErrors({});

            // Determinar el recurso final
            const recursoFinal = data.recurso === 'custom'
                ? data.recurso_custom.trim().toLowerCase()
                : data.recurso;

            // Validaciones frontend
            if (!recursoFinal) {
                setFormErrors({ recurso: 'El recurso es obligatorio' });
                return;
            }

            if (!data.accion) {
                setFormErrors({ accion: 'La acción es obligatoria' });
                return;
            }

            // Validar formato del recurso
            if (!/^[a-z0-9-_]+$/.test(recursoFinal)) {
                setFormErrors({
                    recurso: 'El recurso solo puede contener letras minúsculas, números, guiones y guiones bajos'
                });
                return;
            }

            const datosFinales = {
                recurso: recursoFinal,
                accion: data.accion
            };

            console.log('📤 Datos finales a enviar:', datosFinales);

            // Llamar función del padre con handler de errores
            await onSubmit(datosFinales, handleBackendError);

        } catch (error) {
            console.error('💥 Error en submit del formulario:', error);
            // El error ya fue manejado por handleBackendError
        }
    };

    const handleClose = () => {
        setFormErrors({});
        clearErrors();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal show={isOpen} onClose={handleClose} size="md">
            <ModalHeader>
                {permiso ? 'Editar Permiso' : 'Crear Nuevo Permiso'}
            </ModalHeader>

            <form onSubmit={handleSubmit(onFormSubmit)}>
                <ModalBody className="space-y-6">
                    {/* Error general */}
                    {formErrors.general && (
                        <Alert color="failure" icon={HiExclamationTriangle}>
                            <span className="font-medium">Error:</span> {formErrors.general}
                        </Alert>
                    )}

                    {/* Campo Recurso */}
                    <div>
                        <Label htmlFor="recurso" value="Recurso" />
                        <Select
                            id="recurso"
                            {...register('recurso', {
                                required: 'El recurso es obligatorio'
                            })}
                            color={errors.recurso || formErrors.recurso ? 'failure' : 'gray'}
                        >
                            <option value="">Seleccionar recurso...</option>
                            {recursosDisponibles.map((recurso) => (
                                <option key={recurso} value={recurso}>
                                    {recurso}
                                </option>
                            ))}
                            <option value="custom">+ Crear nuevo recurso</option>
                        </Select>

                        {(errors.recurso || formErrors.recurso) && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.recurso?.message || formErrors.recurso}
                            </p>
                        )}
                    </div>

                    {/* Campo Recurso Personalizado */}
                    {showCustomRecurso && (
                        <div>
                            <Label htmlFor="recurso_custom" value="Nombre del nuevo recurso" />
                            <TextInput
                                id="recurso_custom"
                                placeholder="ej: contratos, reportes, configuracion"
                                {...register('recurso_custom', {
                                    required: showCustomRecurso ? 'El nombre del recurso es obligatorio' : false,
                                    pattern: {
                                        value: /^[a-z0-9-_]+$/,
                                        message: 'Solo letras minúsculas, números, guiones y guiones bajos'
                                    }
                                })}
                                color={errors.recurso_custom || formErrors.recurso ? 'failure' : 'gray'}
                            />

                            {(errors.recurso_custom || formErrors.recurso) && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.recurso_custom?.message || formErrors.recurso}
                                </p>
                            )}

                            <p className="mt-1 text-xs text-gray-500">
                                Use solo letras minúsculas, números, guiones (-) y guiones bajos (_)
                            </p>
                        </div>
                    )}

                    {/* Campo Acción */}
                    <div>
                        <Label htmlFor="accion" value="Acción" />
                        <Select
                            id="accion"
                            {...register('accion', {
                                required: 'La acción es obligatoria'
                            })}
                            color={errors.accion || formErrors.accion ? 'failure' : 'gray'}
                        >
                            <option value="">Seleccionar acción...</option>
                            {accionesDisponibles.map((accion) => (
                                <option key={accion} value={accion}>
                                    {accion.charAt(0).toUpperCase() + accion.slice(1)}
                                </option>
                            ))}
                        </Select>

                        {(errors.accion || formErrors.accion) && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.accion?.message || formErrors.accion}
                            </p>
                        )}
                    </div>

                    {/* Información adicional */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">
                            Información sobre Permisos
                        </h4>
                        <ul className="text-xs text-blue-700 space-y-1">
                            <li><strong>Crear:</strong> Permite crear nuevos elementos</li>
                            <li><strong>Leer:</strong> Permite ver y consultar elementos</li>
                            <li><strong>Actualizar:</strong> Permite modificar elementos existentes</li>
                            <li><strong>Eliminar:</strong> Permite eliminar elementos</li>
                        </ul>
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button
                        type="submit"
                        color="blue"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : (permiso ? 'Actualizar' : 'Crear')}
                    </Button>
                    <Button
                        color="gray"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
};

export default PermisoForm;