import api from './axiosConfig';

export const getFeedStock = async () => {
  const r = await api.get('/feed/stock');
  return r.data;
};

export const updateFeedStock = async (data) => {
  const r = await api.post('/feed/stock', data);
  return r.data;
};

export const recordFeed = async (data) => {
  const r = await api.post('/feed/record', data);
  return r.data;
};

export const getFeedAlerts = async () => {
  const r = await api.get('/feed/alerts');
  return r.data;
};

export const getFeedRecords = async (animalTypeId) => {
  const r = await api.get(`/feed/records/${animalTypeId}`);
  return r.data;
};
