import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7232/api',
});

// Automatically attach JWT token to every request
// This is the React equivalent of adding Bearer token in Postman
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vaxwise_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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