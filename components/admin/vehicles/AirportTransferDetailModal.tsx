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
  Label,
  Chip,
} from "@heroui/react";
import { Edit3, Info, ShieldCheck, DollarSign } from "lucide-react";
import {
  type AirportTransferPrice,
  type AirportRouteDto,
  type VehicleCategoryDto,
} from "@/lib/api/fleet";
import { calcAirportPrice } from "@/lib/pricing";
import type { DepositType } from "@/types/deposit";
import { ActivePromotionSection } from "@/components/admin/discount";

interface AirportTransferDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: AirportTransferPrice | null;
  routes: AirportRouteDto[];
  categories: VehicleCategoryDto[];
  onEdit: () => void;
  defaultRouteDeposit?: {
    depositType?: DepositType;
    depositRate?: number;
    depositAmount?: number;
  };
}

export function AirportTransferDetailModal({
  isOpen,
  onClose,
  transfer,
  routes,
  categories,
  onEdit,
  defaultRouteDeposit,
}: AirportTransferDetailModalProps) {
  if (!transfer) return null;

  const currentRoute = routes.find((r) => r.id === transfer.airportRouteId);
  const routeDepositType: DepositType = (defaultRouteDeposit?.depositType || currentRoute?.depositType || "PERCENT") as DepositType;
  const routeDepositRate: number = defaultRouteDeposit?.depositRate ?? currentRoute?.depositRate ?? 20;
  const routeDepositAmount: number | undefined = defaultRouteDeposit?.depositAmount ?? currentRoute?.depositAmount;

  const isCustomDeposit = Boolean(transfer.depositType);
  const effectiveDepositType = isCustomDeposit ? (transfer.depositType as DepositType) : routeDepositType;
  const effectiveDepositRate = isCustomDeposit ? (transfer.depositRate ?? 20) : routeDepositRate;
  const effectiveDepositAmount = isCustomDeposit ? transfer.depositAmount : routeDepositAmount;

  const baseKm = transfer.baseKm ?? 35;
  const zoneBufferKm = transfer.zoneBufferKm ?? 2.0;
  const maxZoneKm = baseKm + zoneBufferKm;
  const baseAmount = transfer.baseAmount ?? 0;
  const perKmAmount = transfer.perKmAmount ?? 0;
  const fixedOvercharge = transfer.fixedOvercharge ?? false;
  const feeOverchargeFixed = transfer.feeOverchargeFixed ?? 100000;
  const currency = transfer.currency || "VND";

  const getCategoryName = (vcId: number) => {
    const vc = categories.find((c) => c.id === vcId);
    if (!vc) return `Loại xe #${vcId}`;
    const trans = vc.translations?.find((t) => t.locale === "vi") || vc.translations?.[0];
    return trans?.name || vc.code;
  };

  const getRouteName = (rId: number) => {
    const r = routes.find((routeObj) => routeObj.id === rId);
    return r?.code || `#${rId}`;
  };

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
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                    Chi Tiết Cấu Hình Giá Sân Bay
                  </h3>
                  <p className="text-xs text-foreground/60">
                    Mã #{transfer.id} • {getRouteName(transfer.airportRouteId)} • {getCategoryName(transfer.vehicleCategoryId)}
                  </p>
                </div>
              </div>
              <div className="pr-6">
                <Chip
                  size="sm"
                  variant="soft"
                  className={
                    transfer.active
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]"
                      : "bg-default-100 text-foreground/50 font-bold text-[10px]"
                  }
                >
                  {transfer.active ? "Kích hoạt" : "Ngừng hoạt động"}
                </Chip>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Route & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Tuyến Đường</Label>
                  <p className="mt-1 text-sm font-bold text-foreground">{getRouteName(transfer.airportRouteId)}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Loại Xe</Label>
                  <p className="mt-1 text-sm font-bold text-foreground">{getCategoryName(transfer.vehicleCategoryId)}</p>
                </div>
              </div>

              {/* Base Km & Zone Buffer */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Km Cơ Bản</Label>
                  <p className="mt-1 text-sm font-bold text-foreground">{baseKm} km</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Vùng Đệm Zone (Km)</Label>
                  <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    +{zoneBufferKm} km (Áp dụng giá gốc đến {maxZoneKm.toFixed(1)} km)
                  </p>
                </div>
              </div>

              {/* Price & Surcharge */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Giá Trong Km Cơ Bản</Label>
                  <p className="mt-1 text-base font-black text-accent">
                    {baseAmount.toLocaleString("vi-VN")} {currency}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
                    {fixedOvercharge ? "Mức Phí Cố Định" : "Đơn Giá Mỗi Km Thêm"}
                  </Label>
                  <p className="mt-1 text-base font-black text-amber-600 dark:text-amber-400">
                    {fixedOvercharge
                      ? `${feeOverchargeFixed.toLocaleString("vi-VN")} ${currency}`
                      : `${perKmAmount.toLocaleString("vi-VN")} ${currency}/km`}
                  </p>
                </div>
              </div>

              {/* Deposit Policy View */}
              <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <ShieldCheck size={16} />
                    <span>Chính Sách Đặt Cọc</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isCustomDeposit
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    {isCustomDeposit ? "Cấu hình riêng loại xe" : "Kế thừa từ tuyến đường"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <span className="text-foreground/60 block text-[11px]">Hình thức đặt cọc:</span>
                    <span className="font-bold text-foreground">
                      {effectiveDepositType === "PERCENT" ? `Theo phần trăm (${effectiveDepositRate}%)` : "Số tiền cố định"}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground/60 block text-[11px]">Tiền cọc ước tính (giá gốc):</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {(() => {
                        const estDeposit =
                          effectiveDepositType === "PERCENT"
                            ? Math.round(baseAmount * ((effectiveDepositRate || 0) / 100))
                            : (effectiveDepositAmount || 0);
                        return `${estDeposit.toLocaleString("vi-VN")} ${currency}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Zone Preview */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-border space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Info size={14} className="text-accent" />
                  <span>Xem trước tính giá theo Vùng đệm Zone:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  {(() => {
                    const inBase = calcAirportPrice(
                      { baseKm, zoneBufferKm, baseAmount, perKmAmount, fixedOvercharge, feeOverchargeFixed },
                      baseKm
                    );
                    const inZone = calcAirportPrice(
                      { baseKm, zoneBufferKm, baseAmount, perKmAmount, fixedOvercharge, feeOverchargeFixed },
                      baseKm + zoneBufferKm * 0.7
                    );
                    const overZone = calcAirportPrice(
                      { baseKm, zoneBufferKm, baseAmount, perKmAmount, fixedOvercharge, feeOverchargeFixed },
                      maxZoneKm + 4
                    );
                    return (
                      <>
                        <div className="p-2 rounded-lg bg-white dark:bg-[var(--bg-surface)] border border-border">
                          <span className="text-foreground/60 block">{baseKm} km (Cơ bản)</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {inBase.oneWay.toLocaleString("vi-VN")} ₫
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-[var(--bg-surface)] border border-border">
                          <span className="text-foreground/60 block">
                            {(baseKm + zoneBufferKm * 0.7).toFixed(1)} km (Trong Zone)
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {inZone.oneWay.toLocaleString("vi-VN")} ₫ (Giá gốc)
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-[var(--bg-surface)] border border-border">
                          <span className="text-foreground/60 block">{(maxZoneKm + 4).toFixed(1)} km (Vượt Zone)</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {overZone.oneWay.toLocaleString("vi-VN")} ₫
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Active Promotions on this Airport Route */}
              {transfer.airportRouteId > 0 && (
                <ActivePromotionSection
                  scopeType="AIRPORT_TRANSFER"
                  scopeRefId={transfer.airportRouteId}
                  showEmpty
                  className="mt-2"
                />
              )}
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                variant="outline"
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground/80 transition-colors cursor-pointer"
                onClick={onClose}
              >
                Đóng
              </Button>
              <Button
                type="button"
                className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
                onPress={onEdit}
              >
                <Edit3 size={15} className="mr-1.5" />
                Chỉnh sửa
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}

export default AirportTransferDetailModal;
