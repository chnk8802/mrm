import api from './axiosInstance';

const BASE = '/reports';

const reportService = {
    getOwedReport:     (params = {}) => api.get(`${BASE}/owed`, { params }).then(r => r.data),
    getCollectedReport:(params = {}) => api.get(`${BASE}/collected`, { params }).then(r => r.data),
};

export default reportService;