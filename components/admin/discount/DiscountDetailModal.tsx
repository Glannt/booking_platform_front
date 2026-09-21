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
  Tooltip,
} from "@heroui/react";
import {
  Tag,
  Edit3,
  Copy,
  Check,
  Calendar,
  Layers,
  Percent,
  DollarSign,
  ShieldCheck,
  Users,
  Activity,
  FileText,
} from "lucide-react";
import { type PriceDiscountDto, type PromotionDto } from "@/lib/api/discount";
import { useI18n } from "@/context/LanguageContext";

interface DiscountDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotion: PriceDiscountDto | PromotionDto | null;
  onEdit: () => void;
}

export function DiscountDetailModal({
  isOpen,
  onClose,
  promotion,
  onEdit,
}: DiscountDetailModalProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  if (!promotion) return null;

  const handleCopyCode = () => {
    if (!promotion.code) return;
    navigator.clipboard.writeText(promotion.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScopeLabel = (scopeType: string) => {
    switch (scopeType) {
      case "GLOBAL":
        return t.discounts?.scopeGlobal || "Toàn bộ dịch vụ";
      case "TOUR":
        return t.discounts?.scopeTour || "Tour du lịch";
      case "SELF_DRIVE":
        return t.discounts?.scopeSelfDrive || "Thuê xe tự lái";
      case "INTERCITY_ROUTE":
        return t.discounts?.scopeRoute || "Tuyến xe liên tỉnh";
      case "AIRPORT_TRANSFER":
        return t.discounts?.scopeAirport || "Đưa đón sân bay";
      case "SHARED_ROUTE":
        return t.discounts?.scopeSharedRoute || "Tuyến xe ghép";
      default:
        return scopeType;
    }
  };

  const getIssuanceLabel = (type?: string) => {
    switch (type) {
      case "PUBLIC":
        return {
          label: t.discounts?.public || "Công khai",
          desc: "Bất kỳ khách hàng nào cũng có thể nhập và sử dụng mã",
          color: "success" as const,
        };
      case "PRIVATE_TARGETED":
        return {
          label: t.discounts?.privateTargeted || "Chỉ định",
          desc: "Chỉ khách hàng được Admin cấp quyền riêng mới được áp dụng",
          color: "warning" as const,
        };
      case "AUTO_REWARD":
        return {
          label: t.discounts?.autoReward || "Tự động thưởng",
          desc: "Tự động phát thưởng khi đạt cột mốc đơn đặt hoặc sinh nhật",
          color: "accent" as const,
        };
      default:
        return {
          label: type || "Công khai",
          desc: "",
          color: "default" as const,
        };
    }
  };

  const issuanceInfo = getIssuanceLabel(promotion.issuanceType);
  const isPercent = promotion.discountType === "PERCENT";
  const scopes =
    promotion.scopes && promotion.scopes.length > 0
      ? promotion.scopes
      : [{ scopeType: promotion.scopeType || "GLOBAL", scopeRefId: promotion.scopeRefId }];

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                  <Tag size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    {promotion.name || "Chi tiết khuyến mãi"}
                  </h3>
                  <p className="text-xs text-foreground/60">
                    {(t.discounts as any)?.detailsTitle || "Thông tin cấu hình mã ưu đãi và phạm vi áp dụng"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pr-6">
                <Chip
                  size="sm"
                  variant="soft"
                  color={promotion.active ? "success" : "default"}
                  className="font-bold text-xs"
                >
                  {promotion.active ? (t.discounts?.active || "Đang hoạt động") : (t.discounts?.inactive || "Tạm dừng")}
                </Chip>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
              {/* Code Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-accent/15 via-accent/5 to-transparent border border-accent/30 flex items-center justify-between gap-4 shadow-2xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent block">
                    {t.discounts?.code || "Mã khuyến mãi"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-black tracking-wider text-foreground uppercase">
                      {promotion.code || "ƯU ĐÃI TỰ ĐỘNG"}
                    </span>
                    {promotion.code && (
                      <Tooltip delay={200} closeDelay={100}>
                        <Tooltip.Trigger>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            onClick={handleCopyCode}
                            aria-label="Copy code"
                            className="text-foreground/60 hover:text-accent cursor-pointer"
                          >
                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Content className="text-xs">
                          {copied ? "Đã sao chép" : "Sao chép mã"}
                        </Tooltip.Content>
                      </Tooltip>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-foreground/50 block">
                    {t.discounts?.discountValue || "Giá trị giảm"}
                  </span>
                  <span className="text-2xl font-black text-accent block">
                    {isPercent
                      ? `${promotion.discountValue}%`
                      : `${Number(promotion.discountValue).toLocaleString("vi-VN")} ₫`}
                  </span>
                </div>
              </div>

              {/* Discount Conditions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 block">
                    {t.discounts?.maxDiscountAmount || "Giảm tối đa"}
                  </span>
                  <span className="font-bold text-xs text-foreground block">
                    {promotion.maxDiscountAmount && promotion.maxDiscountAmount > 0
                      ? `${promotion.maxDiscountAmount.toLocaleString("vi-VN")} ₫`
                      : "Không giới hạn trần"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 block">
                    {t.discounts?.minOrderAmount || "Đơn tối thiểu"}
                  </span>
                  <span className="font-bold text-xs text-foreground block">
                    {promotion.minOrderAmount && promotion.minOrderAmount > 0
                      ? `${promotion.minOrderAmount.toLocaleString("vi-VN")} ₫`
                      : "Không yêu cầu"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 block">
                    {t.discounts?.minDays || "Số ngày tối thiểu"}
                  </span>
                  <span className="font-bold text-xs text-foreground block">
                    {promotion.minDays && promotion.minDays > 0
                      ? `${promotion.minDays} ngày`
                      : "Không áp dụng"}
                  </span>
                </div>
              </div>

              {/* Issuance Type */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-accent" />
                    {t.discounts?.issuanceType || "Hình thức phát hành"}
                  </span>
                  <Chip size="sm" variant="soft" color={issuanceInfo.color} className="font-bold text-[11px]">
                    {issuanceInfo.label}
                  </Chip>
                </div>
                {issuanceInfo.desc && (
                  <p className="text-[11px] text-foreground/60">{issuanceInfo.desc}</p>
                )}
              </div>

              {/* Scopes Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Layers size={14} className="text-accent" />
                  {t.discounts?.scopes || "Phạm vi áp dụng"} ({scopes.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {scopes.map((s, idx) => (
                    <Chip
                      key={idx}
                      size="sm"
                      variant="secondary"
                      className="text-[11px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-surface)] text-foreground"
                    >
                      <strong className="text-accent mr-1">{getScopeLabel(s.scopeType || "GLOBAL")}</strong>
                      {s.scopeRefId ? `(#${s.scopeRefId})` : "(Toàn bộ)"}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Usage Stats & Validity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Users size={14} className="text-accent" />
                    Giới hạn sử dụng
                  </span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">{t.discounts?.maxUsage || "Tổng lượt dùng"}:</span>
                      <strong className="text-foreground">
                        {promotion.maxUsageTotal && promotion.maxUsageTotal > 0
                          ? promotion.maxUsageTotal.toLocaleString()
                          : "Không giới hạn"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">{t.discounts?.maxUsagePerUser || "Lượt dùng/khách"}:</span>
                      <strong className="text-foreground">{promotion.maxUsagePerUser || 1} lần</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Đã sử dụng:</span>
                      <strong className="text-accent">{promotion.usageCount || 0} lần</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Calendar size={14} className="text-accent" />
                    Thời hạn hiệu lực
                  </span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">{t.discounts?.validFrom || "Bắt đầu"}:</span>
                      <strong className="text-foreground">
                        {promotion.validFrom ? promotion.validFrom.slice(0, 10) : "Ngay khi tạo"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">{t.discounts?.validTo || "Kết thúc"}:</span>
                      <strong className="text-foreground">
                        {promotion.validTo ? promotion.validTo.slice(0, 10) : "Vô thời hạn"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {promotion.description && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileText size={14} className="text-accent" />
                    {t.discounts?.desc || "Mô tả"}
                  </span>
                  <p className="text-xs text-foreground/70 whitespace-pre-wrap">{promotion.description}</p>
                </div>
              )}
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground/80 transition-colors cursor-pointer"
              >
                {t.common?.close || "Đóng"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
              >
                <Edit3 size={15} className="mr-1.5" />
                {t.common?.edit || "Chỉnh sửa"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
