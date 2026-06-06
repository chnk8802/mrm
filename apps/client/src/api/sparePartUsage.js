import api from './axiosInstance';

const sparePartUsageService = {
    getSparePartUsages:    (params = {}) => api.get('/spare-part-usages', { params }).then(r => r.data),
    getSparePartUsageById: (id)          => api.get(`/spare-part-usages/${id}`).then(r => r.data),
    createSparePartUsage:  (data)        => api.post('/spare-part-usages', data).then(r => r.data),
    bulkCreate:            (data)        => api.post('/spare-part-usages/bulk', data).then(r => r.data),
    updateSparePartUsage:  (id, data)    => api.patch(`/spare-part-usages/${id}`, data).then(r => r.data),
    bulkUpdate:            (data)        => api.patch('/spare-part-usages/bulk', data).then(r => r.data),
    deleteSparePartUsage:  (id)          => api.delete(`/spare-part-usages/${id}`).then(r => r.data),
};

export default sparePartUsageService;