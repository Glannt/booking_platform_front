"use client";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, SidebarGroup, UserProfile } from "@/components/sidebar";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  LayoutDashboard,
  Settings,
  Globe,
  ChevronDown,
  Menu,
  Compass,
  Calendar,
  Car,
  Briefcase,
  Plane,
  Shield,
  Layers,
  Users,
  CalendarDays,
  Milestone,
  Coins,
  Search,
  Percent,
  KeyRound,
  Tag,
} from "lucide-react";
import {
  Drawer,
  Dropdown,
  Label,
  useOverlayState,
  Button,
} from "@heroui/react";
import { useAuthStore } from "@/lib/store/authStore";
import { apiFetch } from "@/lib/api/client";
import AuthGuard from "@/components/auth-guard";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const mobileDrawerState = useOverlayState();
  const authUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch { }
    clearAuth();
    router.push("/portal/login");
  };

  const sidebarGroups: SidebarGroup[] = [
    {
      title: "Khám phá",
      items: [
        {
          key: "portal-dashboard",
          label: "Tổng quan",
          path: "/portal",
          icon: <LayoutDashboard size={20} />,
        },
      ],
    },
    {
      title: "Quản lý",
      items: [
        {
          key: "bookings-mgmt",
          label: "Quản lý Đơn đặt",
          icon: <Calendar size={20} />,
          children: [
            { key: "booking-tours", label: "Đơn đặt Tours", path: "/portal/bookings" },
            { key: "booking-self-drive", label: "Đơn đặt xe tự lái", path: "/portal/bookings/self-drive" },
            { key: "booking-intercity", label: "Đơn đặt xe liên tỉnh", path: "/portal/bookings/intercity" },
            { key: "booking-airport", label: "Đơn đưa đón sân bay", path: "/portal/bookings/airport-transfers" },
          ],
        },
        {
          key: "tours-mgmt",
          label: "Quản lý Tour",
          path: "/portal/tours",
          icon: <Compass size={20} />,
        },
        {
          key: "self-drive-mgmt",
          label: "Thuê xe Tự lái",
          path: "/portal/self-drive",
          icon: <KeyRound size={20} />,
        },
        {
          key: "intercity-mgmt",
          label: "Tuyến xe Liên tỉnh",
          path: "/portal/intercity",
          icon: <Milestone size={20} />,
        },
        {
          key: "airport-transfers-mgmt",
          label: "Đưa đón sân bay",
          path: "/portal/airport-transfers",
          icon: <Plane size={20} />,
        },
        {
          key: "vehicles-mgmt",
          label: "Đội xe",
          path: "/portal/vehicles",
          icon: <Car size={20} />,
        },
        {
          key: "surcharges-mgmt",
          label: "Quản lý Phụ thu",
          path: "/portal/surcharges",
          icon: <Percent size={20} />,
        },
        {
          key: "flights-mgmt",
          label: "Tra cứu chuyến bay",
          path: "/portal/flights",
          icon: <Search size={20} />,
        },
        {
          key: "discounts-mgmt",
          label: "Quản lý Khuyến mãi",
          path: "/portal/discounts",
          icon: <Tag size={20} />,
        },
      ],
    },
    {
      title: "Hệ thống",
      items: [
        {
          key: "sections-mgmt",
          label: "Khu vực & Banner",
          path: "/portal/sections",
          icon: <Layers size={20} />,
        },
        {
          key: "currencies-mgmt",
          label: "Tiền tệ & Tỉ giá",
          path: "/portal/currencies",
          icon: <Coins size={20} />,
        },
        {
          key: "contact-settings",
          label: "Cấu hình Liên hệ",
          path: "/portal/contacts",
          icon: <Globe size={20} />,
        },
        ...(authUser?.role === "ADMIN" || authUser?.role === "MODERATOR"
          ? [
            {
              key: "users-mgmt",
              label: "Người dùng & Phân quyền",
              path: "/portal/users",
              icon: <Users size={20} />,
            },
          ]
          : []),
        {
          key: "settings",
          label: "Cài đặt tài khoản",
          path: "/portal/settings",
          icon: <Settings size={20} />,
        },
      ],
    },
  ];

  const userProfile: UserProfile = authUser
    ? { name: authUser.fullname || authUser.email, email: authUser.email, role: authUser.role }
    : { name: "Khách", email: "", role: "" };

  const isDashboard = pathname === "/portal" || pathname === "/admin";

  const isLoginPage = pathname === "/portal/login" || pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AuthGuard allowedRoles={["ADMIN", "STAFF", "MODERATOR"]}>
      <div className="portal-layout flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
        {/* Sidebar - desktop */}
        <div className="hidden md:flex flex-shrink-0">
          <Sidebar
            isShowCollapsedBadge={true}
            className="text-foreground"
            groups={sidebarGroups}
            user={userProfile}
            brandName="Minh Khoa Portal"
            isAdmin={true}
            logo={<LayoutDashboard className="text-primary" size={24} />}
            onLogout={handleLogout}
            onSettingsClick={() => router.push("/portal/settings")}
            onProfileClick={() => router.push("/portal/settings")}
          />
        </div>

        {/* Content Area */}
        <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="w-full max-w-[1720px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Hamburger - mobile */}
                <Drawer state={mobileDrawerState} key="blur">
                  <Button
                    isIconOnly
                    variant="ghost"
                    className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-separator text-foreground/70 shadow-sm bg-transparent"
                    onClick={() => mobileDrawerState.open()}
                    aria-label="Mở menu"
                  >
                    <Menu size={20} />
                  </Button>
                  <Drawer.Backdrop variant="blur">
                    <Drawer.Content placement="left" className="max-w-[270px] p-0">
                      <Drawer.Dialog className="outline-none h-full">
                        <Drawer.Body className="p-0 h-full">
                          <Sidebar
                            className="bg-[#f4f7fe] text-foreground"
                            isShowCollapsedBadge={false}
                            groups={sidebarGroups}
                            user={userProfile}
                            brandName="Minh Khoa Portal"
                            isAdmin={true}
                            logo={<LayoutDashboard className="text-primary" size={24} />}
                            onLogout={() => {
                              mobileDrawerState.close();
                              handleLogout();
                            }}
                            onSettingsClick={() => {
                              mobileDrawerState.close();
                              router.push("/portal/settings");
                            }}
                            onProfileClick={() => {
                              mobileDrawerState.close();
                              router.push("/portal/settings");
                            }}
                          />
                        </Drawer.Body>
                      </Drawer.Dialog>
                    </Drawer.Content>
                  </Drawer.Backdrop>
                </Drawer>

                {isDashboard && (
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                      Tổng quan Hệ thống
                    </h1>
                    <p className="text-sm font-medium text-foreground/60 mt-1">
                      Báo cáo số liệu đặt xe, doanh thu và kiểm tra lịch sử hoạt động.
                    </p>
                  </div>
                )}
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-3 ml-auto">
                {/* Theme Selector */}
                <ThemeSwitch className="flex items-center justify-center border border-separator hover:border-foreground/30 w-10 h-10 rounded-xl text-foreground/80 shadow-sm min-w-0 p-0 flex-shrink-0" />
              </div>
            </div>

            {/* Page content */}
            <div className="w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
