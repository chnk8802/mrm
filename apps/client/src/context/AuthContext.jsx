import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/api/axiosInstance';
import organizationService from '@/api/organizationService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/profile')
      .then(async (res) => {
        setUser(res.data.data)

        if (res.data.data?.role !== 'superadmin') {
          const orgRes = await organizationService.getMyOrganization();
          setOrganization(orgRes.data);
        }
      })
      .catch(() => { setUser(null); setOrganization(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.data);
    if (res.data.data?.role !== 'superadmin') {
      const orgRes = await organizationService.getMyOrganization();
      setOrganization(orgRes.data);
    }
    return res.data.data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    setOrganization(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, organization, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);