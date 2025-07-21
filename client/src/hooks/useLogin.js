import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext.jsx';
import { login as apiLogin } from '../api/auth.js';

export const useLogin = () => {
    const navigate = useNavigate();
    const {login: loginContext} = useContext(AuthContext);
    const [fieldErrors, setFieldErrors] = useState({});

    const handleLogin = async (data) => {
        // Limpiar errores previos
        setFieldErrors({});

        try {
            const res = await apiLogin({
                codigocotel: String(data.codigocotel),
                password: data.password,
            });

            const {access, user_data} = res;
            loginContext(user_data, access);

            if (!user_data.password_changed) {
                toast('Debes cambiar tu contraseña', {icon: '⚠️'});
                navigate('/change-password');
            } else {
                toast.success(`¡Bienvenido ${user_data.nombres}!`);
                navigate('/home');
            }
        } catch (err) {
            if (err.response) {
                const {status, data: errData} = err.response;
                const msg = errData.detail || errData.error;

                if (status === 400) {
                    // Campos faltantes - no debería pasar por las validaciones del frontend
                    toast.error(msg || 'Datos incompletos');
                } else if (status === 404) {
                    // Usuario no existe - código incorrecto
                    setFieldErrors({ codigocotel: 'Usuario no migrado' });
                    toast.error(msg || 'Usuario no migrado', {
                        icon: '⚠️',
                        action: {
                            text: 'Migrar',
                            onClick: () => navigate('/migrar'),
                        },
                    });
                } else if (status === 401) {
                    // Usuario existe pero contraseña incorrecta
                    setFieldErrors({ password: 'Contraseña incorrecta' });
                    toast.error(msg || 'Contraseña incorrecta');
                } else {
                    toast.error(msg || 'Error en el inicio de sesión');
                }
            } else {
                toast.error('Error de conexión con el servidor');
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
        handleLogin,
        fieldErrors,
        clearFieldError
    };
};