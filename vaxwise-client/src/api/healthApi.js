import api from './axiosConfig';

export const recordTreatment = async (data) => {
  const r = await api.post('/health/treatment', data);
  return r.data;
};

export const getHealthRecords = async (animalId) => {
  const r = await api.get(`/health/animal/${animalId}`);
  return r.data;
};

export const getCurrentHealth = async () => {
  const r = await api.get('/health/current');
  return r.data;
};

export const checkOutbreak = async (symptoms) => {
  const r = await api.get(`/health/outbreak?symptoms=${encodeURIComponent(symptoms)}`);
  return r.data;
};
