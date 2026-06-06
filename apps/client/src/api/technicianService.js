import api from './axiosInstance';

const technicianService = {
    getTechnicians: () => api.get('/technicians').then(r => r.data),
};

export default technicianService;