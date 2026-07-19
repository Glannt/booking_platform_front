import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserDto {
  id: number;
  email: string;
  phone?: string;
  fullname?: string;
  role: string;
  status: string;
  kakaoTalkId?: string;
  zaloId?: string;
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

const setCookie = (name: string, value: string, maxAgeSeconds: number) => {
  if (typeof window !== "undefined") {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  }
};

const deleteCookie = (name: string) => {
  if (typeof window !== "undefined") {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,
      setHydrated: (v) => set({ isHydrated: v }),
      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true });
        setCookie("accessToken", accessToken, 24 * 60 * 60);
        setCookie("user_role", user.role, 24 * 60 * 60);
      },
      clearAuth: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        deleteCookie("accessToken");
        deleteCookie("user_role");
      },
      updateAccessToken: (accessToken) => {
        set({ accessToken });
        setCookie("accessToken", accessToken, 24 * 60 * 60);
      },
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
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state.setHydrated(true);
            if (state.isAuthenticated && state.accessToken && state.user) {
              setCookie("accessToken", state.accessToken, 24 * 60 * 60);
              setCookie("user_role", state.user.role, 24 * 60 * 60);
            } else {
              deleteCookie("accessToken");
              deleteCookie("user_role");
            }
          }
        };
      },
    }
  )
);
