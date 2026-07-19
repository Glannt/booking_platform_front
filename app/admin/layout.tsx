"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarGroup, UserProfile } from "@/components/sidebar";
import { useI18n } from "@/context/LanguageContext";
import { ThemeSwitch } from "@/components/theme-switch";
import { Language } from "@/config/translations";
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
} from "lucide-react";
import {
  Drawer,
  Dropdown,
  Label,
  useOverlayState,
  Button,
} from "@heroui/react";
import { useAuthStore } from "@/lib/store/authStore";
import AuthGuard from "@/components/auth-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { language, setLanguage, t, supportedLanguages } = useI18n();
  const [userLocation, setUserLocation] = useState<string>("");
  const mobileDrawerState = useOverlayState();
  const authUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${language}`
            );
            if (res.ok) {
              const data = await res.json();
              const address = data.address;
              const city = address.city || address.town || address.village || address.county || address.state || "";
              const country = address.country || "";
              if (city && country) {
                setUserLocation(`${city}, ${country}`);
              } else if (data.display_name) {
                setUserLocation(data.display_name.split(",").slice(0, 2).join(","));
              } else {
                setUserLocation(`${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
              }
            } else {
              setUserLocation(`${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
            }
          } catch (error) {
            setUserLocation(`${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
          }
        },
        (error) => {
          console.warn("Geolocation permission denied or error occurred:", error);
        }
      );
    }
  }, [language]);

  const sidebarGroups: SidebarGroup[] = [
    {
      title: "Khám phá",
      items: [
        {
          key: "admin-dashboard",
          label: "Tổng quan",
          path: "/admin",
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
          path: "/admin/bookings",
          icon: <Calendar size={20} />,
        },
        {
          key: "tours-mgmt",
          label: "Quản lý Tour",
          path: "/admin/tours",
          icon: <Compass size={20} />,
        },
        {
          key: "vehicles-mgmt",
          label: "Đội xe",
          path: "/admin/vehicles",
          icon: <Car size={20} />,
        },
        {
          key: "airport-transfers-mgmt",
          label: "Đưa đón sân bay",
          path: "/admin/airport-transfers",
          icon: <Plane size={20} />,
        },
      ],
    },
    {
      title: "Hệ thống",
      items: [
        {
          key: "sections-mgmt",
          label: "Sections / Banner",
          path: "/admin/sections",
          icon: <Layers size={20} />,
        },
        ...(authUser?.role === "ADMIN"
          ? [
              {
                key: "roles",
                label: "Phân quyền",
                path: "/admin/roles",
                icon: <Shield size={20} />,
              },
            ]
          : []),
        ...(authUser?.role === "ADMIN" || authUser?.role === "MODERATOR"
          ? [
              {
                key: "users-mgmt",
                label: "Quản lý Users",
                path: "/admin/users",
                icon: <Users size={20} />,
              },
            ]
          : []),
        {
          key: "settings",
          label: "Cài đặt tài khoản",
          path: "/admin/settings",
          icon: <Settings size={20} />,
        },
      ],
    },
  ];

  const userProfile: UserProfile = authUser
    ? { name: authUser.fullname || authUser.email, email: authUser.email, role: authUser.role }
    : { name: "Khách", email: "", role: "" };

  const getLanguageLabel = (lang: Language) => {
    const found = supportedLanguages.find(l => l.code === lang);
    if (found) {
      return `${found.flagIcon} ${found.code.toUpperCase()}`;
    }
    switch (lang) {
      case "vi": return "🇻🇳 VI";
      case "en": return "🇬🇧 EN";
      case "ko": return "🇰🇷 KO";
      case "ru": return "🇷🇺 RU";
      default: return String(lang).toUpperCase();
    }
  };

  const isBookingsMgmt = pathname?.startsWith("/admin/bookings");
  const isToursMgmt = pathname?.startsWith("/admin/tours");
  const isVehiclesMgmt = pathname?.startsWith("/admin/vehicles");
  const isCategoriesMgmt = pathname?.startsWith("/admin/services/categories");
  const isFaqsMgmt = pathname?.startsWith("/admin/services/faqs");
  const isServicesMgmt = pathname?.startsWith("/admin/services") && !isCategoriesMgmt && !isFaqsMgmt;
  const isSettings = pathname?.startsWith("/admin/settings");
  const isRoles = pathname?.startsWith("/admin/roles");
  const isSections = pathname?.startsWith("/admin/sections");

  const getPageTitle = () => {
    if (isRoles) {
      return "Quản lý Phân quyền";
    }
    if (isSections) {
      return "Quản lý Sections / Banner";
    }
    if (isBookingsMgmt) {
      return "Quản lý Đơn đặt xe & Tour";
    }
    if (isCategoriesMgmt) {
      return "Danh mục Dịch vụ & Tour";
    }
    if (isFaqsMgmt) {
      return "Quản lý Feedback & Đánh giá";
    }
    if (isToursMgmt) {
      return "Quản lý Tour Du Lịch";
    }
    if (isVehiclesMgmt) {
      return "Quản lý Xe";
    }
    if (isServicesMgmt) {
      return "Quản lý Đưa đón & Dịch vụ";
    }
    if (isSettings) {
      return "Cài đặt tài khoản";
    }
    return "Tổng quan Hệ thống";
  };

  const getPageSubtitle = () => {
    if (isBookingsMgmt) {
      return "Theo dõi và cập nhật trạng thái đơn đặt xe, dịch vụ, thông tin khách hàng và thanh toán.";
    }
    if (isCategoriesMgmt) {
      return "Thiết lập các nhóm danh mục cho tour du lịch, thuê xe hoặc đưa đón.";
    }
    if (isFaqsMgmt) {
      return "Tạo và quản lý đánh giá khách hàng, chọn hiển thị trên trang chủ.";
    }
    if (isToursMgmt) {
      return "Quản lý danh sách tour du lịch, lịch trình chi tiết, giá vé và thông tin liên quan.";
    }
    if (isVehiclesMgmt) {
      return "Thiết lập đội xe, danh mục xe, tuyến đường và bảng giá đưa đón sân bay.";
    }
    if (isServicesMgmt) {
      return "Thiết lập danh mục dịch vụ, tuyến đưa đón, lịch trình chi tiết và bảng giá.";
    }
    if (isRoles) {
      return "Quản lý quyền hạn của từng vai trò quản trị viên.";
    }
    if (isSections) {
      return "Quản lý banner, nội dung hiển thị trên từng trang của website.";
    }
    if (isSettings) {
      return "Thiết lập cấu hình tài khoản và phân quyền quản trị.";
    }
    return "Báo cáo số liệu đặt xe, doanh thu và kiểm tra lịch sử hoạt động.";
  };

  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AuthGuard allowedRoles={["ADMIN", "STAFF", "MODERATOR"]}>
      <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
        {/* Sidebar - desktop */}
        <div className="hidden md:flex">
          <Sidebar
            isShowCollapsedBadge={true}
            className="text-foreground"
            groups={sidebarGroups}
            user={userProfile}
            brandName="Minh Khoa Travel"
            logo={<LayoutDashboard className="text-primary" size={24} />}
            onLogout={() => console.log("Admin logout")}
            onSettingsClick={() => console.log("Admin settings click")}
          />
        </div>

        {/* Content Area */}
        <main className="flex-grow p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Hamburger - mobile */}
                <Drawer state={mobileDrawerState} key="blur">
                  <Button
                    isIconOnly
                    variant="ghost"
                    className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm bg-transparent"
                    onClick={() => mobileDrawerState.open()}
                    aria-label="Open menu"
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
                            brandName="Minh Khoa Travel"
                            logo={<LayoutDashboard className="text-primary" size={24} />}
                            onLogout={() => { mobileDrawerState.close(); }}
                            onSettingsClick={() => { mobileDrawerState.close(); }}
                          />
                        </Drawer.Body>
                      </Drawer.Dialog>
                    </Drawer.Content>
                  </Drawer.Backdrop>
                </Drawer>

                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {getPageTitle()}
                  </h1>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {getPageSubtitle()}
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-3">
                {/* Theme Selector */}
                <ThemeSwitch className="flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:border-slate-300 w-10 h-10 rounded-xl text-slate-700 dark:text-slate-200 shadow-sm min-w-0 p-0 flex-shrink-0" />
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
