// hooks/useChangePassword.js
import { useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { changePassword } from '../api/auth.js';
import { AuthContext } from '../context/AuthContext.jsx';

export const useChangePassword = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch
    } = useForm();

    const navigate = useNavigate();
    const newPassword = watch('new_password');
    const { user, login: loginContext } = useContext(AuthContext);

    // Verificar autenticación al montar el componente
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        if (!token || !user) {
            toast.error('Acceso no autorizado');
            navigate('/');
        }
    }, [navigate]);

    // Función para manejar el envío del formulario
    const onSubmit = async (data) => {
        console.log('🟡 Enviando changePassword con:', data);
        let res;

        try {
            const token = localStorage.getItem('token');
            res = await changePassword(
                {
                    old_password: data.old_password,
                    new_password: data.new_password
                },
                token
            );
            console.log('✅ changePassword response:', res);
        } catch (error) {
            console.error('❌ Error en changePassword():', error);
            handleChangePasswordError(error);
            return;
        }

        const { access } = res;
        if (!access) {
            console.error('❌ access token missing in response:', res);
            toast.error('Respuesta inválida del servidor');
            return;
        }

        // Actualizar localStorage y contexto
        updateUserData(access);

        // Mostrar éxito y redirigir
        toast.success('¡Contraseña actualizada con éxito!', {
            icon: '🔒',
            duration: 2000
        });
        setTimeout(() => navigate('/home'), 2000);
    };

    // Función para manejar errores de cambio de contraseña
    const handleChangePasswordError = (error) => {
        if (error.response) {
            const status = error.response.status;
            const errData = error.response.data;

            if (status === 400 && errData.error) {
                toast.error(errData.error, { icon: '🔒' });
            } else if (errData.old_password) {
                toast.error(errData.old_password[0]);
            } else {
                toast.error('Error en el servidor');
            }
        } else {
            toast.error('Error de conexión con el servidor');
        }
    };

    // Función para actualizar datos del usuario
    const updateUserData = (accessToken) => {
        // Actualizar localStorage
        localStorage.setItem('token', accessToken);
        const updatedUser = JSON.parse(localStorage.getItem('user'));
        updatedUser.password_changed = true;
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Actualizar contexto de React
        loginContext(updatedUser, accessToken);
    };

    // Configuración de validaciones
    const validationRules = {
        old_password: {
            required: 'Este campo es obligatorio'
        },
        new_password: {
            required: 'Campo obligatorio',
            minLength: {
                value: 8,
                message: 'Mínimo 8 caracteres'
            },
            pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                message: 'Debe incluir mayúsculas, minúsculas y números'
            }
        },
        confirm_password: {
            required: 'Confirma tu contraseña',
            validate: value => value === newPassword || 'Las contraseñas no coinciden'
        }
    };

    return {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        onSubmit,
        validationRules
    };
};