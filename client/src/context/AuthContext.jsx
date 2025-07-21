import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            try {
                const decoded = jwtDecode(storedToken);
                if (decoded.exp * 1000 < Date.now()) {
                    logout(); // Token expirado
                } else {
                    setUser(JSON.parse(storedUser));
                    setToken(storedToken);
                }
            } catch (e) {
                console.error('❌ Error al decodificar el token:', e);
                logout();
            }
        }

        setLoading(false);
    }, []);

    const login = (userData, accessToken) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', accessToken);
        setUser(userData);
        setToken(accessToken);
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        navigate('/');
    };

    const hasPermission = (recurso, accion) => {
        if (!user || !user.permisos) return false;
        return user.permisos.some(
            (perm) => perm.recurso === recurso && perm.accion === accion
        );
    };

    // 🆕 Función para verificar si el token está expirado
    const isTokenExpired = (tokenToCheck = token) => {
        if (!tokenToCheck) return true;

        try {
            const decoded = jwtDecode(tokenToCheck);
            return decoded.exp * 1000 < Date.now();
        } catch (e) {
            console.error('❌ Error verificando token:', e);
            return true;
        }
    };

    // 🆕 Función para obtener un token válido
    const getValidToken = async () => {
        if (!token) {
            throw new Error('No hay token disponible');
        }

        if (isTokenExpired(token)) {
            // Aquí podrías implementar refresh token si lo tienes
            // Por ahora, redirigir al login
            console.warn('⚠️ Token expirado, redirigiendo al login');
            logout();
            throw new Error('Token expirado');
        }

        return token;
    };

    // 🆕 Función para hacer peticiones autenticadas
    const makeAuthenticatedRequest = async (requestFunction) => {
        try {
            const validToken = await getValidToken();
            return await requestFunction(validToken);
        } catch (error) {
            console.error('❌ Error en petición autenticada:', error);
            throw error;
        }
    };

    // 🆕 Función para refrescar el token (si tienes refresh token)
    const refreshToken = async () => {
        try {
            // Implementar lógica de refresh token aquí
            // const response = await fetch('/api/auth/refresh', {
            //     method: 'POST',
            //     headers: { 'Authorization': `Bearer ${token}` }
            // });
            // const newToken = await response.json();
            // setToken(newToken);
            // localStorage.setItem('token', newToken);

            console.log('🔄 Refresh token no implementado aún');
            logout(); // Por ahora, cerrar sesión
        } catch (error) {
            console.error('❌ Error refrescando token:', error);
            logout();
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            hasPermission,
            loading,
            isTokenExpired,
            getValidToken,
            makeAuthenticatedRequest,
            refreshToken
        }}>
            {children}
        </AuthContext.Provider>
    );
};
