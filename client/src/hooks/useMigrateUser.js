import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { migrarUsuario } from '../api/auth.js';

export const useMigrateUser = () => {
    const navigate = useNavigate();
    const [fieldErrors, setFieldErrors] = useState({});

    const handleMigrateUser = async (data) => {
        // Limpiar errores previos
        setFieldErrors({});

        try {
            console.log('🔄 Migrando usuario con código:', data.codigocotel);

            await migrarUsuario({ codigocotel: data.codigocotel });

            toast.success('✅ Usuario migrado correctamente');
            setTimeout(() => navigate('/'), 1500); // Redirigir después de un pequeño delay
        } catch (error) {
            const errMsg = error.response?.data?.error;
            const msg = error.response?.data?.message;

            console.error('❌ Error al migrar:', errMsg || msg || error);

            if (errMsg === 'Empleado inactivo.') {
                setFieldErrors({ codigocotel: 'El usuario no está activo' });
                toast.error('🚫 El usuario no está activo');
            } else if (errMsg === 'Código COTEL no encontrado en los empleados.') {
                setFieldErrors({ codigocotel: 'El código COTEL no existe' });
                toast.error('🔍 El código COTEL no existe');
            } else if (msg === 'El usuario ya está registrado.') {
                setFieldErrors({ codigocotel: 'Este usuario ya fue migrado' });
                toast.error('ℹ️ Este usuario ya fue migrado anteriormente');
            } else {
                setFieldErrors({ codigocotel: 'Error al migrar usuario' });
                toast.error('⚠️ ' + (errMsg || msg || 'Error desconocido'));
            }
        }
    };

    const clearFieldError = (fieldName) => {
        setFieldErrors(prev => ({
            ...prev,
            [fieldName]: undefined
        }));
    };

    return {
        handleMigrateUser,
        fieldErrors,
        clearFieldError
    };
};