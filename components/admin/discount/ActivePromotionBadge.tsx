"use client";

import React from "react";
import { Tag, Sparkles, Percent, Calendar, AlertCircle } from "lucide-react";
import { Tooltip, Chip, Spinner } from "@heroui/react";
import { useActiveDiscounts } from "@/lib/queries/useDiscounts";
import { type PromotionDto } from "@/lib/api/discount";

interface ActivePromotionBadgeProps {
  scopeType: string;
  scopeRefId?: string | number;
  compact?: boolean;
  showEmpty?: boolean;
  className?: string;
}

export function ActivePromotionBadge({
  scopeType,
  scopeRefId,
  compact = false,
  showEmpty = false,
  className = "",
}: ActivePromotionBadgeProps) {
  const { data: promotions = [], isLoading } = useActiveDiscounts(
    scopeType,
    scopeRefId ? String(scopeRefId) : undefined
  );

  if (isLoading) {
    return compact ? (
      <span className="inline-flex items-center gap-1 text-[11px] text-foreground/50">
        <Spinner size="sm" />
      </span>
    ) : (
      <div className="p-3 rounded-xl border border-separator bg-default-50/50 flex items-center gap-2 text-xs text-foreground/60">
        <Spinner size="sm" />
        <span>Đang kiểm tra khuyến mãi...</span>
      </div>
    );
  }

  const hasPromos = promotions.length > 0;

  if (!hasPromos) {
    if (!showEmpty) return null;
    return (
      <div className={`p-3 rounded-xl border border-dashed border-separator bg-default-50/50 flex items-center gap-2 text-xs text-foreground/50 ${className}`}>
        <Tag size={14} className="text-foreground/40 shrink-0" />
        <span>Chưa có khuyến mãi nào đang áp dụng</span>
      </div>
    );
  }

  if (compact) {
    const firstPromo = promotions[0];
    const moreCount = promotions.length - 1;

    const discountLabel =
      firstPromo.discountType === "PERCENT"
        ? `-${firstPromo.discountValue}%`
        : `-${Number(firstPromo.discountValue).toLocaleString("vi-VN")}₫`;

    const tooltipContent = (
      <div className="p-1 space-y-1.5 max-w-xs text-xs">
        <div className="font-bold text-accent border-b border-separator/60 pb-1">
          {promotions.length} Khuyến mãi đang áp dụng:
        </div>
        {promotions.map((p) => (
          <div key={p.id} className="space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold uppercase">{p.code || "Tự động"}</span>
              <span className="font-bold text-accent">
                {p.discountType === "PERCENT" ? `-${p.discountValue}%` : `-${Number(p.discountValue).toLocaleString()}₫`}
              </span>
            </div>
            {p.name && <div className="text-[11px] text-foreground/70">{p.name}</div>}
          </div>
        ))}
      </div>
    );

    return (
      <Tooltip delay={200} closeDelay={100}>
        <Tooltip.Trigger>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 cursor-help ${className}`}
          >
            <Sparkles size={11} className="shrink-0 text-amber-500" />
            <span>{firstPromo.code ? `${firstPromo.code} (${discountLabel})` : discountLabel}</span>
            {moreCount > 0 && (
              <span className="ml-0.5 px-1 py-0.2 bg-amber-500/20 rounded-full text-[9px]">
                +{moreCount}
              </span>
            )}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content className="rounded-xl bg-background border border-separator shadow-xl p-2.5">
          <Tooltip.Arrow />
          {tooltipContent}
        </Tooltip.Content>
      </Tooltip>
    );
  }

  return (
    <div
      className={`p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 space-y-2.5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sparkles size={13} />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block">
              Khuyến mãi đang áp dụng ({promotions.length})
            </span>
            <span className="text-[10px] text-foreground/60">
              Các chương trình ưu đãi khách hàng có thể sử dụng cho dịch vụ này
            </span>
          </div>
        </div>
        <Chip size="sm" variant="soft" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
          Đang chạy
        </Chip>
      </div>

      <div className="space-y-2">
        {promotions.map((p) => {
          const discountText =
            p.discountType === "PERCENT"
              ? `Giảm ${p.discountValue}%`
              : `Giảm ${Number(p.discountValue).toLocaleString("vi-VN")} VND`;

          return (
            <div
              key={p.id}
              className="p-2.5 rounded-xl bg-background/80 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-accent uppercase px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
                    {p.code || "ƯU ĐÃI TỰ ĐỘNG"}
                  </span>
                  <span className="font-bold text-xs text-foreground">{p.name}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-foreground/60 font-medium">
                  {p.minOrderAmount && p.minOrderAmount > 0 ? (
                    <span>Đơn tối thiểu: {p.minOrderAmount.toLocaleString("vi-VN")}₫</span>
                  ) : null}
                  {p.validTo ? (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} className="text-foreground/40" />
                      Đến: {p.validTo.slice(0, 10)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 block">
                  {discountText}
                </span>
                {p.maxDiscountAmount && p.maxDiscountAmount > 0 ? (
                  <span className="text-[10px] text-foreground/50">
                    Tối đa {p.maxDiscountAmount.toLocaleString("vi-VN")}₫
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ActivePromotionSection = ActivePromotionBadge;
