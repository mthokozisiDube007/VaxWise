import api from './axiosConfig';

export const captureVaccination = (data) => api.post('/vaccinations/capture', data).then(r => r.data);
export const getVaccinationsByAnimal = (animalId) => api.get(`/vaccinations/animal/${animalId}`).then(r => r.data);
export const getUpcomingVaccinations = () => api.get('/vaccinations/upcoming').then(r => r.data);
export const batchCaptureVaccination = (data) => api.post('/vaccinations/batch', data).then(r => r.data);
export const getHerdImmunity = () => api.get('/vaccinations/herd-immunity').then(r => r.data);
export const getVaccineSchedules = (animalTypeId) =>
  api.get(`/vaccineschedules?animalTypeId=${animalTypeId}`).then(r => r.data);
