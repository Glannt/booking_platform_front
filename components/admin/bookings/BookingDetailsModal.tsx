"use client";

import React from "react";
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
  Tag,
  DollarSign,
  Clock,
  FileText,
  Car,
  Navigation,
  ArrowRight,
  Info
} from "lucide-react";
import { BookingDto } from "@/lib/api/bookings";
import clsx from "clsx";

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingDto | null;
  language: string;
  onEdit?: () => void;
}

export default function BookingDetailsModal({
  isOpen,
  onClose,
  booking,
  language,
  onEdit
}: BookingDetailsModalProps) {
  if (!booking) return null;

  const isVi = language === "vi";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(isVi ? "vi-VN" : "en-US", {
      style: "currency",
      currency: isVi ? "VND" : "USD",
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString(isVi ? "vi-VN" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
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
      case "pending":
      default:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
    }
  };

  const getStatusLabel = (status: string, lang: string) => {
    const map: Record<string, Record<string, string>> = {
      pending: { vi: "Chờ xử lý", en: "Pending", ko: "대기 중", ru: "В ожидании" },
      confirmed: { vi: "Đã xác nhận", en: "Confirmed", ko: "확정됨", ru: "Подтверждено" },
      completed: { vi: "Đã hoàn thành", en: "Completed", ko: "완료됨", ru: "Завершено" },
      cancelled: { vi: "Đã hủy", en: "Cancelled", ko: "취소됨", ru: "Отменено" }
    };
    return map[status]?.[lang] || map[status]?.["en"] || status;
  };

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
        <div className="p-3 bg-default-100 dark:bg-[var(--bg-card)] rounded-xl border border-divider text-xs text-foreground/80">
          <span className="block font-bold text-default-500 uppercase text-[10px] mb-1">
            {isVi ? "Yêu cầu chi tiết" : "Details / Notes"}
          </span>
          <p className="whitespace-pre-wrap font-medium">{detailsStr}</p>
        </div>
      );
    }

    const tripTypeLabel =
      data.tripType === "ONE_WAY"
        ? isVi ? "Một chiều (1 chiều)" : "One-way"
        : data.tripType === "ROUND_TRIP" || data.tripType === "RETURN"
        ? isVi ? "Khứ hồi (2 chiều)" : "Round trip"
        : data.tripType;

    const outboundDirLabel =
      data.outboundDirection === "FROM_AIRPORT"
        ? isVi ? "Đón từ sân bay về khách sạn/nhà" : "From airport to destination"
        : data.outboundDirection === "TO_AIRPORT"
        ? isVi ? "Tiễn ra sân bay" : "To airport"
        : data.outboundDirection;

    const returnDirLabel =
      data.returnDirection === "FROM_AIRPORT"
        ? isVi ? "Đón từ sân bay về" : "From airport"
        : data.returnDirection === "TO_AIRPORT"
        ? isVi ? "Tiễn ra sân bay" : "To airport"
        : data.returnDirection;

    return (
      <div className="p-4 bg-default-50 dark:bg-[var(--bg-card)] rounded-xl border border-divider space-y-3">
        <div className="flex items-center justify-between border-b border-divider pb-2">
          <span className="font-bold text-default-500 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
            <Info size={13} className="text-primary" />
            {isVi ? "Chi tiết lộ trình & dịch vụ" : "Route & Service Details"}
          </span>
          {tripTypeLabel && (
            <Chip size="sm" color="accent" variant="soft" className="font-bold text-[10px]">
              {tripTypeLabel}
            </Chip>
          )}
        </div>

        {/* Outbound Leg */}
        {(data.outboundPickupTime || data.outboundDate || data.outboundPickupAddress || data.outboundFlightNumber) && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-foreground">
              <span className="flex items-center gap-1 text-primary">
                <Navigation size={13} />
                {isVi ? "Chiều đi" : "Outbound Trip"}: {outboundDirLabel || ""}
              </span>
              {data.outboundFlightNumber && (
                <span className="font-mono px-2 py-0.5 rounded bg-default-200 dark:bg-[var(--bg-elevated)] font-bold text-[11px] text-foreground">
                  ✈ {data.outboundFlightNumber}
                </span>
              )}
            </div>

            {(data.outboundPickupTime || data.outboundDate) && (
              <div className="flex items-center gap-2 text-default-600">
                <Clock size={13} className="text-default-400 shrink-0" />
                <span>
                  {isVi ? "Thời gian đón" : "Pickup Time"}:{" "}
                  <strong className="text-foreground">
                    {formatDate(data.outboundPickupTime || data.outboundDate)}
                  </strong>
                </span>
              </div>
            )}

            {data.outboundPickupAddress && (
              <div className="flex items-start gap-2 text-default-600">
                <MapPin size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  {isVi ? "Điểm đón" : "From"}: <span className="font-medium text-foreground">{data.outboundPickupAddress}</span>
                </span>
              </div>
            )}

            {data.outboundDropoffAddress && (
              <div className="flex items-start gap-2 text-default-600">
                <MapPin size={13} className="text-rose-500 shrink-0 mt-0.5" />
                <span>
                  {isVi ? "Điểm trả" : "To"}: <span className="font-medium text-foreground">{data.outboundDropoffAddress}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Return Leg */}
        {(data.returnPickupTime || data.returnDate || data.returnPickupAddress || data.returnFlightNumber) && (
          <div className="space-y-2 text-xs pt-2 border-t border-divider">
            <div className="flex items-center justify-between font-bold text-foreground">
              <span className="flex items-center gap-1 text-secondary">
                <ArrowRight size={13} />
                {isVi ? "Chiều về" : "Return Trip"}: {returnDirLabel || ""}
              </span>
              {data.returnFlightNumber && (
                <span className="font-mono px-2 py-0.5 rounded bg-default-200 dark:bg-[var(--bg-elevated)] font-bold text-[11px] text-foreground">
                  ✈ {data.returnFlightNumber}
                </span>
              )}
            </div>

            {(data.returnPickupTime || data.returnDate) && (
              <div className="flex items-center gap-2 text-default-600">
                <Clock size={13} className="text-default-400 shrink-0" />
                <span>
                  {isVi ? "Thời gian đón chiều về" : "Return Pickup Time"}:{" "}
                  <strong className="text-foreground">
                    {formatDate(data.returnPickupTime || data.returnDate)}
                  </strong>
                </span>
              </div>
            )}

            {data.returnPickupAddress && (
              <div className="flex items-start gap-2 text-default-600">
                <MapPin size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  {isVi ? "Điểm đón chiều về" : "From"}: <span className="font-medium text-foreground">{data.returnPickupAddress}</span>
                </span>
              </div>
            )}

            {data.returnDropoffAddress && (
              <div className="flex items-start gap-2 text-default-600">
                <MapPin size={13} className="text-rose-500 shrink-0 mt-0.5" />
                <span>
                  {isVi ? "Điểm trả chiều về" : "To"}: <span className="font-medium text-foreground">{data.returnDropoffAddress}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Vehicle & Pricing meta */}
        {(data.vehicleCategoryId || data.basePrice || data.deposit) && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-divider text-[11px]">
            {data.vehicleCategoryId && (
              <span className="px-2.5 py-1 rounded-lg bg-default-100 dark:bg-[var(--bg-elevated)] font-bold text-foreground flex items-center gap-1">
                <Car size={12} className="text-primary" />
                {isVi ? `Dòng xe ID: #${data.vehicleCategoryId}` : `Vehicle Cat: #${data.vehicleCategoryId}`}
              </span>
            )}
            {data.deposit && (
              <span className="px-2.5 py-1 rounded-lg bg-default-100 dark:bg-[var(--bg-elevated)] font-bold text-foreground flex items-center gap-1">
                <DollarSign size={12} className="text-amber-500" />
                {isVi ? `Đặt cọc: ${formatPrice(Number(data.deposit))}` : `Deposit: ${formatPrice(Number(data.deposit))}`}
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
            <ModalHeader className="border-b border-divider py-4 px-6 flex flex-row items-center justify-between shrink-0 bg-default-50 dark:bg-[var(--bg-surface)]">
              <div className="flex flex-col gap-0.5">
                <span id="booking-details-title" className="text-lg font-black text-foreground">
                  {isVi ? "Chi tiết Đơn đặt" : "Booking Details"}
                </span>
                <span className="text-sm font-mono font-black text-primary">
                  {booking.bookingCode}
                </span>
              </div>
              {onEdit && (
                <Button
                  size="sm"
                  onClick={onEdit}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  {isVi ? "Chỉnh sửa đơn" : "Edit Booking"}
                </Button>
              )}
            </ModalHeader>

            <ModalBody className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
              {/* Customer and Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider">
                    {isVi ? "Thông tin khách hàng" : "Customer Information"}
                  </h3>
                  <div className="bg-default-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-divider space-y-2.5">
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <User size={16} className="text-default-400 shrink-0" />
                      <span className="font-bold">{booking.customerName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <Mail size={16} className="text-default-400 shrink-0" />
                      <span className="font-medium break-all">{booking.customerEmail}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <Phone size={16} className="text-default-400 shrink-0" />
                      <span className="font-medium">{booking.customerPhone}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider">
                    {isVi ? "Thông tin đơn đặt" : "Booking Status"}
                  </h3>
                  <div className="bg-default-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-divider space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-default-500 font-medium">{isVi ? "Trạng thái:" : "Status:"}</span>
                      <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-bold capitalize", getStatusBadge(booking.bookingStatus))}>
                        {getStatusLabel(booking.bookingStatus, language)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-default-500 font-medium">{isVi ? "Ngày tạo đơn:" : "Created at:"}</span>
                      <span className="text-foreground font-bold text-xs">{formatDate(booking.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Items */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider">
                  {isVi ? "Chi tiết các dịch vụ đã đặt" : "Booked Services"}
                </h3>

                {booking.items && booking.items.length > 0 ? (
                  <div className="space-y-4">
                    {booking.items.map((item, idx) => {
                      const serviceOptionTitle =
                        item.serviceOptionName?.[language] ||
                        item.serviceOptionName?.["en"] ||
                        (item.serviceOptionId ? (isVi ? `Gói dịch vụ #${item.serviceOptionId}` : `Service Option #${item.serviceOptionId}`) : null);

                      return (
                        <div key={idx} className="bg-white dark:bg-[var(--bg-card)] border border-divider rounded-2xl p-5 shadow-xs space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs mb-1.5">
                                {item.serviceName?.[language] || item.serviceName?.["en"] || (isVi ? `Dịch vụ #${item.serviceId}` : `Service #${item.serviceId}`)}
                              </span>
                              {serviceOptionTitle && (
                                <h4 className="text-sm font-bold text-foreground">
                                  {serviceOptionTitle}
                                </h4>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="block text-xs text-default-400 font-medium">{item.quantity} × {formatPrice(item.unitPrice)}</span>
                              <span className="block text-base font-black">{formatPrice(item.totalPrice)}</span>
                            </div>
                          </div>

                          <Separator className="bg-divider" />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {item.startDate && (
                              <div className="flex items-center gap-2.5 text-foreground">
                                <Clock size={14} className="text-default-400 shrink-0" />
                                <div>
                                  <span className="block font-medium text-default-400">{isVi ? "Thời gian bắt đầu" : "Start Date"}</span>
                                  <span className="font-bold">{formatDate(item.startDate)}</span>
                                </div>
                              </div>
                            )}

                            {item.endDate && (
                              <div className="flex items-center gap-2.5 text-foreground">
                                <Clock size={14} className="text-default-400 shrink-0" />
                                <div>
                                  <span className="block font-medium text-default-400">{isVi ? "Thời gian kết thúc" : "End Date"}</span>
                                  <span className="font-bold">{formatDate(item.endDate)}</span>
                                </div>
                              </div>
                            )}

                            {item.pickupLocation && (
                              <div className="flex items-center gap-2.5 text-foreground">
                                <MapPin size={14} className="text-emerald-500 shrink-0" />
                                <div>
                                  <span className="block font-medium text-default-400">{isVi ? "Điểm đón" : "Pickup Location"}</span>
                                  <span className="font-bold">{item.pickupLocation}</span>
                                </div>
                              </div>
                            )}

                            {item.dropoffLocation && (
                              <div className="flex items-center gap-2.5 text-foreground">
                                <MapPin size={14} className="text-rose-500 shrink-0" />
                                <div>
                                  <span className="block font-medium text-default-400">{isVi ? "Điểm trả" : "Dropoff Location"}</span>
                                  <span className="font-bold">{item.dropoffLocation}</span>
                                </div>
                              </div>
                            )}

                            {item.flightNumber && (
                              <div className="flex items-center gap-2.5 text-foreground sm:col-span-2">
                                <Plane size={14} className="text-default-400 shrink-0" />
                                <div>
                                  <span className="block font-medium text-default-400">{isVi ? "Số hiệu chuyến bay" : "Flight Number"}</span>
                                  <span className="font-bold uppercase font-mono">{item.flightNumber}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Dynamic Detailed Specs (Structured JSON or Text) */}
                          {item.dynamicDetails && renderDynamicDetails(item.dynamicDetails)}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-default-400 font-bold py-2 italic">{isVi ? "Không có dịch vụ đi kèm." : "No attached services found."}</p>
                )}
              </div>

              {/* Customer Notes */}
              {booking.customerNotes && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={13} />
                    {isVi ? "Ghi chú của khách hàng" : "Customer Notes"}
                  </h3>
                  <div className="bg-default-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-divider text-sm text-foreground font-medium whitespace-pre-wrap">
                    {booking.customerNotes}
                  </div>
                </div>
              )}

              {/* Total Summary */}
              <div className="flex items-center justify-between bg-default-100 dark:bg-[var(--bg-card)] border border-divider p-5 rounded-2xl">
                <div>
                  <span className="block text-xs font-bold text-default-500 uppercase tracking-wider">{isVi ? "Tổng cộng" : "Total Price"}</span>
                  <span className="block text-xs text-default-400 mt-0.5">{isVi ? "Đã bao gồm thuế & phí" : "Includes all taxes & fees"}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black">{formatPrice(booking.totalAmount)}</span>
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="border-t border-divider py-3 px-6 justify-end shrink-0 bg-default-50 dark:bg-[var(--bg-surface)]">
              <Button
                className="rounded-xl font-bold bg-default-200 dark:bg-[var(--bg-card)] text-foreground cursor-pointer"
                onClick={onClose}
              >
                {isVi ? "Đóng" : "Close"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
