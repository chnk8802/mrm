import api from './axiosInstance';

export const authService = {
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.patch('/auth/profile', data),
};