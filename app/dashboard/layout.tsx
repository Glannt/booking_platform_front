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
  X,
  Users,
  Car,
  Luggage,
  Clock,
  Plane,
  Calendar,
  CheckCircle2,
  Layers,
  MenuSquare,
} from "lucide-react";
import {
  Button,
  Drawer,
  Dropdown,
  Label,
  Separator,
  useOverlayState,
} from "@heroui/react";
import { useAuthStore } from "@/lib/store/authStore";
import { apiFetch } from "@/lib/api/client";
import AuthGuard from "@/components/auth-guard";
import clsx from "clsx";

const myBookingsTranslations = {
  vi: {
    title: "Đơn đặt của tôi",
    subtitle: "Xem, tìm kiếm và quản lý tất cả các chuyến đi của bạn.",
    bookingType: "Loại đơn",
    customerName: "Người đặt",
    guestsCount: "Hành khách",
    baggage: "Hành lý",
    carSeats: "Số chỗ ngồi",
    pickup: "Điểm đón",
    dropoff: "Điểm trả",
    pickupTime: "Thời gian đón",
    flightDetails: "Chi tiết chuyến bay",
    flightNumber: "Số hiệu chuyến bay",
    estDeparture: "Giờ cất cánh dự kiến",
    estLanding: "Giờ hạ cánh dự kiến",
    airportTransfer: "Trung chuyển sân bay",
    interProvincial: "Thuê xe đi tỉnh",
    cancelledStatus: "Đã hủy",
    reqCancelledStatus: "Chờ hủy",
    close: "Đóng",
  },
  en: {
    title: "My Bookings",
    subtitle: "View, search, and manage all your scheduled trips.",
    bookingType: "Booking Type",
    customerName: "Customer Name",
    guestsCount: "Passengers",
    baggage: "Baggage",
    carSeats: "Seat Capacity",
    pickup: "Pickup Location",
    dropoff: "Dropoff Location",
    pickupTime: "Pickup Time",
    flightDetails: "Flight Details",
    flightNumber: "Flight Number",
    estDeparture: "Est. Departure Time",
    estLanding: "Est. Landing Time",
    airportTransfer: "Airport Transfer",
    interProvincial: "Inter-provincial Rent",
    cancelledStatus: "Cancelled",
    reqCancelledStatus: "Cancellation Requested",
    close: "Close",
  },
  ko: {
    title: "내 예약 내역",
    subtitle: "모든 예정된 여행을 보고 검색하고 관리하세요.",
    bookingType: "예약 유형",
    customerName: "예약자 이름",
    guestsCount: "탑승객 수",
    baggage: "수하물",
    carSeats: "좌석 수",
    pickup: "출발지",
    dropoff: "목적지",
    pickupTime: "출발 시간",
    flightDetails: "항공편 상세 정보",
    flightNumber: "항공편 명",
    estDeparture: "예정 출발 시간",
    estLanding: "예정 도착 시간",
    airportTransfer: "공항 픽업/샌딩",
    interProvincial: "시외 차 렌트",
    cancelledStatus: "취소됨",
    reqCancelledStatus: "취소 요청 중",
    close: "닫기",
  },
  ru: {
    title: "Мои бронирования",
    subtitle: "Просмотр, поиск и управление всеми вашими поездками.",
    bookingType: "Тип бронирования",
    customerName: "Имя клиента",
    guestsCount: "Пассажиры",
    baggage: "Багаж",
    carSeats: "Кол-во мест",
    pickup: "Место посадки",
    dropoff: "Место высадки",
    pickupTime: "Время посадки",
    flightDetails: "Информация о рейсе",
    flightNumber: "Номер рейса",
    estDeparture: "Ожидаемое время вылета",
    estLanding: "Ожидаемое время посадки",
    airportTransfer: "Трансфер из аэропорта",
    interProvincial: "Междугородний прокат",
    cancelledStatus: "Отменено",
    reqCancelledStatus: "Запрошена отмена",
    close: "Закрыть",
  }
};

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isMyBookings = pathname?.replace(/\/$/, "") === "/dashboard/my-bookings";
  const { language, setLanguage, t, supportedLanguages } = useI18n();
  const [userLocation, setUserLocation] = useState<string>("");

  const {
    bookings,
    selectedBooking,
    isModalOpen,
    isModalClosing,
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
      title: language === "vi" ? "Khám phá" : language === "en" ? "Explore" : language === "ko" ? "탐색" : "Исследовать",
      items: [
        {
          key: "dashboard",
          label: language === "vi" ? "Tổng quan" : language === "en" ? "Dashboard" : language === "ko" ? "대시보드" : "Панель управления",
          path: "/dashboard",
          icon: <LayoutDashboard size={20} />,
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

  const getLocalizedBookingType = (type: string) => {
    if (type === "Airport Transfer") {
      return myBookingsTranslations[language as Language]?.airportTransfer || "Airport Transfer";
    }
    return myBookingsTranslations[language as Language]?.interProvincial || "Inter-provincial Rent";
  };

  const getLocalizedStatus = (status: string) => {
    switch (status) {
      case "confirmed": return t.dashboard.confirmed;
      case "completed": return t.dashboard.completed;
      case "pending": return t.dashboard.pending;
      case "cancelled": return myBookingsTranslations[language as Language]?.cancelledStatus || "Cancelled";
      case "cancellation_requested": return myBookingsTranslations[language as Language]?.reqCancelledStatus || "Cancellation Requested";
      default: return status;
    }
  };

  const getLocalizedCarClass = (carClass: string) => {
    if (carClass === "Premium SUV") {
      if (language === "vi") return "SUV Cao cấp";
      if (language === "ko") return "프리미엄 SUV";
      if (language === "ru") return "Премиум SUV";
      return "Premium SUV";
    }
    return carClass;
  };

  const getLocalizedCarDesc = () => {
    if (language === "vi") return "Tự động • Đời 2024";
    if (language === "ko") return "자동 • 2024년식";
    if (language === "ru") return "Автомат • Модель 2024";
    return "Automatic • Model 2024";
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
                      {myBookingsTranslations[language as Language]?.title || myBookingsTranslations.en.title}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                      {myBookingsTranslations[language as Language]?.subtitle || myBookingsTranslations.en.subtitle}
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
              <ThemeSwitch className="flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:border-slate-300 w-10 h-10 rounded-xl text-slate-700 dark:text-slate-200 shadow-sm min-w-0 p-0 flex-shrink-0" />

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
              {/* <button className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 text-foreground hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm transition-colors bg-transparent cursor-pointer">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950"></span>
              </button> */}

              {/* Book New Trip Button */}
              <Button
                className="bg-accent text-white hover:bg-accent-hover h-10 px-5 rounded-xl font-bold text-sm shadow-md shadow-blue-100 dark:shadow-none transition-all border-none"
              >
                {t.dashboard.bookNewTrip}
              </Button>
            </div>
          </div>

          {/* Page Contents */}
          {children}

          {/* Toast Message Notification */}
          {toastMessage && (
            <div className="fixed bottom-4 right-4 z-50 text-white dark:text-slate-100 bg-slate-900 dark:bg-slate-800 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700/50 animate-in fade-in slide-in-from-bottom-5 duration-200">
              <CheckCircle2 className="text-emerald-400" size={20} />
              <span className="text-sm font-bold">{toastMessage}</span>
            </div>
          )}

          {/* Booking Details Overlay Modal (Premium Custom Component) */}
          {isModalOpen && selectedBooking && (
            <div
              className={clsx(
                "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm transition-opacity duration-200",
                isModalClosing ? "opacity-0" : "opacity-100"
              )}
            >
              <div
                className={clsx(
                  "bg-background text-foreground rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 transform flex flex-col max-h-[90vh] transition-all duration-180",
                  isModalClosing ? "opacity-0 scale-95 translate-y-4" : "opacity-100 scale-100 translate-y-0 animate-in fade-in zoom-in-95 duration-200"
                )}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-divider bg-default-50/50 dark:bg-default-100/10">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-full">
                      {getLocalizedBookingType(selectedBooking.type)}
                    </span>
                    <h3 className="text-lg font-extrabold text-foreground mt-1.5 flex items-center gap-2">
                      <span>{selectedBooking.ref}</span>
                      <span className={clsx(
                        "text-xs px-2.5 py-0.5 rounded-full font-bold",
                        selectedBooking.status === "confirmed" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400",
                        selectedBooking.status === "completed" && "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400",
                        selectedBooking.status === "pending" && "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400",
                        selectedBooking.status === "cancelled" && "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400",
                        selectedBooking.status === "cancellation_requested" && "bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400"
                      )}>
                        {getLocalizedStatus(selectedBooking.status)}
                      </span>
                    </h3>
                  </div>
                  {/* X close button */}
                  <button
                    onClick={closeModal}
                    aria-label="Close"
                    className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="overflow-y-auto flex-grow">
                  {/* ── Section 1: Trip Information ── */}
                  <div className="px-6 pt-5 pb-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                      {language === "vi" ? "Thông tin chuyến đi" : language === "ko" ? "여행 정보" : language === "ru" ? "Информация о поездке" : "Trip Information"}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Customer */}
                      <div className="col-span-2 sm:col-span-2 bg-default-50 dark:bg-default-100/10 border border-divider rounded-xl p-3 space-y-0.5 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {myBookingsTranslations[language as Language]?.customerName || "Customer"}
                        </span>
                        <p className="text-sm font-bold text-foreground">{selectedBooking.customerName}</p>
                      </div>
                      {/* Pickup Time */}
                      <div className="col-span-2 sm:col-span-2 bg-default-50 dark:bg-default-100/10 border border-divider rounded-xl p-3 space-y-0.5 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {myBookingsTranslations[language as Language]?.pickupTime || "Pickup Time"}
                        </span>
                        <p className="text-sm font-bold text-foreground">{selectedBooking.pickupTime}</p>
                      </div>
                      {/* Passengers */}
                      <div className="bg-default-50 dark:bg-default-100/10 border border-divider rounded-xl p-3 space-y-0.5 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {myBookingsTranslations[language as Language]?.guestsCount || "Passengers"}
                        </span>
                        <p className="text-sm font-bold text-foreground">{selectedBooking.guests} <span className="text-xs font-medium text-slate-400">{t.dashboard.guests}</span></p>
                      </div>
                      {/* Baggage */}
                      <div className="bg-default-50 dark:bg-default-100/10 border border-divider rounded-xl p-3 space-y-0.5 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {myBookingsTranslations[language as Language]?.baggage || "Baggage"}
                        </span>
                        <p className="text-sm font-bold text-foreground">{selectedBooking.baggageWeight} <span className="text-xs font-medium text-slate-400">kg</span></p>
                      </div>
                    </div>

                    {/* Route Timeline */}
                    <div className="mt-3 bg-default-50 dark:bg-default-100/10 border border-divider rounded-xl p-3 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center pt-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-accent flex-shrink-0" />
                          <span className="w-px flex-grow bg-slate-200 dark:bg-slate-700 my-1" style={{ minHeight: "20px" }} />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        </div>
                        <div className="flex-grow space-y-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              {myBookingsTranslations[language as Language]?.pickup || "Pickup"}
                            </span>
                            <p className="text-sm font-semibold text-foreground">{selectedBooking.pickupLocation}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              {myBookingsTranslations[language as Language]?.dropoff || "Dropoff"}
                            </span>
                            <p className="text-sm font-semibold text-foreground">{selectedBooking.dropoffLocation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mx-6 border-t border-divider" />

                  {/* ── Section 2: Flight Details (conditional) ── */}
                  {selectedBooking.flightNumber && (
                    <>
                      <div className="px-6 pt-4 pb-4">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                          <span className="inline-flex items-center gap-1"><Plane size={11} />{myBookingsTranslations[language as Language]?.flightDetails || "Flight Details"}</span>
                        </p>
                        <div className="bg-accent/5 dark:bg-accent/10 border border-blue-100 dark:border-blue-900/40 rounded-xl grid grid-cols-3 divide-x divide-blue-100 dark:divide-blue-900/40">
                          <div className="p-3 space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-accent/60">
                              {myBookingsTranslations[language as Language]?.flightNumber || "Flight No."}
                            </span>
                            <p className="text-sm font-extrabold text-accent">{selectedBooking.flightNumber}</p>
                          </div>
                          <div className="p-3 space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-accent/60">
                              {myBookingsTranslations[language as Language]?.estDeparture || "Departure"}
                            </span>
                            <p className="text-sm font-bold text-foreground">{selectedBooking.estDepartureTime}</p>
                          </div>
                          <div className="p-3 space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-accent/60">
                              {myBookingsTranslations[language as Language]?.estLanding || "Landing"}
                            </span>
                            <p className="text-sm font-bold text-foreground">{selectedBooking.landingTime}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mx-6 border-t border-divider" />
                    </>
                  )}

                  {/* ── Section 3: Vehicle ── */}
                  <div className="px-6 pt-4 pb-5">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                      {language === "vi" ? "Phương tiện" : language === "ko" ? "차량" : language === "ru" ? "Транспорт" : "Vehicle"}
                    </p>
                    <div className="overflow-hidden border border-divider rounded-2xl">
                      {/* Car image + name header */}
                      <div className="relative h-48 bg-slate-100 dark:bg-black/50 overflow-hidden">
                        <img
                          src={selectedBooking.carImage}
                          alt={selectedBooking.carName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold tracking-widest text-blue-300 bg-accent/30 backdrop-blur-sm px-2 py-0.5 rounded-full uppercase">
                              {getLocalizedCarClass(selectedBooking.carClass)}
                            </span>
                            <h4 className="text-base font-extrabold text-white mt-1">{selectedBooking.carName}</h4>
                          </div>
                        </div>
                      </div>
                      {/* Car specs row */}
                      <div className="relative grid grid-cols-3 mx-auto">
                        <div className="p-3 text-center space-y-0.5">
                          <Users size={14} className="mx-auto text-slate-400" />
                          <p className="text-sm font-extrabold text-foreground">{selectedBooking.carSeats}</p>
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                            {myBookingsTranslations[language as Language]?.carSeats || "Seats"}
                          </span>
                        </div>
                        <Separator className="absolute left-1/3 bottom-1/4 h-1/2 w-[1px] bg-divider" orientation="vertical" />
                        <div className="p-3 text-center space-y-0.5">
                          <Car size={14} className="mx-auto text-slate-400" />
                          <p className="text-xs font-extrabold text-foreground leading-tight">{getLocalizedCarDesc()}</p>
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                            {language === "vi" ? "Hộp số" : language === "ko" ? "변속기" : language === "ru" ? "КПП" : "Transmission"}
                          </span>
                        </div>
                        <Separator className="absolute left-2/3 bottom-1/4 h-1/2 w-[1px] bg-divider" orientation="vertical" />
                        <div className="p-3 text-center space-y-0.5">
                          <Luggage size={14} className="mx-auto text-slate-400" />
                          <p className="text-sm font-extrabold text-foreground">{selectedBooking.baggageWeight}<span className="text-xs font-medium"> kg</span></p>
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                            {myBookingsTranslations[language as Language]?.baggage || "Baggage"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
