import React, { useContext } from 'react';
import { ThemeConfig } from 'flowbite-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

import Login from './pages/Login.jsx';
import MigrateUser from "./pages/MigrateUser.jsx";
import ChangePassword from './pages/ChangePassword';
import BuscarContrato from './pages/BuscarContrato.jsx';
import Loader from "./components/Loader.jsx";
import MarcasPage from "./pages/almacenes/MarcasPage.jsx";
import ModelosPage from "./pages/almacenes/ModelosPage.jsx";
import TiposEquipoPage from "./pages/almacenes/TiposEquipoPage.jsx";
import ComponentesPage from "./pages/almacenes/ComponentesPage.jsx";
import EstadosEquipoPage from "./pages/almacenes/EstadosEquipoPage.jsx";
import LotesPage from "./pages/almacenes/LotePage.jsx";
import EquiposONUPage   from "./pages/almacenes/EquiposONUPage.jsx";
import PermisosPage from "./pages/usuarios/PermisosPage.jsx";
import RolesPage from "./pages/usuarios/RolesPage.jsx";
import UsuariosPage from "./pages/usuarios/UsuariosPage.jsx";

// Componente para proteger rutas que requieren contraseña cambiada
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <Loader />;
    return user?.password_changed ? children : <Navigate to="/change-password" replace />;
};

// Componente para redirigir si ya cambió la contraseña
const PasswordChangeRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <Loader />;
    return user?.password_changed ? <Navigate to="/home" replace /> : children;
};

function App() {
    return (
        <>
            {/* Desactiva el dark mode en runtime */}
            <ThemeConfig dark={false} />

            {/* Rutas de la aplicación (el Router ya está en main.jsx) */}
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/migrar" element={<MigrateUser />} />
                <Route path="/home" element={<ProtectedRoute><Navigate to="/buscar-contrato" replace /></ProtectedRoute>}/>
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/buscar-contrato" element={<ProtectedRoute><BuscarContrato /></ProtectedRoute>}/>
                <Route path="/almacenes/marcas" element={<ProtectedRoute><MarcasPage /></ProtectedRoute>} />
                <Route path="/almacenes/modelos" element={<ProtectedRoute><ModelosPage /></ProtectedRoute>} />
                <Route path="/almacenes/tipos-equipo" element={<ProtectedRoute><TiposEquipoPage /></ProtectedRoute>} />
                <Route path="/almacenes/componentes" element={<ProtectedRoute><ComponentesPage /></ProtectedRoute>} />
                <Route path="/almacenes/estados-equipo" element={<ProtectedRoute><EstadosEquipoPage /></ProtectedRoute>} />
                <Route path="/almacenes/lotes" element={<ProtectedRoute><LotesPage /></ProtectedRoute>} />
                <Route path="/almacenes/equipos" element={<ProtectedRoute><EquiposONUPage /></ProtectedRoute>} />
                <Route path="/usuarios/permisos" element={<ProtectedRoute><PermisosPage /></ProtectedRoute>} />
                <Route path="/usuarios/roles" element={<ProtectedRoute><RolesPage /></ProtectedRoute>} />
                <Route path="/usuarios/usuarios" element={<ProtectedRoute><UsuariosPage /></ProtectedRoute>} />

            </Routes>

        </>
    );
}

export default App;
