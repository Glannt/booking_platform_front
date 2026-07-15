"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { Button } from "@heroui/react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isHydrated } = useAuthStore();

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname.endsWith("/login") || pathname.endsWith("/register");

  // Safety net: force hydrated after 500ms in case onRehydrateStorage never fires
  useEffect(() => {
    if (isHydrated) return;
    const timer = setTimeout(() => {
      useAuthStore.getState().setHydrated(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (isLoginPage) return;

    if (!isAuthenticated || !user) {
      router.replace(isAdminRoute ? "/admin/login" : "/vi/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(isAdminRoute ? "/admin/login" : "/");
    }
  }, [isHydrated, isAuthenticated, user, allowedRoles, router, pathname, isAdminRoute, isLoginPage]);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A227]" />
          <p className="text-sm text-slate-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (isLoginPage) return <>{children}</>;

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <p className="text-slate-500 text-sm">Phiên đăng nhập đã hết hạn.</p>
          <Button
            className="bg-[#C9A227] text-white font-bold px-6"
            onClick={() => router.replace(isAdminRoute ? "/admin/login" : "/vi/login")}
          >
            Đăng nhập lại
          </Button>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <p className="text-slate-500 text-sm">Bạn không có quyền truy cập trang này.</p>
          <Button
            className="bg-[#C9A227] text-white font-bold px-6"
            onClick={() => router.replace(isAdminRoute ? "/admin/login" : "/")}
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
