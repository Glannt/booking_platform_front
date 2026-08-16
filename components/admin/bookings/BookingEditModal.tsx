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
      pending: { vi: "Chờ xử lý", en: "Pending", ko: "대기 중", ru: "В ожидании" },
      confirmed: { vi: "Đã xác nhận", en: "Confirmed", ko: "확정됨", ru: "Подтверждено" },
      completed: { vi: "Đã hoàn thành", en: "Completed", ko: "완료됨", ru: "Завершено" },
      cancelled: { vi: "Đã hủy", en: "Cancelled", ko: "취소됨", ru: "Отменеno" }
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
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden focus:outline-none w-full">
            <ModalCloseTrigger />
            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
              <ModalHeader className="border-b border-divider py-4 px-6 flex flex-col gap-0.5 shrink-0 bg-default-50 dark:bg-[var(--bg-surface)]">
                <span id="booking-edit-title" className="text-lg font-black text-foreground">
                  {language === "vi" ? "Chỉnh sửa Đơn đặt" : "Edit Booking"}
                </span>
                <span className="text-xs font-mono font-bold text-primary">
                  {booking.bookingCode}
                </span>
              </ModalHeader>

              <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField isRequired className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider text-default-500">{language === "vi" ? "Tên khách hàng" : "Customer Name"}</Label>
                    <Input type="text" value={formData.customerName || ""} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-foreground" />
                  </TextField>

                  <TextField isRequired className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider text-default-500">{language === "vi" ? "Số điện thoại" : "Phone Number"}</Label>
                    <Input type="text" value={formData.customerPhone || ""} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-foreground" />
                  </TextField>
                </div>

                <TextField isRequired className="w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider text-default-500">{language === "vi" ? "Email liên hệ" : "Contact Email"}</Label>
                  <Input type="email" value={formData.customerEmail || ""} onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })} className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-foreground" />
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
                    <Label className="block text-xs font-bold text-default-500 uppercase tracking-wider mb-2">
                      {language === "vi" ? "Trạng thái đơn hàng" : "Booking Status"}
                    </Label>
                    <Select.Trigger className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold flex items-center justify-between cursor-pointer">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                      <ListBox>
                        <ListBox.Item id="pending" textValue={getStatusLabel("pending", language)} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground flex items-center justify-between">
                          {getStatusLabel("pending", language)}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="confirmed" textValue={getStatusLabel("confirmed", language)} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground flex items-center justify-between">
                          {getStatusLabel("confirmed", language)}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="completed" textValue={getStatusLabel("completed", language)} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground flex items-center justify-between">
                          {getStatusLabel("completed", language)}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="cancelled" textValue={getStatusLabel("cancelled", language)} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground flex items-center justify-between">
                          {getStatusLabel("cancelled", language)}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                <div>
                  <Label className="block text-xs font-bold text-default-500 uppercase tracking-wider mb-2">
                    {language === "vi" ? "Tổng tiền (VND)" : "Total Amount"}
                  </Label>
                  <NumberField
                    isDisabled
                    minValue={0}
                    value={formData.totalAmount || 0}
                    onChange={(val) => setFormData({ ...formData, totalAmount: val ?? 0 })}
                    formatOptions={{ style: "currency", currency: "VND" }}
                    isRequired
                    fullWidth
                  >
                    <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] text-foreground overflow-hidden focus-within:ring-2 focus-within:ring-primary h-10">
                      <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full font-bold text-primary" />
                    </NumberField.Group>
                  </NumberField>
                </div>

                <TextField className="w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider text-default-500">{language === "vi" ? "Ghi chú của khách" : "Customer Notes"}</Label>
                  <textarea
                    rows={3}
                    value={formData.customerNotes || ""}
                    onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
                    className="w-full p-2.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-foreground outline-none focus:ring-2 focus:ring-primary"
                  />
                </TextField>
              </ModalBody>

              <ModalFooter className="border-t border-divider py-3 px-6 justify-end gap-2 shrink-0 bg-default-50 dark:bg-[var(--bg-surface)]">
                <Button
                  className="rounded-xl font-bold bg-default-200 dark:bg-[var(--bg-card)] text-foreground cursor-pointer"
                  onClick={onClose}
                  isDisabled={loading}
                >
                  {language === "vi" ? "Hủy" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  isDisabled={loading}
                  className="bg-accent text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      {language === "vi" ? "Đang lưu..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      {language === "vi" ? "Lưu thay đổi" : "Save Changes"}
                    </>
                  )}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
