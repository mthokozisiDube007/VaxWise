import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://localhost:7232/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vaxwise_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const farmId = localStorage.getItem('vaxwise_farm_id');
  if (farmId) {
    config.headers['X-Farm-Id'] = farmId;
  }

  return config;
});

// Handle 401 responses — token expired, redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vaxwise_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;