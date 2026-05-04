import api from './axiosConfig';

export const getInvitation = async (token) => {
  const r = await api.get(`/invitations/${token}`);
  return r.data;
};

export const acceptInvitation = async (data) => {
  const r = await api.post('/invitations/accept', data);
  return r.data;
};
