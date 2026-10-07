"use client";

import React, { useState } from "react";
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
import { KeyRound, Tag, Car, Edit3 } from "lucide-react";
import type { RentalDto, RentalPriceDto } from "@/lib/api/selfDrive";
import type { VehicleCategoryDto } from "@/lib/api/fleet";
import { formatPriceSync } from "@/lib/format";
import { useI18n } from "@/context/LanguageContext";
import { ScopedDiscountTab, ActivePromotionBadge } from "@/components/admin/discount";

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
  const [activeTab, setActiveTab] = useState<"INFO" | "DISCOUNTS">("INFO");

  if (!rental) return null;

  const cat = rental.category;
  const catTrans = cat?.translations?.find((t) => t.locale === language) || cat?.translations?.[0];
  const catName = catTrans?.name || cat?.code || `Xe #${rental.id}`;
  const seatText = cat ? `${cat.minSeat}${cat.maxSeat > cat.minSeat ? `-${cat.maxSeat}` : ""} chỗ` : undefined;
  const luggageText = cat ? `${cat.minLuggage}${cat.maxLuggage > cat.minLuggage ? `-${cat.maxLuggage}` : ""} ${cat.unitLuggage || "vali"}` : undefined;

  const activePrice = rental.prices?.find((p) => p.active);
  const isPercent = rental.depositType === "PERCENT" || Boolean(rental.depositRate);

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-border-secondary overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="shrink-0 px-6 py-4 border-b border-separator flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Chi tiết cấu hình xe tự lái #{rental.id}
                  </h3>
                  <p className="text-xs text-foreground/60">
                    {catName} - Thông tin phân khúc, điều kiện cọc & khuyến mãi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pr-8">
                <Chip size="sm" color={rental.active ? "success" : "default"}>
                  {rental.active ? "Đang hoạt động" : "Tạm ngưng"}
                </Chip>
              </div>
            </ModalHeader>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-separator bg-slate-50/50 dark:bg-[var(--bg-card)] shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("INFO")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "INFO"
                    ? "border-accent text-accent"
                    : "border-transparent text-foreground/60 hover:text-foreground"
                }`}
              >
                <Car size={14} />
                <span>Thông tin & Giá cọc</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("DISCOUNTS")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "DISCOUNTS"
                    ? "border-accent text-accent"
                    : "border-transparent text-foreground/60 hover:text-foreground"
                }`}
              >
                <Tag size={14} />
                <span>Khuyến mãi áp dụng</span>
              </button>
            </div>

            <ModalBody className="flex-1 overflow-y-auto max-h-[60vh] p-6 space-y-4">
              {activeTab === "INFO" ? (
                <>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/70 font-bold">Phân khúc xe:</span>
                      <span className="font-black text-foreground text-sm">{catName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/70 font-bold">Số chỗ ngồi:</span>
                      <span className="font-semibold text-foreground/80">{seatText || "Chưa xác định"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/70 font-bold">Quy cách hành lý:</span>
                      <span className="font-semibold text-foreground/80">{luggageText || "Chưa xác định"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/70 font-bold">Số lượng xe trong đội:</span>
                      <span className="font-black text-accent">{rental.vehiclesCount || 0} xe</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/70 font-bold">Thứ tự ưu tiên hiển thị:</span>
                      <span className="font-bold text-foreground">#{rental.sortOrder ?? 0}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/70 font-bold">Hình thức đặt cọc:</span>
                      <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                        {rental.isContactOnly ? (
                          <span className="text-foreground/50 text-xs italic font-normal">Theo thỏa thuận khi báo giá</span>
                        ) : isPercent ? (
                          <span>{rental.depositRate ?? 0}% (tính từ tổng giá đơn hàng)</span>
                        ) : (
                          <span>{formatPriceSync(Number(rental.deposit) || 0, "vi")} (Cố định/xe)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/70 font-bold">Số ngày tối thiểu:</span>
                      <span className="font-bold text-foreground">{rental.minimumDays || 1} ngày</span>
                    </div>
                    <div className="flex flex-col gap-2 pt-1 border-t border-separator/60">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground/70 font-bold">Đơn giá ngày:</span>
                        <div className="flex items-center gap-2">
                          <ActivePromotionBadge scopeType="SELF_DRIVE" scopeRefId={rental.id} compact />
                          {rental.isContactOnly ? (
                            <span className="text-amber-500 font-bold text-xs bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                              Liên hệ báo giá
                            </span>
                          ) : activePrice && activePrice.amount > 0 ? (
                            <span className="font-black text-accent text-sm">
                              {formatPriceSync(Number(activePrice.amount), "vi")} /ngày
                            </span>
                          ) : (
                            <span className="text-foreground/50 italic">Chưa set giá</span>
                          )}
                        </div>
                      </div>
                      <ActivePromotionBadge scopeType="SELF_DRIVE" scopeRefId={rental.id} className="mt-1" />
                    </div>
                  </div>
                </>
              ) : (
                <ScopedDiscountTab
                  scopeType="SELF_DRIVE"
                  scopeRefId={rental.id}
                  scopeTitle={`Thuê xe tự lái: ${catName}`}
                />
              )}
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
              {onEdit && (
                <Button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(rental);
                  }}
                  className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
                >
                  <Edit3 size={15} className="mr-1.5" />
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

export default SelfDriveDetailModal;
