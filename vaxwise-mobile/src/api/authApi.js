import api from './axiosConfig';

export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data);

export const registerUser = (data) =>
  api.post('/auth/register', data).then(r => r.data);
