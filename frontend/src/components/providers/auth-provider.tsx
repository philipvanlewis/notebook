"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores";
import { authApi } from "@/lib/api";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading, token, logout } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      // If we have a token, try to get the current user
      if (token) {
        try {
          const user = await authApi.me();
          setUser(user);
        } catch {
          // Token is invalid, clear auth state
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token, setUser, setLoading, logout]);

  return <>{children}</>;
}
