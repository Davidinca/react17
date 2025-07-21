// Configuración de la API
const API_BASE_URL = 'http://localhost:8000/api'; // Ajusta según tu configuración
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

// Configuración de headers para requests
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

// Función para mostrar alertas
function showAlert(message, type = 'info') {
    const alertHtml = `
        <div class="alert alert-${type} alert-fixed alert-dismissible">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
            ${message}
        </div>
    `;
    $('body').append(alertHtml);
    
    // Auto-dismiss después de 5 segundos
    setTimeout(() => {
        $('.alert-fixed').fadeOut();
    }, 5000);
}

// Función para mostrar loading
function showLoading(containerId) {
    $(`#${containerId}`).html(`
        <div class="loading">
            <div class="spinner"></div>
            <p>Cargando...</p>
        </div>
    `);
}

// Inicialización del dashboard
$(document).ready(function() {
    // Verificar autenticación
    if (!authToken) {
        window.location.href = 'login.html';
        return;
    }

    // Mostrar nombre del usuario
    if (currentUser.nombres) {
        $('#user-name').text(currentUser.nombres);
    }

    // Cargar dashboard por defecto
    showDashboard();

    // Event listeners
    $('#migration-form').on('submit', handleMigration);
    $('#change-password-form').on('submit', handleChangePassword);
    $('#create-usuario-form').on('submit', handleCreateUsuario);
    
    // Filtros de búsqueda
    $('#search-usuarios').on('input', debounce(loadUsuarios, 500));
    $('#filter-tipo, #filter-activo').on('change', loadUsuarios);
    $('#search-empleados').on('input', debounce(loadEmpleados, 500));
});

// Función debounce para búsquedas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========== NAVEGACIÓN ==========

function showSection(sectionId) {
    $('.content-section').hide();
    $(`#${sectionId}`).show();
    
    // Actualizar sidebar activo
    $('.nav-sidebar li').removeClass('active');
    $(`.nav-sidebar a[onclick*="${sectionId.replace('-content', '')}"]`).parent().addClass('active');
}

function showDashboard() {
    showSection('dashboard-content');
    loadDashboardStats();
    loadRecentActivity();
    loadNotifications();
}

function showUsuarios() {
    showSection('usuarios-content');
    loadUsuarios();
    loadRolesForSelect();
}

function showRoles() {
    showSection('roles-content');
    loadRoles();
}

function showPermisos() {
    showSection('permisos-content');
    loadPermisos();
}

function showMigracion() {
    showSection('migracion-content');
    loadMigrationStats();
}

function showEmpleados() {
    showSection('empleados-content');
    loadEmpleados();
}

// ========== DASHBOARD STATS ==========

async function loadDashboardStats() {
    try {
        // Cargar estadísticas de usuarios
        const usuariosResponse = await fetch(`${API_BASE_URL}/usuarios/`, {
            headers: getHeaders()
        });
        const usuarios = await usuariosResponse.json();
        $('#total-usuarios').text(usuarios.length || 0);

        // Cargar estadísticas de roles
        const rolesResponse = await fetch(`${API_BASE_URL}/roles/?activo=true`, {
            headers: getHeaders()
        });
        const roles = await rolesResponse.json();
        $('#total-roles').text(roles.length || 0);

        // Cargar estadísticas de permisos
        const permisosResponse = await fetch(`${API_BASE_URL}/permisos/`, {
            headers: getHeaders()
        });
        const permisos = await permisosResponse.json();
        $('#total-permisos').text(permisos.length || 0);

        // Cargar estadísticas de migración
        const migrationResponse = await fetch(`${API_BASE_URL}/empleados-disponibles/estadisticas/`, {
            headers: getHeaders()
        });
        const migrationStats = await migrationResponse.json();
        $('#pendientes-migracion').text(migrationStats.total_disponibles || 0);

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function loadRecentActivity() {
    // Simulación de actividad reciente
    const activities = [
        { icon: 'fa-user-plus', text: 'Nuevo usuario creado', time: 'Hace 2 horas' },
        { icon: 'fa-key', text: 'Contraseña cambiada', time: 'Hace 4 horas' },
        { icon: 'fa-exchange', text: 'Usuario migrado', time: 'Hace 1 día' },
        { icon: 'fa-user-circle', text: 'Rol actualizado', time: 'Hace 2 días' }
    ];

    const activityHtml = activities.map(activity => `
        <div class="list-group-item">
            <i class="fa ${activity.icon}"></i>
            ${activity.text}
            <span class="pull-right text-muted">${activity.time}</span>
        </div>
    `).join('');

    $('#recent-activity').html(activityHtml);
}

function loadNotifications() {
    // Simulación de notificaciones
    const notifications = [
        { type: 'warning', text: 'Usuarios pendientes de migración' },
        { type: 'info', text: 'Actualización del sistema programada' },
        { type: 'success', text: 'Backup completado exitosamente' }
    ];

    const notificationsHtml = notifications.map(notification => `
        <div class="list-group-item">
            <i class="fa fa-bell text-${notification.type === 'warning' ? 'warning' : notification.type === 'success' ? 'success' : 'info'}"></i>
            ${notification.text}
        </div>
    `).join('');

    $('#notifications').html(notificationsHtml);
}

// ========== USUARIOS ==========

async function loadUsuarios() {
    showLoading('usuarios-table-body');
    
    try {
        const params = new URLSearchParams();
        
        const search = $('#search-usuarios').val();
        if (search) params.append('search', search);
        
        const tipo = $('#filter-tipo').val();
        if (tipo) params.append('tipo', tipo);
        
        const activo = $('#filter-activo').val();
        if (activo) params.append('activo', activo);

        const response = await fetch(`${API_BASE_URL}/usuarios/?${params}`, {
            headers: getHeaders()
        });
        
        const usuarios = await response.json();
        
        const tableHtml = usuarios.map(usuario => `
            <tr>
                <td>${usuario.codigocotel}</td>
                <td>${usuario.nombre_completo}</td>
                <td>
                    <span class="badge badge-info">${usuario.rol_nombre || 'Sin rol'}</span>
                </td>
                <td>
                    <span class="badge ${usuario.is_active ? 'badge-success' : 'badge-danger'}">
                        ${usuario.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <span class="badge ${usuario.es_manual ? 'badge-warning' : 'badge-info'}">
                        ${usuario.es_manual ? 'Manual' : 'Migrado'}
                    </span>
                </td>
                <td>${new Date(usuario.fecha_creacion).toLocaleDateString()}</td>
                <td class="action-buttons">
                    <button class="btn btn-xs btn-primary" onclick="editUsuario(${usuario.id})">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-xs btn-warning" onclick="resetPassword(${usuario.id})">
                        <i class="fa fa-key"></i>
                    </button>
                    <button class="btn btn-xs ${usuario.is_active ? 'btn-danger' : 'btn-success'}" 
                            onclick="${usuario.is_active ? 'deactivateUsuario' : 'activateUsuario'}(${usuario.id})">
                        <i class="fa ${usuario.is_active ? 'fa-ban' : 'fa-check'}"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        $('#usuarios-table-body').html(tableHtml);
        
    } catch (error) {
        console.error('Error loading usuarios:', error);
        $('#usuarios-table-body').html('<tr><td colspan="7" class="text-center text-danger">Error al cargar usuarios</td></tr>');
    }
}

async function loadRolesForSelect() {
    try {
        const response = await fetch(`${API_BASE_URL}/roles/?activo=true`, {
            headers: getHeaders()
        });
        const roles = await response.json();
        
        const optionsHtml = roles.map(rol => 
            `<option value="${rol.id}">${rol.nombre}</option>`
        ).join('');
        
        $('#new-rol').html('<option value="">Seleccionar rol...</option>' + optionsHtml);
        
    } catch (error) {
        console.error('Error loading roles for select:', error);
    }
}

function showCreateUsuario() {
    $('#createUsuarioModal').modal('show');
}

async function createUsuario() {
    const formData = {
        codigocotel: $('#new-codigocotel').val(),
        nombres: $('#new-nombres').val(),
        apellidopaterno: $('#new-apellido-paterno').val(),
        apellidomaterno: $('#new-apellido-materno').val(),
        rol: $('#new-rol').val()
    };

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showAlert('Usuario creado exitosamente', 'success');
            $('#createUsuarioModal').modal('hide');
            $('#create-usuario-form')[0].reset();
            loadUsuarios();
        } else {
            const error = await response.json();
            showAlert(`Error: ${error.message || 'No se pudo crear el usuario'}`, 'danger');
        }
    } catch (error) {
        console.error('Error creating usuario:', error);
        showAlert('Error de conexión', 'danger');
    }
}

async function resetPassword(usuarioId) {
    if (!confirm('¿Está seguro de resetear la contraseña de este usuario?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${usuarioId}/resetear_password/`, {
            method: 'POST',
            headers: getHeaders()
        });

        if (response.ok) {
            showAlert('Contraseña reseteada exitosamente', 'success');
        } else {
            showAlert('Error al resetear contraseña', 'danger');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        showAlert('Error de conexión', 'danger');
    }
}

async function activateUsuario(usuarioId) {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${usuarioId}/activar/`, {
            method: 'POST',
            headers: getHeaders()
        });

        if (response.ok) {
            showAlert('Usuario activado exitosamente', 'success');
            loadUsuarios();
        } else {
            showAlert('Error al activar usuario', 'danger');
        }
    } catch (error) {
        console.error('Error activating usuario:', error);
        showAlert('Error de conexión', 'danger');
    }
}

async function deactivateUsuario(usuarioId) {
    if (!confirm('¿Está seguro de desactivar este usuario?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${usuarioId}/`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (response.ok) {
            showAlert('Usuario desactivado exitosamente', 'success');
            loadUsuarios();
        } else {
            showAlert('Error al desactivar usuario', 'danger');
        }
    } catch (error) {
        console.error('Error deactivating usuario:', error);
        showAlert('Error de conexión', 'danger');
    }
}

// ========== ROLES ==========

async function loadRoles() {
    showLoading('roles-table-body');
    
    try {
        const response = await fetch(`${API_BASE_URL}/roles/`, {
            headers: getHeaders()
        });
        
        const roles = await response.json();
        
        const tableHtml = roles.map(rol => `
            <tr>
                <td>${rol.nombre}</td>
                <td>
                    <span class="badge badge-info">${rol.permisos_count || 0} permisos</span>
                </td>
                <td>
                    <span class="badge badge-success">${rol.usuarios_count || 0} usuarios</span>
                </td>
                <td>
                    <span class="badge ${rol.activo ? 'badge-success' : 'badge-danger'}">
                        ${rol.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="action-buttons">
                    <button class="btn btn-xs btn-primary" onclick="editRol(${rol.id})">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-xs btn-info" onclick="cloneRol(${rol.id})">
                        <i class="fa fa-copy"></i>
                    </button>
                    <button class="btn btn-xs btn-danger" onclick="deleteRol(${rol.id})" 
                            ${rol.usuarios_count > 0 ? 'disabled' : ''}>
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        $('#roles-table-body').html(tableHtml);
        
    } catch (error) {
        console.error('Error loading roles:', error);
        $('#roles-table-body').html('<tr><td colspan="5" class="text-center text-danger">Error al cargar roles</td></tr>');
    }
}

function showCreateRol() {
    // Implementar modal para crear rol
    showAlert('Funcionalidad en desarrollo', 'info');
}

async function cloneRol(rolId) {
    const nombre = prompt('Ingrese el nombre para el nuevo rol:');
    if (!nombre) return;

    try {
        const response = await fetch(`${API_BASE_URL}/roles/${rolId}/clonar/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ nombre })
        });

        if (response.ok) {
            showAlert('Rol clonado exitosamente', 'success');
            loadRoles();
        } else {
            const error = await response.json();
            showAlert(`Error: ${error.error}`, 'danger');
        }
    } catch (error) {
        console.error('Error cloning rol:', error);
        showAlert('Error de conexión', 'danger');
    }
}

async function deleteRol(rolId) {
    if (!confirm('¿Está seguro de eliminar este rol?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/roles/${rolId}/`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (response.ok) {
            showAlert('Rol eliminado exitosamente', 'success');
            loadRoles();
        } else {
            const error = await response.json();
            showAlert(`Error: ${error.error}`, 'danger');
        }
    } catch (error) {
        console.error('Error deleting rol:', error);
        showAlert('Error de conexión', 'danger');
    }
}

// ========== PERMISOS ==========

async function loadPermisos() {
    showLoading('permisos-table-body');
    
    try {
        const response = await fetch(`${API_BASE_URL}/permisos/`, {
            headers: getHeaders()
        });
        
        const permisos = await response.json();
        
        const tableHtml = permisos.map(permiso => `
            <tr>
                <td>${permiso.recurso}</td>
                <td>
                    <span class="badge badge-primary">${permiso.accion}</span>
                </td>
                <td>
                    <span class="badge ${permiso.esta_en_uso ? 'badge-success' : 'badge-warning'}">
                        ${permiso.esta_en_uso ? 'En uso' : 'Sin usar'}
                    </span>
                </td>
                <td class="action-buttons">
                    <button class="btn btn-xs btn-primary" onclick="editPermiso(${permiso.id})">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-xs btn-danger" onclick="deletePermiso(${permiso.id})" 
                            ${permiso.esta_en_uso ? 'disabled' : ''}>
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        $('#permisos-table-body').html(tableHtml);
        
    } catch (error) {
        console.error('Error loading permisos:', error);
        $('#permisos-table-body').html('<tr><td colspan="4" class="text-center text-danger">Error al cargar permisos</td></tr>');
    }
}

function showCreatePermiso() {
    // Implementar modal para crear permiso
    showAlert('Funcionalidad en desarrollo', 'info');
}

// ========== MIGRACIÓN ==========

async function handleMigration(e) {
    e.preventDefault();
    
    const codigocotel = $('#codigocotel').val();
    
    try {
        const response = await fetch(`${API_BASE_URL}/migrar-usuario/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ codigocotel })
        });

        const result = await response.json();

        if (response.ok) {
            showAlert(result.message, 'success');
            $('#migration-form')[0].reset();
            loadMigrationStats();
        } else {
            showAlert(`Error: ${result.error}`, 'danger');
        }
    } catch (error) {
        console.error('Error migrating user:', error);
        showAlert('Error de conexión', 'danger');
    }
}

async function loadMigrationStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/empleados-disponibles/estadisticas/`, {
            headers: getHeaders()
        });
        
        const stats = await response.json();
        
        const statsHtml = `
            <div class="row">
                <div class="col-md-6">
                    <strong>Total Empleados:</strong><br>
                    <span class="text-primary">${stats.total_empleados_fdw}</span>
                </div>
                <div class="col-md-6">
                    <strong>Migrados:</strong><br>
                    <span class="text-success">${stats.total_migrados}</span>
                </div>
            </div>
            <div class="row mt-10">
                <div class="col-md-6">
                    <strong>Disponibles:</strong><br>
                    <span class="text-warning">${stats.total_disponibles}</span>
                </div>
                <div class="col-md-6">
                    <strong>Progreso:</strong><br>
                    <span class="text-info">${stats.porcentaje_migrado}%</span>
                </div>
            </div>
            <div class="progress mt-10">
                <div class="progress-bar progress-bar-success" style="width: ${stats.porcentaje_migrado}%">
                    ${stats.porcentaje_migrado}%
                </div>
            </div>
        `;
        
        $('#migration-stats').html(statsHtml);
        
    } catch (error) {
        console.error('Error loading migration stats:', error);
        $('#migration-stats').html('<p class="text-danger">Error al cargar estadísticas</p>');
    }
}

// ========== EMPLEADOS ==========

async function loadEmpleados() {
    showLoading('empleados-table-body');
    
    try {
        const params = new URLSearchParams();
        
        const search = $('#search-empleados').val();
        if (search) params.append('search', search);

        const response = await fetch(`${API_BASE_URL}/empleados-disponibles/?${params}`, {
            headers: getHeaders()
        });
        
        const empleados = await response.json();
        
        const tableHtml = empleados.map(empleado => `
            <tr>
                <td>${empleado.codigocotel}</td>
                <td>${empleado.nombre_completo}</td>
                <td>${new Date(empleado.fechaingreso).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-xs btn-success" onclick="migrateEmpleado(${empleado.codigocotel})">
                        <i class="fa fa-exchange"></i> Migrar
                    </button>
                </td>
            </tr>
        `).join('');
        
        $('#empleados-table-body').html(tableHtml);
        
    } catch (error) {
        console.error('Error loading empleados:', error);
        $('#empleados-table-body').html('<tr><td colspan="4" class="text-center text-danger">Error al cargar empleados</td></tr>');
    }
}

async function migrateEmpleado(codigocotel) {
    if (!confirm(`¿Migrar empleado con código ${codigocotel}?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/empleados-disponibles/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ codigocotel })
        });

        const result = await response.json();

        if (response.ok) {
            showAlert(result.message, 'success');
            loadEmpleados();
            loadMigrationStats();
        } else {
            showAlert(`Error: ${result.error || 'No se pudo migrar el empleado'}`, 'danger');
        }
    } catch (error) {
        console.error('Error migrating empleado:', error);
        showAlert('Error de conexión', 'danger');
    }
}

// ========== CAMBIO DE CONTRASEÑA ==========

function showChangePassword() {
    $('#changePasswordModal').modal('show');
}

async function changePassword() {
    const oldPassword = $('#old-password').val();
    const newPassword = $('#new-password').val();
    const confirmPassword = $('#confirm-password').val();

    if (newPassword !== confirmPassword) {
        showAlert('Las contraseñas no coinciden', 'danger');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/change-password/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword
            })
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('Contraseña cambiada exitosamente', 'success');
            $('#changePasswordModal').modal('hide');
            $('#change-password-form')[0].reset();
            
            // Actualizar token
            authToken = result.access;
            localStorage.setItem('authToken', authToken);
        } else {
            showAlert(`Error: ${result.error}`, 'danger');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showAlert('Error de conexión', 'danger');
    }
}

// ========== LOGOUT ==========

function logout() {
    if (confirm('¿Está seguro de cerrar sesión?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}