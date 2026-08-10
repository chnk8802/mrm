import axios from 'axios';
import { ORG_STORAGE_KEY } from '@repo/validators';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', withCredentials: true, });

api.interceptors.request.use((config) => {
  const selectedOrgId = localStorage.getItem(ORG_STORAGE_KEY);
  if (selectedOrgId) {
    config.headers['x-org-id'] = selectedOrgId;
  }
  return config;
});

api.interceptors.response.use((response) => response, (error) => { return Promise.reject(error); });

export default api;