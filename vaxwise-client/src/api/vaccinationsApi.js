import api from './axiosConfig';

export const captureVaccination = async (data) => {
  const response = await api.post('/vaccinations/capture', data);
  return response.data;
};

export const getVaccinationsByAnimal = async (animalId) => {
  const response = await api.get(`/vaccinations/animal/${animalId}`);
  return response.data;
};

export const getUpcomingVaccinations = async () => {
  const response = await api.get('/vaccinations/upcoming');
  return response.data;
};