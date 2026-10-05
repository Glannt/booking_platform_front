"use client";

import React from "react";
import { Edit3, MapPin, DollarSign, Car, CheckCircle, XCircle, Calendar, Clock, Gauge } from "lucide-react";
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
  Typography,
} from "@heroui/react";
import { type IntercityRoutePriceDto, type IntercityRouteDto } from "@/lib/api/intercity";
import type { VehicleCategoryDto } from "@/lib/api/fleet";
import { ActivePromotionSection } from "@/components/admin/discount";

interface PriceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  price: IntercityRoutePriceDto | null;
  routes: IntercityRouteDto[];
  categories: VehicleCategoryDto[];
  onEdit: () => void;
}

export function PriceDetailModal({
  isOpen,
  onClose,
  price,
  routes,
  categories,
  onEdit,
}: PriceDetailModalProps) {
  if (!price) return null;

  const routeRefId = price.routeId || Number(price.scopeRefId);
  const routeObj = routes.find((r) => r.id === routeRefId);
  const catObj = categories.find((c) => c.id === price.vehicleCategoryId);

  const getRouteName = (r: IntercityRouteDto | undefined) => {
    if (!r) return "Áp dụng tất cả tuyến";
    const t = r.translations?.find((tr) => tr.locale === "vi") || r.translations?.[0];
    return t?.name || `${r.originCity} ⇌ ${r.destinationCity}`;
  };

  const getCategoryName = (c: VehicleCategoryDto | undefined) => {
    if (!c) return `ID: ${price.vehicleCategoryId}`;
    const t = c.translations?.find((tr) => tr.locale === "vi") || c.translations?.[0];
    return t?.name || c.code;
  };

  const isDailyRate =
    price.priceTypeCode === "DAILY_RATE" || price.priceTypeCategory === "DAILY_RATE";

  // One row = one price type: basePrice IS this type's price. No derivation, no doubling.
  const basePrice = Number(price.basePrice ?? 0);
  const dailyRateVal = isDailyRate ? basePrice : 0;

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <Typography type="h3" className="text-base font-bold text-foreground">
                Chi tiết cấu hình giá xe
              </Typography>
            </ModalHeader>

            <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
              {/* Route detail */}
              <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-separator">
                <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">
                  Tuyến đường áp dụng
                </p>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-accent" />
                  <span className="text-sm font-bold text-foreground">
                    {getRouteName(routeObj)}
                  </span>
                </div>
              </div>

              {/* Vehicle category detail */}
              <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-separator">
                <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">
                  Dòng xe áp dụng
                </p>
                <div className="flex items-center gap-2">
                  <Car size={16} className="text-blue-500" />
                  <span className="text-sm font-bold text-foreground">
                    {getCategoryName(catObj)}
                  </span>
                </div>
              </div>

              {/* Active Promotions on this Route */}
              <ActivePromotionSection
                scopeType="INTERCITY_ROUTE"
                scopeRefId={routeRefId || undefined}
                showEmpty
              />

              {/* Pricing Type Banner */}
              <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-separator flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">
                    Hình thức tính giá
                  </p>
                  <span className="text-sm font-extrabold text-foreground">
                    {isDailyRate ? "Thuê theo ngày (DAILY_RATE)" : "Trong ngày (Một chiều / Khứ hồi)"}
                  </span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-accent/10 text-accent flex items-center gap-1.5">
                  {isDailyRate ? <Calendar size={13} /> : <Clock size={13} />}
                  {price.priceTypeCode || (isDailyRate ? "DAILY_RATE" : "IN_DAY")}
                </span>
              </div>

              {/* Pricing Details */}
              {isDailyRate ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-separator">
                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">
                      Đơn giá / ngày
                    </p>
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-accent" />
                      <span className="text-base font-extrabold text-amber-500">
                        {dailyRateVal > 0 ? `${dailyRateVal.toLocaleString()} ${price.currency || "VND"}` : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-separator">
                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">
                      Số ngày tối thiểu
                    </p>
                    <span className="text-sm font-bold text-foreground">
                      {price.minDays ?? 1} ngày
                    </span>
                  </div>

                  {price.kmIncludedPerDay != null && (
                    <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-separator">
                      <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">
                        Giới hạn km / ngày
                      </p>
                      <div className="flex items-center gap-2">
                        <Gauge size={16} className="text-blue-500" />
                        <span className="text-sm font-bold text-foreground">
                          {price.kmIncludedPerDay} km / ngày
                        </span>
                      </div>
                    </div>
                  )}

                  {price.overagePricePerKm != null && (
                    <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-separator">
                      <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">
                        Phí vượt km
                      </p>
                      <span className="text-sm font-bold text-foreground">
                        {price.overagePricePerKm.toLocaleString()} ${price.currency || "VND"} / km
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-separator">
                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">
                      {price.priceTypeCode === "ROUND_TRIP_SAME_DAY"
                        ? "Giá khứ hồi trong ngày"
                        : "Giá một chiều"}
                    </p>
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-emerald-500" />
                      <span className="text-base font-extrabold text-amber-500">
                        {basePrice > 0 ? `${basePrice.toLocaleString()} ${price.currency || "VND"}` : "—"}
                      </span>
                    </div>
                  </div>

                  {price.waitingFee != null && price.waitingFee > 0 && (
                    <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-separator">
                      <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">
                        Phí chờ quá giờ
                      </p>
                      <span className="text-sm font-bold text-foreground">
                        {price.waitingFee.toLocaleString()} {price.currency || "VND"} / giờ
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Status detail */}
              <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-separator flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">
                    Trạng thái kích hoạt
                  </p>
                  <span className="text-sm font-bold text-foreground">
                    {price.active ? "Đang hoạt động" : "Tạm ngưng / Ẩn"}
                  </span>
                </div>
                {price.active ? (
                  <CheckCircle size={20} className="text-emerald-500" />
                ) : (
                  <XCircle size={20} className="text-amber-500" />
                )}
              </div>
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground/80 transition-colors cursor-pointer"
              >
                Đóng
              </Button>
              <Button
                type="button"
                onClick={onEdit}
                className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
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

export default PriceDetailModal;
