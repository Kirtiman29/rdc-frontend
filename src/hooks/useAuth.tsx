import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { AUTH_STATE_CHANGE_EVENT, getToken, getRefreshToken, saveTokens, clearTokens } from "@/api/apiClient";
import { getCurrentUser } from "@/api/authApi";

interface User {
  id: string;
  email: string;
  name: string;
}

type ApiErrorLike = {
  response?: {
    status?: number;
  };
};

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
  const syncRequestRef = useRef(0);

  const syncAuthState = async () => {
    const requestId = ++syncRequestRef.current;
    const accessToken = getToken();
    const refreshToken = getRefreshToken();

    if (!accessToken || !refreshToken) {
      if (syncRequestRef.current === requestId) {
        setIsAuthenticated(false);
        setUser(null);
      }
      return;
    }

    const decodedUser = decodeToken(accessToken);

    if (!decodedUser) {
      clearTokens();
      if (syncRequestRef.current === requestId) {
        setIsAuthenticated(false);
        setUser(null);
      }
      return;
    }

    if (syncRequestRef.current === requestId) {
      setIsAuthenticated(true);
      setUser(decodedUser);
    }

    try {
      const currentUser = await getCurrentUser();

      if (syncRequestRef.current !== requestId) {
        return;
      }

      setIsAuthenticated(true);
      setUser({
        id: decodedUser.id,
        email: currentUser.email || decodedUser.email,
        name: currentUser.name || decodedUser.name,
      });
    } catch (error) {
      const status = (error as ApiErrorLike)?.response?.status;

      if (syncRequestRef.current !== requestId) {
        return;
      }

      if (status === 401 || status === 403) {
        clearTokens();
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      setIsAuthenticated(true);
      setUser(decodedUser);
    }
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
    void syncAuthState();

    const handleAuthStateChange = () => {
      void syncAuthState();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "accessToken" || event.key === "refreshToken" || event.key === null) {
        void syncAuthState();
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
    const decodedUser = decodeToken(accessToken);

    if (decodedUser) {
      setIsAuthenticated(true);
      setUser(decodedUser);
    }

    void syncAuthState();
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
