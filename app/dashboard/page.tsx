"use client";
import React, { useState } from "react";
import { useDashboard, Booking } from "./context";
import { useI18n } from "@/context/LanguageContext";
import { Language } from "@/config/translations";
import {
  Calendar,
  CheckCircle2,
  Car,
  Users,
  Luggage,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button, Table } from "@heroui/react";
import clsx from "clsx";

export default function OverviewPage() {
  const { language, t } = useI18n();
  const { bookings, setSelectedBooking, setIsModalOpen } = useDashboard();
  const [activeFilter, setActiveFilter] = useState<"all" | "confirmed" | "pending">("all");

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

  const getBannerRouteLabel = () => {
    if (language === "vi") return { from: "Cam Ranh", to: "Đà Lạt" };
    if (language === "ko") return { from: "깜라인", to: "달랏" };
    if (language === "ru") return { from: "Камрань", to: "Далат" };
    return { from: "Cam Ranh", to: "Da Lat" };
  };

  const getDepartureTimeLabel = (timeStr: string) => {
    if (timeStr === "Oct 24, 08:30") {
      if (language === "vi") return "24 thg 10, 08:30";
      if (language === "ko") return "10월 24일 08:30";
      if (language === "ru") return "24 окт., 08:30";
      return "Oct 24, 08:30";
    }
    return timeStr;
  };

  const getDateLabel = (dateStr: string) => {
    if (dateStr === "Oct 24, 2024") {
      if (language === "vi") return "24 thg 10, 2024";
      if (language === "ko") return "2024년 10월 24일";
      if (language === "ru") return "24 окт. 2024 г.";
      return "Oct 24, 2024";
    }
    if (dateStr === "Sep 15, 2024") {
      if (language === "vi") return "15 thg 9, 2024";
      if (language === "ko") return "2024년 9월 15일";
      if (language === "ru") return "15 sept. 2024 g.";
      return "Sep 15, 2024";
    }
    if (dateStr === "Nov 02, 2024") {
      if (language === "vi") return "02 thg 11, 2024";
      if (language === "ko") return "2024년 11월 2일";
      if (language === "ru") return "2 нояб. 2024 г.";
      return "Nov 02, 2024";
    }
    return dateStr;
  };

  const getLocalizedStatus = (status: string) => {
    switch (status) {
      case "confirmed": return t.dashboard.confirmed;
      case "completed": return t.dashboard.completed;
      case "pending": return t.dashboard.pending;
      case "cancelled":
        return language === "vi"
          ? "Đã hủy"
          : language === "ko"
            ? "취소됨"
            : language === "ru"
              ? "Отменено"
              : "Cancelled";
      case "cancellation_requested":
        return language === "vi"
          ? "Chờ hủy"
          : language === "ko"
            ? "취소 요청 중"
            : language === "ru"
              ? "Запрошена отмена"
              : "Cancellation Requested";
      default: return status;
    }
  };

  const getCarClassLabel = () => {
    if (language === "vi") return "SUV Cao cấp";
    if (language === "ko") return "프리미엄 SUV";
    if (language === "ru") return "Премиум SUV";
    return "Premium SUV";
  };

  const getCarDesc = () => {
    if (language === "vi") return "Tự động • Đời 2024";
    if (language === "ko") return "자동 • 2024년식";
    if (language === "ru") return "Автомат • Модель 2024";
    return "Automatic • Model 2024";
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === "all") return true;
    return b.status === activeFilter;
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">
      {/* Left Column (70%) */}
      <div className="xl:col-span-7 space-y-6">
        {/* Active Booking Banner */}
        <div
          className="relative overflow-hidden rounded-[24px] bg-slate-900 min-h-[300px] flex flex-col justify-between p-6 md:p-8 text-white shadow-xl bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.9) 30%, rgba(15, 23, 42, 0.4)), url('/cam_ranh_da_lat_banner.png')`
          }}
        >
          <div className="space-y-1">
            <span className="text-xs font-bold tracking-widest text-blue-400 uppercase opacity-90">
              {t.dashboard.nextDestination}
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-1 flex items-center gap-3 md:gap-4 flex-wrap">
              <span>{getBannerRouteLabel().from}</span>
              <span className="text-blue-400 text-2xl md:text-3xl">➔</span>
              <span>{getBannerRouteLabel().to}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-4 border-t border-white/10">
            <div className="space-y-1">
              <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">{t.dashboard.departure}</p>
              <p className="text-lg font-bold text-white flex items-center gap-1.5">
                <Calendar size={16} className="text-blue-400" />
                {getDepartureTimeLabel("Oct 24, 08:30")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">{t.dashboard.countdown}</p>
              <p className="text-2xl font-black text-blue-400">
                02 <span className="text-lg font-bold text-white/80">{t.dashboard.days}</span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm h-11 px-6 rounded-xl shadow-lg shadow-black/10 transition-all border-none"
            >
              {t.dashboard.viewTicket}
            </Button>
          </div>
        </div>

        {/* Confirmed Trips Indicator */}
        <div className="rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 bg-card flex items-center justify-between transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-accent shadow-inner">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {t.dashboard.confirmedTrips}
              </h3>
              <p className="text-3xl font-extrabold text-foreground mt-0.5 animate-fade-in">
                {bookings.filter((b) => b.status === "confirmed").length}
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-full flex items-center gap-1">
            <span className="text-[10px]">●</span>
            {language === "vi" ? "Hoạt động" : language === "en" ? "Active" : language === "ko" ? "활동 중" : "Активно"}
          </div>
        </div>
      </div>

      {/* Right Column (30%) */}
      <div className="xl:col-span-3">
        {/* Booked Car Details Card */}
        <div className="rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 bg-card flex flex-col justify-between h-full space-y-6 transition-colors">
          <div>
            <h3 className="text-lg font-extrabold text-foreground tracking-tight">
              {t.dashboard.bookedCar}
            </h3>

            {/* Car Image Preview */}
            <div className="relative mt-4 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 h-48 shadow-sm">
              <img
                src="/premium_suv_ford_everest.png"
                alt="Premium SUV"
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500 z-0"
              />
              <div className="absolute top-3.5 left-3.5 bg-accent text-white text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-full shadow-md z-10 tracking-wider">
                {getCarClassLabel()}
              </div>
            </div>

            {/* Car specifications */}
            <div className="mt-5 space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-foreground">Ford Everest Premium</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{getCarDesc()}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-divider">
                <div className="flex items-center gap-3 text-foreground-600">
                  <div className="w-8 h-8 rounded-lg bg-default-50 dark:bg-default-100/10 border border-divider flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Car size={16} />
                  </div>
                  <span className="text-sm font-semibold">
                    7 {t.dashboard.seats}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-foreground-600">
                  <div className="w-8 h-8 rounded-lg bg-default-50 dark:bg-default-100/10 border border-divider flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Users size={16} />
                  </div>
                  <span className="text-sm font-semibold">
                    4 {t.dashboard.guests}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-foreground-600">
                  <div className="w-8 h-8 rounded-lg bg-default-50 dark:bg-default-100/10 border border-divider flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Luggage size={16} />
                  </div>
                  <span className="text-sm font-semibold">
                    {t.dashboard.baggageWeight}: <span className="font-extrabold text-foreground">60 kg</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status indicator info box */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl p-4 border border-blue-100/50 dark:border-blue-900/50 flex items-start gap-3 mt-4">
            <div className="text-accent mt-0.5">
              <Clock size={16} />
            </div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 leading-relaxed">
              {language === "vi"
                ? "Vui lòng có mặt tại điểm đón trước giờ khởi hành 15 phút."
                : language === "en"
                  ? "Please arrive at the pickup location 15 minutes before departure."
                  : language === "ko"
                    ? "출발 15분 전까지 승차 장소에 도착해 주시기 바랍니다."
                    : "Pozhaluysta, pribud'te na mesto vstrechi za 15 minut do otpravleniya."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table Section */}
      <div className="xl:col-span-10 rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 bg-card space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">
            {t.dashboard.recentBookings}
          </h2>

          {/* Tab Filters */}
          <div className="flex bg-default-100 dark:bg-default-50/5 p-1 rounded-xl border border-divider">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                activeFilter === "all"
                  ? "bg-background text-accent shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent"
              }`}
            >
              {t.dashboard.all}
            </button>
            <button
              onClick={() => setActiveFilter("confirmed")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                activeFilter === "confirmed"
                  ? "bg-background text-accent shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent"
              }`}
            >
              {t.dashboard.confirmed}
            </button>
            <button
              onClick={() => setActiveFilter("pending")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                activeFilter === "pending"
                  ? "bg-background text-accent shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent"
              }`}
            >
              {t.dashboard.pending}
            </button>
          </div>
        </div>

        {/* Table wrapper */}
        <div className="overflow-x-auto">
          {filteredBookings.length === 0 ? (
            <div className="py-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
              {language === "vi"
                ? "Không có đơn đặt chuyến đi nào phù hợp bộ lọc."
                : language === "en"
                  ? "No bookings match this filter."
                  : language === "ko"
                    ? "필터와 일치하는 예약이 없습니다."
                    : "Net bronirovaniy, sootvetstvuyushchih etomu fil'tru."
              }
            </div>
          ) : (
            <Table aria-label="Bảng chuyến đi gần đây" className="w-full text-left">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header className="border-b border-divider text-slate-400 dark:text-slate-500 text-xs font-extrabold uppercase tracking-wider">
                    <Table.Column isRowHeader className="pb-4 font-bold">{t.dashboard.ref}</Table.Column>
                    <Table.Column className="pb-4 font-bold">{t.dashboard.route}</Table.Column>
                    <Table.Column className="pb-4 font-bold">{t.dashboard.date}</Table.Column>
                    <Table.Column className="pb-4 font-bold">{t.dashboard.status}</Table.Column>
                    <Table.Column className="pb-4 text-right font-bold">{t.dashboard.action}</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {filteredBookings.map((booking) => (
                      <Table.Row key={booking.ref} className="group hover:bg-default-50/50 dark:hover:bg-default-100/10 transition-colors">
                        <Table.Cell className="py-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                          {booking.ref}
                        </Table.Cell>
                        <Table.Cell className="py-4 text-sm font-extrabold text-foreground">
                          {getRouteLabel(booking.route)}
                        </Table.Cell>
                        <Table.Cell className="py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                          {getDateLabel(booking.date)}
                        </Table.Cell>
                        <Table.Cell className="py-4">
                          <span className={clsx(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border",
                            booking.status === "confirmed" && "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
                            booking.status === "completed" && "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50",
                            booking.status === "pending" && "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50",
                            booking.status === "cancelled" && "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50",
                            booking.status === "cancellation_requested" && "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50"
                          )}>
                            <span className="text-[8px] animate-pulse">●</span>
                            {getLocalizedStatus(booking.status)}
                          </span>
                        </Table.Cell>
                        <Table.Cell className="py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsModalOpen(true);
                            }}
                            className="text-sm font-bold text-accent hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1 ml-auto transition-all bg-transparent border-none cursor-pointer"
                          >
                            <span>{t.dashboard.details}</span>
                            <ExternalLink size={12} className="opacity-75" />
                          </button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
