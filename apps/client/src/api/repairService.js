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

// import axios from 'axios';

// const API_URL = '/api/repairs';

// const repairService = {
//     // Get all repairs with pagination, sorting, filtering
//     getRepairs: async(params = {}) => {
//         const response = await axios.get(API_URL, {
//             params,
//             withCredentials: true
//         });
//         return response.data;
//     },

//     // Get single repair by ID
//     getRepairById: async(id) => {
//         const response = await axios.get(`${API_URL}/${id}`, {
//             withCredentials: true
//         });
//         return response.data;
//     },

//     // Create new repair
//     createRepair: async(repairData) => {
//         const response = await axios.post(API_URL, repairData, {
//             withCredentials: true
//         });
//         return response.data;
//     },

//     // Update repair
//     updateRepair: async(id, repairData) => {
//         const response = await axios.put(`${API_URL}/${id}`, repairData, {
//             withCredentials: true
//         });
//         return response.data;
//     },

//     // Delete repair (soft delete)
//     deleteRepair: async(id) => {
//         const response = await axios.delete(`${API_URL}/${id}`, {
//             withCredentials: true
//         });
//         return response.data;
//     },

//     // Assign technician
//     assignTechnician: async(id, technicianId) => {
//         const response = await axios.put(
//             `${API_URL}/${id}/assign`, { technicianId }, { withCredentials: true }
//         );
//         return response.data;
//     },

//     // Complete repair
//     completeRepair: async(id, data = {}) => {
//         const response = await axios.put(
//             `${API_URL}/${id}/complete`,
//             data, { withCredentials: true }
//         );
//         return response.data;
//     },

//     // Get repair statistics
//     getRepairStats: async() => {
//         const response = await axios.get(`${API_URL}/stats`, {
//             withCredentials: true
//         });
//         return response.data;
//     },

//     // Bulk delete repairs
//     bulkDeleteRepairs: async(ids) => {
//         const response = await axios.post(
//             `${API_URL}/bulk-delete`, { ids }, { withCredentials: true }
//         );
//         return response.data;
//     }
// };

// export default repairService;