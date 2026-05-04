import api from './axiosConfig';

export const getAllAnimals = async () => {
  const r = await api.get('/animals');
  return r.data;
};

export const createAnimal = async (data) => {
  const r = await api.post('/animals', data);
  return r.data;
};

export const updateAnimal = async ({ id, ...data }) => {
  const r = await api.put(`/animals/${id}`, data);
  return r.data;
};

export const deleteAnimal = async (id) => {
  await api.delete(`/animals/${id}`);
};

export const exportAnimalsCsv = async () => {
  const r = await api.get('/animals/export', { responseType: 'blob' });
  const url = URL.createObjectURL(r.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `animals-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
