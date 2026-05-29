import { create } from "zustand";
import { type AuthUser, login as apiLogin, logout as apiLogout, refreshToken, type LoginRequest } from "@/lib/auth";
import { clearAccessToken, getAccessToken } from "@/lib/api";

interface AuthState {
  authorized: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;

  login: (request: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  tryRestore: () => Promise<void>;
  clearError: () => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  authorized: false,
  user: null,
  isLoading: true,
  error: null,

  login: async (request: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiLogin(request);
      set({
        authorized: true,
        user: data.user,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Login failed",
      });
      throw err;
    }
  },

  logout: async () => {
    await apiLogout();
    set({
      authorized: false,
      user: null,
      isLoading: false,
      error: null,
    });
  },

  tryRestore: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const data = await refreshToken();
      set({
        authorized: true,
        user: data.user,
        isLoading: false,
      });
    } catch {
      clearAccessToken();
      set({
        authorized: false,
        user: null,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
}));