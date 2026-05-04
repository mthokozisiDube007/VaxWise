import api from './axiosConfig';

export const getAllAnimals = () => api.get('/animals').then(r => r.data);
export const createAnimal = (data) => api.post('/animals', data).then(r => r.data);
export const updateAnimal = ({ id, ...data }) => api.put(`/animals/${id}`, data).then(r => r.data);
export const deleteAnimal = (id) => api.delete(`/animals/${id}`);
