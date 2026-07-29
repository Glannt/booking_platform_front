"use client";

import React from "react";
import { Edit3, MapPin, Calendar, Percent, CheckCircle, XCircle } from "lucide-react";
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
import type { IntercitySeasonalSurchargeDto, IntercityRouteDto } from "@/lib/api/rental";

interface SurchargeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  surcharge: IntercitySeasonalSurchargeDto | null;
  routes: IntercityRouteDto[];
  onEdit: () => void;
}

export function SurchargeDetailModal({
  isOpen,
  onClose,
  surcharge,
  routes,
  onEdit,
}: SurchargeDetailModalProps) {
  if (!surcharge) return null;

  const routeObj = routes.find(r => r.id === surcharge.routeId);

  const getRouteName = (r: IntercityRouteDto | undefined) => {
    if (!r) return "Áp dụng tất cả tuyến";
    const t = r.translations?.find(t => t.locale === "vi") || r.translations?.[0];
    return t?.name || `${r.originCity} ⇌ ${r.destinationCity}`;
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-xl bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl shadow-2xl">
            <ModalHeader className="flex items-center justify-between p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between w-full">
                <Typography type="h3" className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Chi tiết phụ thu theo mùa
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
                {/* Season Name */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Tên mùa / Dịp lễ</p>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-accent" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{surcharge.seasonName}</span>
                  </div>
                </div>

                {/* Route detail */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Phạm vi áp dụng</p>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-blue-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{getRouteName(routeObj)}</span>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Ngày bắt đầu</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-slate-500" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {surcharge.startDate?.substring(0, 10)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Ngày kết thúc</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-slate-500" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {surcharge.endDate?.substring(0, 10)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Percent detail */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Tỷ lệ phụ thu</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Percent size={14} className="text-amber-500" />
                      <span className="text-sm font-extrabold text-amber-500">
                        +{surcharge.surchargePercent}%
                      </span>
                    </div>
                  </div>
                  <Chip
                    size="sm"
                    color={surcharge.active ? "success" : "warning"}
                    className="font-bold text-[10px]"
                  >
                    {surcharge.active ? "Hoạt động" : "Tạm ẩn"}
                  </Chip>
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
