import axios from 'axios';
import { getToken, getFarmId } from './tokenStore';

export const API_URL = 'https://vaxwise.onrender.com/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const farmId = getFarmId();
  if (farmId) config.headers['X-Farm-Id'] = farmId;
  return config;
});

let _onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { _onUnauthorized = fn; };

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && _onUnauthorized) _onUnauthorized();
    return Promise.reject(error);
  }
);

export default api;
