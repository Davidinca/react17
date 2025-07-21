// ===== ContratoForm.jsx MEJORADO CON ALERTAS =====
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

const tiposServicios = [
    { value: 'telefonia', label: 'Telefonía Fija' },
    { value: 'tv', label: 'TV Cable' },
    { value: 'internet', label: 'Internet Fibra Óptica' },
];

export default function ContratoForm({ contrato, onSubmit, onCancel, isEditing = false }) {
    const { register, handleSubmit, reset, setValue, setError, clearErrors, watch, formState: { errors } } = useForm();
    const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);

    // Watch para detectar cambios en campos críticos
    const watchedCI = watch('ci');
    const watchedNombres = watch('nombres');
    const watchedApellidos = watch('apellidos');

    // Estados para detectar cambios en campos críticos
    const [ciOriginal, setCiOriginal] = useState('');
    const [nombresOriginal, setNombresOriginal] = useState('');
    const [apellidosOriginal, setApellidosOriginal] = useState('');
    const [showCIWarning, setShowCIWarning] = useState(false);

    useEffect(() => {
        if (contrato) {
            const { cliente, servicios } = contrato;

            setValue('ci', cliente?.ci || '');
            setValue('nombres', cliente?.nombres || '');
            setValue('apellidos', cliente?.apellidos || '');
            setValue('direccion', cliente?.direccion || '');
            setValue('telefono', cliente?.telefono || '');
            setServiciosSeleccionados(servicios?.map(s => s.tipo_servicio) || []);

            // Guardar valores originales para comparación
            setCiOriginal(cliente?.ci || '');
            setNombresOriginal(cliente?.nombres || '');
            setApellidosOriginal(cliente?.apellidos || '');
        } else {
            reset();
            setServiciosSeleccionados([]);
            setCiOriginal('');
            setNombresOriginal('');
            setApellidosOriginal('');
        }
        setShowCIWarning(false);
    }, [contrato, setValue, reset]);

    // Detectar cambio en CI para mostrar alerta visual (SIN TOAST)
    useEffect(() => {
        if (isEditing && watchedCI && ciOriginal) {
            const ciCambio = watchedCI.trim() !== ciOriginal.trim();
            setShowCIWarning(ciCambio);
        }
    }, [watchedCI, ciOriginal, isEditing]);

    const toggleServicio = (servicio) => {
        setServiciosSeleccionados(prev =>
            prev.includes(servicio)
                ? prev.filter(s => s !== servicio)
                : [...prev, servicio]
        );
    };

    const validarCambiosCI = () => {
        if (!isEditing) return true;

        const ciCambio = watchedCI?.trim() !== ciOriginal.trim();

        if (ciCambio) {
            const nombresIguales = watchedNombres?.trim() === nombresOriginal.trim();
            const apellidosIguales = watchedApellidos?.trim() === apellidosOriginal.trim();

            if (nombresIguales && apellidosIguales) {
                toast.error('Al cambiar el CI debes cambiar también los nombres y apellidos', {
                    duration: 4000,
                    icon: '⚠️'
                });
                return false;
            } else if (nombresIguales) {
                toast.error('Al cambiar el CI debes cambiar también los nombres', {
                    duration: 4000,
                    icon: '👤'
                });
                return false;
            } else if (apellidosIguales) {
                toast.error('Al cambiar el CI debes cambiar también los apellidos', {
                    duration: 4000,
                    icon: '👤'
                });
                return false;
            }
        }

        return true;
    };

    const validarFormulario = () => {
        // Validar servicios
        if (serviciosSeleccionados.length === 0) {
            toast.error('Debe seleccionar al menos un servicio');
            return false;
        }

        // Validar reglas de CI para edición
        if (isEditing && !validarCambiosCI()) {
            return false;
        }

        return true;
    };

    const handleFormSubmit = async (data) => {
        clearErrors();

        // Validar formulario
        if (!validarFormulario()) {
            return;
        }

        const payload = {
            ci: data.ci.trim(),
            nombres: data.nombres.trim(),
            apellidos: data.apellidos.trim(),
            direccion: data.direccion.trim(),
            telefono: data.telefono.trim(),
            servicios: serviciosSeleccionados.map(tipo => ({ tipo_servicio: tipo }))
        };

        console.log(`=== PAYLOAD ${isEditing ? 'EDICIÓN' : 'CREACIÓN'} ===`);
        console.log('Datos a enviar:', payload);

        try {
            await onSubmit(payload, handleBackendErrors);
        } catch (error) {
            console.log('Error capturado en formulario:', error);
        }
    };

    const handleBackendErrors = (error) => {
        console.log('=== MANEJO DE ERRORES EN FORMULARIO ===');
        console.log('Error completo:', error);

        if (error.response?.status === 400) {
            const errorData = error.response.data;
            console.log('Error data completo:', errorData);

            // SOLO TOASTS para errores críticos de CI, nombres y apellidos
            const criticalFields = ['ci', 'nombres', 'apellidos'];
            let hasCriticalError = false;

            // Errores en campos planos (formato nuevo)
            criticalFields.forEach(field => {
                if (errorData[field]) {
                    let message = errorData[field];

                    // Limpiar el mensaje si viene como array
                    if (Array.isArray(message)) {
                        message = message[0];
                    }

                    // Limpiar mensaje si viene con código de error
                    if (typeof message === 'string') {
                        // Extraer solo el mensaje limpio
                        if (message.includes('ErrorDetail')) {
                            // Buscar el texto entre 'string=' y ', code='
                            const match = message.match(/string='([^']+)'/);
                            if (match) {
                                message = match[1];
                            }
                        }
                    }

                    setError(field, {
                        type: 'server',
                        message: message
                    });

                    // Toast solo para campos críticos con mensaje limpio
                    if (field === 'ci') {
                        toast.error(`Error en CI: ${message}`, {
                            duration: 4000,
                            icon: '🆔',
                            style: {
                                maxWidth: '400px'
                            }
                        });
                        hasCriticalError = true;
                    } else if (field === 'nombres') {
                        toast.error(`Error en Nombres: ${message}`, {
                            duration: 4000,
                            icon: '👤',
                            style: {
                                maxWidth: '400px'
                            }
                        });
                        hasCriticalError = true;
                    } else if (field === 'apellidos') {
                        toast.error(`Error en Apellidos: ${message}`, {
                            duration: 4000,
                            icon: '👤',
                            style: {
                                maxWidth: '400px'
                            }
                        });
                        hasCriticalError = true;
                    }
                }
            });

            // Otros campos sin toast (solo mostrar en el input)
            ['direccion', 'telefono'].forEach(field => {
                if (errorData[field]) {
                    let message = errorData[field];

                    if (Array.isArray(message)) {
                        message = message[0];
                    }

                    // Limpiar mensaje si viene con código
                    if (typeof message === 'string' && message.includes('ErrorDetail')) {
                        const match = message.match(/string='([^']+)'/);
                        if (match) {
                            message = match[1];
                        }
                    }

                    setError(field, {
                        type: 'server',
                        message: message
                    });
                }
            });

            // Errores anidados en cliente (compatibilidad con formato anterior)
            if (errorData.cliente) {
                Object.keys(errorData.cliente).forEach(field => {
                    let message = errorData.cliente[field];

                    if (Array.isArray(message)) {
                        message = message[0];
                    }

                    // Limpiar mensaje si viene con código
                    if (typeof message === 'string' && message.includes('ErrorDetail')) {
                        const match = message.match(/string='([^']+)'/);
                        if (match) {
                            message = match[1];
                        }
                    }

                    setError(field, {
                        type: 'server',
                        message: message
                    });

                    // Toast solo para campos críticos
                    if (criticalFields.includes(field)) {
                        if (field === 'ci') {
                            toast.error(`Error en CI: ${message}`, {
                                duration: 4000,
                                icon: '🆔',
                                style: { maxWidth: '400px' }
                            });
                        } else if (field === 'nombres') {
                            toast.error(`Error en Nombres: ${message}`, {
                                duration: 4000,
                                icon: '👤',
                                style: { maxWidth: '400px' }
                            });
                        } else if (field === 'apellidos') {
                            toast.error(`Error en Apellidos: ${message}`, {
                                duration: 4000,
                                icon: '👤',
                                style: { maxWidth: '400px' }
                            });
                        }
                        hasCriticalError = true;
                    }
                });
            }

            // Manejo de errores en formato string con código (como tu caso)
            if (errorData.detail && typeof errorData.detail === 'string') {
                let message = errorData.detail;

                // Si el detail contiene información de CI
                if (message.includes('ci') && message.includes('ErrorDetail')) {
                    // Extraer mensaje limpio
                    const match = message.match(/string='([^']+)'/);
                    if (match) {
                        const cleanMessage = match[1];
                        setError('ci', {
                            type: 'server',
                            message: cleanMessage
                        });
                        toast.error(`Error en CI: ${cleanMessage}`, {
                            duration: 4000,
                            icon: '🆔',
                            style: { maxWidth: '400px' }
                        });
                        hasCriticalError = true;
                    }
                } else {
                    // Error general limpio
                    toast.error(message, { duration: 4000 });
                    hasCriticalError = true;
                }
            }

            // Solo un toast general si no hay errores críticos específicos
            if (!hasCriticalError) {
                if (errorData.general) {
                    let generalError = errorData.general;
                    if (Array.isArray(generalError)) {
                        generalError = generalError[0];
                    }
                    toast.error(generalError, { duration: 4000 });
                } else {
                    toast.error('Error al procesar la solicitud', { duration: 4000 });
                }
            }
        }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 p-6 bg-white rounded-lg shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Campo CI con alerta visual */}
                <div>
                    <input
                        {...register('ci', {
                            required: 'El CI es requerido',
                            minLength: { value: 7, message: 'CI debe tener al menos 7 caracteres' }
                        })}
                        placeholder="CI"
                        onChange={(e) => {
                            const value = e.target.value;
                            setValue('ci', value);
                            if (errors.ci?.type === 'server') {
                                clearErrors('ci');
                            }
                        }}
                        className={`p-2 border rounded text-gray-900 focus:outline-none w-full transition-all ${
                            errors.ci
                                ? 'border-red-500 focus:border-red-500 bg-red-50'
                                : showCIWarning
                                    ? 'border-yellow-500 focus:border-yellow-500 bg-yellow-50'
                                    : 'border-gray-300 focus:border-orange-500'
                        }`}
                    />
                    {errors.ci && (
                        <span className="text-red-500 text-sm block mt-1 flex items-center">
                            <span className="mr-1">🆔</span>
                            {errors.ci.message}
                        </span>
                    )}
                    {showCIWarning && !errors.ci && (
                        <span className="text-yellow-600 text-sm block mt-1 flex items-center">
                            <span className="mr-1">⚠️</span>
                            Al cambiar CI, debes cambiar nombres y apellidos
                        </span>
                    )}
                </div>

                {/* Campo Nombres con alerta visual */}
                <div>
                    <input
                        {...register('nombres', {
                            required: 'Los nombres son requeridos'
                        })}
                        placeholder="Nombres"
                        onChange={(e) => {
                            const value = e.target.value;
                            setValue('nombres', value);
                            if (errors.nombres?.type === 'server') {
                                clearErrors('nombres');
                            }
                        }}
                        className={`p-2 border rounded text-gray-900 focus:outline-none w-full transition-all ${
                            errors.nombres
                                ? 'border-red-500 focus:border-red-500 bg-red-50'
                                : showCIWarning
                                    ? 'border-yellow-500 focus:border-yellow-500 bg-yellow-50'
                                    : 'border-gray-300 focus:border-orange-500'
                        }`}
                    />
                    {errors.nombres && (
                        <span className="text-red-500 text-sm block mt-1 flex items-center">
                            <span className="mr-1">👤</span>
                            {errors.nombres.message}
                        </span>
                    )}
                    {showCIWarning && watchedNombres?.trim() === nombresOriginal.trim() && !errors.nombres && (
                        <span className="text-yellow-600 text-sm block mt-1 flex items-center">
                            <span className="mr-1">⚠️</span>
                            Debes cambiar los nombres cuando cambias el CI
                        </span>
                    )}
                </div>

                {/* Campo Apellidos con alerta visual */}
                <div>
                    <input
                        {...register('apellidos', {
                            required: 'Los apellidos son requeridos'
                        })}
                        placeholder="Apellidos"
                        onChange={(e) => {
                            const value = e.target.value;
                            setValue('apellidos', value);
                            if (errors.apellidos?.type === 'server') {
                                clearErrors('apellidos');
                            }
                        }}
                        className={`p-2 border rounded text-gray-900 focus:outline-none w-full transition-all ${
                            errors.apellidos
                                ? 'border-red-500 focus:border-red-500 bg-red-50'
                                : showCIWarning
                                    ? 'border-yellow-500 focus:border-yellow-500 bg-yellow-50'
                                    : 'border-gray-300 focus:border-orange-500'
                        }`}
                    />
                    {errors.apellidos && (
                        <span className="text-red-500 text-sm block mt-1 flex items-center">
                            <span className="mr-1">👤</span>
                            {errors.apellidos.message}
                        </span>
                    )}
                    {showCIWarning && watchedApellidos?.trim() === apellidosOriginal.trim() && !errors.apellidos && (
                        <span className="text-yellow-600 text-sm block mt-1 flex items-center">
                            <span className="mr-1">⚠️</span>
                            Debes cambiar los apellidos cuando cambias el CI
                        </span>
                    )}
                </div>

                {/* Campo Dirección - sin cambios especiales */}
                <div>
                    <input
                        {...register('direccion', {
                            required: 'La dirección es requerida'
                        })}
                        placeholder="Dirección"
                        onChange={(e) => {
                            const value = e.target.value;
                            setValue('direccion', value);
                            if (errors.direccion?.type === 'server') {
                                clearErrors('direccion');
                            }
                        }}
                        className={`p-2 border rounded text-gray-900 focus:outline-none w-full ${
                            errors.direccion
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:border-orange-500'
                        }`}
                    />
                    {errors.direccion && (
                        <span className="text-red-500 text-sm block mt-1">
                            {errors.direccion.message}
                        </span>
                    )}
                </div>

                {/* Campo Teléfono - sin cambios especiales */}
                <div className="sm:col-span-2">
                    <input
                        {...register('telefono', {
                            required: 'El teléfono es requerido',
                            pattern: { value: /^\d+$/, message: 'Solo se permiten números' }
                        })}
                        placeholder="Teléfono"
                        onChange={(e) => {
                            const value = e.target.value;
                            setValue('telefono', value);
                            if (errors.telefono?.type === 'server') {
                                clearErrors('telefono');
                            }
                        }}
                        className={`p-2 border rounded text-gray-900 focus:outline-none w-full ${
                            errors.telefono
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:border-orange-500'
                        }`}
                    />
                    {errors.telefono && (
                        <span className="text-red-500 text-sm block mt-1">
                            {errors.telefono.message}
                        </span>
                    )}
                </div>
            </div>

            {/* Servicios */}
            <div>
                <label className="block font-medium text-gray-900 mb-2">
                    Servicios: <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-4">
                    {tiposServicios.map(servicio => (
                        <label key={servicio.value} className="flex items-center gap-2 text-gray-900 cursor-pointer">
                            <input
                                type="checkbox"
                                value={servicio.value}
                                checked={serviciosSeleccionados.includes(servicio.value)}
                                onChange={() => toggleServicio(servicio.value)}
                                className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                            />
                            {servicio.label}
                        </label>
                    ))}
                </div>
                {serviciosSeleccionados.length === 0 && (
                    <p className="text-red-500 text-sm mt-1">Debe seleccionar al menos un servicio</p>
                )}
            </div>

            {/* Mensaje informativo mejorado */}
            {isEditing && (
                <div className={`border rounded p-3 transition-all ${
                    showCIWarning
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                }`}>
                    <p className={`text-sm font-semibold ${
                        showCIWarning ? 'text-yellow-700' : 'text-blue-700'
                    }`}>
                        {showCIWarning ? '⚠️ Atención - CI Modificado' : 'ℹ️ Reglas de edición:'}
                    </p>
                    <ul className={`text-sm mt-1 list-disc list-inside ${
                        showCIWarning ? 'text-yellow-600' : 'text-blue-600'
                    }`}>
                        {showCIWarning ? (
                            <>
                                <li><strong>Has cambiado el CI</strong> - También debes cambiar nombres y apellidos</li>
                                <li>Los campos resaltados en amarillo requieren modificación</li>
                            </>
                        ) : (
                            <>
                                <li><strong>Solo si cambias el CI:</strong> También debes cambiar nombres y apellidos</li>
                                <li><strong>Si NO cambias el CI:</strong> Puedes cambiar dirección, teléfono y servicios libremente</li>
                                <li>Los campos número de contrato y fecha son automáticos</li>
                            </>
                        )}
                    </ul>
                </div>
            )}

            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                >
                    {isEditing ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
        </form>
    );
}