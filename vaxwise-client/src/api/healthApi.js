import api from './axiosConfig';

export const recordTreatment = async (data) => {
  const response = await api.post('/health/treatment', data);
  return response.data;
};

export const getHealthRecords = async (animalId) => {
  const response = await api.get(`/health/animal/${animalId}`);
  return response.data;
};

export const checkOutbreak = async (symptoms) => {
  const response = await api.get(`/health/outbreak?symptoms=${symptoms}`);
  return response.data;
};