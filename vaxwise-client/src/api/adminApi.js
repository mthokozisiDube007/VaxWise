import api from './axiosConfig';

export const getLoginStats = async () => {
  const r = await api.get('/admin/login-stats');
  return r.data;
};

export const getAdminFarms = async () => {
  const r = await api.get('/admin/farms');
  return r.data;
};

export const toggleFarmActive = async (farmId) => {
  await api.put(`/admin/farms/${farmId}/toggle`);
};
