import axios from 'axios';

const API_URL = '/api/customers';

// Create axios instance with default config
const api = axios.create({
  withCredentials: true
});

// Customer Service API
const customerService = {
  // Create a new customer
  createCustomer: async (customerData) => {
    const response = await api.post(API_URL, customerData);
    return response.data;
  },

  // Get all customers with pagination, sorting, and filtering
  getCustomers: async (params = {}) => {
    const response = await api.get(API_URL, { params });
    return response.data;
  },

  // Get single customer by ID
  getCustomerById: async (id) => {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  },

  // Update a customer
  updateCustomer: async (id, customerData) => {
    const response = await api.put(`${API_URL}/${id}`, customerData);
    return response.data;
  },

  // Delete a customer (soft delete)
  deleteCustomer: async (id) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  },

  // Bulk update customers
  bulkUpdateCustomers: async ({ ids, data }) => {
    const response = await api.put(`${API_URL}/bulk`, { ids, data });
    return response.data;
  },

  // Bulk delete customers
  bulkDeleteCustomers: async (ids) => {
    const response = await api.delete(`${API_URL}/bulk`, { data: { ids } });
    return response.data;
  },

  // Get customer statistics
  getCustomerStats: async () => {
    const response = await api.get(`${API_URL}/stats`);
    return response.data;
  }
};

export default customerService;
