"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Input,
  Label,
  Select,
  ListBox,
  TextField,
  toast,
} from "@heroui/react";
import { Car, AlertTriangle, Check, X } from "lucide-react";
import type { RentalDto, RentalPriceDto } from "@/lib/api/rental";
import type { VehicleCategoryDto } from "@/lib/api/fleet";
import { useI18n } from "@/context/LanguageContext";
import { formatPriceSync } from "@/lib/format";

interface SelfDriveFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRental: (RentalDto & { prices?: RentalPriceDto[] }) | null;
  categories: VehicleCategoryDto[];
  existingRentals?: (RentalDto & { prices?: RentalPriceDto[] })[];
  onSave: (payload: Partial<RentalDto>, priceAmount?: number) => Promise<void>;
}

export function SelfDriveFormModal({
  isOpen,
  onClose,
  editingRental,
  categories,
  existingRentals = [],
  onSave,
}: SelfDriveFormModalProps) {
  const { language } = useI18n();
  const [vehicleCategoryId, setVehicleCategoryId] = useState("");
  const [dailyPrice, setDailyPrice] = useState<number>(1000000);
  const [depositPercent, setDepositPercent] = useState<number>(30);
  const [deposit, setDeposit] = useState<number>(300000);
  const [minimumDays, setMinimumDays] = useState<number>(1);
  const [active, setActive] = useState<boolean>(true);
  const [driverRequired, setDriverRequired] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (editingRental) {
      setVehicleCategoryId(String(editingRental.vehicleCategoryId));
      const curDeposit = Number(editingRental.deposit) || 0;
      setDeposit(curDeposit);
      setMinimumDays(editingRental.minimumDays || 1);
      setActive(editingRental.active);
      setDriverRequired(editingRental.driverRequired || false);

      const activePrice = editingRental.prices?.find((p) => p.active) || editingRental.prices?.[0];
      const curPrice = activePrice ? Number(activePrice.amount) : 1000000;
      setDailyPrice(curPrice);

      if (curPrice > 0 && curDeposit > 0) {
        const pct = Math.round((curDeposit / curPrice) * 100);
        setDepositPercent(pct);
      } else {
        setDepositPercent(30);
      }
    } else {
      setVehicleCategoryId(categories[0] ? String(categories[0].id) : "");
      setDailyPrice(1000000);
      setDepositPercent(30);
      setDeposit(300000);
      setMinimumDays(1);
      setActive(true);
      setDriverRequired(false);
    }
  }, [editingRental, categories, isOpen]);

  // When dailyPrice or depositPercent changes, recalculate deposit amount
  const handleDailyPriceChange = (val: number) => {
    setDailyPrice(val);
    if (depositPercent > 0) {
      const calc = Math.round((val * depositPercent) / 100);
      setDeposit(calc);
    }
  };

  const handleDepositPercentChange = (pct: number) => {
    setDepositPercent(pct);
    if (dailyPrice > 0) {
      const calc = Math.round((dailyPrice * pct) / 100);
      setDeposit(calc);
    }
  };

  const handleDepositAmountChange = (val: number) => {
    setDeposit(val);
    if (dailyPrice > 0) {
      const pct = Math.round((val / dailyPrice) * 100);
      setDepositPercent(pct);
    }
  };

  const getCategoryName = (cat: VehicleCategoryDto) => {
    const trans =
      cat.translations?.find((t) => t.locale === language) ||
      cat.translations?.find((t) => t.locale === "vi") ||
      cat.translations?.[0];
    return trans?.name || cat.code || `Phân khúc #${cat.id}`;
  };

  // Detect conflict with other active rental configurations for the same vehicle category
  const conflictingActiveRental = useMemo(() => {
    if (!vehicleCategoryId || !existingRentals.length) return null;
    const catId = Number(vehicleCategoryId);
    return (
      existingRentals.find(
        (r) =>
          r.vehicleCategoryId === catId &&
          r.active &&
          (!editingRental || r.id !== editingRental.id)
      ) || null
    );
  }, [vehicleCategoryId, existingRentals, editingRental]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleCategoryId) {
      toast.danger("Vui lòng chọn phân khúc xe");
      return;
    }

    if (dailyPrice <= 0) {
      toast.danger("Vui lòng nhập giá thuê theo ngày hợp lệ");
      return;
    }

    setSubmitting(true);
    try {
      await onSave(
        {
          vehicleCategoryId: Number(vehicleCategoryId),
          deposit: Number(deposit) || 0,
          minimumDays: Number(minimumDays) || 1,
          active,
          driverRequired,
        },
        Number(dailyPrice)
      );
      onClose();
    } catch {
      toast.danger("Không thể lưu cấu hình xe. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                  <Car size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {editingRental ? "Cập nhật cấu hình xe tự lái" : "Thêm mới cấu hình xe tự lái"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Thiết lập phân khúc xe, giá thuê/ngày, % đặt cọc và trạng thái hoạt động
                  </p>
                </div>
              </div>
            </ModalHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="flex-1 overflow-y-auto max-h-[60vh] p-6 space-y-4">
                {/* Category Select */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider block text-slate-600 dark:text-slate-400">
                    Phân khúc xe
                  </Label>
                  <Select
                    selectedKey={vehicleCategoryId}
                    onSelectionChange={(key) => {
                      if (key) setVehicleCategoryId(key as string);
                    }}
                    className="w-full"
                  >
                    <Select.Trigger className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[var(--bg-surface)] text-xs font-bold flex items-center justify-between cursor-pointer">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl z-50 w-[var(--trigger-width)]">
                      <ListBox className="max-h-56 overflow-y-auto">
                        {categories.map((c) => (
                          <ListBox.Item
                            id={String(c.id)}
                            key={c.id}
                            textValue={getCategoryName(c)}
                            className="text-xs font-semibold px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] rounded-lg cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{getCategoryName(c)}</span>
                              <span className="text-[11px] text-slate-400 font-normal">
                                ({c.minSeat}-{c.maxSeat} chỗ, {c.minLuggage}-{c.maxLuggage} vali)
                              </span>
                            </div>
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                {/* Price & Minimum Days */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Daily Price */}
                  <TextField isRequired className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider block mb-1 text-slate-600 dark:text-slate-400">
                      Giá thuê theo ngày (VND / ngày)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step={50000}
                      value={String(dailyPrice)}
                      onChange={(e) => handleDailyPriceChange(Number(e.target.value) || 0)}
                      placeholder="VD: 1000000"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[var(--bg-surface)] text-xs font-semibold outline-none focus:border-accent"
                    />
                    <span className="text-[11px] font-bold text-accent mt-1 block">
                      {formatPriceSync(dailyPrice, "vi")} / ngày
                    </span>
                  </TextField>

                  {/* Minimum Days */}
                  <TextField isRequired className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider block mb-1 text-slate-600 dark:text-slate-400">
                      Số ngày thuê tối thiểu
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={String(minimumDays)}
                      onChange={(e) => setMinimumDays(Number(e.target.value) || 1)}
                      placeholder="VD: 1"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[var(--bg-surface)] text-xs font-semibold outline-none focus:border-accent"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Tối thiểu {minimumDays} ngày
                    </span>
                  </TextField>
                </div>

                {/* Deposit Percent & Deposit Amount calculation */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Thiết lập tiền cọc xe
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Tự động tính từ % giá thuê
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    {/* Deposit Percentage */}
                    <div>
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        % Đặt cọc
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={String(depositPercent)}
                          onChange={(e) => handleDepositPercentChange(Number(e.target.value) || 0)}
                          className="w-20 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] text-xs font-bold text-center"
                        />
                        <div className="flex items-center gap-1">
                          {[20, 30, 50, 100].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => handleDepositPercentChange(pct)}
                              className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                                depositPercent === pct
                                  ? "bg-accent text-white border-accent shadow-xs"
                                  : "bg-white dark:bg-[var(--bg-surface)] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-accent"
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Calculated Deposit Amount */}
                    <TextField isRequired className="w-full">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Tiền đặt cọc (VND)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step={100000}
                        value={String(deposit)}
                        onChange={(e) => handleDepositAmountChange(Number(e.target.value) || 0)}
                        placeholder="VD: 300000"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] text-xs font-bold text-amber-600 dark:text-amber-400 outline-none"
                      />
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                        = {formatPriceSync(deposit, "vi")} ({depositPercent}%)
                      </span>
                    </TextField>
                  </div>
                </div>

                {/* Interactive Active Button Selector */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Trạng thái kích hoạt (Active Status)
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Chọn trạng thái áp dụng giá cho phân khúc xe này
                      </span>
                    </div>
                  </div>

                  {/* Segmented Button Group */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActive(true)}
                      className={`flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        active
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                          : "bg-white dark:bg-[var(--bg-surface)] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600"
                      }`}
                    >
                      <Check size={16} />
                      <span>Kích hoạt (Active)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActive(false)}
                      className={`flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        !active
                          ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20"
                          : "bg-white dark:bg-[var(--bg-surface)] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-500 hover:text-rose-600"
                      }`}
                    >
                      <X size={16} />
                      <span>Tạm ngưng (Inactive)</span>
                    </button>
                  </div>
                </div>

                {/* Warning Alert if another rental for this category is currently active */}
                {conflictingActiveRental && active && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-start gap-2.5 text-xs">
                    <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold">
                        Cảnh báo: Phân khúc xe này đang có cấu hình khác đang hoạt động (ID #{conflictingActiveRental.id})
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300">
                        Nếu bạn chọn <strong>Kích hoạt</strong> cho cấu hình này, cấu hình #{conflictingActiveRental.id} sẽ tự động bị hủy kích hoạt (deactivate) khi lưu.
                      </p>
                    </div>
                  </div>
                )}
              </ModalBody>

              {/* Fixed Pinned Modal Footer */}
              <ModalFooter className="shrink-0 px-6 py-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)]">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  isDisabled={submitting}
                  className="rounded-xl text-xs font-bold px-4 h-11 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isDisabled={submitting}
                  className="rounded-xl text-xs font-black px-6 h-11 bg-accent text-white hover:bg-accent-hover shadow-md cursor-pointer border-none"
                >
                  {submitting ? "Đang lưu..." : editingRental ? "Lưu thay đổi" : "Tạo cấu hình mới"}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
