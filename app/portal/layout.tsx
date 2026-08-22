"use client";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  CalendarDays,
  Milestone,
  Coins,
  Search,
  Percent,
  KeyRound,
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
  const { language, setLanguage, t, supportedLanguages } = useI18n();
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
      ],
    },
    {
      title: "Hệ thống",
      items: [
        {
          key: "sections-mgmt",
          label: "Sections / Banner",
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

  const isBookingsMgmt = pathname?.startsWith("/portal/bookings") || pathname?.startsWith("/admin/bookings");
  const isBookingTours = pathname === "/portal/bookings" || pathname === "/admin/bookings";
  const isBookingSelfDrive = pathname?.startsWith("/portal/bookings/self-drive") || pathname?.startsWith("/admin/bookings/self-drive");
  const isBookingIntercity = pathname?.startsWith("/portal/bookings/intercity") || pathname?.startsWith("/admin/bookings/intercity");
  const isBookingAirport = pathname?.startsWith("/portal/bookings/airport-transfers") || pathname?.startsWith("/admin/bookings/airport-transfers");
  const isToursMgmt = pathname?.startsWith("/portal/tours") || pathname?.startsWith("/admin/tours");
  const isVehiclesMgmt = pathname?.startsWith("/portal/vehicles") || pathname?.startsWith("/admin/vehicles");
  const isFaqsMgmt = pathname?.startsWith("/portal/services/faqs") || pathname?.startsWith("/admin/services/faqs");
  const isSettings = pathname?.startsWith("/portal/settings") || pathname?.startsWith("/admin/settings");
  const isRoles = pathname?.startsWith("/portal/roles") || pathname?.startsWith("/admin/roles");
  const isSections = pathname?.startsWith("/portal/sections") || pathname?.startsWith("/admin/sections");
  const isContactsMgmt = pathname?.startsWith("/portal/contacts") || pathname?.startsWith("/admin/contacts");
  const isRentalBookings = pathname?.startsWith("/portal/rental-bookings") || pathname?.startsWith("/admin/rental-bookings");
  const isIntercityMgmt = pathname?.startsWith("/portal/intercity") || pathname?.startsWith("/admin/intercity");
  const isSurchargesMgmt = pathname?.startsWith("/portal/surcharges") || pathname?.startsWith("/admin/surcharges");
  const isCurrenciesMgmt = pathname?.startsWith("/portal/currencies") || pathname?.startsWith("/admin/currencies");
  const isFlightsMgmt = pathname?.startsWith("/portal/flights") || pathname?.startsWith("/admin/flights");

  const getPageTitle = () => {
    if (isBookingSelfDrive) {
      return "Quản lý Đơn đặt xe tự lái";
    }
    if (isBookingIntercity) {
      return "Quản lý Đơn đặt xe Liên tỉnh";
    }
    if (isBookingAirport) {
      return "Quản lý Đơn đưa đón sân bay";
    }
    if (isRentalBookings) {
      return "Quản lý Đơn thuê xe tự lái";
    }
    if (isIntercityMgmt) {
      return "Quản lý Tuyến xe Liên tỉnh";
    }
    if (isSurchargesMgmt) {
      return "Quản lý Phụ thu";
    }
    if (isContactsMgmt) {
      return "Cấu hình Liên hệ";
    }
    if (isCurrenciesMgmt) {
      return "Tiền tệ & Tỉ giá";
    }
    if (isRoles) {
      return "Quản lý Phân quyền";
    }
    if (isSections) {
      return "Quản lý Sections / Banner";
    }
    if (isBookingTours) {
      return "Quản lý Đơn đặt Tours";
    }
    if (isBookingsMgmt) {
      return "Quản lý Đơn đặt";
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
    if (isFlightsMgmt) {
      return "Tra cứu chuyến bay";
    }
    if (isSettings) {
      return "Cài đặt tài khoản";
    }
    return "Tổng quan Hệ thống";
  };

  const getPageSubtitle = () => {
    if (isBookingSelfDrive) {
      return "Quản lý danh sách đơn đặt xe tự lái, trạng thái và thông tin khách hàng.";
    }
    if (isBookingIntercity) {
      return "Quản lý danh sách đơn đặt xe liên tỉnh, trạng thái và thông tin khách hàng.";
    }
    if (isBookingAirport) {
      return "Quản lý danh sách đơn đặt đưa đón sân bay, trạng thái và thông tin khách hàng.";
    }
    if (isRentalBookings) {
      return "Theo dõi danh sách, trạng thái thanh toán và thông tin giao nhận xe tự lái.";
    }
    if (isIntercityMgmt) {
      return "Cấu hình danh sách tuyến đường liên tỉnh, bảng giá chi tiết theo loại xe và phụ phí thời gian.";
    }
    if (isContactsMgmt) {
      return "Quản lý các kênh liên hệ của khách hàng như Zalo, Phone, KakaoTalk, Whatsapp.";
    }
    if (isCurrenciesMgmt) {
      return "Quản lý loại tiền tệ, tỉ giá so với VND và hiển thị giá theo ngôn ngữ.";
    }
    if (isBookingTours) {
      return "Theo dõi và cập nhật trạng thái đơn đặt tour, dịch vụ, thông tin khách hàng và thanh toán.";
    }
    if (isBookingsMgmt) {
      return "Theo dõi và quản lý tất cả các đơn đặt trong hệ thống.";
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
    if (isRoles) {
      return "Quản lý quyền hạn của từng vai trò quản trị viên.";
    }
    if (isSections) {
      return "Quản lý banner, nội dung hiển thị trên từng trang của website.";
    }
    if (isFlightsMgmt) {
      return "Tra cứu thông tin chuyến bay theo số hiệu và xem lịch sử tra cứu.";
    }
    if (isSettings) {
      return "Thiết lập cấu hình tài khoản và phân quyền quản trị.";
    }
    return "Báo cáo số liệu đặt xe, doanh thu và kiểm tra lịch sử hoạt động.";
  };

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
