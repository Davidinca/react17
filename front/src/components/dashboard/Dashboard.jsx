import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import Layout from './Layout';
import "../../styles/dashboard.css";

// Configuración de la API
const API_BASE_URL = 'http://localhost:8000/api';

function Dashboard() {
  const history = useHistory();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalRoles: 0,
    totalPermisos: 0,
    pendientesMigracion: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  // Validación de código COTEL
  const validateCodigoCotel = (codigo) => {
    return /^\d+$/.test(codigo) && codigo.length >= 3;
  };

  // Función para mostrar alertas
  const showAlert = useCallback((message, type = 'info') => {
    setError(message);
    
    // Auto-dismiss después de 5 segundos
    setTimeout(() => {
      setError('');
    }, 5000);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      history.push('/login');
      return;
    }

    loadDashboardData();
  }, [history]);

  // Cargar todos los datos del dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas
      const statsResponse = await axios.get(`${API_BASE_URL}/dashboard/stats/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(statsResponse.data);

      // Cargar actividad reciente
      const activityResponse = await axios.get(`${API_BASE_URL}/dashboard/activity/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setRecentActivity(activityResponse.data);

      // Cargar notificaciones
      const notificationsResponse = await axios.get(`${API_BASE_URL}/dashboard/notifications/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(notificationsResponse.data);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showAlert('Error al cargar los datos del dashboard', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ========== USUARIOS ==========
  const loadUsuarios = async (search = '', tipo = '', activo = '') => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (tipo) params.append('tipo', tipo);
      if (activo) params.append('activo', activo);

      const response = await axios.get(`${API_BASE_URL}/usuarios/?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error loading usuarios:', error);
      showAlert('Error al cargar usuarios', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ========== ROLES ==========
  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/roles/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setRoles(response.data);
    } catch (error) {
      console.error('Error loading roles:', error);
      showAlert('Error al cargar roles', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ========== PERMISOS ==========
  const loadPermisos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/permisos/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setPermisos(response.data);
    } catch (error) {
      console.error('Error loading permisos:', error);
      showAlert('Error al cargar permisos', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ========== MIGRACIÓN ==========
  const migrateUsuario = async (codigocotel) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/migrar-usuario/`, {
        codigocotel
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        showAlert(response.data.message, 'success');
        loadMigrationStats();
      } else {
        showAlert(response.data.error, 'danger');
      }
    } catch (error) {
      console.error('Error migrating user:', error);
      showAlert('Error al migrar usuario', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ========== EMPLEADOS ==========
  const loadEmpleados = async (search = '') => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await axios.get(`${API_BASE_URL}/empleados-disponibles/?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setEmpleados(response.data);
    } catch (error) {
      console.error('Error loading empleados:', error);
      showAlert('Error al cargar empleados', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ========== CAMBIO DE CONTRASEÑA ==========
  const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    if (newPassword !== confirmPassword) {
      showAlert('Las contraseñas no coinciden', 'warning');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/change-password/`, {
        old_password: oldPassword,
        new_password: newPassword
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        showAlert('Contraseña cambiada exitosamente', 'success');
        // Actualizar token
        localStorage.setItem('token', response.data.token);
      } else {
        showAlert(response.data.error, 'danger');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showAlert('Error al cambiar contraseña', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ========== CREAR USUARIO ==========
  const createUsuario = async (formData) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/usuarios/`, formData, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        showAlert('Usuario creado exitosamente', 'success');
        loadUsuarios();
      } else {
        showAlert(response.data.error, 'danger');
      }
    } catch (error) {
      console.error('Error creating usuario:', error);
      showAlert('Error al crear usuario', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar contenido según la sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="content-section">
            <h1 className="page-header">Dashboard</h1>
            
            {/* Stats Cards */}
            <div className="row">
              <div className="col-lg-3 col-md-6">
                <div className="panel panel-primary">
                  <div className="panel-heading">
                    <div className="row">
                      <div className="col-xs-3">
                        <i className="fa fa-users fa-5x"></i>
                      </div>
                      <div className="col-xs-9 text-right">
                        <div className="huge">{stats.totalUsuarios}</div>
                        <div>Usuarios Totales</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="panel panel-green">
                  <div className="panel-heading">
                    <div className="row">
                      <div className="col-xs-3">
                        <i className="fa fa-user-circle fa-5x"></i>
                      </div>
                      <div className="col-xs-9 text-right">
                        <div className="huge">{stats.totalRoles}</div>
                        <div>Roles Activos</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="panel panel-yellow">
                  <div className="panel-heading">
                    <div className="row">
                      <div className="col-xs-3">
                        <i className="fa fa-lock fa-5x"></i>
                      </div>
                      <div className="col-xs-9 text-right">
                        <div className="huge">{stats.totalPermisos}</div>
                        <div>Permisos</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="panel panel-red">
                  <div className="panel-heading">
                    <div className="row">
                      <div className="col-xs-3">
                        <i className="fa fa-exchange fa-5x"></i>
                      </div>
                      <div className="col-xs-9 text-right">
                        <div className="huge">{stats.pendientesMigracion}</div>
                        <div>Pendientes Migración</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="row">
              <div className="col-lg-8">
                <div className="panel panel-default">
                  <div className="panel-heading">
                    <i className="fa fa-clock-o"></i> Actividad Reciente
                  </div>
                  <div className="panel-body">
                    <div className="list-group">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="list-group-item">
                          <i className={`fa ${activity.icon}`}></i>
                          {activity.text}
                          <span className="pull-right text-muted">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="panel panel-default">
                  <div className="panel-heading">
                    <i className="fa fa-bell"></i> Notificaciones
                  </div>
                  <div className="panel-body">
                    <div className="list-group">
                      {notifications.map((notification, index) => (
                        <div key={index} className="list-group-item">
                          <i className={`fa fa-bell text-${notification.type}`}></i>
                          {notification.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'usuarios':
        return (
          <div className="content-section">
            <h1 className="page-header">
              Gestión de Usuarios
              <button className="btn btn-primary pull-right" data-toggle="modal" data-target="#createUsuarioModal">
                <i className="fa fa-plus"></i> Nuevo Usuario
              </button>
            </h1>

            {/* Filters */}
            <div className="row">
              <div className="col-md-12">
                <div className="panel panel-default">
                  <div className="panel-body">
                    <form className="form-inline">
                      <div className="form-group">
                        <label>Buscar:</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Nombre, apellido o código..."
                          onChange={(e) => loadUsuarios(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Tipo:</label>
                        <select 
                          className="form-control" 
                          onChange={(e) => loadUsuarios('', e.target.value)}
                        >
                          <option value="">Todos</option>
                          <option value="manual">Manuales</option>
                          <option value="migrado">Migrados</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Estado:</label>
                        <select 
                          className="form-control" 
                          onChange={(e) => loadUsuarios('', '', e.target.value)}
                        >
                          <option value="">Todos</option>
                          <option value="true">Activos</option>
                          <option value="false">Inactivos</option>
                        </select>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="panel panel-default">
              <div className="panel-body">
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Código COTEL</th>
                        <th>Nombre Completo</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Tipo</th>
                        <th>Fecha Creación</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map(usuario => (
                        <tr key={usuario.id}>
                          <td>{usuario.codigocotel}</td>
                          <td>{usuario.nombre_completo}</td>
                          <td>
                            <span className="badge badge-info">{usuario.rol_nombre || 'Sin rol'}</span>
                          </td>
                          <td>
                            <span className={`badge ${usuario.is_active ? 'badge-success' : 'badge-danger'}`}>
                              {usuario.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${usuario.es_manual ? 'badge-warning' : 'badge-info'}`}>
                              {usuario.es_manual ? 'Manual' : 'Migrado'}
                            </span>
                          </td>
                          <td>{new Date(usuario.fecha_creacion).toLocaleDateString()}</td>
                          <td className="action-buttons">
                            <button className="btn btn-xs btn-primary">
                              <i className="fa fa-edit"></i>
                            </button>
                            <button className="btn btn-xs btn-warning">
                              <i className="fa fa-key"></i>
                            </button>
                            <button className={`btn btn-xs ${usuario.is_active ? 'btn-danger' : 'btn-success'}`}>
                              <i className={`fa ${usuario.is_active ? 'fa-ban' : 'fa-check'}`}></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'roles':
        return (
          <div className="content-section">
            <h1 className="page-header">
              Gestión de Roles
              <button className="btn btn-primary pull-right" data-toggle="modal" data-target="#createRolModal">
                <i className="fa fa-plus"></i> Nuevo Rol
              </button>
            </h1>

            <div className="panel panel-default">
              <div className="panel-body">
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Permisos</th>
                        <th>Usuarios</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map(rol => (
                        <tr key={rol.id}>
                          <td>{rol.nombre}</td>
                          <td>
                            <span className="badge badge-info">{rol.permisos_count || 0} permisos</span>
                          </td>
                          <td>
                            <span className="badge badge-success">{rol.usuarios_count || 0} usuarios</span>
                          </td>
                          <td>
                            <span className={`badge ${rol.activo ? 'badge-success' : 'badge-danger'}`}>
                              {rol.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="action-buttons">
                            <button className="btn btn-xs btn-primary">
                              <i className="fa fa-edit"></i>
                            </button>
                            <button className="btn btn-xs btn-info">
                              <i className="fa fa-copy"></i>
                            </button>
                            <button className={`btn btn-xs btn-danger ${rol.usuarios_count > 0 ? 'disabled' : ''}`}>
                              <i className="fa fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'permisos':
        return (
          <div className="content-section">
            <h1 className="page-header">
              Gestión de Permisos
              <button className="btn btn-primary pull-right" data-toggle="modal" data-target="#createPermisoModal">
                <i className="fa fa-plus"></i> Nuevo Permiso
              </button>
            </h1>

            <div className="panel panel-default">
              <div className="panel-body">
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Recurso</th>
                        <th>Acción</th>
                        <th>En Uso</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permisos.map(permiso => (
                        <tr key={permiso.id}>
                          <td>{permiso.recurso}</td>
                          <td>
                            <span className="badge badge-primary">{permiso.accion}</span>
                          </td>
                          <td>
                            <span className={`badge ${permiso.esta_en_uso ? 'badge-success' : 'badge-warning'}`}>
                              {permiso.esta_en_uso ? 'En uso' : 'Sin usar'}
                            </span>
                          </td>
                          <td className="action-buttons">
                            <button className="btn btn-xs btn-primary">
                              <i className="fa fa-edit"></i>
                            </button>
                            <button className={`btn btn-xs btn-danger ${permiso.esta_en_uso ? 'disabled' : ''}`}>
                              <i className="fa fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'migracion':
        return (
          <div className="content-section">
            <h1 className="page-header">Migración de Usuarios</h1>

            <div className="row">
              <div className="col-md-6">
                <div className="panel panel-primary">
                  <div className="panel-heading">
                    <h3 className="panel-title">Migrar Usuario Individual</h3>
                  </div>
                  <div className="panel-body">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      migrateUsuario(e.target.codigocotel.value);
                    }}>
                      <div className="form-group">
                        <label htmlFor="codigocotel">Código COTEL:</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          id="codigocotel" 
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-primary">
                        <i className="fa fa-exchange"></i> Migrar Usuario
                      </button>
                    </form>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="panel panel-info">
                  <div className="panel-heading">
                    <h3 className="panel-title">Estadísticas de Migración</h3>
                  </div>
                  <div className="panel-body">
                    <div className="row">
                      <div className="col-md-6">
                        <strong>Total Empleados:</strong>
                        <span className="text-primary">{stats.totalEmpleados}</span>
                      </div>
                      <div className="col-md-6">
                        <strong>Migrados:</strong>
                        <span className="text-success">{stats.totalMigrados}</span>
                      </div>
                    </div>
                    <div className="row mt-10">
                      <div className="col-md-6">
                        <strong>Disponibles:</strong>
                        <span className="text-warning">{stats.totalDisponibles}</span>
                      </div>
                      <div className="col-md-6">
                        <strong>Progreso:</strong>
                        <span className="text-info">{stats.porcentajeMigrado}%</span>
                      </div>
                    </div>
                    <div className="progress mt-10">
                      <div 
                        className="progress-bar progress-bar-success" 
                        style={{ width: `${stats.porcentajeMigrado}%` }}
                      >
                        {stats.porcentajeMigrado}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'empleados':
        return (
          <div className="content-section">
            <h1 className="page-header">Empleados Disponibles para Migración</h1>

            <div className="row">
              <div className="col-md-12">
                <div className="panel panel-default">
                  <div className="panel-body">
                    <div className="form-group">
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Buscar empleados por nombre, apellido o código..."
                        onChange={(e) => loadEmpleados(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel panel-default">
              <div className="panel-body">
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Código COTEL</th>
                        <th>Nombre Completo</th>
                        <th>Fecha Ingreso</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empleados.map(empleado => (
                        <tr key={empleado.id}>
                          <td>{empleado.codigocotel}</td>
                          <td>{empleado.nombre_completo}</td>
                          <td>{new Date(empleado.fechaingreso).toLocaleDateString()}</td>
                          <td>
                            <button 
                              className="btn btn-xs btn-success" 
                              onClick={() => migrateUsuario(empleado.codigocotel)}
                            >
                              <i className="fa fa-exchange"></i> Migrar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      <div className="main">
        {error && (
          <div className="alert alert-danger alert-fixed">
            {error}
          </div>
        )}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            Cargando...
          </div>
        )}
        {renderContent()}
      </div>
    </Layout>
  );
}

export default Dashboard;