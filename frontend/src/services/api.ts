import axios from 'axios';

// Base URL adaptada al subdirectorio institucional de TecnoWeb (/inf513/grupo02sa/api)
// En desarrollo local import.meta.env.BASE_URL es '/', resolviendo en '/api'
const apiBaseUrl = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, '/');

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para inyectar token Sanctum
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para capturar expiración de sesión (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirección adaptada a la ruta base institucional (/inf513/grupo02sa/login)
      const loginPath = `${import.meta.env.BASE_URL}login`.replace(/\/+/g, '/');
      if (window.location.pathname !== loginPath) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

