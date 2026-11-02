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
  Checkbox,
  Label,
  Select,
  ListBox,
  NumberField,
} from "@heroui/react";
import { Save, RefreshCw, Info, ShieldCheck, DollarSign } from "lucide-react";

import {
  createAirportTransfer,
  updateAirportTransfer,
  type AirportTransferPrice,
  type AirportRouteDto,
  type VehicleCategoryDto,
} from "@/lib/api/fleet";
import { calcAirportPrice } from "@/lib/pricing";
import type { DepositType } from "@/types/deposit";
import { ActivePromotionBadge } from "@/components/admin/discount";

interface AirportTransferCreateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer?: AirportTransferPrice | null;
  routes: AirportRouteDto[];
  categories: VehicleCategoryDto[];
  onSaveSuccess: () => void | Promise<void>;
  showToast: (msg: string, type: "success" | "error") => void;
  defaultRouteDeposit?: {
    depositType?: DepositType;
    depositRate?: number;
    depositAmount?: number;
  };
}

export function AirportTransferCreateUpdateModal({
  isOpen,
  onClose,
  transfer,
  routes,
  categories,
  onSaveSuccess,
  showToast,
  defaultRouteDeposit,
}: AirportTransferCreateUpdateModalProps) {
  const [loading, setLoading] = useState(false);

  const [airportRouteId, setAirportRouteId] = useState<number>(0);
  const [vehicleCategoryId, setVehicleCategoryId] = useState<number>(0);
  const [baseKm, setBaseKm] = useState<number>(35);
  const [zoneBufferKm, setZoneBufferKm] = useState<number>(2.0);
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [perKmAmount, setPerKmAmount] = useState<number>(0);
  const [fixedOvercharge, setFixedOvercharge] = useState<boolean>(false);
  const [feeOverchargeFixed, setFeeOverchargeFixed] = useState<number>(100000);
  const [currency, setCurrency] = useState("VND");
  const [active, setActive] = useState(true);

  // Deposit override configuration
  const [isCustomDeposit, setIsCustomDeposit] = useState<boolean>(false);
  const [customDepositType, setCustomDepositType] = useState<DepositType>("PERCENT");
  const [customDepositRate, setCustomDepositRate] = useState<number>(0);
  const [customDepositAmount, setCustomDepositAmount] = useState<string>("");

  const currentRoute = routes.find((r) => r.id === airportRouteId);
  const routeDepositType: DepositType | undefined = (defaultRouteDeposit?.depositType || currentRoute?.depositType) as DepositType | undefined;
  const routeDepositRate: number | undefined = defaultRouteDeposit?.depositRate ?? currentRoute?.depositRate;
  const routeDepositAmount: number | undefined = defaultRouteDeposit?.depositAmount ?? currentRoute?.depositAmount;

  const effectiveDepositType = isCustomDeposit ? customDepositType : routeDepositType;
  const effectiveDepositRate = isCustomDeposit ? customDepositRate : routeDepositRate;
  const effectiveDepositAmount = isCustomDeposit ? (customDepositAmount ? Number(customDepositAmount) : undefined) : routeDepositAmount;

  useEffect(() => {
    if (isOpen) {
      if (transfer) {
        setAirportRouteId(transfer.airportRouteId);
        setVehicleCategoryId(transfer.vehicleCategoryId);
        setBaseKm(transfer.baseKm ?? 35);
        setZoneBufferKm(transfer.zoneBufferKm ?? 2.0);
        setBaseAmount(transfer.baseAmount ?? 0);
        setPerKmAmount(transfer.perKmAmount ?? 0);
        setFixedOvercharge(transfer.fixedOvercharge ?? false);
        setFeeOverchargeFixed(transfer.feeOverchargeFixed ?? 100000);
        setCurrency(transfer.currency || "VND");
        setActive(transfer.active);
        const hasCustom = Boolean(transfer.depositType);
        setIsCustomDeposit(hasCustom);
        setCustomDepositType((transfer.depositType as DepositType) || "PERCENT");
        setCustomDepositRate(transfer.depositRate != null ? Number(transfer.depositRate) : 0);
        setCustomDepositAmount(transfer.depositAmount != null ? String(transfer.depositAmount) : "");
      } else {
        setAirportRouteId(routes[0]?.id || 0);
        setVehicleCategoryId(categories[0]?.id || 0);
        setBaseKm(35);
        setZoneBufferKm(2.0);
        setBaseAmount(0);
        setPerKmAmount(0);
        setFixedOvercharge(false);
        setFeeOverchargeFixed(100000);
        setCurrency("VND");
        setActive(true);
        setIsCustomDeposit(false);
        setCustomDepositType("PERCENT");
        setCustomDepositRate(0);
        setCustomDepositAmount("");
      }
    }
  }, [isOpen, transfer, routes, categories]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!airportRouteId || !vehicleCategoryId) {
      showToast("Vui lòng chọn đầy đủ tuyến đường và loại xe!", "error");
      return;
    }

    const payload: AirportTransferPrice = {
      airportRouteId,
      vehicleCategoryId,
      baseKm,
      zoneBufferKm,
      baseAmount,
      perKmAmount,
      fixedOvercharge,
      feeOverchargeFixed: fixedOvercharge ? feeOverchargeFixed : undefined,
      currency,
      active,
      depositType: isCustomDeposit ? customDepositType : null,
      depositRate: isCustomDeposit && customDepositType === "PERCENT" ? Number(customDepositRate) : null,
      depositAmount: isCustomDeposit && customDepositType === "FIXED" && customDepositAmount ? Number(customDepositAmount) : null,
    };

    setLoading(true);
    try {
      if (transfer?.id) {
        await updateAirportTransfer(transfer.id, payload);
      } else {
        await createAirportTransfer(payload);
      }

      showToast("Lưu cấu hình giá thành công!", "success");
      await onSaveSuccess?.();
      onClose();
    } catch {
      showToast("Lưu cấu hình thất bại!", "error");
    } finally {
      setLoading(false);
    }
  };

  const maxZoneKm = baseKm + zoneBufferKm;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-border-secondary overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-separator flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                    {transfer?.id ? "Chỉnh Sửa Cấu Hình Giá Sân Bay" : "Thêm Cấu Hình Giá Sân Bay Mới"}
                  </h3>
                  <p className="text-xs text-foreground/60">
                    Cấu hình cước theo km cơ bản, vùng đệm zone và chính sách cọc
                  </p>
                </div>
              </div>
            </ModalHeader>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Select
                    isRequired
                    className="w-full"
                    name="airportRouteId"
                    value={airportRouteId ? String(airportRouteId) : undefined}
                    onChange={(key) => {
                      if (key) setAirportRouteId(Number(key));
                    }}
                  >
                    <Label className="block text-xs font-bold mb-1 text-foreground">
                      Tuyến Đường
                    </Label>
                    <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-foreground text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-border-secondary rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                      <ListBox>
                        {routes.map((r) => (
                          <ListBox.Item
                            key={r.id}
                            id={String(r.id)}
                            textValue={r.code}
                            className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-foreground flex items-center justify-between"
                          >
                            {r.code}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                  {airportRouteId > 0 && (
                    <ActivePromotionBadge scopeType="AIRPORT_TRANSFER" scopeRefId={airportRouteId} className="mt-1" />
                  )}
                </div>

                <div>
                  <Select
                    isRequired
                    className="w-full"
                    name="vehicleCategoryId"
                    value={vehicleCategoryId ? String(vehicleCategoryId) : undefined}
                    onChange={(key) => {
                      if (key) setVehicleCategoryId(Number(key));
                    }}
                  >
                    <Label className="block text-xs font-bold mb-1 text-foreground">
                      Loại Xe
                    </Label>
                    <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-foreground text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-border-secondary rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                      <ListBox>
                        {categories.map((c) => {
                          const tr = c.translations?.find((t) => t.locale === "vi") || c.translations?.[0];
                          const catName = tr?.name || c.code;
                          return (
                            <ListBox.Item
                              key={c.id}
                              id={String(c.id)}
                              textValue={catName}
                              className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-foreground flex items-center justify-between"
                            >
                              <span>{catName}</span>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          );
                        })}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <NumberField
                    isRequired
                    value={baseKm}
                    onChange={(val) => setBaseKm(val || 0)}
                    minValue={1}
                    className="w-full"
                  >
                    <Label className="block text-xs font-bold mb-1 text-foreground">
                      Km Cơ Bản
                    </Label>
                    <NumberField.Group className="w-full">
                      <NumberField.Input className="w-full px-3 py-2 rounded-xl border border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-foreground text-sm font-semibold h-[40px]" />
                    </NumberField.Group>
                  </NumberField>

                  <NumberField
                    isRequired
                    value={zoneBufferKm}
                    onChange={(val) => setZoneBufferKm(val ?? 0)}
                    minValue={0}
                    step={0.5}
                    className="w-full"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Label className="block text-xs font-bold text-foreground">
                        Vùng Đệm Zone (Km)
                      </Label>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Max {maxZoneKm.toFixed(1)} km
                      </span>
                    </div>
                    <NumberField.Group className="w-full">
                      <NumberField.Input className="w-full px-3 py-2 rounded-xl border border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-foreground text-sm font-semibold h-[40px]" />
                    </NumberField.Group>
                  </NumberField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <NumberField
                    isRequired
                    value={baseAmount}
                    onChange={(val) => setBaseAmount(val || 0)}
                    minValue={0}
                    step={10000}
                    className="w-full"
                  >
                    <Label className="block text-xs font-bold mb-1 text-foreground">
                      Giá Trong Km Cơ Bản ({currency})
                    </Label>
                    <NumberField.Group className="w-full">
                      <NumberField.Input className="w-full px-3 py-2 rounded-xl border border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-foreground text-sm font-semibold h-[40px]" />
                    </NumberField.Group>
                  </NumberField>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="block text-xs font-bold text-foreground">
                        {fixedOvercharge ? "Mức Phí Cố Định" : "Đơn Giá Km Thêm"}
                      </Label>
                      <div className="flex items-center gap-1.5">
                        <Checkbox
                          id="fixed-overcharge-chk"
                          isSelected={fixedOvercharge}
                          onChange={(val: boolean) => setFixedOvercharge(val)}
                        >
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Content>
                        </Checkbox>
                        <Label htmlFor="fixed-overcharge-chk" className="text-[11px] font-semibold cursor-pointer select-none text-foreground">
                          Phụ trội cố định
                        </Label>
                      </div>
                    </div>

                    {fixedOvercharge ? (
                      <NumberField
                        value={feeOverchargeFixed}
                        onChange={(val) => setFeeOverchargeFixed(val || 0)}
                        minValue={0}
                        step={10000}
                        className="w-full"
                      >
                        <NumberField.Group className="w-full">
                          <NumberField.Input className="w-full px-3 py-2 rounded-xl border border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-foreground text-sm font-semibold h-[40px]" />
                        </NumberField.Group>
                      </NumberField>
                    ) : (
                      <NumberField
                        value={perKmAmount}
                        onChange={(val) => setPerKmAmount(val || 0)}
                        minValue={0}
                        step={1000}
                        className="w-full"
                      >
                        <NumberField.Group className="w-full">
                          <NumberField.Input className="w-full px-3 py-2 rounded-xl border border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-foreground text-sm font-semibold h-[40px]" />
                        </NumberField.Group>
                      </NumberField>
                    )}
                  </div>
                </div>

                {/* Live Zone Preview in form */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-border space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Info size={14} className="text-accent" />
                    <span>Xem trước tính giá theo Vùng đệm Zone:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    {(() => {
                      const inBase = calcAirportPrice({ baseKm, zoneBufferKm, baseAmount, perKmAmount, fixedOvercharge, feeOverchargeFixed }, baseKm);
                      const inZone = calcAirportPrice({ baseKm, zoneBufferKm, baseAmount, perKmAmount, fixedOvercharge, feeOverchargeFixed }, baseKm + zoneBufferKm * 0.7);
                      const overZone = calcAirportPrice({ baseKm, zoneBufferKm, baseAmount, perKmAmount, fixedOvercharge, feeOverchargeFixed }, maxZoneKm + 4);
                      return (
                        <>
                          <div className="p-2 rounded-lg bg-white dark:bg-[var(--bg-surface)] border border-border">
                            <span className="text-foreground/60 block">{baseKm} km (Cơ bản)</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{inBase.oneWay.toLocaleString("vi-VN")} ₫</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white dark:bg-[var(--bg-surface)] border border-border">
                            <span className="text-foreground/60 block">{(baseKm + zoneBufferKm * 0.7).toFixed(1)} km (Trong Zone)</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{inZone.oneWay.toLocaleString("vi-VN")} ₫ (Giá gốc)</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white dark:bg-[var(--bg-surface)] border border-border">
                            <span className="text-foreground/60 block">{(maxZoneKm + 4).toFixed(1)} km (Vượt Zone)</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">{overZone.oneWay.toLocaleString("vi-VN")} ₫</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Deposit Configuration Section */}
                <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                      <ShieldCheck size={16} />
                      <span>Chính Sách Đặt Cọc Của Giá Này</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Checkbox
                        id="custom-deposit-chk"
                        isSelected={isCustomDeposit}
                        onChange={(val: boolean) => setIsCustomDeposit(val)}
                      >
                        <Checkbox.Content>
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox.Content>
                      </Checkbox>
                      <Label htmlFor="custom-deposit-chk" className="text-xs font-bold cursor-pointer select-none text-foreground">
                        Cấu hình cọc riêng
                      </Label>
                    </div>
                  </div>

                  {!isCustomDeposit ? (
                    <div className="text-xs text-foreground/70 bg-white/70 dark:bg-[var(--bg-surface)] p-2.5 rounded-xl border border-border">
                      {routeDepositType ? (
                        <>
                          <span>Đang kế thừa từ tuyến đường: </span>
                          <strong className="text-foreground">
                            {routeDepositType === "PERCENT" ? `Cọc ${routeDepositRate}%` : `Cọc ${routeDepositAmount ? routeDepositAmount.toLocaleString("vi-VN") : 0} VND`}
                          </strong>
                        </>
                      ) : (
                        <span>Không cấu hình cọc trên tuyến đường</span>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <Label className="block text-xs font-bold mb-1 text-foreground">Hình thức cọc</Label>
                        <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-[var(--bg-card)] border border-border text-xs">
                          <button
                            type="button"
                            onClick={() => setCustomDepositType("PERCENT")}
                            className={`flex-1 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                              customDepositType === "PERCENT"
                                ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                                : "text-foreground/60 hover:text-foreground"
                            }`}
                          >
                            % Giá trị
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomDepositType("FIXED")}
                            className={`flex-1 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                              customDepositType === "FIXED"
                                ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                                : "text-foreground/60 hover:text-foreground"
                            }`}
                          >
                            Cố định
                          </button>
                        </div>
                      </div>

                      <div>
                        {customDepositType === "PERCENT" ? (
                          <NumberField
                            value={customDepositRate}
                            onChange={(val) => setCustomDepositRate(val ?? 0)}
                            minValue={1}
                            maxValue={100}
                            className="w-full"
                          >
                            <Label className="block text-xs font-bold mb-1 text-foreground">Tỷ lệ cọc (%)</Label>
                            <NumberField.Group className="w-full">
                              <NumberField.Input className="w-full px-3 py-2 rounded-xl border border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground text-sm font-semibold h-[36px]" />
                            </NumberField.Group>
                          </NumberField>
                        ) : (
                          <div>
                            <Label className="block text-xs font-bold mb-1 text-foreground">Số tiền cọc (VND)</Label>
                            <input
                              type="number"
                              value={customDepositAmount}
                              onChange={(e) => setCustomDepositAmount(e.target.value)}
                              placeholder="e.g. 200000"
                              className="w-full px-3 py-2 rounded-xl border border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground text-sm font-semibold h-[36px] outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="transfer-active"
                    isSelected={active}
                    onChange={(val: boolean) => setActive(val)}
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                  <Label htmlFor="transfer-active" className="text-xs sm:text-sm font-bold cursor-pointer select-none text-foreground">
                    Kích hoạt cấu hình giá này
                  </Label>
                </div>
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground/80 transition-colors cursor-pointer"
                  onClick={onClose}
                  isDisabled={loading}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isDisabled={loading}
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                >
                  {loading ? (
                    <RefreshCw size={15} className="animate-spin mr-1.5" />
                  ) : (
                    <Save size={15} className="mr-1.5" />
                  )}
                  {transfer?.id ? "Lưu thay đổi" : "Tạo cấu hình giá"}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}

export { AirportTransferCreateUpdateModal as AirportTransferModal };
export default AirportTransferCreateUpdateModal;
