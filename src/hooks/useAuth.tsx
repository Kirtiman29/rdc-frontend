import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getToken, getRefreshToken, saveTokens, clearTokens, isTokenExpired } from '@/api/apiClient';

interface User { id: string; email: string; name: string; }
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeToken = (token: string): User | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));
    return { id: decoded.sub, email: decoded.email || '', name: decoded.name || 'Industrial User' };
  } catch { return null; }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const logout = () => {
    clearTokens();
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/login';
  };

  // ✅ INITIALIZATION: Handle token state and auto-refresh on load
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = getToken();
      const refreshToken = getRefreshToken();

      if (!accessToken || !refreshToken) {
        setIsAuthenticated(false);
        return;
      }

      if (isTokenExpired(accessToken)) {
        try {
          const res = await axios.post('http://localhost:8081/auth/refresh', { refreshToken });
          saveTokens(res.data.accessToken, res.data.refreshToken);
          setIsAuthenticated(true);
          setUser(decodeToken(res.data.accessToken));
        } catch (err) {
          logout();
        }
      } else {
        setIsAuthenticated(true);
        setUser(decodeToken(accessToken));
      }
    };
    initAuth();
  }, []);

  // ✅ BACKGROUND REFRESH: Silent update every 5 minutes if expired
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = getToken();
      const refreshToken = getRefreshToken();
      if (token && refreshToken && isTokenExpired(token)) {
        try {
          const res = await axios.post('http://localhost:8081/auth/refresh', { refreshToken });
          saveTokens(res.data.accessToken, res.data.refreshToken);
        } catch { logout(); }
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const login = (accessToken: string, refreshToken: string) => {
    saveTokens(accessToken, refreshToken);
    setIsAuthenticated(true);
    setUser(decodeToken(accessToken));
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
};