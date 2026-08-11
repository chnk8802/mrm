import api from "@/api/axiosInstance";

const organizationService = {
    createOrganization: (data) => api.post("/platform/organizations", data).then((res) => res.data),
    getOrganizations: (params) => api.get("/platform/organizations", { params }).then((res) => res.data),
    getOrganizationById: (id) => api.get(`/platform/organizations/${id}`).then((res) => res.data),
    updateOrganization: (id, data) => api.patch(`/platform/organizations/${id}`, data).then((res) => res.data),
    getMyOrganization: () => api.get("/organizations/me").then((res) => res.data),
};

export default organizationService;