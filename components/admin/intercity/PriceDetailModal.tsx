"use client";

import React from "react";
import { Edit3, MapPin, DollarSign, Car, CheckCircle, XCircle } from "lucide-react";
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
import type { IntercityRoutePriceDto, IntercityRouteDto } from "@/lib/api/rental";
import type { VehicleCategoryDto } from "@/lib/api/fleet";
import { calcIntercityPrice, calcIntercityPrivatePrice } from "@/lib/pricing";

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

  const routeObj = routes.find(r => r.id === price.routeId);
  const catObj = categories.find(c => c.id === price.vehicleCategoryId);

  const getRouteName = (r: IntercityRouteDto | undefined) => {
    if (!r) return "Áp dụng tất cả tuyến";
    const t = r.translations?.find(t => t.locale === "vi") || r.translations?.[0];
    return t?.name || `${r.originCity} ⇌ ${r.destinationCity}`;
  };

  const getCategoryName = (c: VehicleCategoryDto | undefined) => {
    if (!c) return `ID: ${price.vehicleCategoryId}`;
    const t = c.translations?.find(t => t.locale === "vi") || c.translations?.[0];
    return t?.name || c.code;
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <Typography type="h3" className="text-base font-bold text-slate-800 dark:text-slate-100">
                Chi tiết cấu hình giá xe
              </Typography>
              <Button
                size="sm"
                onClick={onEdit}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 size={14} /> Chỉnh sửa
              </Button>
            </ModalHeader>

            <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
              {/* Route detail */}
              <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Tuyến đường áp dụng</p>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-accent" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{getRouteName(routeObj)}</span>
                </div>
              </div>

              {/* Vehicle category detail */}
              <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Dòng xe áp dụng</p>
                <div className="flex items-center gap-2">
                  <Car size={16} className="text-blue-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{getCategoryName(catObj)}</span>
                </div>
              </div>

              {/* Pricing Type Banner */}
              <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Hình thức tính giá</p>
                  <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    {price.pricingType === "FIXED" ? "Giá trọn gói cố định" : "Tính theo số KM"}
                  </span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                  {price.pricingType || "PER_KM"}
                </span>
              </div>

              {/* Amounts detail */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    {price.pricingType === "FIXED" ? "Đơn giá" : "Giá / km"}
                  </p>
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-500" />
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      {price.pricingType === "FIXED"
                        ? "Trọn gói"
                        : (price.perKmAmount > 0 ? `${price.perKmAmount.toLocaleString()} ${price.currency}` : "—")}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Một chiều</p>
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-500" />
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      {(() => {
                        const calculated = calcIntercityPrivatePrice({
                          distanceKm: routeObj?.distanceKm,
                          pricingType: price.pricingType,
                          perKmAmount: price.perKmAmount,
                          fixedPriceOneWay: price.fixedPriceOneWay,
                          fixedPriceRoundTrip: price.fixedPriceRoundTrip,
                          roundTripPrice: price.roundTripPrice,
                          roundTripPerKmAmount: price.roundTripPerKmAmount,
                        }, false);
                        return calculated > 0 ? `${calculated.toLocaleString()} ${price.currency}` : "—";
                      })()}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Khứ hồi</p>
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-500" />
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      {(() => {
                        const calculated = calcIntercityPrivatePrice({
                          distanceKm: routeObj?.distanceKm,
                          pricingType: price.pricingType,
                          perKmAmount: price.perKmAmount,
                          fixedPriceOneWay: price.fixedPriceOneWay,
                          fixedPriceRoundTrip: price.fixedPriceRoundTrip,
                          roundTripPrice: price.roundTripPrice,
                          roundTripPerKmAmount: price.roundTripPerKmAmount,
                        }, true);
                        return calculated > 0 ? `${calculated.toLocaleString()} ${price.currency}` : "—";
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status detail */}
              <div className="bg-slate-50 dark:bg-[var(--bg-card)] p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Trạng thái kích hoạt</p>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {price.active ? "Đang hoạt động" : "Tạm ngưng / Ẩn"}
                  </span>
                </div>
                {price.active ? <CheckCircle size={20} className="text-success" /> : <XCircle size={20} className="text-warning" />}
              </div>
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0 bg-white dark:bg-[var(--bg-surface)]">
              <Button size="sm" variant="ghost" onClick={onClose} className="rounded-xl font-bold cursor-pointer">
                Đóng
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
