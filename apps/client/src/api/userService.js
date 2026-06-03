import axios from 'axios';

const API_URL = '/api/users';

// Create axios instance with default config
const api = axios.create({
    withCredentials: true
});

// User Service API
const userService = {
    // Create a new user
    createUser: async(userData) => {
        const response = await api.post(API_URL, userData);
        return response.data;
    },

    // Get all users with pagination, sorting, and filtering
    getUsers: async(params = {}) => {
        const response = await api.get(API_URL, { params });
        return response.data;
    },

    // Get single user by ID
    getUserById: async(id) => {
        const response = await api.get(`${API_URL}/${id}`);
        return response.data;
    },

    // Update a user
    updateUser: async(id, userData) => {
        const response = await api.put(`${API_URL}/${id}`, userData);
        return response.data;
    },

    // Deactivate a user
    deactivateUser: async(id) => {
        const response = await api.patch(`${API_URL}/${id}/deactivate`);
        return response.data;
    },

    // Activate a user
    activateUser: async(id) => {
        const response = await api.patch(`${API_URL}/${id}/activate`);
        return response.data;
    },

    // Delete User
    deleteUser: async(id) => {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    },

    // Reset user password
    resetPassword: async(id, newPassword) => {
        const response = await api.put(`${API_URL}/${id}/reset-password`, { newPassword });
        return response.data;
    },

    // Get user statistics
    getUserStats: async() => {
        const response = await api.get(`${API_URL}/stats`);
        return response.data;
    }
};

export default userService;