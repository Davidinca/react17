import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Modal, ModalBody, ModalHeader, Button, Label,
    TextInput, Textarea, Select, HelperText, Card, Spinner
} from 'flowbite-react';
import { useForm } from 'react-hook-form';
import { useMarcas, useTiposEquipo, useEstadosEquipo, useLotes, useModelosWithFilters } from '../../../hooks/useAlmacenes';
import { toast } from 'react-hot-toast';

const EquipoONUForm = ({ isOpen, onClose, equipo = null, onSubmit, loading = false }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [dataLoaded, setDataLoaded] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);

    // Hooks para datos de referencia
    const { marcas, fetchMarcas } = useMarcas();
    const { data: tiposEquipo, fetchData: fetchTiposEquipo } = useTiposEquipo();
    const { data: estadosEquipo, fetchData: fetchEstadosEquipo } = useEstadosEquipo();
    const { data: lotes, fetchData: fetchLotes } = useLotes();
    const { modelos, fetchModelos } = useModelosWithFilters();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm({
        defaultValues: {
            codigo_interno: '',
            modelo: '',
            tipo_equipo: '',
            lote: '',
            mac_address: '',
            gpon_serial: '',
            serial_manufacturer: '',
            estado: '',
            observaciones: ''
        }
    });

    // Función para triggear refresh automático
    const triggerRefresh = useCallback(() => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('refresh', Date.now().toString());
        setSearchParams(currentParams);
    }, [searchParams, setSearchParams]);

    // Cargar datos SOLO cuando se abre el modal y no se han cargado antes
    useEffect(() => {
        if (isOpen && !dataLoaded && !isInitializing) {
            setIsInitializing(true);

            const loadAllData = async () => {
                try {
                    console.log('📦 Cargando datos del formulario...');

                    // Cargar todos los datos en paralelo (sin pausas innecesarias)
                    await Promise.all([
                        fetchMarcas(),
                        fetchTiposEquipo(),
                        fetchEstadosEquipo(),
                        fetchLotes(),
                        fetchModelos()
                    ]);

                    setDataLoaded(true);
                    console.log('✅ Datos cargados exitosamente');

                } catch (error) {
                    console.error('❌ Error cargando datos:', error);
                    toast.error('Error al cargar los datos del formulario');
                } finally {
                    setIsInitializing(false);
                }
            };

            loadAllData();
        }

        // Reset cuando se cierra el modal
        if (!isOpen) {
            setDataLoaded(false);
            setIsInitializing(false);
        }
    }, [isOpen]); // SOLO depende de isOpen

    // Configurar formulario cuando los datos estén listos Y cuando cambie el equipo
    useEffect(() => {
        if (dataLoaded && isOpen) {
            if (equipo) {
                console.log('🔧 Configurando formulario para edición:', equipo);

                reset({
                    codigo_interno: equipo.codigo_interno || '',
                    modelo: equipo.modelo ? String(equipo.modelo) : '',
                    tipo_equipo: equipo.tipo_equipo ? String(equipo.tipo_equipo) : '',
                    lote: equipo.lote ? String(equipo.lote) : '',
                    mac_address: equipo.mac_address || '',
                    gpon_serial: equipo.gpon_serial || '',
                    serial_manufacturer: equipo.serial_manufacturer || '',
                    estado: equipo.estado ? String(equipo.estado) : '',
                    observaciones: equipo.observaciones || ''
                });

                console.log('✅ Formulario configurado');
            } else {
                // Nuevo equipo - formulario limpio
                reset({
                    codigo_interno: '',
                    modelo: '',
                    tipo_equipo: '',
                    lote: '',
                    mac_address: '',
                    gpon_serial: '',
                    serial_manufacturer: '',
                    estado: '',
                    observaciones: ''
                });
            }
        }
    }, [dataLoaded, equipo, isOpen]); // Solo cuando cambie dataLoaded, equipo o isOpen

    // Auto-refresh SOLO cuando se recibe el parámetro refresh específico
    useEffect(() => {
        const refreshParam = searchParams.get('refresh');
        if (refreshParam && isOpen && dataLoaded) {
            console.log('🔄 Refrescando datos...');

            // Refresh simple sin bucles
            fetchMarcas();
            fetchTiposEquipo();
            fetchEstadosEquipo();
            fetchLotes();
            fetchModelos();
        }
    }, [searchParams.get('refresh')]); // Solo cuando cambie el parámetro refresh

    // Generar código interno automático
    const generateCodigoInterno = () => {
        const timestamp = Date.now().toString().slice(-6);
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const codigo = `EQ-${timestamp}${randomNum}`;
        setValue('codigo_interno', codigo);
    };

    // Formatear MAC Address
    const formatMacAddress = (value) => {
        if (!value) return '';
        const clean = value.replace(/[^a-fA-F0-9]/g, '');
        const formatted = clean.match(/.{1,2}/g)?.join(':') || clean;
        return formatted.substring(0, 17).toUpperCase();
    };

    const handleMacChange = (e) => {
        const formatted = formatMacAddress(e.target.value);
        setValue('mac_address', formatted);
    };

    const onFormSubmit = async (data) => {
        try {
            console.log('🔍 Datos del formulario:', data);

            const formData = {
                ...data,
                // Convertir a int solo si el valor no está vacío
                modelo: data.modelo ? parseInt(data.modelo) : null,
                tipo_equipo: data.tipo_equipo ? parseInt(data.tipo_equipo) : null,
                lote: data.lote ? parseInt(data.lote) : null,
                estado: data.estado ? parseInt(data.estado) : null
            };

            console.log('📤 Enviando:', formData);

            await onSubmit(formData);
            reset();
            onClose();
            triggerRefresh();
        } catch (error) {
            console.error('Error en formulario:', error);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // Validar MAC Address
    const validateMacAddress = (value) => {
        if (!value) return true;
        const macRegex = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i;
        return macRegex.test(value) || 'Formato de MAC inválido (XX:XX:XX:XX:XX:XX)';
    };

    // Loading mientras carga los datos
    if (!dataLoaded || isInitializing) {
        return (
            <Modal show={isOpen} onClose={handleClose} size="4xl">
                <ModalBody className="p-8">
                    <div className="flex flex-col items-center justify-center py-8">
                        <Spinner size="xl" />
                        <p className="mt-4 text-gray-600">
                            {equipo ? 'Cargando datos del equipo...' : 'Preparando formulario...'}
                        </p>
                        <div className="mt-2 text-sm text-gray-500 text-center">
                            Cargando marcas, modelos, tipos, estados y lotes...
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        );
    }

    return (
        <Modal show={isOpen} onClose={handleClose} size="4xl">
            <ModalHeader>
                <div className="flex items-center justify-between w-full">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold">
                            {equipo ? 'Editar Equipo ONU' : 'Registrar Nuevo Equipo ONU'}
                        </h3>
                        {equipo && (
                            <p className="text-sm text-gray-500 mt-1">
                                <span className="font-mono">{equipo.codigo_interno}</span>
                                {equipo.modelo_nombre && (
                                    <span className="ml-2">• {equipo.marca_nombre} {equipo.modelo_nombre}</span>
                                )}
                            </p>
                        )}
                    </div>
                </div>
            </ModalHeader>
            <ModalBody>
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                    {/* Información básica */}
                    <Card>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Código Interno */}
                            <div>
                                <Label htmlFor="codigo_interno" value="Código Interno *" className="mb-2 block" />
                                <div className="flex gap-2">
                                    <TextInput
                                        id="codigo_interno"
                                        type="text"
                                        placeholder="EQ-123456789"
                                        {...register('codigo_interno', {
                                            required: 'El código interno es requerido',
                                            minLength: {
                                                value: 3,
                                                message: 'El código debe tener al menos 3 caracteres'
                                            }
                                        })}
                                        color={errors.codigo_interno ? 'failure' : 'gray'}
                                        className="flex-1"
                                    />
                                    {!equipo && (
                                        <Button
                                            type="button"
                                            color="gray"
                                            size="sm"
                                            onClick={generateCodigoInterno}
                                        >
                                            Auto
                                        </Button>
                                    )}
                                </div>
                                {errors.codigo_interno && (
                                    <HelperText color="failure" className="mt-1">
                                        {errors.codigo_interno.message}
                                    </HelperText>
                                )}
                            </div>

                            {/* Modelo */}
                            <div>
                                <Label htmlFor="modelo" value="Modelo *" className="mb-2 block" />
                                <Select
                                    id="modelo"
                                    {...register('modelo', {
                                        required: 'El modelo es requerido'
                                    })}
                                    color={errors.modelo ? 'failure' : 'gray'}
                                >
                                    <option value="">Seleccionar modelo...</option>
                                    {modelos.map((modelo) => (
                                        <option key={modelo.id} value={modelo.id}>
                                            {modelo.marca_nombre} {modelo.nombre} - Código: {modelo.codigo_modelo}
                                        </option>
                                    ))}
                                </Select>
                                {errors.modelo && (
                                    <HelperText color="failure" className="mt-1">
                                        {errors.modelo.message}
                                    </HelperText>
                                )}
                            </div>

                            {/* Tipo de Equipo */}
                            <div>
                                <Label htmlFor="tipo_equipo" value="Tipo de Equipo *" className="mb-2 block" />
                                <Select
                                    id="tipo_equipo"
                                    {...register('tipo_equipo', {
                                        required: 'El tipo de equipo es requerido'
                                    })}
                                    color={errors.tipo_equipo ? 'failure' : 'gray'}
                                >
                                    <option value="">Seleccionar tipo...</option>
                                    {tiposEquipo.map((tipo) => (
                                        <option key={tipo.id} value={tipo.id}>
                                            {tipo.nombre}
                                        </option>
                                    ))}
                                </Select>
                                {errors.tipo_equipo && (
                                    <HelperText color="failure" className="mt-1">
                                        {errors.tipo_equipo.message}
                                    </HelperText>
                                )}
                            </div>

                            {/* Lote */}
                            <div>
                                <Label htmlFor="lote" value="Lote *" className="mb-2 block" />
                                <Select
                                    id="lote"
                                    {...register('lote', {
                                        required: 'El lote es requerido'
                                    })}
                                    color={errors.lote ? 'failure' : 'gray'}
                                >
                                    <option value="">Seleccionar lote...</option>
                                    {lotes.map((lote) => (
                                        <option key={lote.id} value={lote.id}>
                                            {lote.numero_lote} - {lote.proveedor}
                                        </option>
                                    ))}
                                </Select>
                                {errors.lote && (
                                    <HelperText color="failure" className="mt-1">
                                        {errors.lote.message}
                                    </HelperText>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Información Técnica */}
                    <Card>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Información Técnica</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* MAC Address */}
                            <div>
                                <Label htmlFor="mac_address" value="MAC Address *" className="mb-2 block" />
                                <TextInput
                                    id="mac_address"
                                    type="text"
                                    placeholder="XX:XX:XX:XX:XX:XX"
                                    {...register('mac_address', {
                                        required: 'La MAC Address es requerida',
                                        validate: validateMacAddress
                                    })}
                                    onChange={handleMacChange}
                                    color={errors.mac_address ? 'failure' : 'gray'}
                                    maxLength={17}
                                />
                                {errors.mac_address && (
                                    <HelperText color="failure" className="mt-1">
                                        {errors.mac_address.message}
                                    </HelperText>
                                )}
                                <HelperText className="mt-1">
                                    Formato: XX:XX:XX:XX:XX:XX (se formatea automáticamente)
                                </HelperText>
                            </div>

                            {/* GPON Serial */}
                            <div>
                                <Label htmlFor="gpon_serial" value="GPON Serial *" className="mb-2 block" />
                                <TextInput
                                    id="gpon_serial"
                                    type="text"
                                    placeholder="GPON012345678901"
                                    {...register('gpon_serial', {
                                        required: 'El GPON Serial es requerido',
                                        minLength: {
                                            value: 8,
                                            message: 'El GPON Serial debe tener al menos 8 caracteres'
                                        },
                                        maxLength: {
                                            value: 100,
                                            message: 'El GPON Serial no puede exceder 100 caracteres'
                                        }
                                    })}
                                    color={errors.gpon_serial ? 'failure' : 'gray'}
                                />
                                {errors.gpon_serial && (
                                    <HelperText color="failure" className="mt-1">
                                        {errors.gpon_serial.message}
                                    </HelperText>
                                )}
                            </div>

                            {/* Serial Manufacturer */}
                            <div>
                                <Label htmlFor="serial_manufacturer" value="Serial del Fabricante *" className="mb-2 block" />
                                <TextInput
                                    id="serial_manufacturer"
                                    type="text"
                                    placeholder="SN123456789"
                                    {...register('serial_manufacturer', {
                                        required: 'El serial del fabricante es requerido',
                                        minLength: {
                                            value: 4,
                                            message: 'El serial debe tener al menos 4 caracteres'
                                        },
                                        maxLength: {
                                            value: 100,
                                            message: 'El serial no puede exceder 100 caracteres'
                                        }
                                    })}
                                    color={errors.serial_manufacturer ? 'failure' : 'gray'}
                                />
                                {errors.serial_manufacturer && (
                                    <HelperText color="failure" className="mt-1">
                                        {errors.serial_manufacturer.message}
                                    </HelperText>
                                )}
                            </div>

                            {/* Estado */}
                            <div>
                                <Label htmlFor="estado" value="Estado Inicial" className="mb-2 block" />
                                <Select
                                    id="estado"
                                    {...register('estado')}
                                    color={errors.estado ? 'failure' : 'gray'}
                                >
                                    <option value="">Seleccionar estado...</option>
                                    {estadosEquipo.map((estado) => (
                                        <option key={estado.id} value={estado.id}>
                                            {estado.nombre}
                                        </option>
                                    ))}
                                </Select>
                                <HelperText className="mt-1">
                                    Si no se selecciona, se asignará "Disponible" por defecto
                                </HelperText>
                            </div>
                        </div>
                    </Card>

                    {/* Observaciones */}
                    <Card>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Observaciones</h3>
                        <Textarea
                            id="observaciones"
                            placeholder="Notas adicionales sobre el equipo, condición física, etc..."
                            rows={4}
                            {...register('observaciones', {
                                maxLength: {
                                    value: 1000,
                                    message: 'Las observaciones no pueden exceder 1000 caracteres'
                                }
                            })}
                            color={errors.observaciones ? 'failure' : 'gray'}
                        />
                        {errors.observaciones && (
                            <HelperText color="failure" className="mt-1">
                                {errors.observaciones.message}
                            </HelperText>
                        )}
                    </Card>

                    {/* Información adicional para edición */}
                    {equipo && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>
                                    <span className="font-semibold">Creado:</span> {new Date(equipo.created_at).toLocaleDateString('es-BO')}
                                </p>
                                {equipo.updated_at && (
                                    <p>
                                        <span className="font-semibold">Última modificación:</span> {new Date(equipo.updated_at).toLocaleDateString('es-BO')}
                                    </p>
                                )}
                                {equipo.esta_asignado !== undefined && (
                                    <p>
                                        <span className="font-semibold">Estado de asignación:</span>
                                        <span className={equipo.esta_asignado ? 'text-blue-600' : 'text-green-600'}>
                                            {equipo.esta_asignado ? ' Asignado' : ' Disponible'}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                            {loading ? (
                                <>
                                    <Spinner size="sm" className="mr-2" />
                                    Procesando...
                                </>
                            ) : (
                                equipo ? 'Actualizar' : 'Registrar'
                            )}
                        </Button>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    );
};

export default EquipoONUForm;