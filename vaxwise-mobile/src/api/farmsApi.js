import api from './axiosConfig';

export const getFarms = () => api.get('/farms').then(r => r.data);
export const createFarm = (data) => api.post('/farms', data).then(r => r.data);
export const updateFarm = ({ farmId, ...data }) => api.put(`/farms/${farmId}`, data).then(r => r.data);
export const getFarmWorkers = (farmId) => api.get(`/farms/${farmId}/workers`).then(r => r.data);
export const inviteWorker = ({ farmId, ...data }) => api.post(`/farms/${farmId}/invite`, data).then(r => r.data);
export const removeWorker = ({ farmId, userId }) => api.delete(`/farms/${farmId}/workers/${userId}`);
