import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import '../styles/login.css';

// Configuración de la API
const API_BASE_URL = 'http://192.168.1.219:8000/api';

function Login() {
  const history = useHistory();

  // Variables de estado
  const [formData, setFormData] = useState({
    codigocotel: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [migrationData, setMigrationData] = useState({
    codigocotel: ''
  });
  const [changePasswordData, setChangePasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentToken, setCurrentToken] = useState(null);

  // Configuración de axios
  useEffect(() => {
    axios.defaults.baseURL = API_BASE_URL;
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    
    // Configurar interceptores para manejar tokens
    axios.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          history.push('/login');
        }
        return Promise.reject(error);
      }
    );
  }, [history]);

  // Validación de código COTEL
  const validateCodigoCotel = (codigo) => {
    return /^\d+$/.test(codigo) && codigo.length >= 3;
  };

  // Manejo de cambios en formularios
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleMigrationChange = (e) => {
    setMigrationData({
      ...migrationData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setChangePasswordData({
      ...changePasswordData,
      [e.target.name]: e.target.value
    });
  };

  // Manejo de errores de red
  useEffect(() => {
    window.addEventListener('online', () => {
      setError('Conexión restaurada');
    });

    window.addEventListener('offline', () => {
      setError('Sin conexión a internet');
    });

    return () => {
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
    };
  }, []);

  // Función para mostrar alertas
  const showAlert = useCallback((message, type = 'info') => {
    setError(message);
    
    // Auto-dismiss después de 5 segundos
    const timer = setTimeout(() => {
      setError('');
    }, 5000);

    // Limpiar el timer cuando el componente se desmonta
    return () => clearTimeout(timer);
  }, []);

  // Función para mostrar/ocultar loading
  const toggleLoading = (show) => {
    setLoading(show);
  };

  // ========== LOGIN ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.codigocotel || !formData.password) {
      showAlert('Por favor complete todos los campos', 'warning');
      return;
    }
    
    toggleLoading(true);
    
    try {
      console.log('Iniciando login con datos:', formData);
      const response = await axios.post('/usuarios/login/', formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta del servidor:', response.data);
      
      if (response.status === 200) {
        // Verificar si hay token de acceso en la respuesta
        if (response.data.access) {
          // Guardar token de acceso
          const token = response.data.access;
          localStorage.setItem('token', token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Guardar token de refresh si existe
          if (response.data.refresh) {
            localStorage.setItem('refresh_token', response.data.refresh);
          }
          
          // Verificar si es necesario cambiar contraseña
          if (response.data.user_data?.redirect_to_password_change) {
            console.log('Redirigiendo a cambio de contraseña');
            setCurrentToken(token);
            setShowChangePassword(true);
          } else {
            console.log('Redirigiendo al dashboard');
            history.push('/dashboard');
          }
        } else {
          console.error('No se recibió token de acceso en la respuesta');
          showAlert('Error: No se recibió token válido', 'danger');
        }
      } else {
        console.error('Respuesta no exitosa:', response.status);
        showAlert(`Error del servidor: ${response.status}`, 'danger');
      }
      
    } catch (err) {
      console.error('Error durante el login:', err);
      console.error('Error response:', err.response?.data);
      
      if (err.response) {
        // Manejar errores específicos del backend
        if (err.response.status === 401) {
          showAlert('Error de autenticación', 'danger');
        } else if (err.response.status === 400) {
          showAlert('Datos inválidos. Por favor verifique su código COTEL y contraseña.', 'danger');
        } else {
          showAlert('Error del servidor', 'danger');
        }
      } else {
        // Manejar errores de conexión
        showAlert('Error de conexión. Verifique su conexión a internet.', 'danger');
      }
    } finally {
      toggleLoading(false);
    }
  };

  // Cleanup para evitar actualizaciones de estado en componente desmontado
  useEffect(() => {
    return () => {
      setError('');
    };
  }, []);

  // ========== MIGRACIÓN ==========
  const handleMigration = async (e) => {
    e.preventDefault();
    
    if (!migrationData.codigocotel) {
      showAlert('Por favor ingrese su código COTEL', 'warning');
      return;
    }
    
    toggleLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/usuarios/migrar_usuario/`, migrationData);
      
      if (response.data.success) {
        showAlert(response.data.message + ' Ahora puede iniciar sesión con su código COTEL como contraseña.', 'success');
        setShowMigration(false);
        setFormData({ codigocotel: migrationData.codigocotel, password: migrationData.codigocotel });
      } else {
        showAlert(response.data.error || 'Error durante la migración', 'danger');
      }
      
    } catch (err) {
      console.error('Error during migration:', err);
      showAlert('Error de conexión. Verifique su conexión a internet.', 'danger');
    } finally {
      toggleLoading(false);
    }
  };

  // ========== CAMBIO DE CONTRASEÑA ==========
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    
    if (!changePasswordData.oldPassword || !changePasswordData.newPassword || !changePasswordData.confirmPassword) {
      showAlert('Por favor complete todos los campos', 'warning');
      return;
    }
    
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      showAlert('Las contraseñas no coinciden', 'warning');
      return;
    }
    
    if (changePasswordData.newPassword.length < 6) {
      showAlert('La nueva contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }
    
    toggleLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/usuarios/cambiar_contraseña/`, {
        ...changePasswordData,
        codigocotel: formData.codigocotel
      }, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        
        // Actualizar datos del usuario
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        userData.password_changed = true;
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        showAlert('Contraseña cambiada exitosamente. Redirigiendo...', 'success');
        
        setTimeout(() => {
          history.push('/dashboard');
        }, 2000);
      } else {
        showAlert(response.data.error || 'Error al cambiar la contraseña', 'danger');
      }
      
    } catch (err) {
      console.error('Error changing password:', err);
      showAlert('Error de conexión', 'danger');
    } finally {
      toggleLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h2><i className="fa fa-dashboard"></i> Sistema de Gestión</h2>
        <p>Ingrese sus credenciales para acceder</p>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} id="login-form">
        <div className="form-group">
          <div className="input-group">
            <span className="input-group-addon"><i className="fa fa-user"></i></span>
            <input
              type="number"
              className="form-control"
              id="codigocotel"
              name="codigocotel"
              value={formData.codigocotel}
              onChange={handleChange}
              placeholder="Código COTEL"
              required
              onKeyPress={(e) => {
                if (e.key === 'Enter' && validateCodigoCotel(formData.codigocotel)) {
                  document.getElementById('password').focus();
                }
              }}
            />
          </div>
        </div>
        
        <div className="form-group">
          <div className="input-group">
            <span className="input-group-addon"><i className="fa fa-lock"></i></span>
            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Contraseña"
              required
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className="btn btn-login"
          disabled={loading}
        >
          <span className="login-text">Iniciar Sesión</span>
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          )}
        </button>
      </form>

      <div className="divider">
        <span>¿Primera vez?</span>
      </div>

      <div className="migration-section">
        <p className="text-muted">Si es su primera vez, debe migrar su usuario</p>
        <button 
          type="button" 
          className="btn btn-migration" 
          onClick={() => setShowMigration(true)}
        >
          <i className="fa fa-exchange"></i> Migrar Usuario
        </button>
      </div>

      {showMigration && (
        <div id="migration-section">
          <div className="divider">
            <span>Migración de Usuario</span>
          </div>
          
          <form onSubmit={handleMigration} id="migration-form">
            <div className="form-group">
              <div className="input-group">
                <span className="input-group-addon"><i className="fa fa-user"></i></span>
                <input
                  type="number"
                  className="form-control"
                  id="migration-codigocotel"
                  name="codigocotel"
                  value={migrationData.codigocotel}
                  onChange={handleMigrationChange}
                  placeholder="Código COTEL"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-migration"
              disabled={loading}
            >
              <span className="migration-text">Migrar Usuario</span>
              {loading && (
                <div className="loading">
                  <div className="spinner"></div>
                </div>
              )}
            </button>
          </form>
          
          <button 
            type="button" 
            className="btn btn-link" 
            onClick={() => {
              setShowMigration(false);
              setFormData({ codigocotel: migrationData.codigocotel, password: migrationData.codigocotel });
            }}
          >
            Volver al login
          </button>
        </div>
      )}

      {showChangePassword && (
        <div className="modal fade in" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <button 
                  type="button" 
                  className="close" 
                  onClick={() => setShowChangePassword(false)}
                >×</button>
                <h4 className="modal-title">Cambiar Contraseña</h4>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="fa fa-info-circle"></i>
                  Debe cambiar su contraseña antes de continuar.
                </div>
                <form onSubmit={handlePasswordChangeSubmit} id="change-password-form">
                  <div className="form-group">
                    <label>Contraseña Actual:</label>
                    <input
                      type="password"
                      className="form-control"
                      id="old-password"
                      name="oldPassword"
                      value={changePasswordData.oldPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nueva Contraseña:</label>
                    <input
                      type="password"
                      className="form-control"
                      id="new-password"
                      name="newPassword"
                      value={changePasswordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirmar Nueva Contraseña:</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirm-password"
                      name="confirmPassword"
                      value={changePasswordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handlePasswordChangeSubmit}
                  disabled={loading}
                >
                  Cambiar Contraseña
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
