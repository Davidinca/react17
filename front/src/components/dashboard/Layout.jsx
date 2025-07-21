import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import "../../styles/dashboard.css";

function Layout({ children, activeSection, onSectionChange }) {
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Cleanup para el modal de cambio de contraseña
  useEffect(() => {
    return () => {
      // Limpiar los datos del formulario cuando el componente se desmonta
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    };
  }, []);

  // Manejo de cambio de contraseña
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Por favor complete todos los campos');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await axios.post('/usuarios/change_password/', passwordData);
      if (response.data.success) {
        alert('Contraseña cambiada exitosamente');
        document.getElementById('changePasswordModal').style.display = 'none';
      } else {
        alert(response.data.error || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      alert('Error al cambiar la contraseña. Por favor intente nuevamente.');
    }
  };

  // Manejo de cambios en el formulario
  const handlePasswordInputChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };
  return (
    <div>
      {/* Navigation */}
      <nav className="navbar navbar-inverse navbar-fixed-top">
        <div className="container-fluid">
          <div className="navbar-header">
            <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar">
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>
            <Link className="navbar-brand" to="/dashboard">
              <i className="fa fa-dashboard"></i> Sistema de Gestión
            </Link>
          </div>
          <div id="navbar" className="navbar-collapse collapse">
            <ul className="nav navbar-nav navbar-right">
              <li className="dropdown">
                <a href="#" className="dropdown-toggle" data-toggle="dropdown">
                  <i className="fa fa-user"></i> <span id="user-name">Usuario</span> <span className="caret"></span>
                </a>
                <ul className="dropdown-menu">
                  <li><a href="#" onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('changePasswordModal').style.display = 'block';
                  }}>
                    <i className="fa fa-key"></i> Cambiar Contraseña
                  </a></li>
                  <li className="divider"></li>
                  <li><a href="/login" onClick={(e) => {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    localStorage.removeItem('currentUser');
                    window.location.href = '/login';
                  }}>
                    <i className="fa fa-sign-out"></i> Cerrar Sesión
                  </a></li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <div className="col-sm-3 col-md-2 sidebar">
            <ul className="nav nav-sidebar">
              <li className={activeSection === 'dashboard' ? 'active' : ''}>
                <Link to="/dashboard" onClick={() => onSectionChange('dashboard')}>
                  <i className="fa fa-dashboard"></i> Dashboard
                </Link>
              </li>
              <li className={activeSection === 'usuarios' ? 'active' : ''}>
                <Link to="/dashboard/usuarios" onClick={() => onSectionChange('usuarios')}>
                  <i className="fa fa-users"></i> Usuarios
                </Link>
              </li>
              <li className={activeSection === 'roles' ? 'active' : ''}>
                <Link to="/dashboard/roles" onClick={() => onSectionChange('roles')}>
                  <i className="fa fa-user-secret"></i> Roles
                </Link>
              </li>
              <li className={activeSection === 'permisos' ? 'active' : ''}>
                <Link to="/dashboard/permisos" onClick={() => onSectionChange('permisos')}>
                  <i className="fa fa-key"></i> Permisos
                </Link>
              </li>
              <li className={activeSection === 'migracion' ? 'active' : ''}>
                <Link to="/dashboard/migracion" onClick={() => onSectionChange('migracion')}>
                  <i className="fa fa-exchange"></i> Migración
                </Link>
              </li>
              <li className={activeSection === 'empleados' ? 'active' : ''}>
                <Link to="/dashboard/empleados" onClick={() => onSectionChange('empleados')}>
                  <i className="fa fa-briefcase"></i> Empleados
                </Link>
              </li>
              <li><Link to="/permisos"><i className="fa fa-lock"></i> Permisos</Link></li>
              <li><Link to="/migracion"><i className="fa fa-exchange"></i> Migración</Link></li>
              <li><Link to="/empleados"><i className="fa fa-address-book"></i> Empleados</Link></li>
            </ul>
          </div>

          {/* Main Content Area */}
          <div className="col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main">
            {children}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <div className="modal fade" id="changePasswordModal" tabindex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal">×</button>
              <h4 className="modal-title">Cambiar Contraseña</h4>
            </div>
            <div className="modal-body">
              <form id="change-password-form">
                <div className="form-group">
                  <label>Contraseña Actual:</label>
                  <input type="password" className="form-control" id="old-password" required />
                </div>
                <div className="form-group">
                  <label>Nueva Contraseña:</label>
                  <input type="password" className="form-control" id="new-password" required />
                </div>
                <div className="form-group">
                  <label>Confirmar Nueva Contraseña:</label>
                  <input type="password" className="form-control" id="confirm-password" required />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal">Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={(e) => handlePasswordChange(e)}>
                Cambiar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Layout;
