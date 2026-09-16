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
  FieldError,
  toast,
  Switch,
} from "@heroui/react";
import { Car, AlertTriangle, Check, X, Save, RefreshCw, Sparkles } from "lucide-react";
import type { RentalDto, RentalPriceDto } from "@/lib/api/selfDrive";
import type { VehicleCategoryDto } from "@/lib/api/fleet";
import { useI18n } from "@/context/LanguageContext";
import { formatPriceSync } from "@/lib/format";

interface SelfDriveCreateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRental: (RentalDto & { prices?: RentalPriceDto[] }) | null;
  categories: VehicleCategoryDto[];
  existingRentals?: (RentalDto & { prices?: RentalPriceDto[] })[];
  onSave: (payload: Partial<RentalDto>, priceAmount?: number) => Promise<void>;
}

export function SelfDriveCreateUpdateModal({
  isOpen,
  onClose,
  editingRental,
  categories,
  existingRentals = [],
  onSave,
}: SelfDriveCreateUpdateModalProps) {
  const { language } = useI18n();
  const [vehicleCategoryId, setVehicleCategoryId] = useState("");
  const [dailyPrice, setDailyPrice] = useState<number>(1000000);
  const [depositType, setDepositType] = useState<"FIXED" | "PERCENT">("FIXED");
  const [depositPercent, setDepositPercent] = useState<number>(30);
  const [deposit, setDeposit] = useState<number>(300000);
  const [minimumDays, setMinimumDays] = useState<number>(1);
  const [active, setActive] = useState<boolean>(true);
  const [driverRequired, setDriverRequired] = useState<boolean>(false);
  const [isContactOnly, setIsContactOnly] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (editingRental) {
      setVehicleCategoryId(String(editingRental.vehicleCategoryId));
      const curDeposit = Number(editingRental.deposit) || 0;
      setDeposit(curDeposit);
      setDepositType(editingRental.depositType || (editingRental.depositRate ? "PERCENT" : "FIXED"));
      if (editingRental.depositRate) {
        setDepositPercent(Number(editingRental.depositRate));
      }
      setMinimumDays(editingRental.minimumDays || 1);
      setActive(editingRental.active);
      setDriverRequired(editingRental.driverRequired || false);
      setIsContactOnly(editingRental.isContactOnly || false);

      const activePrice = editingRental.prices?.find((p) => p.active) || editingRental.prices?.[0];
      const curPrice = activePrice ? Number(activePrice.amount) : 1000000;
      setDailyPrice(curPrice);

      if (!editingRental.depositRate && curPrice > 0 && curDeposit > 0) {
        const pct = Math.round((curDeposit / curPrice) * 100);
        setDepositPercent(pct);
      }
    } else {
      setVehicleCategoryId(categories[0] ? String(categories[0].id) : "");
      setDailyPrice(1000000);
      setDepositType("FIXED");
      setDepositPercent(30);
      setDeposit(300000);
      setMinimumDays(1);
      setActive(true);
      setDriverRequired(false);
      setIsContactOnly(false);
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

    if (!isContactOnly && dailyPrice <= 0) {
      toast.danger("Vui lòng nhập giá thuê theo ngày hợp lệ");
      return;
    }

    if (!isContactOnly && deposit < 0) {
      toast.danger("Tiền đặt cọc không được nhỏ hơn 0");
      return;
    }

    setSubmitting(true);
    try {
      await onSave(
        {
          vehicleCategoryId: Number(vehicleCategoryId),
          deposit: isContactOnly ? 0 : (Number(deposit) || 0),
          depositType,
          depositRate: (!isContactOnly && depositType === "PERCENT") ? Number(depositPercent) : undefined,
          minimumDays: Number(minimumDays) || 1,
          active,
          driverRequired,
          isContactOnly,
        },
        isContactOnly ? 0 : Number(dailyPrice)
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
          <ModalDialog className="max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-border-secondary overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="shrink-0 px-6 py-4 border-b border-separator flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                  <Car size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {editingRental ? "Cập nhật cấu hình xe tự lái" : "Thêm mới cấu hình xe tự lái"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Thiết lập phân khúc xe, giá thuê/ngày, hình thức đặt cọc và trạng thái hoạt động
                  </p>
                </div>
              </div>
            </ModalHeader>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="flex-1 overflow-y-auto max-h-[60vh] p-6 space-y-4">
                {/* Category Select */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider block">
                    Phân khúc xe
                  </Label>
                  <Select
                    selectedKey={vehicleCategoryId}
                    onSelectionChange={(key) => {
                      if (key) setVehicleCategoryId(key as string);
                    }}
                    className="w-full"
                  >
                    <Select.Trigger className="w-full h-11 px-3.5 rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-xs font-bold flex items-center justify-between cursor-pointer">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-border-secondary rounded-xl p-1 shadow-xl z-50 w-[var(--trigger-width)]">
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

                {/* Contact Only Switch */}
                <div
                  onClick={() => setIsContactOnly(!isContactOnly)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
                    isContactOnly
                      ? "bg-amber-500/5 border-amber-500/30 dark:bg-amber-950/20 dark:border-amber-500/30"
                      : "bg-slate-50 dark:bg-[var(--bg-card)] border-separator hover:bg-slate-100/70 dark:hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Liên hệ báo giá chính xác
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        isContactOnly
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          : "bg-slate-200 dark:bg-[var(--bg-elevated)] text-slate-500 border-transparent"
                      }`}>
                        {isContactOnly ? "Báo giá riêng" : "Tùy chọn"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      Bật tùy chọn này nếu phân khúc xe cần liên hệ để thỏa thuận giá (không bắt buộc nhập giá thuê & tiền cọc).
                    </span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                      isSelected={isContactOnly}
                      onChange={setIsContactOnly}
                      aria-label="Liên hệ để được báo giá chính xác"
                    >
                      <Switch.Content className="cursor-pointer">
                        <Switch.Control className="border border-slate-300 dark:border-slate-700">
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Content>
                    </Switch>
                  </div>
                </div>

                {isContactOnly ? (
                  <>
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                      <Sparkles size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <p className="font-bold">Chế độ liên hệ để báo giá đang bật</p>
                        <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                          Phân khúc xe này sẽ hiển thị nhãn <strong>Liên hệ báo giá</strong> cho khách hàng. Bạn không bắt buộc phải nhập đơn giá theo ngày và quy định đặt cọc.
                        </p>
                      </div>
                    </div>

                    {/* Minimum Days still editable in contact mode */}
                    <TextField isRequired className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider block mb-1">
                        Số ngày thuê tối thiểu
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={String(minimumDays)}
                        onChange={(e) => setMinimumDays(Number(e.target.value) || 1)}
                        placeholder="VD: 1"
                        className="w-full h-11 px-3.5 rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-xs font-semibold outline-none focus:border-accent"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Tối thiểu {minimumDays} ngày
                      </span>
                    </TextField>
                  </>
                ) : (
                  <>
                    {/* Price & Minimum Days */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Daily Price */}
                      <TextField isRequired className="w-full">
                        <Label className="text-xs font-bold uppercase tracking-wider block mb-1">
                          Giá thuê theo ngày (VND / ngày)
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={String(dailyPrice)}
                          onChange={(e) => handleDailyPriceChange(Number(e.target.value) || 0)}
                          placeholder="VD: 1000000"
                          className="w-full h-11 px-3.5 rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-xs font-semibold outline-none focus:border-accent"
                        />
                        <FieldError className="text-xs text-red-500 mt-1" />
                        <span className="text-[11px] font-bold text-accent mt-1 block">
                          {formatPriceSync(dailyPrice, "vi")} / ngày
                        </span>
                      </TextField>

                      {/* Minimum Days */}
                      <TextField isRequired className="w-full">
                        <Label className="text-xs font-bold uppercase tracking-wider block mb-1">
                          Số ngày thuê tối thiểu
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={String(minimumDays)}
                          onChange={(e) => setMinimumDays(Number(e.target.value) || 1)}
                          placeholder="VD: 1"
                          className="w-full h-11 px-3.5 rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-xs font-semibold outline-none focus:border-accent"
                        />
                        <FieldError className="text-xs text-red-500 mt-1" />
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          Tối thiểu {minimumDays} ngày
                        </span>
                      </TextField>
                    </div>

                    {/* Deposit Engine Configuration */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                            Quy định đặt cọc thuê xe
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Đặt cọc tính từ tổng giá trị đơn hàng thuê xe
                          </span>
                        </div>

                        {/* Toggle PERCENT vs FIXED */}
                        <div className="flex items-center bg-white dark:bg-[var(--bg-surface)] p-1 rounded-xl border border-separator">
                          <button
                            type="button"
                            onClick={() => setDepositType("PERCENT")}
                            className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                              depositType === "PERCENT"
                                ? "bg-accent text-accent-foreground shadow-xs"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            % Tổng tiền
                          </button>
                          <button
                            type="button"
                            onClick={() => setDepositType("FIXED")}
                            className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                              depositType === "FIXED"
                                ? "bg-accent text-accent-foreground shadow-xs"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            Cố định (VND)
                          </button>
                        </div>
                      </div>

                      {depositType === "PERCENT" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-1">
                          <div>
                            <Label className="text-xs font-bold block mb-1">
                              % Đặt cọc (Tính trên tổng giá đơn hàng)
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={String(depositPercent)}
                                onChange={(e) => handleDepositPercentChange(Number(e.target.value) || 0)}
                                className="w-20 h-10 px-3 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-xs font-bold text-center"
                              />
                              <div className="flex items-center gap-1">
                                {[20, 30, 50, 100].map((pct) => (
                                  <button
                                    key={pct}
                                    type="button"
                                    onClick={() => handleDepositPercentChange(pct)}
                                    className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                                      depositPercent === pct
                                        ? "bg-accent text-accent-foreground border-accent shadow-xs"
                                        : "bg-white dark:bg-[var(--bg-surface)] border-border text-slate-600 dark:text-slate-300 hover:border-accent"
                                    }`}
                                  >
                                    {pct}%
                                  </button>
                                ))}
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">
                              Khách hàng sẽ thanh toán trước {depositPercent}% tổng giá trị thuê xe
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-separator">
                            <span className="text-[11px] text-slate-400 block font-medium">Ước tính cọc cho 1 ngày:</span>
                            <span className="text-sm font-black text-accent mt-0.5 block">
                              {formatPriceSync(Math.round((dailyPrice * depositPercent) / 100), "vi")}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              (Đơn giá 1 ngày: {formatPriceSync(dailyPrice, "vi")})
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1">
                          <TextField isRequired className="w-full max-w-sm">
                            <Label className="text-xs font-bold block mb-1">
                              Số tiền đặt cọc cố định (VND / xe)
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              step="any"
                              value={String(deposit)}
                              onChange={(e) => handleDepositAmountChange(Number(e.target.value) || 0)}
                              placeholder="VD: 5000000"
                              className="w-full h-10 px-3 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-xs font-bold text-accent outline-none"
                            />
                            <FieldError className="text-xs text-red-500 mt-1" />
                            <span className="text-[11px] font-bold text-accent mt-1 block">
                              = {formatPriceSync(deposit, "vi")}
                            </span>
                          </TextField>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Interactive Active Button Selector */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator space-y-2.5">
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
                      className={`flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-bold text-xs border transition-all cursor-pointer ${active
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                        : "bg-white dark:bg-[var(--bg-surface)] border-border text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600"
                        }`}
                    >
                      <Check size={16} />
                      <span>Kích hoạt (Active)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActive(false)}
                      className={`flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-bold text-xs border transition-all cursor-pointer ${!active
                        ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20"
                        : "bg-white dark:bg-[var(--bg-surface)] border-border text-slate-600 dark:text-slate-300 hover:border-rose-500 hover:text-rose-600"
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
              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  isDisabled={submitting}
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isDisabled={submitting}
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                >
                  {submitting ? (
                    <RefreshCw size={15} className="animate-spin mr-1.5" />
                  ) : (
                    <Save size={15} className="mr-1.5" />
                  )}
                  {editingRental ? "Lưu" : "Tạo cấu hình mới"}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
