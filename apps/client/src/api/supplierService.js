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
    bulkDeleteSuppliers:    (data)           => api.delete('/suppliers/bulk', { data }).then(r => r.data),
};

export default supplierService;

// import axios from 'axios';

// const API_URL = '/api/suppliers';

// const api = axios.create({
//     withCredentials: true
// });

// const supplierService = {
//     createSupplier: async(supplierData) => {
//         const response = await api.post(API_URL, supplierData);
//         return response.data;
//     },

//     getSuppliers: async(params = {}) => {
//         const response = await api.get(API_URL, { params });
//         return response.data;
//     },

//     getSupplierById: async(id) => {
//         const response = await api.get(`${API_URL}/${id}`);
//         return response.data;
//     },

//     updateSupplier: async(id, supplierData) => {
//         const response = await api.put(`${API_URL}/${id}`, supplierData);
//         return response.data;
//     },

//     deleteSupplier: async(id) => {
//         const response = await api.delete(`${API_URL}/${id}`);
//         return response.data;
//     },

//     getSupplierStats: async() => {
//         const response = await api.get(`${API_URL}/stats`);
//         return response.data;
//     }
// };

// export default supplierService;