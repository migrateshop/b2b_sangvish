import api from './axiosConfig';

export const createReview = (reviewData) => api.post('/reviews', reviewData);
export const getMyReviews = () => api.get('/reviews/my-reviews');
export const getProductReviews = (productId) => api.get(`/reviews/product/${productId}`);
