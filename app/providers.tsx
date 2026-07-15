"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { LanguageProvider } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Toast } from "@heroui/react";
import { useAuthStore } from "@/lib/store/authStore";
import { getWhoAmI } from "@/lib/api/auth";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  React.useEffect(() => {
    if (!isHydrated) return;
    const { isAuthenticated, accessToken } = useAuthStore.getState();
    if (!isAuthenticated || !accessToken) return;

    getWhoAmI().then((user) => {
      if (user) {
        const { refreshToken } = useAuthStore.getState();
        setAuth(user, accessToken, refreshToken ?? "");
      } else {
        clearAuth();
      }
    }).catch(() => {});
  }, [isHydrated]);

  return (
    <LanguageProvider>
      <NextThemesProvider {...themeProps}>
        {children}
        <LanguageSelector />
        <Toast.Provider />
      </NextThemesProvider>
    </LanguageProvider>
  );
}
