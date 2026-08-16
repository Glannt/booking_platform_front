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
  Chip,
} from "@heroui/react";
import { KeyRound } from "lucide-react";
import type { RentalDto, RentalPriceDto } from "@/lib/api/rental";
import type { VehicleCategoryDto } from "@/lib/api/fleet";
import { formatPriceSync } from "@/lib/format";
import { useI18n } from "@/context/LanguageContext";

interface SelfDriveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: (RentalDto & { category?: VehicleCategoryDto; vehiclesCount?: number; prices?: RentalPriceDto[] }) | null;
  onEdit?: (rental: RentalDto) => void;
}

export function SelfDriveDetailModal({
  isOpen,
  onClose,
  rental,
  onEdit,
}: SelfDriveDetailModalProps) {
  const { language } = useI18n();

  if (!rental) return null;

  const cat = rental.category;
  const trans =
    cat?.translations?.find((t) => t.locale === language) ||
    cat?.translations?.find((t) => t.locale === "vi") ||
    cat?.translations?.[0];
  const catName = trans?.name || cat?.code || `Phân khúc #${rental.vehicleCategoryId}`;
  const seatText = cat ? `${cat.minSeat}-${cat.maxSeat} chỗ` : "";
  const luggageText = cat ? `${cat.minLuggage}-${cat.maxLuggage} ${cat.unitLuggage || "vali"}` : "";

  const activePrice = rental.prices?.find((p) => p.active);

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-2xl bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <ModalCloseTrigger />
            <ModalHeader className="flex items-center justify-between p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Chi tiết cấu hình xe tự lái #{rental.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Thông tin phân khúc, điều kiện cọc và bảng giá
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pr-8">
                <Chip size="sm" color={rental.active ? "success" : "default"}>
                  {rental.active ? "Đang hoạt động" : "Tạm ngưng"}
                </Chip>
              </div>
            </ModalHeader>

            <ModalBody className="p-0 space-y-4 text-xs mt-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Phân khúc xe:</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm">{catName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Số chỗ ngồi:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{seatText || "Chưa xác định"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Quy cách hành lý:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{luggageText || "Chưa xác định"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Số lượng xe trong đội:</span>
                  <span className="font-black text-accent">{rental.vehiclesCount || 0} xe</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Tiền đặt cọc:</span>
                  <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                    {formatPriceSync(Number(rental.deposit) || 0, "vi")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Số ngày tối thiểu:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{rental.minimumDays || 1} ngày</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Đơn giá ngày:</span>
                  {activePrice && activePrice.amount > 0 ? (
                    <span className="font-black text-accent text-sm">
                      {formatPriceSync(Number(activePrice.amount), "vi")} /ngày
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Chưa set giá</span>
                  )}
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="p-0 pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-4">
              <Button
                variant="secondary"
                onClick={onClose}
                className="rounded-xl text-xs font-bold px-4 h-10 border border-slate-200 dark:border-slate-700"
              >
                Đóng
              </Button>
              {onEdit && (
                <Button
                  onClick={() => {
                    onClose();
                    onEdit(rental);
                  }}
                  className="rounded-xl text-xs font-black px-5 h-10 bg-accent text-white hover:bg-accent-hover shadow-md cursor-pointer border-none"
                >
                  Chỉnh sửa
                </Button>
              )}
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
