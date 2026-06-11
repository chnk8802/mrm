import api from './axiosInstance';

const sparePartUsageService = {
    getSparePartUsages:    (params = {}) => api.get('/spare-part-usage', { params }).then(r => r.data),
    getSparePartUsageById: (id)          => api.get(`/spare-part-usage/${id}`).then(r => r.data),
    createSparePartUsage:  (data)        => api.post('/spare-part-usage', data).then(r => r.data),
    bulkCreate:            (data)        => api.post('/spare-part-usage/bulk', data).then(r => r.data),
    updateSparePartUsage:  (id, data)    => api.patch(`/spare-part-usage/${id}`, data).then(r => r.data),
    bulkUpdate:            (data)        => api.patch('/spare-part-usage/bulk', data).then(r => r.data),
    deleteSparePartUsage:  (id)          => api.delete(`/spare-part-usage/${id}`).then(r => r.data),
};

export default sparePartUsageService;