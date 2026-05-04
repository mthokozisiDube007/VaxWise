import api from './axiosConfig';

export const getFarms = async () => {
  const r = await api.get('/farms');
  return r.data;
};

export const createFarm = async (data) => {
  const r = await api.post('/farms', data);
  return r.data;
};

export const updateFarm = async ({ farmId, ...data }) => {
  const r = await api.put(`/farms/${farmId}`, data);
  return r.data;
};

export const getFarmWorkers = async (farmId) => {
  const r = await api.get(`/farms/${farmId}/workers`);
  return r.data;
};

export const inviteWorker = async ({ farmId, ...data }) => {
  const r = await api.post(`/farms/${farmId}/invite`, data);
  return r.data;
};

export const removeWorker = async ({ farmId, userId }) => {
  await api.delete(`/farms/${farmId}/workers/${userId}`);
};

export const updateWorker = async ({ farmId, userId, ...data }) => {
  const r = await api.put(`/farms/${farmId}/workers/${userId}`, data);
  return r.data;
};
