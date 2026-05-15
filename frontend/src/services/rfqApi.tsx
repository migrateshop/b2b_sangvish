import api from './axiosConfig';

export const postRFQ = (rfqData) => api.post('/rfq', rfqData);
export const getRFQs = (params) => api.get('/rfq', { params });
export const getMyRFQs = () => api.get('/rfq/my-rfqs');
export const getRFQById = (id) => api.get(`/rfq/${id}`);
export const submitQuote = (rfqId, quoteData) => api.post(`/rfq/${rfqId}/quote`, quoteData);
export const getRFQQuotes = (rfqId) => api.get(`/rfq/${rfqId}/quotes`);
