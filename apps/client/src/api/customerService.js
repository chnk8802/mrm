import api from './axiosInstance';

const customerService = {
    getCustomers:           (params = {})    => api.get('/customers', { params }).then(r => r.data),
    getCustomerById:        (id)             => api.get(`/customers/${id}`).then(r => r.data),
    getCustomerStats:       ()               => api.get('/customers/stats').then(r => r.data),
    createCustomer:         (data)           => api.post('/customers', data).then(r => r.data),
    updateCustomer:         (id, data)       => api.patch(`/customers/${id}`, data).then(r => r.data),
    deleteCustomer:         (id)             => api.delete(`/customers/${id}`).then(r => r.data),
    restoreCustomer:        (id)             => api.patch(`/customers/${id}/restore`).then(r => r.data),
    permanentlyDeleteCustomer: (id)          => api.delete(`/customers/${id}/permanent`).then(r => r.data),
    bulkUpdateCustomers:    (data)           => api.patch('/customers/bulk', data).then(r => r.data),
    bulkDeleteCustomers:    (data)           => api.post('/customers/bulk', data).then(r => r.data),
};

export default customerService;