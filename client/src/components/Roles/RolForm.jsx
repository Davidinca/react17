// components/roles/RolForm.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Label, TextInput, Alert, Card, Checkbox
} from 'flowbite-react';
import { HiExclamationTriangle, HiShieldCheck } from 'react-icons/hi2';

const RolForm = ({
                     isOpen,
                     onClose,
                     rol = null,
                     onSubmit,
                     loading = false,
                     permisosDisponibles = []
                 }) => {
    const [formErrors, setFormErrors] = useState({});
    const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);

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
            nombre: '',
            activo: true
        }
    });

    // Resetear formulario cuando cambia el rol o se abre/cierra
    useEffect(() => {
        if (isOpen) {
            if (rol) {
                // Modo edición
                console.log('🔧 Modo edición, cargando rol:', rol);

                setValue('nombre', rol.nombre);
                setValue('activo', rol.activo !== false); // Default true si no está definido

                // Cargar permisos del rol
                const permisosDelRol = rol.permisos ?
                    rol.permisos.map(p => p.id) :
                    [];
                setPermisosSeleccionados(permisosDelRol);

            } else {
                // Modo creación
                console.log('➕ Modo creación');
                reset({
                    nombre: '',
                    activo: true
                });
                setPermisosSeleccionados([]);
            }

            // Limpiar errores
            setFormErrors({});
            clearErrors();
        }
    }, [isOpen, rol, setValue, reset, clearErrors]);

    // Función para manejar errores del backend
    const handleBackendError = (error) => {
        console.error('❌ Error del backend:', error);

        if (error.response?.status === 400) {
            const errorData = error.response.data;

            // Errores de validación por campo
            const newFormErrors = {};

            if (errorData.nombre) {
                newFormErrors.nombre = Array.isArray(errorData.nombre)
                    ? errorData.nombre[0]
                    : errorData.nombre;
            }

            if (errorData.permisos_ids) {
                newFormErrors.permisos = Array.isArray(errorData.permisos_ids)
                    ? errorData.permisos_ids[0]
                    : errorData.permisos_ids;
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

    // Función para manejar selección de permisos
    const handlePermisoChange = (permisoId, checked) => {
        setPermisosSeleccionados(prev => {
            if (checked) {
                return [...prev, permisoId];
            } else {
                return prev.filter(id => id !== permisoId);
            }
        });
    };

    // Función para seleccionar/deseleccionar todos los permisos
    const handleSelectAllPermisos = (checked) => {
        if (checked) {
            setPermisosSeleccionados(permisosDisponibles.map(p => p.id));
        } else {
            setPermisosSeleccionados([]);
        }
    };

    // Función para seleccionar permisos por recurso
    const handleSelectPermisosPorRecurso = (recurso, checked) => {
        const permisosDelRecurso = permisosDisponibles
            .filter(p => p.recurso === recurso)
            .map(p => p.id);

        if (checked) {
            setPermisosSeleccionados(prev => [
                ...prev.filter(id => !permisosDelRecurso.includes(id)),
                ...permisosDelRecurso
            ]);
        } else {
            setPermisosSeleccionados(prev =>
                prev.filter(id => !permisosDelRecurso.includes(id))
            );
        }
    };

    // Agrupar permisos por recurso
    const permisosPorRecurso = permisosDisponibles.reduce((acc, permiso) => {
        if (!acc[permiso.recurso]) {
            acc[permiso.recurso] = [];
        }
        acc[permiso.recurso].push(permiso);
        return acc;
    }, {});

    // Función para enviar formulario
    const onFormSubmit = async (data) => {
        try {
            console.log('📝 Enviando formulario:', data);
            console.log('📝 Permisos seleccionados:', permisosSeleccionados);

            // Limpiar errores previos
            setFormErrors({});

            // Validaciones frontend
            if (!data.nombre || !data.nombre.trim()) {
                setFormErrors({ nombre: 'El nombre del rol es obligatorio' });
                return;
            }

            if (data.nombre.trim().length < 2) {
                setFormErrors({ nombre: 'El nombre debe tener al menos 2 caracteres' });
                return;
            }

            const datosFinales = {
                nombre: data.nombre.trim(),
                activo: data.activo,
                permisos_ids: permisosSeleccionados
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
        setPermisosSeleccionados([]);
        clearErrors();
        onClose();
    };

    // Obtener color del badge según la acción
    const getAccionBadgeColor = (accion) => {
        const colors = {
            'crear': 'blue',
            'leer': 'green',
            'actualizar': 'yellow',
            'eliminar': 'red'
        };
        return colors[accion] || 'gray';
    };

    if (!isOpen) return null;

    return (
        <Modal show={isOpen} onClose={handleClose} size="4xl">
            <ModalHeader>
                <div className="flex items-center space-x-2">
                    <HiShieldCheck className="w-6 h-6 text-blue-600" />
                    <span>{rol ? 'Editar Rol' : 'Crear Nuevo Rol'}</span>
                </div>
            </ModalHeader>

            <form onSubmit={handleSubmit(onFormSubmit)}>
                <ModalBody className="space-y-6">
                    {/* Error general */}
                    {formErrors.general && (
                        <Alert color="failure" icon={HiExclamationTriangle}>
                            <span className="font-medium">Error:</span> {formErrors.general}
                        </Alert>
                    )}

                    {/* Información básica del rol */}
                    <Card>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Rol</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nombre del rol */}
                            <div>
                                <Label htmlFor="nombre" value="Nombre del Rol *" />
                                <TextInput
                                    id="nombre"
                                    placeholder="ej: Administrador, Editor, Supervisor"
                                    {...register('nombre', {
                                        required: 'El nombre del rol es obligatorio',
                                        minLength: {
                                            value: 2,
                                            message: 'El nombre debe tener al menos 2 caracteres'
                                        }
                                    })}
                                    color={errors.nombre || formErrors.nombre ? 'failure' : 'gray'}
                                />

                                {(errors.nombre || formErrors.nombre) && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.nombre?.message || formErrors.nombre}
                                    </p>
                                )}
                            </div>

                            {/* Estado activo */}
                            <div className="flex items-center space-x-2 mt-6">
                                <Checkbox
                                    id="activo"
                                    {...register('activo')}
                                />
                                <Label htmlFor="activo" value="Rol activo" />
                                <span className="text-sm text-gray-500">
                                    (Los roles inactivos no se pueden asignar a usuarios)
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Selección de permisos */}
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Permisos del Rol
                                <span className="ml-2 text-sm text-gray-500">
                                    ({permisosSeleccionados.length} de {permisosDisponibles.length} seleccionados)
                                </span>
                            </h3>

                            <div className="flex space-x-2">
                                <Button
                                    type="button"
                                    size="xs"
                                    color="blue"
                                    onClick={() => handleSelectAllPermisos(true)}
                                    disabled={permisosSeleccionados.length === permisosDisponibles.length}
                                >
                                    Seleccionar Todos
                                </Button>
                                <Button
                                    type="button"
                                    size="xs"
                                    color="gray"
                                    onClick={() => handleSelectAllPermisos(false)}
                                    disabled={permisosSeleccionados.length === 0}
                                >
                                    Deseleccionar Todos
                                </Button>
                            </div>
                        </div>

                        {/* Error de permisos */}
                        {formErrors.permisos && (
                            <Alert color="failure" className="mb-4">
                                <span className="font-medium">Error en permisos:</span> {formErrors.permisos}
                            </Alert>
                        )}

                        {Object.keys(permisosPorRecurso).length > 0 ? (
                            <div className="space-y-4">
                                {Object.entries(permisosPorRecurso).map(([recurso, permisos]) => {
                                    const permisosDelRecursoIds = permisos.map(p => p.id);
                                    const todosSeleccionados = permisosDelRecursoIds.every(id =>
                                        permisosSeleccionados.includes(id)
                                    );
                                    const algunosSeleccionados = permisosDelRecursoIds.some(id =>
                                        permisosSeleccionados.includes(id)
                                    );

                                    return (
                                        <div key={recurso} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`recurso-${recurso}`}
                                                        checked={todosSeleccionados}
                                                        onChange={(e) => handleSelectPermisosPorRecurso(recurso, e.target.checked)}
                                                    />
                                                    <Label
                                                        htmlFor={`recurso-${recurso}`}
                                                        className="text-base font-medium text-gray-900 capitalize"
                                                    >
                                                        {recurso}
                                                    </Label>
                                                    <span className="text-sm text-gray-500">
                                                        ({permisos.filter(p => permisosSeleccionados.includes(p.id)).length}/{permisos.length})
                                                    </span>
                                                </div>

                                                {algunosSeleccionados && !todosSeleccionados && (
                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                                        Parcial
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 ml-6">
                                                {permisos.map((permiso) => (
                                                    <div key={permiso.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`permiso-${permiso.id}`}
                                                            checked={permisosSeleccionados.includes(permiso.id)}
                                                            onChange={(e) => handlePermisoChange(permiso.id, e.target.checked)}
                                                        />
                                                        <Label
                                                            htmlFor={`permiso-${permiso.id}`}
                                                            className={`text-sm ${getAccionBadgeColor(permiso.accion) === 'blue' ? 'text-blue-700' :
                                                                getAccionBadgeColor(permiso.accion) === 'green' ? 'text-green-700' :
                                                                    getAccionBadgeColor(permiso.accion) === 'yellow' ? 'text-yellow-700' :
                                                                        getAccionBadgeColor(permiso.accion) === 'red' ? 'text-red-700' :
                                                                            'text-gray-700'}`}
                                                        >
                                                            {permiso.accion.charAt(0).toUpperCase() + permiso.accion.slice(1)}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <HiShieldCheck className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    No hay permisos disponibles
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Primero debe crear permisos en el sistema
                                </p>
                            </div>
                        )}

                        {/* Información adicional */}
                        {permisosSeleccionados.length > 0 && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-800 mb-2">
                                    Resumen de Permisos Seleccionados:
                                </h4>
                                <div className="text-sm text-blue-700">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {Object.entries(permisosPorRecurso).map(([recurso, permisos]) => {
                                            const seleccionados = permisos.filter(p =>
                                                permisosSeleccionados.includes(p.id)
                                            );

                                            if (seleccionados.length === 0) return null;

                                            return (
                                                <div key={recurso}>
                                                    <span className="font-medium capitalize">{recurso}:</span> {seleccionados.length}/{permisos.length}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </ModalBody>

                <ModalFooter>
                    <Button
                        type="submit"
                        color="blue"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : (rol ? 'Actualizar' : 'Crear')}
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

export default RolForm;