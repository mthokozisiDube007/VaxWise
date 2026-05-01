import api from './axiosConfig';

export const getDashboard = async () => {
  const r = await api.get('/dashboard');
  return r.data;
};
