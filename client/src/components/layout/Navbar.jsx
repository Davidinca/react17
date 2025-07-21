// src/components/CustomNavbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Navbar,
    NavbarBrand,
    Avatar,
    Dropdown,
    DropdownItem,
    DropdownDivider,
    DropdownHeader,
} from 'flowbite-react';
import {
    FiUsers,
    FiUser,
    FiPackage,
    FiFileText,
    FiHardDrive,
    FiServer,
    FiList,
    FiTag,
    FiLayers,
    FiSettings,
    FiWifi,
    FiCpu,
    FiMonitor,
    FiTool,
    FiCheckCircle,
    FiBox,
    FiArchive,
    FiLock,
} from 'react-icons/fi';
import { HiCog, HiLogout, HiChevronRight, HiCollection, HiCube } from 'react-icons/hi';
import { Permiso} from "../../api/permisos.js";

const CustomNavbar = () => {
    const navigate = useNavigate();

    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch {
            return null;
        }
    })();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    // Componente para submenú con posicionamiento lateral
    const SubMenuDropdown = ({ trigger, children, position = "right" }) => {
        return (
            <div className="relative group">
                {trigger}
                <div className={`absolute ${position === 'left' ? 'right-0' : 'left-full'} top-0 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}>
                    <div className="py-1">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    const SubMenuItem = ({ icon: Icon, label, onClick }) => (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary-700 hover:bg-primary-100 transition-colors"
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    return (
        <Navbar
            fluid
            className="bg-primary-500 border-b border-primary-600 shadow-md sticky top-0 z-50 px-4 py-2"
        >
            {/* Marca */}
            <NavbarBrand>
                <span className="text-white font-bold text-xl">COTEL R. L.</span>
            </NavbarBrand>

            {/* Navegación principal (oculta en sm, visible en md+) */}
            <div className="hidden md:flex items-center gap-4">
                {/* Dropdown Contratos */}
                <Dropdown
                    label="Contratos"
                    className="text-white"
                    style={{
                        backgroundColor: 'transparent',
                        border: '1px solid white',
                        borderRadius: '0.5rem',
                        padding: '0.25rem 0.75rem'
                    }}
                >
                    <DropdownHeader>
                        <span className="block text-sm font-medium text-primary-700">Gestión de Contratos</span>
                    </DropdownHeader>
                    <DropdownItem
                        icon={FiFileText}
                        onClick={() => navigate('/buscar-contrato')}
                        className="text-primary-700 hover:bg-primary-100"
                    >
                        Buscar Contrato
                    </DropdownItem>
                </Dropdown>

                {/* Dropdown Usuarios */}
                <Permiso recurso="usuarios" accion="leer">
                    <Dropdown
                        label="Usuarios"
                        className="text-white"
                        style={{
                            backgroundColor: 'transparent',
                            border: '1px solid white',
                            borderRadius: '0.5rem',
                            padding: '0.25rem 0.75rem'
                        }}
                    >
                        <DropdownHeader>
                            <span className="block text-sm font-medium text-primary-700">Gestión de Usuarios</span>
                        </DropdownHeader>
                        <DropdownItem
                            icon={FiLock }
                            onClick={() => navigate('/usuarios/permisos')}
                            className="text-primary-700 hover:bg-primary-100"
                        >
                            Permiso de Usuarios
                        </DropdownItem>
                        <DropdownItem
                            icon={HiCog}
                            onClick={() => navigate('/usuarios/roles')}
                            className="text-primary-700 hover:bg-primary-100"
                        >
                            Roles de Usuario
                        </DropdownItem>
                        <DropdownItem
                            icon={FiUser}
                            onClick={() => navigate('/usuarios/usuarios')}
                            className="text-primary-700 hover:bg-primary-100"
                        >
                            Usuarios
                        </DropdownItem>
                    </Dropdown>
                </Permiso>


                {/* Dropdown Almacenes con submenús laterales */}
                <Permiso recurso="almacenesnav" accion="leer">


                <Dropdown
                    label="Almacenes"
                    className="text-white"
                    style={{
                        backgroundColor: 'transparent',
                        border: '1px solid white',
                        borderRadius: '0.5rem',
                        padding: '0.25rem 0.75rem'
                    }}
                >
                    <DropdownHeader>
                        <span className="block text-sm font-medium text-primary-700">Inventario</span>
                    </DropdownHeader>
                    <Permiso recurso="equiposonu" accion="leer">
                        <DropdownItem
                            icon={FiWifi}
                            onClick={() => navigate('/almacenes/equipos')}
                            className="text-primary-700 hover:bg-primary-100"
                        >
                            Equipos Onu
                        </DropdownItem>
                    </Permiso>
                    <DropdownDivider />

                    {/* Submenú Catálogos con hover lateral */}
                    <div className="relative group">
                        <Permiso recurso= "catalogo" accion="leer">
                            <DropdownItem className="text-primary-700 hover:bg-primary-100 flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <HiCollection className="w-4 h-4" />
                                        Catálogos
                                </div>
                                <HiChevronRight className="w-4 h-4" />
                            </DropdownItem>
                        </Permiso>

                        {/* Submenú desplegable lateral */}
                        <div className="absolute left-full top-0 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="py-1">
                                <SubMenuItem
                                    icon={FiTag}
                                    label="Marcas"
                                    onClick={() => navigate('/almacenes/marcas')}
                                />
                                <SubMenuItem
                                    icon={FiCpu}
                                    label="Modelos"
                                    onClick={() => navigate('/almacenes/modelos')}
                                />
                                <SubMenuItem
                                    icon={FiMonitor}
                                    label="Tipos de Equipo"
                                    onClick={() => navigate('/almacenes/tipos-equipo')}
                                />
                                <SubMenuItem
                                    icon={FiTool}
                                    label="Componentes"
                                    onClick={() => navigate('/almacenes/componentes')}
                                />
                                <SubMenuItem
                                    icon={FiCheckCircle}
                                    label="Estados Equipo"
                                    onClick={() => navigate('/almacenes/estados-equipo')}
                                />
                            </div>
                        </div>
                    </div>

                    <DropdownDivider />

                    {/* Submenú Lotes */}
                    <div className="relative group">
                        <Permiso recurso="lotes" accion="leer">
                            <DropdownItem className="text-primary-700 hover:bg-primary-100 flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <FiArchive className="w-4 h-4" />
                                        Lotes
                                </div>
                                <HiChevronRight className="w-4 h-4" />
                            </DropdownItem>
                        </Permiso>


                        {/* Submenú desplegable lateral */}
                        <div className="absolute left-full top-0 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="py-1">
                                <SubMenuItem
                                    icon={FiBox}
                                    label="Lotes"
                                    onClick={() => navigate('/almacenes/lotes')}
                                />
                            </div>
                        </div>
                    </div>
                </Dropdown>
                </Permiso>
            </div>

            {/* Parte derecha: menú móvil + dropdown usuario */}
            <div className="flex items-center gap-3">
                {/* Menú móvil (visible en < md) */}
                <div className="md:hidden">
                    <Dropdown
                        label="Menú"
                        className="text-white"
                        style={{
                            backgroundColor: 'transparent',
                            color: 'white'
                        }}
                    >
                        <DropdownHeader>
                            <span className="block text-sm font-medium text-primary-700">Navegación</span>
                        </DropdownHeader>
                        <DropdownItem
                            icon={FiFileText}
                            onClick={() => navigate('/buscar-contrato')}
                            className="text-primary-700 hover:bg-primary-100"
                        >
                            Contratos
                        </DropdownItem>
                        <DropdownDivider />
                        <DropdownItem
                            icon={FiUsers}
                            onClick={() => navigate('/usuarios')}
                            className="text-primary-700 hover:bg-primary-100"
                        >
                            Gestión de Usuarios
                        </DropdownItem>
                        <DropdownItem
                            icon={HiCog}
                            onClick={() => navigate('/permisos-usuarios')}
                            className="text-primary-700 hover:bg-primary-100"
                        >
                            Permisos de Usuario
                        </DropdownItem>
                        <DropdownDivider />

                        {/* Almacenes Mobile - todos los items originales */}
                        <DropdownHeader>
                            <span className="block text-xs font-medium text-primary-600">📦 Inventario</span>
                        </DropdownHeader>
                        <DropdownItem
                            icon={FiWifi}
                            onClick={() => navigate('/almacenes/equipos')}
                            className="text-primary-700 hover:bg-primary-100"
                        >
                            Equipos Onu
                        </DropdownItem>

                        <DropdownHeader>
                            <span className="block text-xs font-medium text-primary-600">📋 Catálogos</span>
                        </DropdownHeader>
                        <DropdownItem
                            icon={FiTag}
                            onClick={() => navigate('/almacenes/marcas')}
                            className="text-primary-700 hover:bg-primary-100"
                        >
                            Marcas
                        </DropdownItem>
                        <DropdownItem
                            icon={FiCpu}
                            onClick={() => navigate('/almacenes/modelos')}
                            className="text-primary-700 hover:bg-primary-100"
                        >
                            Modelos
                        </DropdownItem>
                        <DropdownItem
                            icon={FiMonitor}
                            onClick={() => navigate('/almacenes/tipos-equipo')}
                            className="text-primary-700 hover:bg-primary-100"
                        >
                            Tipos de Equipo
                        </DropdownItem>
                        <DropdownItem
                            icon={FiTool}
                            onClick={() => navigate('/almacenes/componentes')}
                            className="text-primary-700 hover:bg-primary-100"
                        >
                            Componentes
                        </DropdownItem>
                        <DropdownItem
                            icon={FiCheckCircle}
                            onClick={() => navigate('/almacenes/estados-equipo')}
                            className="text-primary-700 hover:bg-primary-100"
                        >
                            Estados Equipo
                        </DropdownItem>

                        <DropdownHeader>
                            <span className="block text-xs font-medium text-primary-600">📥 Lotes</span>
                        </DropdownHeader>
                        <DropdownItem
                            icon={FiBox}
                            onClick={() => navigate('/almacenes/lotes')}
                            className="text-primary-700 hover:bg-primary-100"
                        >
                            Lotes
                        </DropdownItem>
                    </Dropdown>
                </div>

                {/* Dropdown Usuario */}
                <Dropdown
                    inline
                    arrowIcon={false}
                    label={
                        <div className="flex items-center gap-2">
                            <Avatar rounded className="bg-white" />
                            <span className="text-white font-medium hidden sm:block">
                                {user?.nombres} {user?.apellidos}
                            </span>
                        </div>
                    }
                >
                    <DropdownHeader>
                        <span className="block text-sm text-primary-700">{user?.nombres} {user?.apellidos}</span>
                    </DropdownHeader>
                    <DropdownItem
                        icon={HiCog}
                        onClick={() => navigate('/change-password')}
                        className="text-primary-700 hover:bg-primary-100"
                    >
                        Cambiar Contraseña
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem
                        icon={HiLogout}
                        onClick={handleLogout}
                        className="text-danger-500 hover:bg-primary-100"
                    >
                        Cerrar Sesión
                    </DropdownItem>
                </Dropdown>
            </div>
        </Navbar>
    );
};

export default CustomNavbar;