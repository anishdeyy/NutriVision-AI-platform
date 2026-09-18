import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserProfile } from "../types";
import api from "../services/api";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("nv_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.data);
    } catch (err) {
      setUser(null);
      setToken(null);
      localStorage.removeItem("nv_token");
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.getProfile();
      setProfile(res.data);
    } catch (err) {
      setProfile(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        await refreshUser();
        await refreshProfile();
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    const { access_token, user: u } = res.data;
    localStorage.setItem("nv_token", access_token);
    setToken(access_token);
    setUser(u);
    await refreshProfile();
  };

  const demoLogin = async () => {
    await login("demo@nutrivision.ai", "password123");
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    const { access_token, user: u } = res.data;
    localStorage.setItem("nv_token", access_token);
    setToken(access_token);
    setUser(u);
    await refreshProfile();
  };

  const logout = () => {
    localStorage.removeItem("nv_token");
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        demoLogin,
        register,
        logout,
        refreshUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
