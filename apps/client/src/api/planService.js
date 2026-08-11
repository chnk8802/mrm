import api from "@/api/axiosInstance";

const planService = {
    getPlans: () => api.get("/platform/plans").then((res) => res.data),
};

export default planService;