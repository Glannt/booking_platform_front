"use client";

import React, { useState } from "react";
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
  Label,
} from "@heroui/react";
import { Trash2, AlertCircle, RefreshCw, ShieldAlert, Ban } from "lucide-react";
import { BookingDto, deleteBooking } from "@/lib/api/bookings";
import { useI18n } from "@/context/LanguageContext";

interface BookingDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingDto | null;
  language: string;
  onDeleteSuccess: (id: number) => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function BookingDeleteModal({
  isOpen,
  onClose,
  booking,
  onDeleteSuccess,
  showToast
}: BookingDeleteModalProps) {
  const { t } = useI18n();
  const tb = t.adminBookings;

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!booking) return null;

  const deposit = booking.depositAmount ?? 0;
  const received = booking.receivedAmount ?? 0;
  const paid = booking.paidAmount ?? (deposit + received);
  const isPaidOrDeposited =
    booking.paymentStatus === "PAID" ||
    booking.paymentStatus === "DEPOSITED" ||
    deposit > 0 ||
    received > 0 ||
    paid > 0;

  const handleDelete = async () => {
    if (isPaidOrDeposited) return;

    if (!reason.trim()) {
      showToast(tb.deletionReasonRequired, "error");
      return;
    }

    setLoading(true);
    try {
      await deleteBooking(booking.id, reason.trim());
      showToast(t.surchargeEngine?.deleteSuccess || "Đã xóa đơn đặt thành công!", "success");
      onDeleteSuccess(booking.id);
      setReason("");
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Lỗi xóa đơn đặt!", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="booking-delete-title">
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm" isDismissable={false}>
        <ModalContainer size="sm">
          <ModalDialog className="max-w-md bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden focus:outline-none w-full flex flex-col">
            <ModalCloseTrigger />
            <ModalHeader className="border-b border-slate-100 dark:border-slate-800 py-4 px-6 flex items-center justify-between shrink-0">
              <span id="booking-delete-title" className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                {isPaidOrDeposited ? (
                  <ShieldAlert className="text-amber-500" size={22} />
                ) : (
                  <AlertCircle className="text-rose-500" size={22} />
                )}
                {tb.deleteModalTitle}
              </span>
            </ModalHeader>

            <ModalBody className="p-6 text-sm text-slate-600 dark:text-slate-300 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-border flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">{t.booking?.title || "Mã đơn"}:</span>
                  <span className="font-mono font-bold text-primary text-sm">{booking.bookingCode}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">{t.booking?.fullName || "Khách hàng"}:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{booking.customerName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">{tb.totalAmount}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(booking.totalAmount)}
                  </span>
                </div>
              </div>

              {isPaidOrDeposited ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Ban size={18} className="text-rose-500 shrink-0" />
                    <span>{tb.deleteBlockedTitle}</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{tb.deleteBlockedDesc}</p>
                  <div className="pt-2 text-xs border-t border-rose-500/20 flex justify-between font-semibold">
                    <span>{tb.paid}:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-300">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(paid)}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {tb.deleteModalWarning}
                  </p>

                  <div className="space-y-1.5">
                    <Label isRequired className="text-xs font-bold block mb-1.5">
                      {tb.deletionReason}
                    </Label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={tb.deletionReasonPlaceholder}
                      className="w-full text-xs rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-card)] p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
                    />
                  </div>
                </>
              )}
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                onClick={onClose}
                isDisabled={loading}
              >
                {tb.cancel}
              </Button>
              <Button
                type="button"
                className={`rounded-xl font-bold text-xs h-10 px-5 text-white shadow-sm border-none transition-colors ${
                  isPaidOrDeposited || !reason.trim()
                    ? "bg-slate-300 dark:bg-[var(--bg-elevated)] text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    : "bg-rose-600 hover:bg-rose-700 cursor-pointer"
                }`}
                onClick={handleDelete}
                isDisabled={loading || isPaidOrDeposited || !reason.trim()}
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={15} />
                ) : (
                  <Trash2 size={15} className="mr-1.5" />
                )}
                {isPaidOrDeposited ? tb.cannotDeleteWithFunds : tb.confirmDelete}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
