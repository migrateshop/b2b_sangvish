import api from './axiosConfig';

// Public
export const fetchProducts = (params) => api.get('/products', { params });
export const fetchProductById = (id) => api.get(`/products/${id}`);

// Supplier
export const fetchMyProducts = (params) => api.get('/products/my/products', { params });

export const createProduct = (formData) => api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

export const updateProduct = (id, formData) => api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

export const bulkUploadProducts = (formData) => api.post('/products/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const toggleShowcase = (id) => api.put(`/products/${id}/toggle-showcase`);

// Admin
export const fetchAllProductsAdmin = (params) => api.get('/products/admin/all', { params });
export const exportProductsAdmin = () => api.get('/products/admin/export', { responseType: 'blob' });
export const approveProduct = (id) => api.put(`/products/${id}/approve`);
export const rejectProduct = (id, note) => api.put(`/products/${id}/reject`, { note });
