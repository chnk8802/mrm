import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/profile')
      .then(res => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        setUser(res.data.data);
        return res.data.data;
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
        window.location.href = '/login';
    };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);