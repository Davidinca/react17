import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Modal, ModalBody, ModalHeader, ModalFooter, Button, Label,
    TextInput, Textarea, Select, HelperText, Alert
} from 'flowbite-react';
import { useForm } from 'react-hook-form';
import { useMarcas, useTiposEquipo } from '../../../hooks/useAlmacenes';
import { useComponentesBasic } from "../../../hooks/useAlmacenes";
import {
    HiPlus, HiTrash, HiExclamationCircle, HiCheckCircle,
    HiInformationCircle, HiCog, HiTag, HiCollection,
    HiDocumentText, HiClipboardList, HiX
} from 'react-icons/hi';

const ModeloForm = ({ isOpen, onClose, modelo = null, onSubmit, loading = false }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { marcas, fetchMarcas, loading: marcasLoading } = useMarcas();
    const { data: tiposEquipo, fetchData: fetchTiposEquipo, loading: tiposLoading } = useTiposEquipo();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setError,
        clearErrors,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: {
            marca: '',
            tipo_equipo: '',
            nombre: '',
            codigo_modelo: '',
            descripcion: ''
        }
    });

    // Estado para componentes
    const [componentesSeleccionados, setComponentesSeleccionados] = useState([]);
    const { componentes, fetchComponentes, loading: componentesLoading } = useComponentesBasic();
    const [componentesError, setComponentesError] = useState('');
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // Estados adicionales para validaciones en tiempo real
    const [codigoValidated, setCodigoValidated] = useState(false);

    // Validación en tiempo real del código
    const validateCodigoEnTiempoReal = async (codigo) => {
        if (!codigo || codigo.length < 4) {
            setCodigoValidated(false);
            clearErrors('codigo_modelo');
            return;
        }

        // Simulación de códigos existentes - en real sería una consulta al backend
        const codigosExistentes = ['1000', '2000', '3000'];
        if (codigosExistentes.includes(codigo.toString()) && !modelo) {
            setCodigoValidated(false);
            setError('codigo_modelo', {
                type: 'manual',
                message: 'Este código ya existe, por favor use otro'
            });
        } else {
            setCodigoValidated(true);
            clearErrors('codigo_modelo');
        }
    };

    // Watcher para validar código en tiempo real
    const codigoWatch = watch('codigo_modelo');
    useEffect(() => {
        if (codigoWatch) {
            validateCodigoEnTiempoReal(codigoWatch);
        }
    }, [codigoWatch, modelo]);

    // Función para triggerar refresh automático
    const triggerRefresh = () => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('refresh', Date.now().toString());
        setSearchParams(currentParams);
    };

    // Verificar si todos los datos están cargados
    const checkDataLoaded = () => {
        return marcas.length > 0 && tiposEquipo.length > 0 && componentes.length > 0;
    };

    // Cargar datos necesarios cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                try {
                    await Promise.all([
                        fetchMarcas(),
                        fetchTiposEquipo(),
                        fetchComponentes()
                    ]);
                    setIsDataLoaded(true);
                } catch (error) {
                    console.error('Error loading data:', error);
                }
            };
            loadData();
        }
    }, [isOpen]);

    // Auto-refresh cuando cambian los searchParams
    useEffect(() => {
        const refreshParam = searchParams.get('refresh');
        if (refreshParam && isOpen) {
            fetchMarcas();
            fetchTiposEquipo();
            fetchComponentes();
        }
    }, [searchParams, isOpen, fetchMarcas, fetchTiposEquipo, fetchComponentes]);

    // Poblar formulario cuando el modelo y los datos estén listos
    useEffect(() => {
        if (isOpen && checkDataLoaded()) {
            if (modelo) {
                // Modo edición
                reset({
                    marca: modelo.marca?.toString() || '',
                    tipo_equipo: modelo.tipo_equipo?.toString() || '',
                    nombre: modelo.nombre || '',
                    codigo_modelo: modelo.codigo_modelo || '',
                    descripcion: modelo.descripcion || ''
                });

                // Cargar componentes del modelo
                if (modelo.componentes) {
                    const componentesFormateados = modelo.componentes.map(comp => ({
                        componente_id: comp.componente?.toString() || '',
                        nombre: comp.componente_nombre || '',
                        cantidad: comp.cantidad || 1
                    }));
                    setComponentesSeleccionados(componentesFormateados);
                }
                setCodigoValidated(true); // En modo edición el código es válido
                clearErrors('codigo_modelo');
            } else {
                // Modo creación
                reset({
                    marca: '',
                    tipo_equipo: '',
                    nombre: '',
                    codigo_modelo: '',
                    descripcion: ''
                });
                setComponentesSeleccionados([]);
                setCodigoValidated(false);
                clearErrors('codigo_modelo');
            }
            setComponentesError('');
        }
    }, [modelo, reset, isOpen, marcas, tiposEquipo, componentes, clearErrors]);

    // Validación personalizada para componentes
    const validateComponentes = () => {
        if (componentesSeleccionados.length === 0) {
            setComponentesError('Debe agregar al menos un componente al modelo');
            return false;
        }

        const componentesIncompletos = componentesSeleccionados.some(
            comp => !comp.componente_id || !comp.cantidad || comp.cantidad < 1
        );

        if (componentesIncompletos) {
            setComponentesError('Todos los componentes deben estar completos con cantidad válida');
            return false;
        }

        // Verificar componentes duplicados
        const componentesIds = componentesSeleccionados.map(comp => comp.componente_id);
        const duplicados = componentesIds.filter((id, index) => componentesIds.indexOf(id) !== index);

        if (duplicados.length > 0) {
            setComponentesError('No puede agregar el mismo componente múltiples veces');
            return false;
        }

        setComponentesError('');
        return true;
    };

    // Verificar código de modelo único (simulado)
    const validateCodigoModelo = async (codigo) => {
        if (!codigo) return true;

        // En un caso real, aquí harías una consulta al backend
        const codigosExistentes = ['1000', '2000', '3000'];
        if (codigosExistentes.includes(codigo.toString()) && !modelo) {
            return false;
        }
        return true;
    };

    const onFormSubmit = async (data) => {
        try {
            // Limpiar errores previos
            clearErrors();

            // Validar componentes
            if (!validateComponentes()) {
                return;
            }

            // Validar código único usando react-hook-form
            const codigoEsValido = await validateCodigoModelo(data.codigo_modelo);
            if (!codigoEsValido) {
                setError('codigo_modelo', {
                    type: 'manual',
                    message: 'Este código ya existe, por favor use otro'
                });
                return;
            }

            // Preparar datos del formulario
            const formData = {
                ...data,
                codigo_modelo: parseInt(data.codigo_modelo),
                marca: parseInt(data.marca),
                tipo_equipo: parseInt(data.tipo_equipo),
                componentes_data: componentesSeleccionados.map(comp => ({
                    componente_id: parseInt(comp.componente_id),
                    cantidad: parseInt(comp.cantidad)
                }))
            };

            // NO TOAST AQUÍ - se maneja solo en el componente padre
            await onSubmit(formData);

            // Solo cerrar si todo salió bien
            handleClose();
            triggerRefresh();
        } catch (error) {
            console.error('Form submit error:', error);
            // El error se maneja en el componente padre
        }
    };

    const handleClose = () => {
        reset();
        setComponentesSeleccionados([]);
        setComponentesError('');
        setIsDataLoaded(false);
        setCodigoValidated(false);
        clearErrors();
        onClose();
    };

    // Funciones para manejar componentes
    const agregarComponente = () => {
        if (componentesSeleccionados.length >= 10) {
            return;
        }

        const nuevoComponente = {
            componente_id: '',
            nombre: '',
            cantidad: 1
        };
        setComponentesSeleccionados([...componentesSeleccionados, nuevoComponente]);
        setComponentesError('');
    };

    const removerComponente = (index) => {
        const nuevosComponentes = componentesSeleccionados.filter((_, i) => i !== index);
        setComponentesSeleccionados(nuevosComponentes);

        if (nuevosComponentes.length === 0) {
            setComponentesError('Debe agregar al menos un componente al modelo');
        } else {
            setComponentesError('');
        }
    };

    const actualizarComponente = (index, campo, valor) => {
        setComponentesSeleccionados(prev => prev.map((comp, i) => {
            if (i === index) {
                const updated = { ...comp, [campo]: valor };

                // Si cambió el componente, actualizar el nombre
                if (campo === 'componente_id') {
                    const componenteEncontrado = componentes.find(c => c.id.toString() === valor);
                    updated.nombre = componenteEncontrado ? componenteEncontrado.nombre : '';
                }

                return updated;
            }
            return comp;
        }));
        setComponentesError('');
    };

    // Componentes disponibles filtrados
    const getComponentesDisponibles = (currentIndex) => {
        return componentes.filter(comp =>
            !componentesSeleccionados.some((selected, i) =>
                i !== currentIndex && selected.componente_id === comp.id.toString()
            )
        );
    };

    // Verificar si el formulario está completo
    const isFormComplete = () => {
        const watchedValues = watch();
        return (
            watchedValues.marca &&
            watchedValues.tipo_equipo &&
            watchedValues.nombre &&
            watchedValues.codigo_modelo &&
            codigoValidated && // Código debe estar validado
            !errors.codigo_modelo && // No debe haber errores de código
            componentesSeleccionados.length > 0 &&
            !componentesError &&
            !Object.keys(errors).length
        );
    };

    // Loading state mientras se cargan datos
    if (isOpen && (!isDataLoaded || marcasLoading || tiposLoading || componentesLoading)) {
        return (
            <Modal show={isOpen} onClose={handleClose} size="lg">
                <ModalHeader>
                    <h3 className="text-lg font-medium">Cargando datos...</h3>
                </ModalHeader>
                <ModalBody>
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                        <span className="ml-3">Preparando formulario...</span>
                    </div>
                </ModalBody>
            </Modal>
        );
    }

    return (
        <Modal show={isOpen} onClose={handleClose} size="4xl">
            {/* Header mejorado */}
            <ModalHeader className="border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                        modelo
                            ? 'bg-orange-500 text-white'
                            : 'bg-green-500 text-white'
                    }`}>
                        <HiCog className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            {modelo ? 'Editar Modelo Existente' : 'Crear Nuevo Modelo'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {modelo
                                ? 'Modifique la información del modelo y sus componentes'
                                : 'Complete los datos del modelo y agregue sus componentes'
                            }
                        </p>
                    </div>
                </div>
            </ModalHeader>

            <ModalBody className="p-0">
                {/* Indicador de estado simple */}
                <div className="bg-white px-6 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Estado del formulario:</span>
                        <span className={`text-sm font-bold px-3 py-1 rounded-full flex items-center space-x-2 ${
                            isFormComplete()
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                        }`}>
                            {isFormComplete() ? (
                                <>
                                    <HiCheckCircle className="h-4 w-4" />
                                    <span>Completo y listo</span>
                                </>
                            ) : (
                                <>
                                    <HiExclamationCircle className="h-4 w-4" />
                                    <span>Faltan campos</span>
                                </>
                            )}
                        </span>
                    </div>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">

                        {/* Información básica mejorada */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gray-600 text-white rounded-lg flex items-center justify-center font-bold">
                                        1
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <HiInformationCircle className="h-5 w-5 text-gray-600" />
                                        <h4 className="text-lg font-bold text-gray-900">Información Básica del Modelo</h4>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mt-1">Complete los datos principales del modelo</p>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Marca mejorada */}
                                    <div>
                                        <Label htmlFor="marca" className="mb-3 block">
                                            <div className="flex items-center space-x-2">
                                                <HiTag className="h-4 w-4 text-gray-600" />
                                                <span className="text-base font-semibold text-gray-900">Marca del Equipo</span>
                                                <span className="text-red-500 ml-1">*</span>
                                                {watch('marca') && (
                                                    <HiCheckCircle className="h-4 w-4 text-green-500" />
                                                )}
                                            </div>
                                        </Label>
                                        <Select
                                            id="marca"
                                            {...register('marca', {
                                                required: 'Debe seleccionar una marca'
                                            })}
                                            color={errors.marca ? 'failure' : 'gray'}
                                            disabled={isSubmitting}
                                            className="text-base"
                                        >
                                            <option value="">Seleccione la marca del fabricante</option>
                                            {marcas.map((marca) => (
                                                <option key={marca.id} value={marca.id}>
                                                    {marca.nombre}
                                                </option>
                                            ))}
                                        </Select>
                                        {errors.marca && (
                                            <HelperText color="failure" className="mt-2 flex items-center">
                                                <HiExclamationCircle className="h-4 w-4 mr-1" />
                                                {errors.marca.message}
                                            </HelperText>
                                        )}
                                        <HelperText className="mt-1 text-xs text-gray-500">
                                            Ejemplo: Huawei, ZTE, Nokia, TP-Link
                                        </HelperText>
                                    </div>

                                    {/* Tipo de Equipo mejorado */}
                                    <div>
                                        <Label htmlFor="tipo_equipo" className="mb-3 block">
                                            <div className="flex items-center space-x-2">
                                                <HiCog className="h-4 w-4 text-gray-600" />
                                                <span className="text-base font-semibold text-gray-900">Tipo de Equipo</span>
                                                <span className="text-red-500 ml-1">*</span>
                                                {watch('tipo_equipo') && (
                                                    <HiCheckCircle className="h-4 w-4 text-green-500" />
                                                )}
                                            </div>
                                        </Label>
                                        <Select
                                            id="tipo_equipo"
                                            {...register('tipo_equipo', {
                                                required: 'Debe seleccionar un tipo de equipo'
                                            })}
                                            color={errors.tipo_equipo ? 'failure' : 'gray'}
                                            disabled={isSubmitting}
                                            className="text-base"
                                        >
                                            <option value="">Seleccione la categoría del equipo</option>
                                            {tiposEquipo.map((tipo) => (
                                                <option key={tipo.id} value={tipo.id}>
                                                    {tipo.nombre}
                                                </option>
                                            ))}
                                        </Select>
                                        {errors.tipo_equipo && (
                                            <HelperText color="failure" className="mt-2 flex items-center">
                                                <HiExclamationCircle className="h-4 w-4 mr-1" />
                                                {errors.tipo_equipo.message}
                                            </HelperText>
                                        )}
                                        <HelperText className="mt-1 text-xs text-gray-500">
                                            Ejemplo: Router, Modem, Switch, Access Point
                                        </HelperText>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                    {/* Nombre mejorado */}
                                    <div>
                                        <Label htmlFor="nombre" className="mb-3 block">
                                            <div className="flex items-center space-x-2">
                                                <HiDocumentText className="h-4 w-4 text-gray-600" />
                                                <span className="text-base font-semibold text-gray-900">Nombre del Modelo</span>
                                                <span className="text-red-500 ml-1">*</span>
                                                {watch('nombre') && watch('nombre').length >= 2 && (
                                                    <HiCheckCircle className="h-4 w-4 text-green-500" />
                                                )}
                                            </div>
                                        </Label>
                                        <TextInput
                                            id="nombre"
                                            type="text"
                                            placeholder="Ejemplo: F601, HG8245H, Archer C6"
                                            {...register('nombre', {
                                                required: 'El nombre del modelo es obligatorio',
                                                minLength: {
                                                    value: 2,
                                                    message: 'Debe tener al menos 2 caracteres'
                                                },
                                                maxLength: {
                                                    value: 100,
                                                    message: 'No puede exceder 100 caracteres'
                                                }
                                            })}
                                            color={errors.nombre ? 'failure' : 'gray'}
                                            disabled={isSubmitting}
                                            className="text-base"
                                        />
                                        {errors.nombre && (
                                            <HelperText color="failure" className="mt-2 flex items-center">
                                                <HiExclamationCircle className="h-4 w-4 mr-1" />
                                                {errors.nombre.message}
                                            </HelperText>
                                        )}
                                        <HelperText className="mt-1 text-xs text-gray-500">
                                            Nombre exacto del modelo según el fabricante
                                        </HelperText>
                                    </div>

                                    {/* Código mejorado con validación en tiempo real */}
                                    <div>
                                        <Label htmlFor="codigo_modelo" className="mb-3 block">
                                            <div className="flex items-center space-x-2">
                                                <HiClipboardList className="h-4 w-4 text-gray-600" />
                                                <span className="text-base font-semibold text-gray-900">Código Interno del Sistema</span>
                                                <span className="text-red-500 ml-1">*</span>
                                                {codigoValidated && !errors.codigo_modelo && (
                                                    <HiCheckCircle className="h-4 w-4 text-green-500" />
                                                )}
                                                {errors.codigo_modelo && (
                                                    <HiX className="h-4 w-4 text-red-500" />
                                                )}
                                            </div>
                                        </Label>
                                        <TextInput
                                            id="codigo_modelo"
                                            type="number"
                                            placeholder="Ejemplo: 2001, 2050, 3015"
                                            {...register('codigo_modelo', {
                                                required: 'El código interno es obligatorio',
                                                min: {
                                                    value: 1000,
                                                    message: 'Debe ser mayor a 1000'
                                                },
                                                max: {
                                                    value: 9999,
                                                    message: 'Debe ser menor a 10000'
                                                }
                                            })}
                                            color={errors.codigo_modelo ? 'failure' : 'gray'}
                                            disabled={isSubmitting}
                                            className="text-base"
                                        />
                                        {errors.codigo_modelo && (
                                            <HelperText color="failure" className="mt-2 flex items-center">
                                                <HiExclamationCircle className="h-4 w-4 mr-1" />
                                                {errors.codigo_modelo.message}
                                            </HelperText>
                                        )}
                                        {codigoValidated && !errors.codigo_modelo && (
                                            <HelperText color="success" className="mt-2 flex items-center">
                                                <HiCheckCircle className="h-4 w-4 mr-1" />
                                                Código disponible y válido
                                            </HelperText>
                                        )}
                                        <HelperText className="mt-1 text-xs text-gray-500">
                                            Código único para identificar el modelo (entre 1000 y 9999)
                                        </HelperText>
                                    </div>
                                </div>

                                {/* Descripción mejorada */}
                                <div className="mt-6">
                                    <Label htmlFor="descripcion" className="mb-3 block">
                                        <div className="flex items-center space-x-2">
                                            <HiDocumentText className="h-4 w-4 text-gray-600" />
                                            <span className="text-base font-semibold text-gray-900">Descripción Técnica</span>
                                            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Opcional</span>
                                        </div>
                                    </Label>
                                    <Textarea
                                        id="descripcion"
                                        placeholder="Ejemplo: Router inalámbrico dual band con 4 puertos Ethernet, soporte WiFi 6, velocidad hasta 1200 Mbps..."
                                        rows={3}
                                        {...register('descripcion', {
                                            maxLength: {
                                                value: 500,
                                                message: 'No puede exceder 500 caracteres'
                                            }
                                        })}
                                        disabled={isSubmitting}
                                        className="text-base"
                                    />
                                    {errors.descripcion && (
                                        <HelperText color="failure" className="mt-2 flex items-center">
                                            <HiExclamationCircle className="h-4 w-4 mr-1" />
                                            {errors.descripcion.message}
                                        </HelperText>
                                    )}
                                    <HelperText className="mt-1 text-xs text-gray-500">
                                        Características técnicas del modelo (puertos, velocidades, capacidades)
                                    </HelperText>
                                </div>
                            </div>
                        </div>

                        {/* Sección de Componentes mejorada */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-green-100 px-6 py-4 border-b border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold">
                                            2
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <HiCollection className="h-5 w-5 text-green-600" />
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900">Componentes del Modelo</h4>
                                                <p className="text-green-700 text-sm">Agregue las partes que incluye este modelo</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Button
                                            type="button"
                                            size="sm"
                                            color="green"
                                            onClick={agregarComponente}
                                            disabled={componentesSeleccionados.length >= 10 || isSubmitting}
                                        >
                                            <HiPlus className="mr-2 h-4 w-4" />
                                            Agregar Componente
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                {/* Error de componentes */}
                                {componentesError && (
                                    <Alert color="failure" className="mb-6">
                                        <HiExclamationCircle className="h-5 w-5" />
                                        <span className="ml-2 font-medium">{componentesError}</span>
                                    </Alert>
                                )}

                                {componentesSeleccionados.length === 0 ? (
                                    <div className="text-center py-12 bg-green-50 rounded-xl border-2 border-dashed border-green-300">
                                        <div className="mb-6">
                                            <HiCollection className="mx-auto h-16 w-16 text-green-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                            Agregue los componentes del modelo
                                        </h3>
                                        <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                                            Los componentes son las partes físicas que incluye este modelo
                                            (cables, adaptadores, antenas, manual, etc.).
                                            <strong> Es obligatorio agregar al menos uno.</strong>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {componentesSeleccionados.map((componente, index) => (
                                            <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                                                            {index + 1}
                                                        </div>
                                                        <h6 className="text-base font-semibold text-gray-900">
                                                            Componente #{index + 1}
                                                        </h6>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        color="red"
                                                        onClick={() => removerComponente(index)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <HiTrash className="h-4 w-4 mr-2" />
                                                        Eliminar
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                                    {/* Selector de Componente */}
                                                    <div className="lg:col-span-3">
                                                        <Label className="block text-sm font-medium text-gray-700 mb-2">
                                                            <div className="flex items-center space-x-2">
                                                                <HiCog className="h-4 w-4 text-gray-600" />
                                                                <span>¿Qué tipo de componente es?</span>
                                                                <span className="text-red-500">*</span>
                                                                {componente.componente_id && (
                                                                    <HiCheckCircle className="h-4 w-4 text-green-500" />
                                                                )}
                                                            </div>
                                                        </Label>
                                                        <Select
                                                            value={componente.componente_id}
                                                            onChange={(e) => actualizarComponente(index, 'componente_id', e.target.value)}
                                                            color={componente.componente_id ? 'gray' : 'failure'}
                                                            disabled={isSubmitting}
                                                        >
                                                            <option value="">Seleccione el tipo de componente</option>
                                                            {getComponentesDisponibles(index).map((comp) => (
                                                                <option key={comp.id} value={comp.id}>
                                                                    {comp.nombre}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                        {!componente.componente_id && (
                                                            <HelperText color="failure" className="mt-1 flex items-center">
                                                                <HiExclamationCircle className="h-4 w-4 mr-1" />
                                                                Debe seleccionar un componente
                                                            </HelperText>
                                                        )}
                                                    </div>

                                                    {/* Campo de Cantidad */}
                                                    <div>
                                                        <Label className="block text-sm font-medium text-gray-700 mb-2">
                                                            <div className="flex items-center space-x-2">
                                                                <HiClipboardList className="h-4 w-4 text-gray-600" />
                                                                <span>¿Cuántos?</span>
                                                                <span className="text-red-500">*</span>
                                                                {componente.cantidad > 0 && (
                                                                    <HiCheckCircle className="h-4 w-4 text-green-500" />
                                                                )}
                                                            </div>
                                                        </Label>
                                                        <TextInput
                                                            type="number"
                                                            min="1"
                                                            max="999"
                                                            placeholder="1"
                                                            value={componente.cantidad}
                                                            onChange={(e) => actualizarComponente(index, 'cantidad', parseInt(e.target.value) || 1)}
                                                            disabled={!componente.componente_id || isSubmitting}
                                                            color={componente.cantidad > 0 ? 'gray' : 'failure'}
                                                        />
                                                        {componente.cantidad <= 0 && (
                                                            <HelperText color="failure" className="mt-1 flex items-center">
                                                                <HiExclamationCircle className="h-4 w-4 mr-1" />
                                                                Cantidad debe ser mayor a 0
                                                            </HelperText>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Confirmación del componente */}
                                                {componente.nombre && (
                                                    <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                                                        <div className="flex items-center space-x-2">
                                                            <HiCheckCircle className="h-5 w-5 text-green-500" />
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {componente.nombre} - Cantidad: {componente.cantidad}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Resumen final */}
                                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                            <h5 className="font-semibold text-green-800 mb-3 flex items-center space-x-2">
                                                <HiClipboardList className="h-5 w-5" />
                                                <span>Resumen de Componentes ({componentesSeleccionados.length})</span>
                                            </h5>
                                            <div className="space-y-2">
                                                {componentesSeleccionados
                                                    .filter(comp => comp.componente_id && comp.nombre)
                                                    .map((comp, index) => (
                                                        <div key={index} className="flex items-center justify-between bg-white rounded px-3 py-2 border border-green-200">
                                                            <span className="text-gray-900 font-medium">{comp.nombre}</span>
                                                            <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-bold">
                                                                × {comp.cantidad}
                                                            </span>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                            {componentesSeleccionados.some(comp => !comp.componente_id || !comp.nombre) && (
                                                <Alert color="warning" className="mt-4">
                                                    <HiExclamationCircle className="h-4 w-4" />
                                                    <span className="ml-2 text-sm font-medium">
                                                        Complete todos los componentes antes de guardar el modelo
                                                    </span>
                                                </Alert>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </ModalBody>

            {/* Footer mejorado */}
            <ModalFooter className="border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 w-full">
                    {/* Estado del formulario */}
                    <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${
                            isFormComplete() ? 'bg-green-500' : 'bg-orange-500'
                        }`}></div>
                        <span className={`text-sm font-medium flex items-center space-x-2 ${
                            isFormComplete() ? 'text-green-700' : 'text-orange-700'
                        }`}>
                            {isFormComplete() ? (
                                <>
                                    <HiCheckCircle className="h-4 w-4" />
                                    <span>Todo está listo para guardar el modelo</span>
                                </>
                            ) : (
                                <>
                                    <HiExclamationCircle className="h-4 w-4" />
                                    <span>Complete los campos obligatorios para continuar</span>
                                </>
                            )}
                        </span>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button
                            color="gray"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-initial"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            onClick={handleSubmit(onFormSubmit)}
                            disabled={isSubmitting || !isFormComplete()}
                            color="green"
                            className="flex-1 sm:flex-initial"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                    Guardando...
                                </div>
                            ) : (
                                modelo ? 'Actualizar Modelo' : 'Crear Modelo'
                            )}
                        </Button>
                    </div>
                </div>
            </ModalFooter>
        </Modal>
    );
};

export default ModeloForm;
