import React, { createContext, useContext, useState, useEffect } from "react";
import { getToken, getRefreshToken, saveTokens, clearTokens } from "@/api/apiClient";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeToken = (token: string): User | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(base64));

    return {
      id: decoded.sub,
      email: decoded.email || "",
      name: decoded.name || "Industrial User",
    };
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const logout = () => {
    clearTokens();
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = "/login";
  };

  /**
   * ✅ Initialization
   * Just restore auth state from stored tokens.
   * Axios interceptor will handle refresh automatically.
   */
  useEffect(() => {
    const accessToken = getToken();
    const refreshToken = getRefreshToken();

    if (!accessToken || !refreshToken) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    const decodedUser = decodeToken(accessToken);

    if (decodedUser) {
      setIsAuthenticated(true);
      setUser(decodedUser);
    } else {
      logout();
    }
  }, []);

  /**
   * ✅ Login
   */
  const login = (accessToken: string, refreshToken: string) => {
    saveTokens(accessToken, refreshToken);

    const decodedUser = decodeToken(accessToken);

    setIsAuthenticated(true);
    setUser(decodedUser);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * ✅ Custom Hook
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};