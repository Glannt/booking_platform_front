import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface UserDto {
  id: number;
  email: string;
  phone?: string;
  fullname?: string;
  role: string;
  status: string;
  kakaoTalkId?: string;
  zaloId?: string;
  whatsapp?: string;
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
  updateUser: (user: UserDto) => void;
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
        set({ user, accessToken, refreshToken, isAuthenticated: true, isHydrated: true });
        setCookie("accessToken", accessToken, 24 * 60 * 60);
        setCookie("user_role", user.role, 24 * 60 * 60);
      },
      updateUser: (user) => {
        set({ user });
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
      // Only persist non-null auth fields to localStorage when authenticated
      storage: createJSONStorage(() => ({
        getItem: (name: string) => {
          if (typeof window === "undefined") return null;
          return localStorage.getItem(name);
        },
        setItem: (name: string, value: string) => {
          if (typeof window === "undefined") return;
          try {
            const parsed = JSON.parse(value);
            if (parsed?.state?.isAuthenticated && parsed?.state?.accessToken) {
              localStorage.setItem(name, value);
            } else {
              // Do not store null/empty states for guests
              localStorage.removeItem(name);
            }
          } catch {
            localStorage.removeItem(name);
          }
        },
        removeItem: (name: string) => {
          if (typeof window === "undefined") return;
          localStorage.removeItem(name);
        },
      })),
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
