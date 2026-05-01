import api from './axiosConfig';

export const generateCertificate = async (eventId) => {
  const r = await api.post(`/certificates/generate/${eventId}`);
  return r.data;
};

export const getFarmCertificates = async () => {
  const r = await api.get('/certificates/farm');
  return r.data;
};

export const verifyCertificate = async (certId) => {
  const r = await api.get(`/certificates/verify/${certId}`);
  return r.data;
};
