import api from './axiosInstance';

const supplierService = {
    getSuppliers:           (params = {})    => api.get('/suppliers', { params }).then(r => r.data),
    getSupplierById:        (id)             => api.get(`/suppliers/${id}`).then(r => r.data),
    getSupplierStats:       ()               => api.get('/suppliers/stats').then(r => r.data),
    createSupplier:         (data)           => api.post('/suppliers', data).then(r => r.data),
    updateSupplier:         (id, data)       => api.patch(`/suppliers/${id}`, data).then(r => r.data),
    deleteSupplier:         (id)             => api.delete(`/suppliers/${id}`).then(r => r.data),
    restoreSupplier:        (id)             => api.patch(`/suppliers/${id}/restore`).then(r => r.data),
    permanentlyDeleteSupplier: (id)          => api.delete(`/suppliers/${id}/permanent`).then(r => r.data),
    bulkUpdateSuppliers:    (data)           => api.patch('/suppliers/bulk', data).then(r => r.data),
    bulkDeleteSuppliers:    (data)           => api.post('/suppliers/bulk', data).then(r => r.data),
};

export default supplierService;