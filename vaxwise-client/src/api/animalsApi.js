import api from './axiosConfig';

export const getAllAnimals = async () => {
  const r = await api.get('/animals');
  return r.data;
};

export const createAnimal = async (data) => {
  const r = await api.post('/animals', data);
  return r.data;
};

export const deleteAnimal = async (id) => {
  await api.delete(`/animals/${id}`);
};
