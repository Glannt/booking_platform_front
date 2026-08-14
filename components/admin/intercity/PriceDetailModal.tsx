"use client";

import React from "react";
import { Edit3, MapPin, DollarSign, Car, CheckCircle, XCircle } from "lucide-react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  Button,
  Typography,
  Chip
} from "@heroui/react";
import type { IntercityRoutePriceDto, IntercityRouteDto } from "@/lib/api/rental";
import type { VehicleCategoryDto } from "@/lib/api/fleet";
import { calcIntercityPrice } from "@/lib/pricing";

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
          <ModalDialog className="max-w-xl bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl shadow-2xl">
            <ModalHeader className="flex items-center justify-between p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between w-full">
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
              </div>
            </ModalHeader>

            <ModalBody className="gap-4 mt-4">
              <div className="space-y-4">
                {/* Route detail */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Tuyến đường áp dụng</p>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-accent" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{getRouteName(routeObj)}</span>
                  </div>
                </div>

                {/* Vehicle category detail */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Dòng xe áp dụng</p>
                  <div className="flex items-center gap-2">
                    <Car size={16} className="text-blue-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{getCategoryName(catObj)}</span>
                  </div>
                </div>

                {/* Amounts detail */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Giá / km</p>
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-emerald-500" />
                      <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                        {price.perKmAmount > 0 ? `${price.perKmAmount.toLocaleString()} ${price.currency}` : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Một chiều</p>
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-emerald-500" />
                      <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                        {routeObj?.distanceKm ? `${calcIntercityPrice(routeObj.distanceKm, price.perKmAmount, false).toLocaleString()} ${price.currency}` : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Khứ hồi</p>
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-emerald-500" />
                      <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                        {routeObj?.distanceKm ? `${calcIntercityPrice(routeObj.distanceKm, price.perKmAmount, true).toLocaleString()} ${price.currency}` : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status detail */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Trạng thái kích hoạt</p>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {price.active ? "Đang hoạt động" : "Tạm ngưng / Ẩn"}
                    </span>
                  </div>
                  {price.active ? <CheckCircle size={20} className="text-success" /> : <XCircle size={20} className="text-warning" />}
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                <Button size="sm" variant="ghost" onClick={onClose}>Đóng</Button>
              </div>
            </ModalBody>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
