// components/Permiso.jsx
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const Permiso = ({ recurso, accion, children }) => {
    const { hasPermission } = useContext(AuthContext);

    if (!hasPermission(recurso, accion)) return null;
    return children;
};
