import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        token: null,
        isLoading: true,
        isAuthenticated: false,

        // Actions
        setUser: (user) =>
          set({ user, isAuthenticated: !!user }),

        setToken: (token) =>
          set({ token }),

        setLoading: (isLoading) =>
          set({ isLoading }),

        login: (user, token) =>
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          }),

        logout: () =>
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          }),
      }),
      {
        name: "notebook-auth-store",
        partialize: (state) => ({
          token: state.token,
          user: state.user,
        }),
      }
    ),
    { name: "AuthStore" }
  )
);
