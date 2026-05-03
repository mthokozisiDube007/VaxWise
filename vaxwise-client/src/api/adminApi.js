import api from './axiosConfig';

export const getLoginStats = async () => {
  const r = await api.get('/admin/login-stats');
  return r.data;
};
