import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.1.219:8000',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para el token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
