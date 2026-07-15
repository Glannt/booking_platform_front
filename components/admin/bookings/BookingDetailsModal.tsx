"use client";

import React from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Separator
} from "@heroui/react";
import { Calendar, User, Mail, Phone, MapPin, Plane, Tag, DollarSign, Clock, FileText } from "lucide-react";
import { BookingDto } from "@/lib/api/bookings";
import clsx from "clsx";

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingDto | null;
  language: string;
}

export default function BookingDetailsModal({
  isOpen,
  onClose,
  booking,
  language
}: BookingDetailsModalProps) {
  if (!booking) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
      style: "currency",
      currency: language === "vi" ? "VND" : "USD",
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
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
        return "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50";
      case "completed":
        return "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50";
      case "cancelled":
        return "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/50";
      case "pending":
      default:
        return "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/50";
    }
  };

  const getStatusLabel = (status: string, lang: string) => {
    const map: Record<string, Record<string, string>> = {
      pending: {
        vi: "Chờ xử lý",
        en: "Pending",
        ko: "대기 중",
        ru: "В ожидании"
      },
      confirmed: {
        vi: "Đã xác nhận",
        en: "Confirmed",
        ko: "확정됨",
        ru: "Подтверждено"
      },
      completed: {
        vi: "Đã hoàn thành",
        en: "Completed",
        ko: "완료됨",
        ru: "Завершено"
      },
      cancelled: {
        vi: "Đã hủy",
        en: "Cancelled",
        ko: "취소됨",
        ru: "Отменено"
      }
    };
    return map[status]?.[lang] || map[status]?.["en"] || status;
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm" isDismissable={true}>
        <ModalContainer size="lg">
          <ModalDialog className="max-w-3xl bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden focus:outline-none w-full max-h-[90vh] flex flex-col">
            <ModalHeader className="border-b border-divider bg-slate-50 dark:bg-black/40 py-4 px-6 flex flex-col gap-0.5">
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                {language === "vi" ? "Chi tiết Đơn đặt" : "Booking Details"}
              </span>
              <span className="text-sm font-mono font-bold text-primary">
                {booking.bookingCode}
              </span>
            </ModalHeader>

            <ModalBody className="p-6 space-y-6 overflow-y-auto">
              {/* Customer and Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {language === "vi" ? "Thông tin khách hàng" : "Customer Information"}
                  </h3>
                  <div className="bg-slate-50/50 dark:bg-black/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                      <User size={16} className="text-slate-400" />
                      <span className="font-bold">{booking.customerName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                      <Mail size={16} className="text-slate-400" />
                      <span className="font-medium break-all">{booking.customerEmail}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                      <Phone size={16} className="text-slate-400" />
                      <span className="font-medium">{booking.customerPhone}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {language === "vi" ? "Thông tin trạng thái" : "Status Information"}
                  </h3>
                  <div className="bg-slate-50/50 dark:bg-black/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium">{language === "vi" ? "Trạng thái đơn:" : "Booking Status:"}</span>
                      <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-bold capitalize", getStatusBadge(booking.bookingStatus))}>
                        {getStatusLabel(booking.bookingStatus, language)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Items */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {language === "vi" ? "Chi tiết các dịch vụ đã đặt" : "Booked Services"}
                </h3>

                {booking.items && booking.items.length > 0 ? (
                  <div className="space-y-4">
                    {booking.items.map((item, idx) => (
                      <div key={idx} className="bg-white dark:bg-black border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 mb-2">
                              {item.serviceName?.[language] || item.serviceName?.["en"] || (language === "vi" ? `Dịch vụ #${item.serviceId}` : `Service #${item.serviceId}`)}
                            </span>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                              {item.serviceOptionName?.[language] || item.serviceOptionName?.["en"] || (language === "vi" ? `Lựa chọn giá vé #${item.serviceOptionId}` : `Ticket Class option #${item.serviceOptionId}`)}
                            </h4>
                          </div>
                          <div className="text-right">
                            <span className="block text-xs text-slate-400 font-bold">{item.quantity} x {formatPrice(item.unitPrice)}</span>
                            <span className="block text-sm font-extrabold text-primary">{formatPrice(item.totalPrice)}</span>
                          </div>
                        </div>

                        <Separator className="bg-slate-100 dark:bg-slate-800" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          {item.startDate && (
                            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                              <Clock size={14} className="text-slate-400" />
                              <div>
                                <span className="block font-medium text-slate-400">{language === "vi" ? "Thời gian bắt đầu" : "Start Date"}</span>
                                <span className="font-bold">{formatDate(item.startDate)}</span>
                              </div>
                            </div>
                          )}

                          {item.endDate && (
                            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                              <Clock size={14} className="text-slate-400" />
                              <div>
                                <span className="block font-medium text-slate-400">{language === "vi" ? "Thời gian kết thúc" : "End Date"}</span>
                                <span className="font-bold">{formatDate(item.endDate)}</span>
                              </div>
                            </div>
                          )}

                          {item.pickupLocation && (
                            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                              <MapPin size={14} className="text-slate-400" />
                              <div>
                                <span className="block font-medium text-slate-400">{language === "vi" ? "Điểm đón" : "Pickup Location"}</span>
                                <span className="font-bold">{item.pickupLocation}</span>
                              </div>
                            </div>
                          )}

                          {item.dropoffLocation && (
                            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                              <MapPin size={14} className="text-slate-400" />
                              <div>
                                <span className="block font-medium text-slate-400">{language === "vi" ? "Điểm trả" : "Dropoff Location"}</span>
                                <span className="font-bold">{item.dropoffLocation}</span>
                              </div>
                            </div>
                          )}

                          {item.flightNumber && (
                            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 sm:col-span-2">
                              <Plane size={14} className="text-slate-400" />
                              <div>
                                <span className="block font-medium text-slate-400">{language === "vi" ? "Số hiệu chuyến bay" : "Flight Number"}</span>
                                <span className="font-bold uppercase font-mono">{item.flightNumber}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {item.dynamicDetails && (
                          <div className="mt-2 p-3 bg-slate-50 dark:bg-black rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-350">
                            <span className="block font-bold text-slate-400 uppercase text-[9px] mb-1">{language === "vi" ? "Yêu cầu chi tiết" : "Spec / Details"}</span>
                            <pre className="font-mono whitespace-pre-wrap">{item.dynamicDetails}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-bold py-2 italic">{language === "vi" ? "Không có dịch vụ đi kèm." : "No attached services found."}</p>
                )}
              </div>

              {/* Customer Notes */}
              {booking.customerNotes && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={12} />
                    {language === "vi" ? "Ghi chú của khách hàng" : "Customer Notes"}
                  </h3>
                  <div className="bg-slate-50 dark:bg-black p-4 rounded-xl border border-slate-100 dark:border-slate-850 text-sm text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">
                    {booking.customerNotes}
                  </div>
                </div>
              )}

              {/* Total Summary */}
              <div className="flex items-center justify-between bg-primary/5 dark:bg-primary/10 border border-primary/10 p-5 rounded-2xl">
                <div>
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{language === "vi" ? "Tổng cộng" : "Total Price"}</span>
                  <span className="block text-xs text-slate-400 mt-0.5">{language === "vi" ? "Đã bao gồm thuế & phí" : "Includes all taxes & fees"}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-primary">{formatPrice(booking.totalAmount)}</span>
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="border-t border-divider bg-slate-50 dark:bg-black/40 py-3 px-6 justify-end">
              <Button
                className="rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                onClick={onClose}
              >
                {language === "vi" ? "Đóng" : "Close"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
