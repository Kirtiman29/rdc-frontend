import React, { createContext, useContext, useState, useEffect } from "react";
import { AUTH_STATE_CHANGE_EVENT, getToken, getRefreshToken, saveTokens, clearTokens } from "@/api/apiClient";

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
    const paddedBase64 = `${base64Url.replace(/-/g, "+").replace(/_/g, "/")}${"=".repeat((4 - (base64Url.length % 4)) % 4)}`;
    const decoded = JSON.parse(atob(paddedBase64));

    return {
      id: decoded.sub,
      email: decoded.email || "",
      name: decoded.name || decoded.displayName || decoded.email?.split("@")[0] || "Industrial User",
    };
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const syncAuthState = () => {
    const accessToken = getToken();
    const refreshToken = getRefreshToken();

    if (!accessToken || !refreshToken) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    const decodedUser = decodeToken(accessToken);

    if (!decodedUser) {
      clearTokens();
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    setIsAuthenticated(true);
    setUser(decodedUser);
  };

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
    syncAuthState();

    const handleAuthStateChange = () => syncAuthState();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "accessToken" || event.key === "refreshToken" || event.key === null) {
        syncAuthState();
      }
    };

    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  /**
   * ✅ Login
   */
  const login = (accessToken: string, refreshToken: string) => {
    saveTokens(accessToken, refreshToken);
    syncAuthState();
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
