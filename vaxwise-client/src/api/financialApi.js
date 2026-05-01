import api from './axiosConfig';

export const recordIncome = async (data) => {
  const r = await api.post('/financial/income', data);
  return r.data;
};

export const recordExpense = async (data) => {
  const r = await api.post('/financial/expense', data);
  return r.data;
};

export const getProfitLoss = async ({ month, year }) => {
  const r = await api.get(`/financial/profit-loss?month=${month}&year=${year}`);
  return r.data;
};

export const getTransactions = async () => {
  const r = await api.get('/financial/transactions');
  return r.data;
};

export const getAnimalCost = async (animalId) => {
  const r = await api.get(`/financial/animal/${animalId}/cost`);
  return r.data;
};
