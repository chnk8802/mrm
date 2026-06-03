import axios from 'axios';

const API_URL = '/api/suppliers';

const api = axios.create({
    withCredentials: true
});

const supplierService = {
    createSupplier: async(supplierData) => {
        const response = await api.post(API_URL, supplierData);
        return response.data;
    },

    getSuppliers: async(params = {}) => {
        const response = await api.get(API_URL, { params });
        return response.data;
    },

    getSupplierById: async(id) => {
        const response = await api.get(`${API_URL}/${id}`);
        return response.data;
    },

    updateSupplier: async(id, supplierData) => {
        const response = await api.put(`${API_URL}/${id}`, supplierData);
        return response.data;
    },

    deleteSupplier: async(id) => {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    },

    getSupplierStats: async() => {
        const response = await api.get(`${API_URL}/stats`);
        return response.data;
    }
};

export default supplierService;