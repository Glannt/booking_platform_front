"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarGroup, UserProfile } from "@/components/sidebar";
import { useI18n } from "@/context/LanguageContext";
import { ThemeSwitch } from "@/components/theme-switch";
import { Language } from "@/config/translations";
import {
  LayoutDashboard,
  Calendar,
  Car,
  Settings,
  Globe,
  ChevronDown,
  Menu,
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

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { language, setLanguage, t, supportedLanguages } = useI18n();
  const mobileDrawerState = useOverlayState();
  const authUser = useAuthStore((s) => s.user);

  const sidebarGroups: SidebarGroup[] = [
    {
      title: language === "vi" ? "Khám phá" : language === "en" ? "Explore" : language === "ko" ? "탐색" : "Исследовать",
      items: [
        {
          key: "staff-dashboard",
          label: language === "vi" ? "Tổng quan" : language === "en" ? "Dashboard" : language === "ko" ? "대시보드" : "Панель управления",
          path: "/staff",
          icon: <LayoutDashboard size={20} />,
        },
      ],
    },
    {
      title: language === "vi" ? "Điều phối" : language === "en" ? "Operations" : language === "ko" ? "운영" : "Операции",
      items: [
        {
          key: "dispatch-schedule",
          label: language === "vi" ? "Lịch điều xe" : language === "en" ? "Dispatching Schedule" : language === "ko" ? "차량 배차 일정" : "График диспетчеризации",
          path: "/staff/dispatching",
          icon: <Calendar size={20} />,
        },
        {
          key: "vehicle-pool",
          label: language === "vi" ? "Đội xe điều động" : language === "en" ? "Vehicle Pool" : language === "ko" ? "차량 풀" : "Автопарк",
          path: "/staff/vehicles",
          icon: <Car size={20} />,
        },
      ],
    },
    {
      title: language === "vi" ? "Hệ thống" : language === "en" ? "System" : language === "ko" ? "시스템" : "Система",
      items: [
        {
          key: "settings",
          label: language === "vi" ? "Cài đặt tài khoản" : language === "en" ? "Account Settings" : language === "ko" ? "계정 설정" : "Настройки аккаунта",
          path: "/staff/settings",
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

  const isDispatching = pathname?.startsWith("/staff/dispatching");
  const isVehicles = pathname?.startsWith("/staff/vehicles");
  const isSettings = pathname?.startsWith("/staff/settings");

  const getPageTitle = () => {
    if (isDispatching) {
      return language === "vi" ? "Lịch điều phối xe" : "Dispatching Schedule";
    }
    if (isVehicles) {
      return language === "vi" ? "Đội xe điều động" : "Vehicle Pool";
    }
    if (isSettings) {
      return language === "vi" ? "Cài đặt tài khoản" : "Account Settings";
    }
    return language === "vi" ? "Trung tâm điều vận" : "Operations Center";
  };

  const getPageSubtitle = () => {
    if (isDispatching) {
      return language === "vi" ? "Xem danh sách và phân bổ tài xế cho các hành trình sắp diễn ra." : "View upcoming itinerary trips and allocate drivers.";
    }
    if (isVehicles) {
      return language === "vi" ? "Quản lý trạng thái, lịch bảo trì và thông tin đội xe." : "Manage availability, maintenance schedules, and car models.";
    }
    if (isSettings) {
      return language === "vi" ? "Thiết lập cấu hình thông tin cá nhân và thông báo ca trực." : "Set up user preferences and Shift notifications.";
    }
    return language === "vi" ? "Theo dõi thời gian thực lịch trình di chuyển và phân bổ lái xe." : "Real-time dispatch board, upcoming bookings, and fleet status.";
  };

  return (
    <AuthGuard allowedRoles={["STAFF"]}>
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Sidebar - desktop */}
      <div className="hidden md:flex">
        <Sidebar
          isShowCollapsedBadge={true}
          className="text-foreground"
          groups={sidebarGroups}
          user={userProfile}
          brandName="Minh Khoa Travel"
          logo={<Car className="text-primary" size={24} />}
          onLogout={() => console.log("Staff logout")}
          onSettingsClick={() => console.log("Staff settings click")}
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
                          logo={<Car className="text-primary" size={24} />}
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
              
              {/* Language Selector */}
              <Dropdown>
                <Dropdown.Trigger
                  className="flex items-center gap-1.5 border border-slate-200 hover:border-slate-300 px-3 h-10 rounded-xl font-bold text-slate-700 shadow-sm cursor-pointer bg-transparent outline-none"
                >
                  <Globe size={16} className="text-foreground animate-pulse flex-shrink-0" />
                  <span className="text-xs text-foreground">{getLanguageLabel(language)}</span>
                  <ChevronDown size={12} className="opacity-60 flex-shrink-0" />
                </Dropdown.Trigger>
                <Dropdown.Popover className="min-w-[150px]">
                  <Dropdown.Menu
                    aria-label="Language options"
                    onAction={(key) => setLanguage(key as Language)}
                  >
                    {supportedLanguages.map((lang) => (
                      <Dropdown.Item key={lang.code} id={lang.code} textValue={lang.name}>
                        <div className="flex items-center gap-2">
                          <span className="text-base">{lang.flagIcon}</span>
                          <Label className="text-sm">{lang.name}</Label>
                        </div>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
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
