"use client";

import React, { useState } from "react";
import { Button } from "@heroui/react";
import {
  Tag,
  Percent,
  Copy,
  Check,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { useI18n } from "@/context/LanguageContext";
import { PromotionDto, PromotionGrantDto } from "@/lib/api/discount";
import { useRouter } from "next/navigation";

export interface VoucherCardProps {
  /** Có thể truyền PromotionDto (mã công khai) hoặc PromotionGrantDto (mã cấp riêng) */
  item: PromotionDto | PromotionGrantDto;
  /** Loại thẻ: "grant" (voucher cá nhân) hoặc "public" (khuyến mãi chung) */
  variant?: "grant" | "public";
  /** Callback khi bấm sử dụng */
  onUse?: (code: string) => void;
}

export function VoucherCard({
  item,
  variant = "public",
  onUse,
}: VoucherCardProps) {
  const { t, language } = useI18n();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  // Xác định các trường dữ liệu tùy theo grant hay public promotion
  const isGrant = variant === "grant" || "grantedReason" in item;
  const grantItem = isGrant ? (item as PromotionGrantDto) : null;
  const promoItem = !isGrant ? (item as PromotionDto) : null;

  const promoCode =
    grantItem?.uniqueCode ||
    grantItem?.promotionCode ||
    promoItem?.code ||
    "";
  const promoName =
    grantItem?.promotionName || promoItem?.name || promoCode;
  const description =
    grantItem?.description || promoItem?.description || "";
  const discountType =
    grantItem?.discountType || promoItem?.discountType || "PERCENT";
  const discountValue =
    grantItem?.discountValue ?? promoItem?.discountValue ?? 0;
  const maxDiscount =
    grantItem?.maxDiscountAmount ?? promoItem?.maxDiscountAmount;
  const minOrder =
    grantItem?.minOrderAmount ?? promoItem?.minOrderAmount;

  const expiresDateStr = grantItem?.expiresAt || promoItem?.validTo;
  const isUsed = Boolean(grantItem?.used);

  // Tính toán trạng thái hết hạn
  let isExpired = false;
  let daysLeft: number | null = null;
  if (expiresDateStr) {
    const expDate = new Date(expiresDateStr);
    const now = new Date();
    const diffTime = expDate.getTime() - now.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) {
      isExpired = true;
    }
  }

  // Xác định đường dẫn điều hướng khi bấm "Dùng ngay"
  const getTargetServicePath = () => {
    const scopes = promoItem?.scopes || [];
    const mainScope = promoItem?.scopeType || scopes[0]?.scopeType || "GLOBAL";

    switch (mainScope) {
      case "TOUR":
        return `/${language}/tours`;
      case "SELF_DRIVE":
        return `/${language}/self-drive`;
      case "INTERCITY_ROUTE":
      case "SHARED_ROUTE":
        return `/${language}/intercity`;
      case "AIRPORT_TRANSFER":
        return `/${language}/airport-transfer`;
      default:
        return `/${language}`;
    }
  };

  const handleCopy = async () => {
    if (!promoCode) return;
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback nếu clipboard API bị chặn
      const textArea = document.createElement("textarea");
      textArea.value = promoCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleUseNow = () => {
    if (onUse) {
      onUse(promoCode);
      return;
    }
    const targetPath = getTargetServicePath();
    router.push(targetPath);
  };

  // Xác định badge lý do cấp
  const getGrantReasonLabel = (reason?: string) => {
    switch (reason) {
      case "LOYALTY_MILESTONE":
        return "Tri ân thành viên thân thiết";
      case "BIRTHDAY":
        return "Quà tặng sinh nhật";
      case "REFERRAL":
        return "Thưởng giới thiệu bạn bè";
      case "COMPENSATION":
        return "Voucher hỗ trợ dịch vụ";
      default:
        return t.discounts.exclusiveGift;
    }
  };

  const isDisabled = isUsed || isExpired;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-200 overflow-hidden ${
        isDisabled
          ? "bg-slate-50 dark:bg-[var(--bg-muted)] border-slate-200 dark:border-slate-800/60 opacity-70"
          : "bg-white dark:bg-[var(--bg-card)] border-slate-200 dark:border-slate-800 hover:border-accent/50 shadow-sm hover:shadow-md"
      }`}
    >
      {/* Top Header Card / Banner */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Discount Value Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-black shrink-0 ${
                isDisabled
                  ? "bg-slate-200 dark:bg-[var(--bg-elevated)] text-slate-500"
                  : "bg-accent/15 text-accent shadow-xs"
              }`}
            >
              {discountType === "PERCENT" ? (
                <Percent size={20} />
              ) : (
                <Tag size={20} />
              )}
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {discountType === "PERCENT"
                    ? `${discountValue}%`
                    : `${Number(discountValue).toLocaleString("vi-VN")}₫`}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t.discounts.discountType === "PERCENT" ? "" : "GIẢM"}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block -mt-0.5">
                {discountType === "PERCENT"
                  ? t.discounts.percent
                  : t.discounts.fixedAmount}
              </span>
            </div>
          </div>

          {/* Status Chip / Grant Reason */}
          <div>
            {isUsed ? (
              <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-[var(--bg-elevated)] text-slate-500 border border-slate-200 dark:border-slate-700">
                {t.discounts.used}
              </span>
            ) : isExpired ? (
              <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-300/40 dark:border-rose-800/40">
                {t.discounts.expired}
              </span>
            ) : isGrant ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/50 dark:border-amber-700/50">
                <Sparkles size={11} className="text-amber-500" />
                {getGrantReasonLabel(grantItem?.grantedReason)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300/50 dark:border-emerald-800/50">
                <ShieldCheck size={11} className="text-emerald-500" />
                {t.discounts.available}
              </span>
            )}
          </div>
        </div>

        {/* Promo Title & Description */}
        <div className="mt-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
            {promoName}
          </h4>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
              {description}
            </p>
          )}
        </div>

        {/* Requirements & Limitations */}
        <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {minOrder && minOrder > 0 ? (
            <div>
              <span className="text-slate-400">{t.discounts.minOrderLabel}: </span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {Number(minOrder).toLocaleString("vi-VN")}₫
              </span>
            </div>
          ) : (
            <div>
              <span className="text-slate-400">{t.discounts.minOrderLabel}: </span>
              <span className="font-semibold">{t.discounts.unlimited}</span>
            </div>
          )}

          {maxDiscount && maxDiscount > 0 ? (
            <div>
              <span className="text-slate-400">{t.discounts.maxDiscountLabel}: </span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {Number(maxDiscount).toLocaleString("vi-VN")}₫
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Ticket Cutout Divider (decorative circles) */}
      <div className="relative w-full flex items-center justify-between px-0">
        <div className="w-3 h-6 rounded-r-full bg-slate-100 dark:bg-[var(--bg-page)] border-r border-t border-b border-slate-200 dark:border-slate-800 -ml-[1px]" />
        <div className="flex-1 border-b border-dashed border-slate-200 dark:border-slate-800 mx-2" />
        <div className="w-3 h-6 rounded-l-full bg-slate-100 dark:bg-[var(--bg-page)] border-l border-t border-b border-slate-200 dark:border-slate-800 -mr-[1px]" />
      </div>

      {/* Footer / Actions & Code */}
      <div className="p-4 sm:p-5 pt-3 bg-slate-50/50 dark:bg-[var(--bg-surface)]/50 flex flex-col gap-3">
        {/* Expiry line */}
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Calendar size={12} className="shrink-0 text-slate-400" />
            <span>
              {expiresDateStr
                ? `${t.discounts.expiresOn}: ${expiresDateStr.slice(0, 10)}`
                : t.discounts.neverExpires}
            </span>
          </div>

          {!isDisabled && daysLeft !== null && daysLeft <= 5 && daysLeft > 0 && (
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 animate-pulse flex items-center gap-1">
              <Clock size={10} />
              {t.discounts.expiresIn} {daysLeft} ngày
            </span>
          )}
        </div>

        {/* Promo Code Box & Copy Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center justify-between flex-1 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[var(--bg-card)]">
            <span className="font-mono font-black text-xs sm:text-sm tracking-wider text-slate-900 dark:text-white uppercase truncate">
              {promoCode || "KHUYENMAI"}
            </span>

            <Button
              type="button"
              isIconOnly
              size="sm"
              variant="ghost"
              isDisabled={isDisabled}
              onClick={handleCopy}
              className={`h-7 w-7 rounded-lg transition-colors cursor-pointer ${
                copied
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-600 dark:text-slate-300"
              }`}
              aria-label={t.discounts.copyCode}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>

          {/* Action "Dùng ngay" */}
          <Button
            type="button"
            size="sm"
            isDisabled={isDisabled}
            onClick={handleUseNow}
            className="rounded-xl font-bold text-xs h-9 px-3.5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-xs cursor-pointer border-none flex items-center gap-1 transition-colors shrink-0"
          >
            <span>{t.discounts.useNow}</span>
            <ArrowRight size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VoucherCard;
