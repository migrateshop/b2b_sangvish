import api from './axiosConfig';

export const openDispute = (disputeData) => api.post('/disputes', disputeData);
export const getMyDisputes = () => api.get('/disputes/my-disputes');
export const addDisputeMessage = (disputeId, message) => api.post(`/disputes/${disputeId}/message`, { message });
