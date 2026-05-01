import api from './axiosConfig';

export const getFarms = async () => {
  const response = await api.get('/farms');
  return response.data;
};
