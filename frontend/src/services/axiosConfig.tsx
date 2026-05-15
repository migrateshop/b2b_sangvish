import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "https://b2b.sangvish.com/api",
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor to handle 401s and log errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error(`[AXIOS ERROR] ${error.config.method.toUpperCase()} ${error.config.url} failed with ${error.response.status}`);
            console.error(`[AXIOS RESPONSE DATA]:`, error.response.data);
            
            if (typeof window !== 'undefined' && error.response.status === 401) {
                // Only logout if it's not the login/auth endpoints
                const url = error.config.url;
                if (url && !url.includes('/auth/login') && !url.includes('/auth/verify-otp') && !url.includes('/auth/register')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/'; // Redirect to home/login
                }
            }
        } else {
            console.error(`[AXIOS NETWORK ERROR] ${error.config?.url}:`, error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
