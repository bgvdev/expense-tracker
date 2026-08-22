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
    // No separate /api/health warm-up ping: it was fired in parallel with
    // fetchUser(), so both requests queued behind the same cold start and it
    // bought nothing — it only added a request. Keeping a sleeping backend warm
    // has to come from outside the browser (see MONITORING.md).
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
    // Changing the password revokes every existing token server-side, so the
    // response carries a freshly issued one. Store it, or the next request would
    // 401 and log the user out mid-session.
    const res = await apiFetch<{ token: string }>("/api/auth/password", {
      method: "PATCH",
      json: data,
    });
    if (res?.token) localStorage.setItem("auth_token", res.token);
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
