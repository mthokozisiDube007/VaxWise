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

export const batchCaptureVaccination = async (data) => {
  const r = await api.post('/vaccinations/batch', data);
  return r.data;
};

export const getHerdImmunity = async () => {
  const r = await api.get('/vaccinations/herd-immunity');
  return r.data;
};

export const exportVaccinationsCsv = async () => {
  const r = await api.get('/vaccinations/export', { responseType: 'blob' });
  const url = URL.createObjectURL(r.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vaccinations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
