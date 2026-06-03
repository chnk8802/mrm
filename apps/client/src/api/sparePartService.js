import axios from 'axios';

const API_URL = '/api/spare-parts';

// Create axios instance with default config
const api = axios.create({
    withCredentials: true
});

// Spare Part Service API
const sparePartService = {
    // Create a new spare part
    createSparePart: async(sparePartData) => {
        const response = await api.post(API_URL, sparePartData);
        return response.data;
    },

    // Get all spare parts with pagination, sorting, and filtering
    getSpareParts: async(params = {}) => {
        const response = await api.get(API_URL, { params });
        return response.data;
    },

    // Get single spare part by ID
    getSparePartById: async(id) => {
        const response = await api.get(`${API_URL}/${id}`);
        return response.data;
    },

    // Update a spare part
    updateSparePart: async(id, sparePartData) => {
        const response = await api.put(`${API_URL}/${id}`, sparePartData);
        return response.data;
    },

    // Delete a spare part (soft delete)
    deleteSparePart: async(id) => {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    },

    // Get spare part statistics
    getSparePartStats: async() => {
        const response = await api.get(`${API_URL}/stats`);
        return response.data;
    },

    // Get low stock items
    getLowStockParts: async() => {
        const response = await api.get(`${API_URL}/low-stock`);
        return response.data;
    },

    // Adjust stock quantity
    adjustStock: async(id, adjustment, reason) => {
        const response = await api.post(`${API_URL}/${id}/adjust-stock`, {
            adjustment,
            reason
        });
        return response.data;
    },

    // Restock a part
    restockPart: async(id, quantity, costPrice, supplier, notes) => {
        const response = await api.post(`${API_URL}/${id}/restock`, {
            quantity,
            costPrice,
            supplier,
            notes
        });
        return response.data;
    },

    // Add spare parts to a repair
    addSparePartsToRepair: async(repairId, sparePartId, quantity, unitCost, supplierId = null, warrantyStartDate = null, warrantyEndDate = null, notes = null) => {
        const response = await api.post(`/api/spare-parts/usage`, {
            repairId,
            sparePartId,
            quantity,
            unitCost,
            supplierId,
            warrantyStartDate,
            warrantyEndDate,
            notes
        });
        return response.data;
    },

    // Get spare parts by repair
    getSparePartsByRepair: async(repairId) => {
        const response = await api.get(`/api/spare-parts/usage/by-repair/${repairId}`);
        return response.data;
    },

    // Get all spare part usage
    getSparePartsUsage: async(params = {}) => {
        const response = await api.get('/api/spare-parts/usage', { params });
        return response.data;
    },

    // Get spare part usage by ID
    getSparePartUsageById: async(id) => {
        const response = await api.get(`/api/spare-parts/usage/${id}`);
        return response.data;
    },

    // Get spare parts usage by supplier
    getSparePartsUsageBySupplier: async(supplierId, params = {}) => {
        const response = await api.get(`/api/spare-parts/usage/by-supplier/${supplierId}`, { params });
        return response.data;
    },

    // Update spare part usage in a repair
    updateSparePartUsage: async(usageId, data) => {
        const response = await api.put(`/api/spare-parts/usage/${usageId}`, data);
        return response.data;
    },

    // Remove spare part from repair
    removeSparePartFromRepair: async(usageId) => {
        const response = await api.delete(`/api/spare-parts/usage/${usageId}`);
        return response.data;
    }
};

export default sparePartService;