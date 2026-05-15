import api from './axiosConfig';

export const getCompanyProfile = () => api.get('/company/profile');
export const updateCompanyProfile = (data) => api.post('/company/profile', data);
export const getSupplierCompanyProfile = (supplierId) => api.get(`/company/supplier/${supplierId}`);
export const getSupplierProducts = (supplierId) => api.get(`/products?supplier=${supplierId}&limit=20`);
export const searchCompanies = (params) => api.get('/company/search', { params });
