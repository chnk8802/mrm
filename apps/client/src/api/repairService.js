import api from './axiosInstance';

const repairService = {
    getRepairs:       (params = {}) => api.get('/repairs', { params }).then(r => r.data),
    getRepairById:    (id)          => api.get(`/repairs/${id}`).then(r => r.data),
    getRepairStats:   ()            => api.get('/repairs/stats').then(r => r.data),
    createRepair:     (data)        => api.post('/repairs', data).then(r => r.data),
    updateRepair:     (id, data)    => api.patch(`/repairs/${id}`, data).then(r => r.data),
    deleteRepair:     (id)          => api.delete(`/repairs/${id}`).then(r => r.data),
    assignTechnician: (id, data)    => api.patch(`/repairs/${id}/assign`, data).then(r => r.data),
    updateStatus:     (id, data)    => api.patch(`/repairs/${id}/status`, data).then(r => r.data),
    pickupRepair:     (id, data)    => api.patch(`/repairs/${id}/pickup`, data).then(r => r.data),
};

export default repairService;