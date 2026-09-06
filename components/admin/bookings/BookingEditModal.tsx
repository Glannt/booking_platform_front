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
  NumberField,
} from "@heroui/react";
import {
  Save,
  RefreshCw,
  User,
  Car,
  CreditCard,
  ShieldAlert,
  Calculator,
} from "lucide-react";
import { BookingDto, updateBooking, UpdateBookingRequest, BookingStatus } from "@/lib/api/bookings";
import { getVehicles, type VehicleDto } from "@/lib/api/fleet";
import { useI18n } from "@/context/LanguageContext";

interface BookingEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingDto | null;
  language?: string;
  onSaveSuccess: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function BookingEditModal({
  isOpen,
  onClose,
  booking,
  onSaveSuccess,
  showToast,
}: BookingEditModalProps) {
  const { t } = useI18n();
  const tb = t.adminBookings;

  const [formData, setFormData] = useState<UpdateBookingRequest>({});
  const [loading, setLoading] = useState(false);
  const [fleetVehicles, setFleetVehicles] = useState<VehicleDto[]>([]);

  useEffect(() => {
    if (isOpen) {
      getVehicles({}).then((res) => {
        if (res?.data?.content) {
          setFleetVehicles(res.data.content);
        }
      }).catch((err) => console.error("Failed to load fleet vehicles:", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (booking) {
      const deposit = booking.depositAmount ?? 0;
      const received = booking.receivedAmount ?? 0;
      const total = booking.totalAmount ?? 0;
      setFormData({
        customerName: booking.customerName || "",
        customerEmail: booking.customerEmail || "",
        customerPhone: booking.customerPhone || "",
        zaloId: booking.zaloId || "",
        kakaoTalkId: booking.kakaoTalkId || "",
        whatsapp: booking.whatsapp || "",
        totalAmount: total,
        depositAmount: deposit,
        receivedAmount: received,
        bookingStatus: booking.bookingStatus || "pending",
        assignedDriver: booking.assignedDriver || "",
        assignedVehicle: booking.assignedVehicle || "",
        paymentStatus: booking.paymentStatus || (deposit + received >= total && total > 0 ? "PAID" : deposit > 0 ? "DEPOSITED" : "UNPAID"),
        paymentMethod: booking.paymentMethod || "CASH",
        customerNotes: booking.customerNotes || "",
        internalNotes: booking.internalNotes || "",
      });
    }
  }, [booking, isOpen]);

  if (!booking) return null;

  const currentTotal = formData.totalAmount ?? 0;
  const currentDeposit = formData.depositAmount ?? 0;
  const currentReceived = formData.receivedAmount ?? 0;
  const currentRemaining = Math.max(0, currentTotal - (currentDeposit + currentReceived));

  const handleDepositChange = (val: number | null) => {
    const dep = val ?? 0;
    const rec = formData.receivedAmount ?? 0;
    const tot = formData.totalAmount ?? 0;
    let autoStatus = formData.paymentStatus;
    if (dep + rec >= tot && tot > 0) {
      autoStatus = "PAID";
    } else if (dep > 0) {
      autoStatus = "DEPOSITED";
    } else if (dep === 0 && rec === 0) {
      autoStatus = "UNPAID";
    }
    setFormData({ ...formData, depositAmount: dep, paymentStatus: autoStatus });
  };

  const handleReceivedChange = (val: number | null) => {
    const rec = val ?? 0;
    const dep = formData.depositAmount ?? 0;
    const tot = formData.totalAmount ?? 0;
    let autoStatus = formData.paymentStatus;
    if (dep + rec >= tot && tot > 0) {
      autoStatus = "PAID";
    } else if (dep > 0 || rec > 0) {
      autoStatus = "DEPOSITED";
    }
    setFormData({ ...formData, receivedAmount: rec, paymentStatus: autoStatus });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName?.trim()) {
      showToast(t.errors?.nameRequired || "Tên khách hàng không được để trống!", "error");
      return;
    }

    setLoading(true);
    try {
      await updateBooking(booking.id, {
        ...formData,
        customerName: formData.customerName?.trim(),
        customerEmail: formData.customerEmail?.trim(),
        customerPhone: formData.customerPhone?.trim(),
        zaloId: formData.zaloId?.trim() || undefined,
        kakaoTalkId: formData.kakaoTalkId?.trim() || undefined,
        whatsapp: formData.whatsapp?.trim() || undefined,
        assignedDriver: formData.assignedDriver?.trim() || undefined,
        assignedVehicle: formData.assignedVehicle?.trim() || undefined,
        internalNotes: formData.internalNotes?.trim() || undefined,
        customerNotes: formData.customerNotes?.trim() || undefined,
      });
      showToast(t.surchargeEngine?.saveSuccess || "Cập nhật thành công!", "success");
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err?.response?.data?.message || err?.message || "Lỗi cập nhật!";
      showToast(errorMsg, "error");
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
              <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-[var(--bg-card)]">
                <div className="flex flex-col gap-0.5">
                  <span id="booking-edit-title" className="text-lg font-black text-slate-900 dark:text-white">
                    {tb.editBooking}
                  </span>
                  <span className="text-xs font-mono font-bold text-primary">
                    {booking.bookingCode}
                  </span>
                </div>
              </ModalHeader>

              <ModalBody className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
                {/* 1. Customer & Contact Channels */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={13} />
                    <span>{t.booking?.step3 || "Khách hàng & Kênh liên hệ"}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TextField isRequired className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {t.booking?.fullName || "Tên khách hàng"}
                      </Label>
                      <Input
                        type="text"
                        value={formData.customerName || ""}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-900 dark:text-white"
                      />
                    </TextField>

                    <TextField isRequired className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {t.booking?.phone || "Số điện thoại"}
                      </Label>
                      <Input
                        type="text"
                        value={formData.customerPhone || ""}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-900 dark:text-white"
                      />
                    </TextField>
                  </div>

                  <TextField isRequired className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {t.booking?.email || "Email"}
                    </Label>
                    <Input
                      type="email"
                      value={formData.customerEmail || ""}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-900 dark:text-white"
                    />
                  </TextField>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <TextField className="w-full">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Zalo ID
                      </Label>
                      <Input
                        type="text"
                        placeholder="Zalo..."
                        value={formData.zaloId || ""}
                        onChange={(e) => setFormData({ ...formData, zaloId: e.target.value })}
                        className="w-full p-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-900 dark:text-white"
                      />
                    </TextField>

                    <TextField className="w-full">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        KakaoTalk ID
                      </Label>
                      <Input
                        type="text"
                        placeholder="KakaoTalk..."
                        value={formData.kakaoTalkId || ""}
                        onChange={(e) => setFormData({ ...formData, kakaoTalkId: e.target.value })}
                        className="w-full p-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-900 dark:text-white"
                      />
                    </TextField>

                    <TextField className="w-full">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        WhatsApp
                      </Label>
                      <Input
                        type="text"
                        placeholder="WhatsApp..."
                        value={formData.whatsapp || ""}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        className="w-full p-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-900 dark:text-white"
                      />
                    </TextField>
                  </div>
                </div>

                {/* 2. Operations & Dispatch */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Car size={13} />
                    <span>{tb.dispatch}</span>
                  </h4>

                  <div className="w-full">
                    <Select
                      isRequired
                      fullWidth
                      name="bookingStatus"
                      selectedKey={formData.bookingStatus || "pending"}
                      onSelectionChange={(key) => {
                        if (key) {
                          setFormData({ ...formData, bookingStatus: key as BookingStatus });
                        }
                      }}
                    >
                      <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {tb.bookingStatus}
                      </Label>
                      <Select.Trigger className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold flex items-center justify-between cursor-pointer">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                        <ListBox>
                          <ListBox.Item id="pending" textValue={t.status?.pending || "Chờ xử lý"} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-900 dark:text-white flex items-center justify-between">
                            {t.status?.pending || "Chờ xử lý"}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          <ListBox.Item id="confirmed" textValue={t.status?.confirmed || "Đã xác nhận"} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-900 dark:text-white flex items-center justify-between">
                            {t.status?.confirmed || "Đã xác nhận"}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          <ListBox.Item id="completed" textValue={t.status?.completed || "Đã hoàn thành"} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-900 dark:text-white flex items-center justify-between">
                            {t.status?.completed || "Đã hoàn thành"}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          <ListBox.Item id="cancelled" textValue={t.status?.cancelled || "Đã hủy"} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-900 dark:text-white flex items-center justify-between">
                            {t.status?.cancelled || "Đã hủy"}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TextField className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {tb.assignedDriver}
                      </Label>
                      <Input
                        type="text"
                        placeholder={tb.driverPlaceholder}
                        value={formData.assignedDriver || ""}
                        onChange={(e) => setFormData({ ...formData, assignedDriver: e.target.value })}
                        className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-900 dark:text-white"
                      />
                    </TextField>

                    <TextField className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {tb.assignedVehicle}
                      </Label>
                      <Input
                        type="text"
                        list="fleet-vehicles-list"
                        placeholder={tb.vehiclePlaceholder}
                        value={formData.assignedVehicle || ""}
                        onChange={(e) => setFormData({ ...formData, assignedVehicle: e.target.value })}
                        className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-900 dark:text-white"
                      />
                      <datalist id="fleet-vehicles-list">
                        {fleetVehicles.map((fv) => (
                          <option
                            key={fv.id}
                            value={fv.licensePlate ? `${fv.licensePlate} (${fv.brand} ${fv.model})` : `${fv.brand} ${fv.model}`}
                          />
                        ))}
                      </datalist>
                    </TextField>
                  </div>
                </div>

                {/* 3. Payment & Financial Tracking (4 Attributes) */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard size={13} />
                    <span>{tb.financialSummary}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Select
                        fullWidth
                        name="paymentStatus"
                        selectedKey={formData.paymentStatus || "UNPAID"}
                        onSelectionChange={(key) => {
                          if (key) setFormData({ ...formData, paymentStatus: key as string });
                        }}
                      >
                        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          {tb.paymentStatus}
                        </Label>
                        <Select.Trigger className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-xs font-bold flex items-center justify-between cursor-pointer">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                          <ListBox>
                            <ListBox.Item id="UNPAID" textValue={tb.unpaid} className="px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-900 dark:text-white">
                              {tb.unpaid}
                            </ListBox.Item>
                            <ListBox.Item id="DEPOSITED" textValue={tb.deposited} className="px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-900 dark:text-white">
                              {tb.deposited}
                            </ListBox.Item>
                            <ListBox.Item id="PAID" textValue={tb.paid} className="px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-900 dark:text-white">
                              {tb.paid}
                            </ListBox.Item>
                            <ListBox.Item id="REFUNDED" textValue={tb.refunded} className="px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-900 dark:text-white">
                              {tb.refunded}
                            </ListBox.Item>
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>

                    <div>
                      <Select
                        fullWidth
                        name="paymentMethod"
                        selectedKey={formData.paymentMethod || "CASH"}
                        onSelectionChange={(key) => {
                          if (key) setFormData({ ...formData, paymentMethod: key as string });
                        }}
                      >
                        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          {tb.paymentMethod}
                        </Label>
                        <Select.Trigger className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-xs font-bold flex items-center justify-between cursor-pointer">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                          <ListBox>
                            <ListBox.Item id="CASH" textValue={tb.cash} className="px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-900 dark:text-white">
                              {tb.cash}
                            </ListBox.Item>
                            <ListBox.Item id="BANK_TRANSFER" textValue={tb.bankTransfer} className="px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-900 dark:text-white">
                              {tb.bankTransfer}
                            </ListBox.Item>
                            <ListBox.Item id="CREDIT_CARD" textValue={tb.creditCard} className="px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-900 dark:text-white">
                              {tb.creditCard}
                            </ListBox.Item>
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>
                  </div>

                  {/* 4 Financial Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {tb.totalAmount} (VND)
                      </Label>
                      <NumberField
                        minValue={0}
                        value={formData.totalAmount || 0}
                        onChange={(val) => setFormData({ ...formData, totalAmount: val ?? 0 })}
                        formatOptions={{ style: "currency", currency: "VND" }}
                        isRequired
                        fullWidth
                      >
                        <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] text-slate-900 dark:text-white overflow-hidden focus-within:ring-2 focus-within:ring-primary h-10">
                          <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-xs outline-none border-none h-full font-bold text-primary" />
                        </NumberField.Group>
                      </NumberField>
                    </div>

                    <div>
                      <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {tb.depositAmount} (VND)
                      </Label>
                      <NumberField
                        minValue={0}
                        value={formData.depositAmount || 0}
                        onChange={handleDepositChange}
                        formatOptions={{ style: "currency", currency: "VND" }}
                        fullWidth
                      >
                        <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] text-slate-900 dark:text-white overflow-hidden focus-within:ring-2 focus-within:ring-primary h-10">
                          <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-xs outline-none border-none h-full font-bold text-amber-600 dark:text-amber-400" />
                        </NumberField.Group>
                      </NumberField>
                    </div>

                    <div>
                      <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {tb.receivedAmount} (VND)
                      </Label>
                      <NumberField
                        minValue={0}
                        value={formData.receivedAmount || 0}
                        onChange={handleReceivedChange}
                        formatOptions={{ style: "currency", currency: "VND" }}
                        fullWidth
                      >
                        <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] text-slate-900 dark:text-white overflow-hidden focus-within:ring-2 focus-within:ring-primary h-10">
                          <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-xs outline-none border-none h-full font-bold text-emerald-600 dark:text-emerald-400" />
                        </NumberField.Group>
                      </NumberField>
                    </div>
                  </div>

                  {/* Computed Remaining Balance Card */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator size={16} className="text-slate-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{tb.remainingAmount}:</span>
                    </div>
                    <span className={`text-sm font-black ${currentRemaining > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(currentRemaining)}
                    </span>
                  </div>
                </div>

                {/* 4. Notes */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <TextField className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {tb.customerNotes}
                    </Label>
                    <textarea
                      rows={2}
                      value={formData.customerNotes || ""}
                      onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
                      className="w-full p-2.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                    />
                  </TextField>

                  <TextField className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <ShieldAlert size={12} />
                      {tb.internalNotes}
                    </Label>
                    <textarea
                      rows={2}
                      placeholder={tb.internalNotesPlaceholder}
                      value={formData.internalNotes || ""}
                      onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                      className="w-full p-2.5 rounded-xl text-xs font-medium border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-[var(--bg-card)] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </TextField>
                </div>
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 justify-end gap-2 shrink-0 bg-slate-50 dark:bg-[var(--bg-card)]">
                <Button
                  className="rounded-xl font-bold bg-slate-200 dark:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 cursor-pointer"
                  onClick={onClose}
                  isDisabled={loading}
                >
                  {tb.cancel}
                </Button>
                <Button
                  type="submit"
                  isDisabled={loading}
                  className="bg-primary text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5 px-5 shadow-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      {tb.saveChanges}...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      {tb.saveChanges}
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
