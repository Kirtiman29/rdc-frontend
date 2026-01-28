import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, saveTokens, clearTokens } from '@/api/apiClient';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ✅ Initialize directly from localStorage to prevent flash-logout
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken());

  const login = (accessToken: string, refreshToken: string) => {
    saveTokens(accessToken, refreshToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearTokens();
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  // ✅ Keep state in sync with token presence
  useEffect(() => {
    const token = getToken();
    setIsAuthenticated(!!token);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};