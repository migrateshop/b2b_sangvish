import api from './axiosConfig';

export const createCheckoutSession = (orderData) => api.post('/orders/create-checkout-session', orderData);
export const verifySession = (sessionId) => api.post('/orders/verify-session', { sessionId });
export const verifyPayPal = (orderId) => api.post('/orders/verify-paypal', { orderId });
export const getMyOrders = () => api.get('/orders/my-orders');
export const getSupplierOrders = () => api.get('/orders/supplier-orders');
export const updateOrderStatus = (id, data) => api.put(`/orders/${id}/status`, data);
