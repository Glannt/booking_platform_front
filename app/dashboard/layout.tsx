"use client";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, SidebarGroup, UserProfile } from "@/components/sidebar";
import { useI18n } from "@/context/LanguageContext";
import { ThemeSwitch } from "@/components/theme-switch";
import { Language } from "@/config/translations";
import { DashboardProvider, useDashboard } from "./context";
import {
  LayoutDashboard,
  Briefcase,
  Settings,
  Bell,
  MapPin,
  Globe,
  ChevronDown,
  Menu,
  Clock,
  Calendar,
  CheckCircle2,
  Layers,
  MenuSquare,
  Home,
  Tag,
} from "lucide-react";
import {
  Drawer,
  Dropdown,
  Label,
  useOverlayState,
} from "@heroui/react";
import { useAuthStore } from "@/lib/store/authStore";
import { apiFetch } from "@/lib/api/client";
import AuthGuard from "@/components/auth-guard";
import BookingDetailModal from "@/components/dashboard/BookingDetailModal";



function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isMyBookings = pathname?.replace(/\/$/, "") === "/dashboard/my-bookings";
  const { language, setLanguage, t, supportedLanguages } = useI18n();
  const [userLocation, setUserLocation] = useState<string>("");

  const {
    bookings,
    selectedBookingDto,
    isModalOpen,
    closeModal,
    toastMessage,
    activeRole,
    setActiveRole,
  } = useDashboard();

  const { refreshToken } = useAuthStore();

  const handleLogout = async () => {
    try {
      await apiFetch("/api/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch { }
    clearAuth();
    router.push(`/${language}`);
  };

  // Mobile drawer state
  const mobileDrawerState = useOverlayState();

  // Geolocation trigger on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Fetch clean location name from Nominatim (OpenStreetMap)
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
      title: language === "vi" ? "Điều hướng" : language === "en" ? "Navigation" : language === "ko" ? "네비게이션" : "Навигация",
      items: [
        {
          key: "home",
          label: language === "vi" ? "Trang chủ" : language === "en" ? "Home" : language === "ko" ? "홈" : "Главная",
          path: `/${language}`,
          icon: <Home size={20} />,
        },
      ],
    },
    {
      title: language === "vi" ? "Cá nhân" : language === "en" ? "Personal" : language === "ko" ? "개인 설정" : "Личное",
      items: [
        {
          key: "my-bookings",
          label: language === "vi" ? "Đơn đặt của tôi" : language === "en" ? "My Bookings" : language === "ko" ? "내 예약" : "Мои бронирования",
          path: "/dashboard/my-bookings",
          icon: <Briefcase size={20} />,
          badge: bookings.filter(b => b.status === "confirmed" || b.status === "pending").length,
          badgeColor: "warning" as const,
        },
        {
          key: "discounts",
          label: t.discounts?.customerDiscountsTitle || (language === "vi" ? "Mã giảm giá & Ưu đãi" : "Discounts & Vouchers"),
          path: "/dashboard/discounts",
          icon: <Tag size={20} />,
        },
      ],
    },
    {
      title: language === "vi" ? "Hệ thống" : language === "en" ? "System" : language === "ko" ? "시스템" : "Система",
      items: [
        {
          key: "settings",
          label: language === "vi" ? "Hồ sơ cá nhân" : language === "en" ? "My Profile" : language === "ko" ? "내 프로필" : "Мой профиль",
          path: "/dashboard/profile",
          icon: <Settings size={20} />,
        },
      ],
    },
  ];

  const authUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const userProfile: UserProfile = authUser
    ? { name: authUser.fullname || authUser.email, email: authUser.email, role: t.dashboard.goldMember }
    : { name: "Khách", email: "", role: t.dashboard.goldMember };

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

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Sidebar — hidden on mobile, visible md+ */}
      <div className="hidden md:flex">
        <Sidebar
          isShowCollapsedBadge={true}
          className="text-foreground"
          groups={sidebarGroups}
          user={userProfile}
          brandName="Minh Khoa Travel"
          isAdmin={false}
          logo={<LayoutDashboard className="text-primary" size={24} />}
          onLogout={handleLogout}
          onSettingsClick={() => router.push("/dashboard/profile")}
          onProfileClick={() => router.push("/dashboard/profile")}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Dashboard */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <Drawer state={mobileDrawerState} key="blur">
                <button
                  className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm"
                  onClick={() => mobileDrawerState.open()}
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </button>
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
                          isAdmin={false}
                          logo={<LayoutDashboard className="text-primary" size={24} />}
                          onLogout={() => { mobileDrawerState.close(); handleLogout(); }}
                          onSettingsClick={() => { mobileDrawerState.close(); router.push("/dashboard/profile"); }}
                          onProfileClick={() => { mobileDrawerState.close(); router.push("/dashboard/profile"); }}
                        />
                      </Drawer.Body>
                    </Drawer.Dialog>
                  </Drawer.Content>
                </Drawer.Backdrop>
              </Drawer>

              <div>
                {isMyBookings ? (
                  <>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {t.myBookings?.title || "My Bookings"}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                      {t.myBookings?.subtitle || "View, search, and manage all your scheduled trips."}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {t.dashboard.welcome} {userProfile.name}!
                      </h1>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin size={14} className="text-slate-400" />
                      {userLocation || t.dashboard.location}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Switcher Component */}
              <ThemeSwitch />

              {/* Language Selector Dropdown */}
              <Dropdown>
                <Dropdown.Trigger
                  className="flex items-center gap-1.5 border border-slate-200 hover:border-slate-300 px-3 h-10 rounded-xl font-bold text-slate-700 shadow-sm cursor-pointer bg-transparent outline-none"
                >
                  <Globe size={16} className="text-foreground animate-pulse flex-shrink-0" />
                  <span className="text-xs text-foreground dark:text-white">{getLanguageLabel(language)}</span>
                  <ChevronDown size={12} className="opacity-60 flex-shrink-0 dark:text-white" />
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

              {/* Notification Button */}
              {/* <button className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 text-foreground hover:bg-slate-50 dark:hover:bg-[var(--bg-surface)] shadow-sm transition-colors bg-transparent cursor-pointer">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[var(--bg-page)]"></span>
              </button> */}

              {/* Book New Trip Dropdown */}
              <Dropdown>
                <Dropdown.Trigger className="bg-accent text-white hover:bg-accent-hover h-10 px-5 rounded-xl font-bold text-sm shadow-md shadow-blue-100 dark:shadow-none transition-all border-none flex items-center gap-1.5 cursor-pointer outline-none">
                  {t.dashboard.bookNewTrip}
                  <ChevronDown size={14} />
                </Dropdown.Trigger>
                <Dropdown.Popover className="min-w-[180px]">
                  <Dropdown.Menu aria-label="Booking services" onAction={(key) => router.push(key as string)}>
                    <Dropdown.Item id={`/${language}/tours`} key={`/${language}/tours`} textValue={t.nav.tour}>
                      <Label>{t.nav.tour}</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id={`/${language}/airport-transfer`} key={`/${language}/airport-transfer`} textValue={t.nav.airportTransfer}>
                      <Label>{t.nav.airportTransfer}</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id={`/${language}/intercity`} key={`/${language}/intercity`} textValue={t.nav.rentCar}>
                      <Label>{t.nav.rentCar}</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id={`/${language}/self-drive`} key={`/${language}/self-drive`} textValue={t.nav.selfDrive}>
                      <Label>{t.nav.selfDrive}</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </div>
          </div>

          {/* Page Contents */}
          {children}

          {/* Toast Message Notification */}
          {toastMessage && (
            <div className="fixed bottom-4 right-4 z-50 text-white dark:text-slate-100 bg-slate-900 dark:bg-[var(--bg-card)] px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700/50 animate-in fade-in slide-in-from-bottom-5 duration-200">
              <CheckCircle2 className="text-emerald-400" size={20} />
              <span className="text-sm font-bold">{toastMessage}</span>
            </div>
          )}

          {/* Booking Detail Modal — per-service-type design, data from BookingDto */}
          <BookingDetailModal
            isOpen={isModalOpen}
            onClose={closeModal}
            booking={selectedBookingDto}
          />
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <AuthGuard allowedRoles={["ADMIN", "STAFF", "CUSTOMER"]}>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </AuthGuard>
    </DashboardProvider>
  );
}
