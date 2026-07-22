"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  ListBox,
  Label,
  TextField,
  Input,
  NumberField
} from "@heroui/react";
import { Save, RefreshCw } from "lucide-react";
import { BookingDto, updateBooking, UpdateBookingRequest } from "@/lib/api/bookings";

interface BookingEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingDto | null;
  language: string;
  onSaveSuccess: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function BookingEditModal({
  isOpen,
  onClose,
  booking,
  language,
  onSaveSuccess,
  showToast
}: BookingEditModalProps) {
  const [formData, setFormData] = useState<UpdateBookingRequest>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking) {
      setFormData({
        customerName: booking.customerName || "",
        customerEmail: booking.customerEmail || "",
        customerPhone: booking.customerPhone || "",
        totalAmount: booking.totalAmount || 0,
        bookingStatus: booking.bookingStatus || "pending",
        customerNotes: booking.customerNotes || ""
      });
    }
  }, [booking, isOpen]);

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

  if (!booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName?.trim()) {
      showToast(language === "vi" ? "Tên khách hàng không được để trống!" : "Customer name cannot be empty!", "error");
      return;
    }

    setLoading(true);
    try {
      await updateBooking(booking.id, formData);
      showToast(language === "vi" ? "Cập nhật đơn đặt thành công!" : "Booking updated successfully!", "success");
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || (language === "vi" ? "Lỗi cập nhật!" : "Update failed!"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="booking-edit-title">
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm" isDismissable={false}>
        <ModalContainer size="md">
          <ModalDialog className="max-w-2xl bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden focus:outline-none w-full max-h-[90vh] flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
              <ModalHeader className="border-b border-divider bg-slate-50 dark:bg-black/40 py-4 px-6 flex flex-col gap-0.5">
                <span id="booking-edit-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {language === "vi" ? "Chỉnh sửa Đơn đặt" : "Edit Booking"}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {booking.bookingCode}
                </span>
              </ModalHeader>

              <ModalBody className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField isRequired className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider">{language === "vi" ? "Tên khách hàng" : "Customer Name"}</Label>
                    <Input type="text" value={formData.customerName || ""} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800" />
                  </TextField>

                  <TextField isRequired className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider">{language === "vi" ? "Số điện thoại" : "Phone Number"}</Label>
                    <Input type="text" value={formData.customerPhone || ""} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800" />
                  </TextField>
                </div>

                <TextField isRequired className="w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider">{language === "vi" ? "Email liên hệ" : "Contact Email"}</Label>
                  <Input type="email" value={formData.customerEmail || ""} onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })} className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800" />
                </TextField>

                <div className="w-full">
                  <Select
                    isRequired
                    fullWidth
                    name="bookingStatus"
                    placeholder={language === "vi" ? "Chọn trạng thái" : "Select status"}
                    selectedKey={formData.bookingStatus || "pending"}
                    onSelectionChange={(key) => {
                      if (key) {
                        setFormData({ ...formData, bookingStatus: key as any });
                      }
                    }}
                  >
                    <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {language === "vi" ? "Trạng thái đơn hàng" : "Booking Status"}
                    </Label>
                    <Select.Trigger className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold flex items-center justify-between cursor-pointer">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                      <ListBox>
                        <ListBox.Item id="pending" textValue={getStatusLabel("pending", language)} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between">
                          {getStatusLabel("pending", language)}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="confirmed" textValue={getStatusLabel("confirmed", language)} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between">
                          {getStatusLabel("confirmed", language)}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="completed" textValue={getStatusLabel("completed", language)} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between">
                          {getStatusLabel("completed", language)}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="cancelled" textValue={getStatusLabel("cancelled", language)} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between">
                          {getStatusLabel("cancelled", language)}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                <div>
                  <NumberField
                    minValue={0}
                    value={formData.totalAmount || 0}
                    onChange={(val) => setFormData({ ...formData, totalAmount: val ?? 0 })}
                    formatOptions={{ style: "currency", currency: "VND" }}
                    isRequired
                    fullWidth
                  >
                    <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {language === "vi" ? "Tổng tiền" : "Total Amount"}
                    </Label>
                    <NumberField.Group>
                      <NumberField.Input />
                    </NumberField.Group>
                  </NumberField>
                </div>

                <div>
                  <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {language === "vi" ? "Ghi chú đơn đặt" : "Booking Notes"}
                  </Label>
                  <textarea
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    value={formData.customerNotes || ""}
                    onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
                  />
                </div>
              </ModalBody>

              <ModalFooter className="border-t border-divider bg-slate-50 dark:bg-black/40 py-3 px-6 justify-end gap-2.5">
                <Button
                  className="rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  onClick={onClose}
                  type="button"
                >
                  {language === "vi" ? "Hủy" : "Cancel"}
                </Button>
                <Button
                  className="rounded-xl font-bold bg-[#C9A227] hover:bg-[#b8922a] text-white shadow-sm border border-transparent"
                  type="submit"
                  isDisabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} className="mr-1.5" />
                  )}
                  {language === "vi" ? "Lưu thay đổi" : "Save Changes"}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
