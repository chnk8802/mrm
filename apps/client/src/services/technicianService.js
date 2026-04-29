import axios from 'axios';

const API_URL = '/api/technicians';

// Create axios instance with default config
const api = axios.create({
    withCredentials: true
});

// Technician Service API
const technicianService = {
    // Get all Technicians with pagination, sorting, and filtering
    getTechnicians: async(params = {}) => {
        const response = await api.get(API_URL, { params });
        return response.data;
    },
};

export default technicianService;