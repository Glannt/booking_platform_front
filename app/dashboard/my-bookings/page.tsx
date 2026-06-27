"use client";
import React, { useState, useEffect } from "react";
import { useDashboard, Booking } from "../context";
import { useI18n } from "@/context/LanguageContext";
import { Language } from "@/config/translations";
import {
  Search,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { Button, Dropdown, Label } from "@heroui/react";
import clsx from "clsx";

const myBookingsTranslations = {
  vi: {
    searchPlaceholder: "Tìm kiếm mã đơn, tuyến đường...",
    bookingType: "Loại đơn",
    pickupTime: "Thời gian đón",
    cancelDirect: "Hủy trực tiếp",
    requestCancel: "Yêu cầu hủy",
    viewDetails: "Xem chi tiết",
    airportTransfer: "Trung chuyển sân bay",
    interProvincial: "Thuê xe đi tỉnh",
    cancelledStatus: "Đã hủy",
    reqCancelledStatus: "Chờ hủy",
    createdTime: "Thời gian đặt",
  },
  en: {
    searchPlaceholder: "Search reference, route...",
    bookingType: "Booking Type",
    pickupTime: "Pickup Time",
    cancelDirect: "Cancel Booking",
    requestCancel: "Request Cancel",
    viewDetails: "View Details",
    airportTransfer: "Airport Transfer",
    interProvincial: "Inter-provincial Rent",
    cancelledStatus: "Cancelled",
    reqCancelledStatus: "Cancellation Requested",
    createdTime: "Booking Date",
  },
  ko: {
    searchPlaceholder: "예약 번호, 경로 검색...",
    bookingType: "예약 유형",
    pickupTime: "출발 시간",
    cancelDirect: "직접 취소",
    requestCancel: "취소 요청",
    viewDetails: "상세 보기",
    airportTransfer: "공항 픽업/샌딩",
    interProvincial: "시외 차 렌트",
    cancelledStatus: "취소됨",
    reqCancelledStatus: "취소 요청 중",
    createdTime: "예약 일시",
  },
  ru: {
    searchPlaceholder: "Поиск по коду, маршруту...",
    bookingType: "Тип бронирования",
    pickupTime: "Время посадки",
    cancelDirect: "Отменить бронь",
    requestCancel: "Запросить отмену",
    viewDetails: "Детали",
    airportTransfer: "Трансфер из аэропорта",
    interProvincial: "Междугородний прокат",
    cancelledStatus: "Отменено",
    reqCancelledStatus: "Запрошена отмена",
    createdTime: "Дата бронирования",
  }
};

export default function MyBookingsPage() {
  const { language, t } = useI18n();
  const {
    bookings,
    setSelectedBooking,
    setIsModalOpen,
    handleCancelBooking,
    handleRequestCancelBooking,
  } = useDashboard();

  // Search, Filters & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const canCancelDirectly = (booking: Booking) => {
    if (booking.status === "pending") return true;
    if (booking.status === "cancelled" || booking.status === "cancellation_requested" || booking.status === "completed") return false;
    try {
      const createdDate = new Date(booking.createdTime);
      const diffMs = new Date().getTime() - createdDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours <= 2;
    } catch (e) {
      return false;
    }
  };

  // Computed variables for search, filter, sort & pagination
  const myBookingsFiltered = bookings.filter((b) => {
    // 1. Filter by Status
    if (statusFilter !== "all" && b.status !== statusFilter) {
      return false;
    }
    // 2. Filter by Search Query
    const query = searchQuery.toLowerCase();
    return (
      b.ref.toLowerCase().includes(query) ||
      b.route.toLowerCase().includes(query) ||
      b.pickupLocation.toLowerCase().includes(query) ||
      b.dropoffLocation.toLowerCase().includes(query) ||
      b.type.toLowerCase().includes(query)
    );
  });

  // 3. Sort by Pickup Time
  const myBookingsSorted = [...myBookingsFiltered].sort((a, b) => {
    const dateA = new Date(a.pickupTime.replace(/-/g, "/")).getTime();
    const dateB = new Date(b.pickupTime.replace(/-/g, "/")).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const totalPages = Math.ceil(myBookingsSorted.length / itemsPerPage);
  const paginatedBookings = myBookingsSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getLocalizedBookingType = (type: string) => {
    if (type === "Airport Transfer") {
      return myBookingsTranslations[language as Language]?.airportTransfer || "Airport Transfer";
    }
    return myBookingsTranslations[language as Language]?.interProvincial || "Inter-provincial Rent";
  };

  const getLocalizedStatus = (status: string) => {
    switch (status) {
      case "all":
        return language === "vi"
          ? "Tất cả"
          : language === "ko"
            ? "전체 상태"
            : language === "ru"
              ? "Все статусы"
              : "All Statuses";
      case "confirmed": return t.dashboard.confirmed;
      case "completed": return t.dashboard.completed;
      case "pending": return t.dashboard.pending;
      case "cancelled": return myBookingsTranslations[language as Language]?.cancelledStatus || "Cancelled";
      case "cancellation_requested": return myBookingsTranslations[language as Language]?.reqCancelledStatus || "Cancellation Requested";
      default: return status;
    }
  };

  const getRouteLabel = (route: string) => {
    if (route === "Cam Ranh ➔ Da Lat") {
      if (language === "vi") return "Cam Ranh ➔ Đà Lạt";
      if (language === "ko") return "깜라인 ➔ 달랏";
      if (language === "ru") return "Камрань ➔ Далат";
      return "Cam Ranh ➔ Da Lat";
    }
    if (route === "Hanoi ➔ Sapa") {
      if (language === "vi") return "Hà Nội ➔ Sa Pa";
      if (language === "ko") return "하노이 ➔ 사파";
      if (language === "ru") return "Ханой ➔ Сапа";
      return "Hanoi ➔ Sapa";
    }
    if (route === "Da Nang ➔ Hoi An") {
      if (language === "vi") return "Đà Nẵng ➔ Hội An";
      if (language === "ko") return "다낭 ➔ 호이안";
      if (language === "ru") return "Дананг ➔ Хойан";
      return "Da Nang ➔ Hoi An";
    }
    return route;
  };

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={myBookingsTranslations[language as Language]?.searchPlaceholder || "Search..."}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-divider bg-background text-foreground placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0b66e4] focus:border-transparent transition-all"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Dropdown */}
          <Dropdown>
            <Dropdown.Trigger
              className="flex items-center gap-1.5 border border-divider hover:border-slate-300 dark:hover:border-slate-700 px-3.5 h-10 rounded-xl font-bold text-foreground shadow-sm text-xs cursor-pointer bg-background"
            >
              <span className="text-slate-400 dark:text-slate-500 font-medium">Status:</span>
              <span>{getLocalizedStatus(statusFilter)}</span>
              <ChevronDown size={12} className="opacity-60 flex-shrink-0" />
            </Dropdown.Trigger>
            <Dropdown.Popover className="min-w-[180px]">
              <Dropdown.Menu
                aria-label="Filter status options"
                onAction={(key) => setStatusFilter(key as string)}
              >
                <Dropdown.Item id="all" textValue="All">
                  <Label className="text-sm">{language === "vi" ? "Tất cả" : "All"}</Label>
                </Dropdown.Item>
                <Dropdown.Item id="confirmed" textValue="Confirmed">
                  <Label className="text-sm">{t.dashboard.confirmed}</Label>
                </Dropdown.Item>
                <Dropdown.Item id="pending" textValue="Pending">
                  <Label className="text-sm">{t.dashboard.pending}</Label>
                </Dropdown.Item>
                <Dropdown.Item id="completed" textValue="Completed">
                  <Label className="text-sm">{t.dashboard.completed}</Label>
                </Dropdown.Item>
                <Dropdown.Item id="cancelled" textValue="Cancelled">
                  <Label className="text-sm">{myBookingsTranslations[language as Language]?.cancelledStatus || "Cancelled"}</Label>
                </Dropdown.Item>
                <Dropdown.Item id="cancellation_requested" textValue="Cancellation Requested">
                  <Label className="text-sm">{myBookingsTranslations[language as Language]?.reqCancelledStatus || "Cancellation Requested"}</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>

          {/* Sort Order Dropdown */}
          <Dropdown>
            <Dropdown.Trigger
              className="flex items-center gap-1.5 border border-divider hover:border-slate-300 dark:hover:border-slate-700 px-3.5 h-10 rounded-xl font-bold text-foreground shadow-sm text-xs cursor-pointer bg-background"
            >
              <span className="text-slate-400 dark:text-slate-500 font-medium">{language === "vi" ? "Sắp xếp:" : "Sort:"}</span>
              <span>
                {sortOrder === "asc"
                  ? (language === "vi" ? "Thời gian tăng dần" : "Time: Ascending")
                  : (language === "vi" ? "Thời gian giảm dần" : "Time: Descending")}
              </span>
              <ChevronDown size={12} className="opacity-60 flex-shrink-0" />
            </Dropdown.Trigger>
            <Dropdown.Popover className="min-w-[180px]">
              <Dropdown.Menu
                aria-label="Sort order options"
                onAction={(key) => setSortOrder(key as "asc" | "desc")}
              >
                <Dropdown.Item id="desc" textValue="Time: Descending">
                  <Label className="text-sm">
                    {language === "vi" ? "Thời gian giảm dần" : "Time: Descending"}
                  </Label>
                </Dropdown.Item>
                <Dropdown.Item id="asc" textValue="Time: Ascending">
                  <Label className="text-sm">
                    {language === "vi" ? "Thời gian tăng dần" : "Time: Ascending"}
                  </Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>

      {/* Bookings Table container */}
      <div className="rounded-3xl p-6 shadow-sm border border-divider bg-card space-y-6">
        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-4">
          {paginatedBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
              <AlertCircle size={24} className="opacity-60" />
              <span>
                {language === "vi"
                  ? "Không tìm thấy đơn đặt nào phù hợp."
                  : "No bookings found matching search."}
              </span>
            </div>
          ) : (
            paginatedBookings.map((booking) => (
              <div
                key={booking.ref}
                className="p-5 rounded-2xl border border-divider bg-background/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col gap-3 relative shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
              >
                {/* Header: Ref & Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    {booking.ref}
                  </span>
                  <span className={clsx(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                    booking.status === "confirmed" && "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
                    booking.status === "completed" && "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50",
                    booking.status === "pending" && "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50",
                    booking.status === "cancelled" && "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50",
                    booking.status === "cancellation_requested" && "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50"
                  )}>
                    <span className="text-[8px] animate-pulse">●</span>
                    {getLocalizedStatus(booking.status)}
                  </span>
                </div>

                {/* Route */}
                <div className="text-sm font-extrabold text-foreground">
                  {getRouteLabel(booking.route)}
                </div>

                {/* Details */}
                <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground-700">
                      {myBookingsTranslations[language as Language]?.bookingType || "Type"}:
                    </span>
                    <span>{getLocalizedBookingType(booking.type)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground-700">
                      {myBookingsTranslations[language as Language]?.pickupTime || "Pickup"}:
                    </span>
                    <span>{booking.pickupTime}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end mt-2">
                  <button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsModalOpen(true);
                    }}
                    className="text-xs font-extrabold text-[#0b66e4] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 px-3 py-1.5 rounded-lg border border-divider transition-all cursor-pointer bg-transparent"
                  >
                    {myBookingsTranslations[language as Language]?.viewDetails || "Details"}
                  </button>

                  {booking.status !== "cancelled" && booking.status !== "cancellation_requested" && booking.status !== "completed" && (
                    <>
                      {canCancelDirectly(booking) ? (
                        <button
                          onClick={() => handleCancelBooking(booking.ref)}
                          className="text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/50 transition-all cursor-pointer bg-transparent"
                        >
                          {myBookingsTranslations[language as Language]?.cancelDirect || "Cancel"}
                        </button>
                      ) : booking.status === "confirmed" ? (
                        <button
                          onClick={() => handleRequestCancelBooking(booking.ref)}
                          className="text-xs font-extrabold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-900/50 transition-all cursor-pointer bg-transparent"
                        >
                          {myBookingsTranslations[language as Language]?.requestCancel || "Request Cancel"}
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-divider text-slate-400 dark:text-slate-500 text-xs font-extrabold uppercase tracking-wider">
                <th className="pb-4 font-bold text-left">{t.dashboard.ref}</th>
                <th className="pb-4 font-bold text-left">{myBookingsTranslations[language as Language]?.bookingType || "Type"}</th>
                <th className="pb-4 font-bold text-left">{t.dashboard.route}</th>
                <th className="pb-4 font-bold text-left">{myBookingsTranslations[language as Language]?.pickupTime || "Pickup"}</th>
                <th className="pb-4 font-bold text-left">{t.dashboard.status}</th>
                <th className="pb-4 text-right font-bold">{t.dashboard.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={24} className="opacity-60" />
                      <span>
                        {language === "vi"
                          ? "Không tìm thấy đơn đặt nào phù hợp."
                          : "No bookings found matching search."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((booking) => (
                  <tr key={booking.ref} className="group hover:bg-default-50/50 dark:hover:bg-default-100/10 transition-colors">
                    <td className="py-4 text-sm font-bold text-slate-500 dark:text-slate-400 align-middle">
                      {booking.ref}
                    </td>
                    <td className="py-4 text-sm font-bold text-foreground align-middle">
                      {getLocalizedBookingType(booking.type)}
                    </td>
                    <td className="py-4 text-sm font-extrabold text-foreground align-middle">
                      {getRouteLabel(booking.route)}
                    </td>
                    <td className="py-4 text-sm font-semibold text-slate-500 dark:text-slate-400 align-middle">
                      {booking.pickupTime}
                    </td>
                    <td className="py-4 align-middle">
                      <span className={clsx(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                        booking.status === "confirmed" && "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
                        booking.status === "completed" && "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50",
                        booking.status === "pending" && "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50",
                        booking.status === "cancelled" && "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50",
                        booking.status === "cancellation_requested" && "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50"
                      )}>
                        <span className="text-[8px] animate-pulse">●</span>
                        {getLocalizedStatus(booking.status)}
                      </span>
                    </td>
                    <td className="py-4 text-right align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsModalOpen(true);
                          }}
                          className="text-xs font-extrabold text-[#0b66e4] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 px-3 py-1.5 rounded-lg border border-divider transition-all cursor-pointer bg-transparent"
                        >
                          {myBookingsTranslations[language as Language]?.viewDetails || "Details"}
                        </button>
                        {booking.status !== "cancelled" && booking.status !== "cancellation_requested" && booking.status !== "completed" && (
                          <>
                            {canCancelDirectly(booking) ? (
                              <button
                                onClick={() => handleCancelBooking(booking.ref)}
                                className="text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/50 transition-all cursor-pointer bg-transparent"
                              >
                                {myBookingsTranslations[language as Language]?.cancelDirect || "Cancel"}
                              </button>
                            ) : booking.status === "confirmed" ? (
                              <button
                                onClick={() => handleRequestCancelBooking(booking.ref)}
                                className="text-xs font-extrabold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-900/50 transition-all cursor-pointer bg-transparent"
                              >
                                {myBookingsTranslations[language as Language]?.requestCancel || "Request Cancel"}
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-divider pt-4">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              {language === "vi"
                ? `Trang ${currentPage} trên ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                isDisabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="h-9 px-3 rounded-lg border border-divider text-xs font-bold text-foreground bg-transparent"
              >
                {language === "vi" ? "Trước" : "Prev"}
              </Button>
              <Button
                variant="outline"
                isDisabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="h-9 px-3 rounded-lg border border-divider text-xs font-bold text-foreground bg-transparent"
              >
                {language === "vi" ? "Sau" : "Next"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
