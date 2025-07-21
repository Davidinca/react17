// components/usuarios/UsuarioForm.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Label, TextInput, Select, Alert, Card
} from 'flowbite-react';
import { HiExclamationTriangle, HiInformationCircle } from 'react-icons/hi2';

const UsuarioForm = ({
                         isOpen,
                         onClose,
                         usuario = null,
                         onSubmit,
                         loading = false,
                         rolesDisponibles = []
                     }) => {
    const [formErrors, setFormErrors] = useState({});

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        reset,
        clearErrors
    } = useForm({
        defaultValues: {
            nombres: '',
            apellidopaterno: '',
            apellidomaterno: '',
            rol: ''
        }
    });

    // Resetear formulario cuando cambia el usuario o se abre/cierra
    useEffect(() => {
        if (isOpen) {
            if (usuario) {
                // Modo edición
                console.log('🔧 Modo edición, cargando usuario:', usuario);

                setValue('nombres', usuario.nombres || '');
                setValue('apellidopaterno', usuario.apellidopaterno || '');
                setValue('apellidomaterno', usuario.apellidomaterno || '');
                setValue('rol', usuario.rol?.id || usuario.rol || '');
            } else {
                // Modo creación
                console.log('➕ Modo creación');
                reset({
                    nombres: '',
                    apellidopaterno: '',
                    apellidomaterno: '',
                    rol: ''
                });
            }

            // Limpiar errores
            setFormErrors({});
            clearErrors();
        }
    }, [isOpen, usuario, setValue, reset, clearErrors]);

    // Función para manejar errores del backend
    const handleBackendError = (error) => {
        console.error('❌ Error del backend:', error);

        if (error.response?.status === 400) {
            const errorData = error.response.data;

            // Errores de validación por campo
            const newFormErrors = {};

            if (errorData.nombres) {
                newFormErrors.nombres = Array.isArray(errorData.nombres)
                    ? errorData.nombres[0]
                    : errorData.nombres;
            }

            if (errorData.apellidopaterno) {
                newFormErrors.apellidopaterno = Array.isArray(errorData.apellidopaterno)
                    ? errorData.apellidopaterno[0]
                    : errorData.apellidopaterno;
            }

            if (errorData.apellidomaterno) {
                newFormErrors.apellidomaterno = Array.isArray(errorData.apellidomaterno)
                    ? errorData.apellidomaterno[0]
                    : errorData.apellidomaterno;
            }

            if (errorData.rol) {
                newFormErrors.rol = Array.isArray(errorData.rol)
                    ? errorData.rol[0]
                    : errorData.rol;
            }

            // Error general
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
            console.log('📝 Datos del formulario antes de procesar:', data);

            // Limpiar errores previos
            setFormErrors({});

            // Validaciones frontend
            if (!data.nombres?.trim()) {
                setFormErrors({ nombres: 'Los nombres son obligatorios' });
                return;
            }

            if (!data.apellidopaterno?.trim()) {
                setFormErrors({ apellidopaterno: 'El apellido paterno es obligatorio' });
                return;
            }

            if (!data.apellidomaterno?.trim()) {
                setFormErrors({ apellidomaterno: 'El apellido materno es obligatorio' });
                return;
            }

            if (!data.rol) {
                setFormErrors({ rol: 'El rol es obligatorio' });
                return;
            }

            const datosFinales = {
                nombres: data.nombres.trim(),
                apellidopaterno: data.apellidopaterno.trim(),
                apellidomaterno: data.apellidomaterno.trim(),
                rol: parseInt(data.rol, 10) // Asegurar que sea número entero
            };

            console.log('📤 Datos finales a enviar:', datosFinales);
            console.log('📋 Tipo del rol:', typeof datosFinales.rol, datosFinales.rol);

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
        <Modal show={isOpen} onClose={handleClose} size="lg">
            <ModalHeader>
                {usuario ? `Editar Usuario - ${usuario.nombre_completo || usuario.nombres}` : 'Crear Usuario Manual'}
            </ModalHeader>

            <form onSubmit={handleSubmit(onFormSubmit)}>
                <ModalBody className="space-y-6">
                    {/* Error general */}
                    {formErrors.general && (
                        <Alert color="failure" icon={HiExclamationTriangle}>
                            <span className="font-medium">Error:</span> {formErrors.general}
                        </Alert>
                    )}

                    {/* Información sobre usuarios manuales */}
                    {!usuario && (
                        <Alert color="info" icon={HiInformationCircle}>
                            <div>
                                <span className="font-medium">Usuario Manual:</span>
                                <ul className="mt-1 list-disc list-inside text-sm">
                                    <li>Se generará automáticamente un código COTEL ≥ 9000</li>
                                    <li>La contraseña inicial será igual al código COTEL generado</li>
                                    <li>El usuario deberá cambiar su contraseña en el primer login</li>
                                </ul>
                            </div>
                        </Alert>
                    )}

                    {/* Información del usuario en edición */}
                    {usuario && (
                        <Card>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-600">Código COTEL:</span>
                                    <p className="text-gray-900">{usuario.codigocotel}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-600">Tipo:</span>
                                    <p className="text-gray-900">
                                        {usuario.codigocotel >= 9000 ? 'Usuario Manual' : 'Usuario Migrado'}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-600">Estado:</span>
                                    <p className={`${usuario.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                        {usuario.is_active ? 'Activo' : 'Inactivo'}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-600">Contraseña:</span>
                                    <p className={`${usuario.password_changed ? 'text-green-600' : 'text-orange-600'}`}>
                                        {usuario.password_changed ? 'Actualizada' : 'Requiere cambio'}
                                    </p>
                                </div>
                                {usuario.fecha_creacion && (
                                    <div className="md:col-span-2">
                                        <span className="font-medium text-gray-600">Fecha de creación:</span>
                                        <p className="text-gray-900">
                                            {new Date(usuario.fecha_creacion).toLocaleString('es-BO')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Formulario */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nombres */}
                        <div>
                            <Label htmlFor="nombres" value="Nombres *" />
                            <TextInput
                                id="nombres"
                                placeholder="Nombres del usuario"
                                {...register('nombres', {
                                    required: 'Los nombres son obligatorios',
                                    minLength: {
                                        value: 2,
                                        message: 'Los nombres deben tener al menos 2 caracteres'
                                    }
                                })}
                                color={errors.nombres || formErrors.nombres ? 'failure' : 'gray'}
                            />

                            {(errors.nombres || formErrors.nombres) && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.nombres?.message || formErrors.nombres}
                                </p>
                            )}
                        </div>

                        {/* Apellido Paterno */}
                        <div>
                            <Label htmlFor="apellidopaterno" value="Apellido Paterno *" />
                            <TextInput
                                id="apellidopaterno"
                                placeholder="Apellido paterno"
                                {...register('apellidopaterno', {
                                    required: 'El apellido paterno es obligatorio',
                                    minLength: {
                                        value: 2,
                                        message: 'El apellido paterno debe tener al menos 2 caracteres'
                                    }
                                })}
                                color={errors.apellidopaterno || formErrors.apellidopaterno ? 'failure' : 'gray'}
                            />

                            {(errors.apellidopaterno || formErrors.apellidopaterno) && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.apellidopaterno?.message || formErrors.apellidopaterno}
                                </p>
                            )}
                        </div>

                        {/* Apellido Materno */}
                        <div>
                            <Label htmlFor="apellidomaterno" value="Apellido Materno *" />
                            <TextInput
                                id="apellidomaterno"
                                placeholder="Apellido materno"
                                {...register('apellidomaterno', {
                                    required: 'El apellido materno es obligatorio',
                                    minLength: {
                                        value: 2,
                                        message: 'El apellido materno debe tener al menos 2 caracteres'
                                    }
                                })}
                                color={errors.apellidomaterno || formErrors.apellidomaterno ? 'failure' : 'gray'}
                            />

                            {(errors.apellidomaterno || formErrors.apellidomaterno) && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.apellidomaterno?.message || formErrors.apellidomaterno}
                                </p>
                            )}
                        </div>

                        {/* Rol */}
                        <div>
                            <Label htmlFor="rol" value="Rol *" />
                            <Select
                                id="rol"
                                {...register('rol', {
                                    required: 'El rol es obligatorio'
                                })}
                                color={errors.rol || formErrors.rol ? 'failure' : 'gray'}
                            >
                                <option value="">
                                    {rolesDisponibles.length === 0 ? 'Cargando roles...' : 'Seleccionar rol...'}
                                </option>
                                {rolesDisponibles.map((rol) => (
                                    <option key={rol.id} value={rol.id}>
                                        {rol.nombre}
                                        {rol.cantidad_usuarios !== undefined &&
                                            ` (${rol.cantidad_usuarios} usuarios)`
                                        }
                                    </option>
                                ))}
                            </Select>

                            {rolesDisponibles.length === 0 && (
                                <p className="mt-1 text-xs text-gray-500">
                                    No hay roles disponibles. Contacta al administrador para crear roles.
                                </p>
                            )}

                            {(errors.rol || formErrors.rol) && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.rol?.message || formErrors.rol}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Información adicional */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-800 mb-2">
                            Información Importante
                        </h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                            {!usuario && (
                                <>
                                    <li>• El código COTEL se generará automáticamente (≥ 9000)</li>
                                    <li>• La contraseña inicial será igual al código COTEL</li>
                                    <li>• El usuario deberá cambiar la contraseña en su primer acceso</li>
                                </>
                            )}
                            <li>• El rol determina los permisos y accesos del usuario</li>
                            <li>• Todos los campos marcados con (*) son obligatorios</li>
                            {usuario && usuario.es_usuario_migrado && (
                                <li>• Este usuario fue migrado desde el sistema externo</li>
                            )}
                        </ul>
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button
                        type="submit"
                        color="blue"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : (usuario ? 'Actualizar Usuario' : 'Crear Usuario')}
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

export default UsuarioForm;
