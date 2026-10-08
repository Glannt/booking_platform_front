"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalCloseTrigger,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Separator,
  Chip
} from "@heroui/react";
import {
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Plane,
  DollarSign,
  Clock,
  FileText,
  Car,
  Navigation,
  ArrowRight,
  Info,
  ShieldAlert,
  History,
  Users,
  Briefcase,
  Layers,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Edit3
} from "lucide-react";
import { BookingDto, BookingTimelineDto, getBookingTimeline, DepositType } from "@/lib/api/bookings";
import { useI18n } from "@/context/LanguageContext";
import clsx from "clsx";
import CancelRequestActions from "./CancelRequestActions";

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingDto | null;
  language?: string;
  onEdit?: () => void;
  onStatusChanged?: () => void;
}

export default function BookingDetailModal({
  isOpen,
  onClose,
  booking,
  onEdit,
  onStatusChanged
}: BookingDetailModalProps) {
  const { t } = useI18n();
  const tb = t.adminBookings;

  const [activeTab, setActiveTab] = useState<"details" | "timeline">("details");
  const [timelineEvents, setTimelineEvents] = useState<BookingTimelineDto[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    if (isOpen && booking?.id) {
      setLoadingTimeline(true);
      getBookingTimeline(booking.id)
        .then((res) => {
          if (res?.data) {
            setTimelineEvents(res.data);
          }
        })
        .catch((err) => console.error("Failed to load timeline events:", err))
        .finally(() => setLoadingTimeline(false));
    }
  }, [isOpen, booking?.id]);

  if (!booking) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "completed":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
      case "cancelled":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
      case "cancellation_requested":
        return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20";
      case "pending":
      default:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return t.status?.confirmed || "Đã xác nhận";
      case "completed":
        return t.status?.completed || "Đã hoàn thành";
      case "cancelled":
        return t.status?.cancelled || "Đã hủy";
      case "cancellation_requested":
        return t.status?.cancellationRequested || "Chờ hủy";
      case "pending":
      default:
        return t.status?.pending || "Chờ xử lý";
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "DEPOSITED":
      case "PARTIAL":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "REFUNDED":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
      case "UNPAID":
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-border/50";
    }
  };

  const total = booking.totalAmount ?? 0;
  const deposit = booking.depositAmount ?? 0;
  const received = booking.receivedAmount ?? 0;
  const paid = booking.paidAmount ?? (deposit + received);
  const remaining = booking.remainingAmount ?? Math.max(0, total - paid);

  const renderDynamicDetails = (detailsStr?: string) => {
    if (!detailsStr) return null;
    let data: Record<string, any> | null = null;
    try {
      const trimmed = detailsStr.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        data = JSON.parse(trimmed);
      }
    } catch {
      data = null;
    }

    if (!data || typeof data !== "object") {
      return (
        <div className="p-3 bg-slate-50 dark:bg-[var(--bg-card)] rounded-xl border border-border text-xs text-slate-700 dark:text-slate-300">
          <span className="block font-bold text-slate-500 uppercase text-[10px] mb-1">
            {tb.serviceSpecs}
          </span>
          <p className="whitespace-pre-wrap font-medium">{detailsStr}</p>
        </div>
      );
    }

    return (
      <div className="p-4 bg-slate-50/70 dark:bg-[var(--bg-card)] rounded-xl border border-border space-y-3">
        <div className="flex items-center justify-between border-b border-separator pb-2">
          <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
            <Info size={13} className="text-primary" />
            {tb.serviceSpecs}
          </span>
          <div className="flex items-center gap-1.5">
            {data.serviceType && (
              <Chip
                size="sm"
                color={data.serviceType === "SHARED" ? "success" : "accent"}
                variant="soft"
                className="font-bold text-[10px]"
              >
                {data.serviceType === "SHARED" ? (t.rentCar?.sharedService || "Vé xe ghép") : (t.rentCar?.privateService || "Xe riêng")}
              </Chip>
            )}
            {data.tripType && (
              <Chip size="sm" color="accent" variant="soft" className="font-bold text-[10px]">
                {data.tripType === "ONE_WAY" ? (t.rentCar?.oneWay || "1 Chiều") : data.tripType === "ROUND_TRIP" ? (t.rentCar?.roundTrip || "Khứ hồi") : data.tripType}
              </Chip>
            )}
          </div>
        </div>

        {/* Capacity specs: Passengers & Luggage */}
        {(data.passenger !== undefined || data.passengerCount !== undefined || data.guestCount !== undefined || data.rentalDays !== undefined || data.serviceType === "SHARED") && (
          <div className="flex flex-wrap gap-2 text-xs">
            {(data.passenger !== undefined || data.passengerCount !== undefined || data.guestCount !== undefined) && (
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1.5 border border-blue-200 dark:border-blue-900/50">
                <Users size={12} />
                {data.serviceType === "SHARED" ? (t.rentCar?.paxCount || "Số vé / Khách") : tb.passengers}: {data.passengerCount ?? data.passenger ?? data.guestCount}
              </span>
            )}
            {data.rentalDays !== undefined && (
              <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-bold flex items-center gap-1.5 border border-purple-200 dark:border-purple-900/50">
                <Calendar size={12} />
                {data.rentalDays} ngày thuê
              </span>
            )}
            {data.vehicleCategoryId && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5 border border-border">
                <Car size={12} className="text-primary" />
                Hạng xe ID: #{data.vehicleCategoryId}
              </span>
            )}
          </div>
        )}

        {/* Outbound Leg */}
        {(data.outboundPickupTime || data.outboundDate || data.outboundPickupAddress || data.outboundFlightNumber || data.meetingPoint) && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
              <span className="flex items-center gap-1 text-primary">
                <Navigation size={13} />
                Lộ trình đón / Chiều đi
              </span>
              {data.outboundFlightNumber && (
                <span className="font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[11px]">
                  ✈ {data.outboundFlightNumber}
                </span>
              )}
            </div>

            {(data.outboundPickupTime || data.outboundDate || data.startTime) && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Clock size={13} className="text-slate-400 shrink-0" />
                <span>
                  {tb.pickupTime}:{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {formatDate(data.outboundPickupTime || data.outboundDate || data.startTime)}
                  </strong>
                </span>
              </div>
            )}

            {(data.outboundPickupAddress || data.meetingPoint) && (
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <MapPin size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  {tb.pickupLocation}: <span className="font-medium text-slate-900 dark:text-white">{data.outboundPickupAddress || data.meetingPoint}</span>
                </span>
              </div>
            )}

            {data.outboundDropoffAddress && (
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <MapPin size={13} className="text-rose-500 shrink-0 mt-0.5" />
                <span>
                  {tb.dropoffLocation}: <span className="font-medium text-slate-900 dark:text-white">{data.outboundDropoffAddress}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Return Leg */}
        {(data.returnPickupTime || data.returnDate || data.returnPickupAddress || data.returnFlightNumber || data.endTime) && (
          <div className="space-y-2 text-xs pt-2 border-t border-separator">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
              <span className="flex items-center gap-1 text-secondary">
                <ArrowRight size={13} />
                Lộ trình trả / Chiều về
              </span>
              {data.returnFlightNumber && (
                <span className="font-mono px-2 py-0.5 rounded bg-secondary/10 text-secondary font-bold text-[11px]">
                  ✈ {data.returnFlightNumber}
                </span>
              )}
            </div>

            {(data.returnPickupTime || data.returnDate || data.endTime) && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Clock size={13} className="text-slate-400 shrink-0" />
                <span>
                  Thời gian:{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {formatDate(data.returnPickupTime || data.returnDate || data.endTime)}
                  </strong>
                </span>
              </div>
            )}

            {data.returnPickupAddress && (
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <MapPin size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  {tb.pickupLocation}: <span className="font-medium text-slate-900 dark:text-white">{data.returnPickupAddress}</span>
                </span>
              </div>
            )}

            {data.returnDropoffAddress && (
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <MapPin size={13} className="text-rose-500 shrink-0 mt-0.5" />
                <span>
                  {tb.dropoffLocation}: <span className="font-medium text-slate-900 dark:text-white">{data.returnDropoffAddress}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Pricing meta breakdown */}
        {(data.basePrice || data.surchargeAmount || data.deposit) && (
          <div className="pt-2 border-t border-separator flex flex-wrap items-center gap-3 text-xs">
            {data.basePrice && (
              <span className="text-slate-500">
                {tb.basePrice}: <strong className="text-slate-800 dark:text-slate-200">{formatPrice(Number(data.basePrice))}</strong>
              </span>
            )}
            {data.surchargeAmount && Number(data.surchargeAmount) > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                {tb.surcharge}: <strong>+{formatPrice(Number(data.surchargeAmount))}</strong>
              </span>
            )}
            {data.deposit && (
              <span className="text-primary font-bold">
                {tb.depositAmount}: {formatPrice(Number(data.deposit))}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="booking-details-title">
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden focus:outline-none w-full">
            <ModalCloseTrigger />
            <ModalHeader className="border-b border-slate-100 dark:border-slate-800 py-4 px-6 flex flex-row items-center justify-between shrink-0">
              <div className="flex flex-col gap-0.5">
                <span id="booking-details-title" className="text-lg font-black text-slate-900 dark:text-white">
                  {tb.bookingDetails}
                </span>
                <span className="text-sm font-mono font-black text-primary">
                  {booking.bookingCode}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Tab Switcher */}
                <div className="flex bg-slate-200/70 dark:bg-[var(--bg-elevated)] p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab("details")}
                    className={clsx(
                      "px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                      activeTab === "details"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-primary shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <Layers size={13} />
                    <span>{tb.serviceSpecs}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("timeline")}
                    className={clsx(
                      "px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                      activeTab === "timeline"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-primary shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <History size={13} />
                    <span>{tb.timeline}</span>
                  </button>
                </div>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
              {/* Top Operational Financial Dashboard (4 KPIs) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-border flex flex-col">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{tb.totalAmount}</span>
                  <span className="text-base font-black text-slate-900 dark:text-white mt-1">{formatPrice(total)}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">{tb.depositAmount}</span>
                    {booking.depositType && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-bold uppercase">
                        {booking.depositType === DepositType.RATE && booking.depositRate != null ? `${booking.depositRate}%` : booking.depositType}
                      </span>
                    )}
                  </div>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400 mt-1">{formatPrice(deposit)}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex flex-col">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{tb.receivedAmount}</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatPrice(received)}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex flex-col">
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">{tb.remainingAmount}</span>
                  <span className={clsx("text-base font-black mt-1", remaining > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400")}>
                    {formatPrice(remaining)}
                  </span>
                </div>
              </div>

              {activeTab === "timeline" ? (
                /* Timeline View */
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <History size={14} className="text-primary" />
                    <span>{tb.timeline}</span>
                  </h3>

                  {loadingTimeline ? (
                    <div className="py-12 flex justify-center text-xs text-slate-400">
                      Đang tải dữ liệu dòng thời gian...
                    </div>
                  ) : timelineEvents.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-[var(--bg-card)] rounded-xl border border-border">
                      {tb.noTimelineEvents}
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                      {timelineEvents.map((evt) => (
                        <div key={evt.id} className="relative group">
                          <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-white dark:ring-[var(--bg-surface)]" />
                          <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-border shadow-xs space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                {evt.title}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {formatDate(evt.createdAt)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>Người thực hiện: <strong className="text-slate-700 dark:text-slate-300">{evt.actorName}</strong></span>
                              <Chip size="sm" variant="soft" className="text-[10px] font-bold">
                                {evt.eventType}
                              </Chip>
                            </div>

                            {evt.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                {evt.description}
                              </p>
                            )}

                            {(evt.oldValue || evt.newValue) && (
                              <div className="pt-1 text-[11px] flex flex-wrap gap-2 text-slate-500">
                                {evt.oldValue && (
                                  <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-[var(--bg-elevated)] line-through">
                                    {evt.oldValue}
                                  </span>
                                )}
                                {evt.newValue && (
                                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                                    → {evt.newValue}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Details View */
                <>
                  {/* Customer and Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {t.booking?.step3 || "Thông tin khách hàng"}
                      </h3>
                      <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-border space-y-2.5">
                        <div className="flex items-center gap-3 text-sm text-slate-900 dark:text-white">
                          <User size={16} className="text-slate-400 shrink-0" />
                          <span className="font-bold">{booking.customerName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-900 dark:text-white">
                          <Mail size={16} className="text-slate-400 shrink-0" />
                          <span className="font-medium break-all">{booking.customerEmail}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-900 dark:text-white">
                          <Phone size={16} className="text-slate-400 shrink-0" />
                          <span className="font-medium">{booking.customerPhone}</span>
                        </div>
                        {(booking.zaloId || booking.kakaoTalkId || booking.whatsapp) && (
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-separator">
                            {booking.zaloId && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
                                Zalo: {booking.zaloId}
                              </span>
                            )}
                            {booking.kakaoTalkId && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                                KakaoTalk: {booking.kakaoTalkId}
                              </span>
                            )}
                            {booking.whatsapp && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                                WhatsApp: {booking.whatsapp}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {tb.orderInfo}
                      </h3>
                      <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-border space-y-2.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium">{tb.bookingStatus}:</span>
                          <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-bold capitalize", getStatusBadge(booking.bookingStatus))}>
                            {getStatusLabel(booking.bookingStatus)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium">Ngày tạo đơn:</span>
                          <span className="text-slate-900 dark:text-white font-bold text-xs">{formatDate(booking.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium">{tb.paymentMethod}:</span>
                          <span className="text-slate-900 dark:text-white font-bold text-xs">{booking.paymentMethod || "CASH"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium">{tb.paymentStatus}:</span>
                          <span className={clsx("px-2 py-0.5 rounded-md text-[11px] font-bold", getPaymentStatusBadge(booking.paymentStatus))}>
                            {booking.paymentStatus || "UNPAID"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Dispatch Card */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Car size={13} />
                      <span>{tb.dispatch}</span>
                    </h3>
                    <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[var(--bg-surface)] border border-separator">
                        <span className="text-slate-500 font-medium">{tb.assignedDriver}:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{booking.assignedDriver || "Chưa phân công"}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[var(--bg-surface)] border border-separator">
                        <span className="text-slate-500 font-medium">{tb.assignedVehicle}:</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{booking.assignedVehicle || "Chưa phân công"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Notes vs Internal Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {booking.customerNotes && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText size={13} />
                          <span>{tb.customerNotes}</span>
                        </h3>
                        <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-border text-xs text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                          {booking.customerNotes}
                        </div>
                      </div>
                    )}

                    {booking.internalNotes && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldAlert size={13} />
                          <span>{tb.internalNotes}</span>
                        </h3>
                        <div className="bg-amber-50/40 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                          {booking.internalNotes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Booking Items */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {tb.serviceSpecs}
                    </h3>

                    {booking.items && booking.items.length > 0 ? (
                      <div className="space-y-4">
                        {booking.items.map((item, idx) => {
                          const serviceOptionTitle =
                            item.serviceOptionName?.["vi"] ||
                            item.serviceOptionName?.["en"] ||
                            (item.serviceOptionId ? `Gói dịch vụ #${item.serviceOptionId}` : null);

                          return (
                            <div key={idx} className="bg-white dark:bg-[var(--bg-card)] border border-border rounded-2xl p-5 shadow-xs space-y-4">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-1.5">
                                    {item.serviceName?.["vi"] || item.serviceName?.["en"] || `Dịch vụ #${item.serviceId}`}
                                  </span>
                                  {serviceOptionTitle && (
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                      {serviceOptionTitle}
                                    </h4>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="block text-xs text-slate-400 font-medium">{item.quantity} × {formatPrice(item.unitPrice)}</span>
                                  <span className="block text-base font-black text-slate-900 dark:text-white">{formatPrice(item.totalPrice)}</span>
                                </div>
                              </div>

                              <Separator className="bg-slate-100 dark:bg-[var(--bg-elevated)]" />

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                {item.startDate && (
                                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                                    <Clock size={14} className="text-slate-400 shrink-0" />
                                    <div>
                                      <span className="block font-medium text-slate-400">Thời gian bắt đầu</span>
                                      <span className="font-bold">{formatDate(item.startDate)}</span>
                                    </div>
                                  </div>
                                )}

                                {item.endDate && (
                                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                                    <Clock size={14} className="text-slate-400 shrink-0" />
                                    <div>
                                      <span className="block font-medium text-slate-400">Thời gian kết thúc</span>
                                      <span className="font-bold">{formatDate(item.endDate)}</span>
                                    </div>
                                  </div>
                                )}

                                {item.pickupLocation && (
                                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                                    <MapPin size={14} className="text-emerald-500 shrink-0" />
                                    <div>
                                      <span className="block font-medium text-slate-400">{tb.pickupLocation}</span>
                                      <span className="font-bold">{item.pickupLocation}</span>
                                    </div>
                                  </div>
                                )}

                                {item.dropoffLocation && (
                                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                                    <MapPin size={14} className="text-rose-500 shrink-0" />
                                    <div>
                                      <span className="block font-medium text-slate-400">{tb.dropoffLocation}</span>
                                      <span className="font-bold">{item.dropoffLocation}</span>
                                    </div>
                                  </div>
                                )}

                                {item.flightNumber && (
                                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 sm:col-span-2">
                                    <Plane size={14} className="text-slate-400 shrink-0" />
                                    <div>
                                      <span className="block font-medium text-slate-400">{tb.flightNumber}</span>
                                      <span className="font-bold uppercase font-mono">{item.flightNumber}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Detailed Specs (JSON breakdown) */}
                              {item.dynamicDetails && renderDynamicDetails(item.dynamicDetails)}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-bold py-2 italic">Không có dịch vụ đi kèm.</p>
                    )}
                  </div>
                </>
              )}
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <CancelRequestActions booking={booking} onDone={onStatusChanged} />
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {tb.close}
              </Button>
              {onEdit && (
                <Button
                  type="button"
                  onClick={onEdit}
                  className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
                >
                  <Edit3 size={15} className="mr-1.5" />
                  {tb.editBooking}
                </Button>
              )}
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
