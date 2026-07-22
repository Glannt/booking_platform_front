"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from "@heroui/react";
import { Trash2, AlertCircle, RefreshCw } from "lucide-react";
import { BookingDto, deleteBooking } from "@/lib/api/bookings";

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
  language,
  onDeleteSuccess,
  showToast
}: BookingDeleteModalProps) {
  const [loading, setLoading] = useState(false);

  if (!booking) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteBooking(booking.id);
      showToast(language === "vi" ? "Đã xóa đơn đặt thành công!" : "Booking deleted successfully!", "success");
      onDeleteSuccess(booking.id);
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || (language === "vi" ? "Lỗi xóa đơn đặt!" : "Delete failed!"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="booking-delete-title">
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm" isDismissable={false}>
        <ModalContainer size="sm">
          <ModalDialog className="max-w-md bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden focus:outline-none w-full flex flex-col">
            <ModalHeader className="border-b border-divider bg-slate-50 dark:bg-black/40 py-4 px-6 flex flex-col gap-0.5">
              <span id="booking-delete-title" className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="text-rose-500" size={20} />
                {language === "vi" ? "Xác nhận xóa đơn đặt" : "Confirm Delete"}
              </span>
            </ModalHeader>

            <ModalBody className="p-6 text-sm text-slate-600 dark:text-slate-350">
              <p>
                {language === "vi"
                  ? `Bạn có chắc chắn muốn xóa đơn đặt có mã `
                  : `Are you sure you want to delete the booking with code `}
                <strong className="font-mono text-primary font-bold">{booking.bookingCode}</strong>
                {language === "vi"
                  ? " của khách hàng "
                  : " belonging to "}
                <strong>{booking.customerName}</strong>?
              </p>
              <p className="mt-2 text-xs text-rose-500 font-bold">
                {language === "vi"
                  ? "* Hành động này sẽ ẩn đơn đặt này khỏi danh sách quản lý."
                  : "* This action will soft-delete this booking from the active list."}
              </p>
            </ModalBody>

            <ModalFooter className="border-t border-divider bg-slate-50 dark:bg-black/40 py-3 px-6 justify-end gap-2.5">
              <Button
                className="rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                onClick={onClose}
                isDisabled={loading}
              >
                {language === "vi" ? "Hủy" : "Cancel"}
              </Button>
              <Button
                className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-transparent"
                onClick={handleDelete}
                isDisabled={loading}
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <Trash2 size={16} className="mr-1.5" />
                )}
                {language === "vi" ? "Xóa đơn" : "Delete"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
