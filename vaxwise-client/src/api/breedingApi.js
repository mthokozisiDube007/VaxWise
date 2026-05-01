import api from './axiosConfig';

export const recordBreeding = async (data) => {
  const r = await api.post('/breeding', data);
  return r.data;
};

export const getBreedingHistory = async (animalId) => {
  const r = await api.get(`/breeding/animal/${animalId}`);
  return r.data;
};

export const getUpcomingBirths = async () => {
  const r = await api.get('/breeding/upcoming');
  return r.data;
};

export const recordBirth = async ({ breedingRecordId, ...data }) => {
  const r = await api.post(`/breeding/${breedingRecordId}/birth`, data);
  return r.data;
};
