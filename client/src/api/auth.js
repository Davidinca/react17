import axios from './axios';

// Login
export const login = async (data) => {
  const response = await axios.post('/usuarios/login/', data);
  return response.data;
};

// Cambiar contraseña
export const changePassword = async (data) => {
  const token = localStorage.getItem('token');
  const response = await axios.post('/usuarios/change-password/', data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return response.data;
};

// Migrar usuario
export const migrarUsuario = async (data) => {
  const response = await axios.post('/usuarios/migrar/', data);
  return response.data;
};
