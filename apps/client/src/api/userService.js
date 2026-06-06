import api from './axiosInstance';

const BASE = '/users';

const userService = {
    getUsers:      (params = {})    => api.get(BASE, { params }).then(r => r.data),
    getUserById:   (id)             => api.get(`${BASE}/${id}`).then(r => r.data),
    getUserStats:  ()               => api.get(`${BASE}/stats`).then(r => r.data),
    createUser:    (data)           => api.post(BASE, data).then(r => r.data),
    updateUser:    (id, data)       => api.patch(`${BASE}/${id}`, data).then(r => r.data),
    deleteUser:    (id)             => api.delete(`${BASE}/${id}`).then(r => r.data),
    restoreUser:   (id)             => api.patch(`${BASE}/${id}/restore`).then(r => r.data),
    deactivateUser:(id)             => api.patch(`${BASE}/${id}/deactivate`).then(r => r.data),
    activateUser:  (id)             => api.patch(`${BASE}/${id}/activate`).then(r => r.data),
    deleteUserPermanently: (id)     => api.delete(`${BASE}/${id}/permanent`).then(r => r.data),
    resetPassword: (id, newPassword)=> api.patch(`${BASE}/${id}/reset-password`, { newPassword }).then(r => r.data),
};

export default userService;