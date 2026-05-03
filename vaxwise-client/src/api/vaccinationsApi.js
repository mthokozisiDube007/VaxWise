import api from './axiosConfig';

export const captureVaccination = async (data) => {
  const r = await api.post('/vaccinations/capture', data);
  return r.data;
};

export const getVaccinationsByAnimal = async (animalId) => {
  const r = await api.get(`/vaccinations/animal/${animalId}`);
  return r.data;
};

export const getUpcomingVaccinations = async () => {
  const r = await api.get('/vaccinations/upcoming');
  return r.data;
};

export const syncVaccinations = async (data) => {
  const r = await api.post('/vaccinations/sync', data);
  return r.data;
};

export const getVaccineSchedules = async (animalTypeId) => {
  const r = await api.get(`/vaccineschedules?animalTypeId=${animalTypeId}`);
  return r.data;
};
