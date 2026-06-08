"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import apiFetch from "@/lib/api";
import type { User, AuthResponse, UpdateProfileData, UpdatePasswordData } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: Record<string, string>) => Promise<void>;
  register: (data: Record<string, string>) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  updatePassword: (data: UpdatePasswordData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const userData = await apiFetch<User>("/api/auth/me");
      setUser(userData);
    } catch {
      setUser(null);
      localStorage.removeItem("auth_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (data: Record<string, string>) => {
    const res = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      json: data,
    });
    localStorage.setItem("auth_token", res.token);
    setUser(res.user);
  };

  const register = async (data: Record<string, string>) => {
    const res = await apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      json: data,
    });
    localStorage.setItem("auth_token", res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  const updateProfile = async (data: UpdateProfileData) => {
    const updated = await apiFetch<User>("/api/auth/profile", {
      method: "PATCH",
      json: data,
    });
    setUser(updated);
  };

  const updatePassword = async (data: UpdatePasswordData) => {
    await apiFetch("/api/auth/password", {
      method: "PATCH",
      json: data,
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
