import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserDto {
  id: number;
  email: string;
  phone?: string;
  fullname?: string;
  role: string;
  status: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setHydrated: (v: boolean) => void;
  setAuth: (user: UserDto, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateAccessToken: (accessToken: string) => void;
  setRefreshToken: (refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,
      setHydrated: (v) => set({ isHydrated: v }),
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      updateAccessToken: (accessToken) => set({ accessToken }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
    }),
    {
      name: "auth-storage",
      // Persist all auth fields. Session survives page reload.
      // Server-side refreshToken expiry is validated via whoAmI / refresh endpoint.
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: true,
      }),
      onRehydrateStorage: () => {
        return () => {
          useAuthStore.getState().setHydrated(true);
        };
      },
    }
  )
);
