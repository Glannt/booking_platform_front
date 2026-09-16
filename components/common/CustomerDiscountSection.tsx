"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Tag, Sparkles, Check, X, Calendar, Gift, AlertCircle } from "lucide-react";
import { Button, Input, toast, Chip } from "@heroui/react";
import {
  getActiveDiscounts,
  getMyVouchers,
  validateDiscount,
  type PriceDiscountDto,
  type PromotionGrantDto,
  type DiscountResultDto,
} from "@/lib/api/discount";
import { useAuthStore } from "@/lib/store/authStore";
import { useI18n } from "@/context/LanguageContext";
import { formatPriceSync } from "@/lib/format";

export interface AppliedDiscountInfo {
  code: string;
  amount: number;
  discountType?: "PERCENT" | "FIXED_AMOUNT";
  discountRate?: number;
  name?: string;
}

interface CustomerDiscountSectionProps {
  scopeType: "TOUR" | "SELF_DRIVE" | "INTERCITY_ROUTE" | "SHARED_ROUTE" | "AIRPORT_TRANSFER" | "GLOBAL" | string;
  scopeRefId?: string | number;
  orderTotal: number;
  days?: number;
  onDiscountChange: (discount: AppliedDiscountInfo | null) => void;
  className?: string;
}

export function CustomerDiscountSection({
  scopeType,
  scopeRefId,
  orderTotal,
  days = 1,
  onDiscountChange,
  className = "",
}: CustomerDiscountSectionProps) {
  const { language, t } = useI18n();
  const { user, isAuthenticated } = useAuthStore();

  const [activeDiscounts, setActiveDiscounts] = useState<PriceDiscountDto[]>([]);
  const [myVouchers, setMyVouchers] = useState<PromotionGrantDto[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscountInfo | null>(null);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch active discounts & customer vouchers
  useEffect(() => {
    let mounted = true;
    const fetchPromos = async () => {
      setLoading(true);
      try {
        const promises: [Promise<any>, Promise<any>, Promise<any>?] = [
          getActiveDiscounts(scopeType, scopeRefId ? String(scopeRefId) : undefined),
          scopeType !== "GLOBAL" ? getActiveDiscounts("GLOBAL") : Promise.resolve({ data: [] }),
        ];

        if (isAuthenticated) {
          promises.push(getMyVouchers());
        }

        const [scopedRes, globalRes, vouchersRes] = await Promise.all(promises);

        if (!mounted) return;

        const allPromos = [...(scopedRes?.data || []), ...(globalRes?.data || [])];
        // Deduplicate by code/id
        const unique = allPromos.filter(
          (p, idx, arr) => arr.findIndex((x) => x.id === p.id || x.code === p.code) === idx
        );
        setActiveDiscounts(unique.filter((p) => p.active));

        if (vouchersRes?.data) {
          const now = new Date();
          const validGrants = (vouchersRes.data as PromotionGrantDto[]).filter(
            (g) => !g.used && (!g.expiresAt || new Date(g.expiresAt) > now)
          );
          setMyVouchers(validGrants);
        }
      } catch {
        // Silent fail for promo fetching
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPromos();
    return () => {
      mounted = false;
    };
  }, [scopeType, scopeRefId, isAuthenticated]);

  // Recalculate applied discount if order total changes
  useEffect(() => {
    if (!appliedDiscount) return;

    if (appliedDiscount.discountType === "PERCENT" && appliedDiscount.discountRate) {
      const newAmount = Math.round((orderTotal * appliedDiscount.discountRate) / 100);
      const cappedAmount = Math.min(newAmount, orderTotal);
      if (cappedAmount !== appliedDiscount.amount) {
        const updated = { ...appliedDiscount, amount: cappedAmount };
        setAppliedDiscount(updated);
        onDiscountChange(updated);
      }
    } else if (appliedDiscount.amount > orderTotal) {
      const updated = { ...appliedDiscount, amount: orderTotal };
      setAppliedDiscount(updated);
      onDiscountChange(updated);
    }
  }, [orderTotal, appliedDiscount, onDiscountChange]);

  const handleApplyCode = async (codeToApply?: string) => {
    const rawCode = (codeToApply || promoCodeInput).trim().toUpperCase();
    if (!rawCode) return;

    if (orderTotal <= 0) {
      toast.danger(t.discounts.invalidCode);
      return;
    }

    setValidating(true);
    try {
      const res = await validateDiscount({
        code: rawCode,
        orderAmount: orderTotal,
        scopeType,
        scopeRefId: scopeRefId ? String(scopeRefId) : undefined,
        customerId: user?.id,
        days,
        cartItems: [
          {
            module: scopeType,
            productId: scopeRefId ? String(scopeRefId) : undefined,
            quantity: 1,
            itemPrice: orderTotal,
          },
        ],
      });

      if (res?.data && res.data.valid) {
        const valData: DiscountResultDto = res.data;
        const discountAmt = Math.min(Number(valData.discountAmount) || 0, orderTotal);

        const discountInfo: AppliedDiscountInfo = {
          code: rawCode,
          amount: discountAmt,
          discountType: valData.discountType as "PERCENT" | "FIXED_AMOUNT" | undefined,
          discountRate: valData.discountValue,
          name: valData.discountCode || rawCode,
        };

        setAppliedDiscount(discountInfo);
        setPromoCodeInput("");
        onDiscountChange(discountInfo);
        toast.success(`${t.discounts.applied}: -${formatPriceSync(discountAmt, language)}`);
      } else {
        toast.danger(res?.data?.message || t.discounts.invalidCode);
      }
    } catch {
      toast.danger(t.discounts.invalidCode);
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    onDiscountChange(null);
  };

  // Format date helper from response data
  const formatApiDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-border/80 space-y-3.5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-accent shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {t.discounts.promoCode}
          </span>
        </div>
        {appliedDiscount && (
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <Check size={12} />
            {t.discounts.applied}
          </span>
        )}
      </div>

      {/* Applied Discount Badge */}
      {appliedDiscount ? (
        <div className="p-3 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles size={14} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  {appliedDiscount.code}
                </span>
                {appliedDiscount.discountRate && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    ({appliedDiscount.discountRate}%)
                  </span>
                )}
              </div>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                - {formatPriceSync(appliedDiscount.amount, language)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveDiscount}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            aria-label="Remove promo code"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        /* Promo Input Field */
        <div className="flex gap-2">
          <Input
            value={promoCodeInput}
            onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApplyCode();
              }
            }}
            placeholder={t.discounts.enterPromoCode}
            className="flex-1 h-10 px-3.5 rounded-xl border border-border bg-white dark:bg-[var(--bg-surface)] text-xs font-bold uppercase tracking-wider outline-none focus:border-accent"
          />
          <Button
            type="button"
            isDisabled={validating || !promoCodeInput.trim()}
            onClick={() => handleApplyCode()}
            className="h-10 px-4 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:bg-accent-hover transition-all cursor-pointer shadow-xs border-none shrink-0"
          >
            {validating ? "..." : t.discounts.apply}
          </Button>
        </div>
      )}

      {/* Customer Personal Vouchers */}
      {myVouchers.length > 0 && !appliedDiscount && (
        <div className="space-y-2 pt-1 border-t border-border/60">
          <div className="flex items-center gap-1.5">
            <Gift size={13} className="text-amber-500" />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
              {t.discounts.myVouchers}
            </span>
          </div>
          <div className="space-y-2">
            {myVouchers.map((voucher) => {
              const code = voucher.uniqueCode || voucher.promotionCode || "";
              const toDate = formatApiDate(voucher.expiresAt);

              return (
                <div
                  key={`voucher-${voucher.id}`}
                  className="p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-300/40 dark:border-amber-700/40 flex items-center justify-between gap-3 hover:border-amber-400 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400 font-black text-[11px] uppercase tracking-wider">
                        {code}
                      </span>
                      <Chip size="sm" variant="soft" color="warning" className="text-[10px] font-bold">
                        {t.discounts.privateTargeted}
                      </Chip>
                      {voucher.promotionName && (
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {voucher.promotionName}
                        </span>
                      )}
                    </div>

                    {toDate && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <Calendar size={11} className="shrink-0 text-slate-400" />
                        <span>Hạn dùng đến: {toDate}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyCode(code)}
                    className="h-8 px-3 rounded-lg text-xs font-bold border border-amber-400/60 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white cursor-pointer shrink-0 transition-colors"
                  >
                    {t.discounts.apply}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Public & Scoped Promotions from API */}
      {activeDiscounts.length > 0 && !appliedDiscount && (
        <div className="space-y-2 pt-1 border-t border-border/60">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
            Khuyến mãi có thể áp dụng:
          </span>
          <div className="space-y-2">
            {activeDiscounts.map((promo) => {
              const fromDate = formatApiDate(promo.validFrom);
              const toDate = formatApiDate(promo.validTo);
              const hasDate = Boolean(fromDate || toDate);

              return (
                <div
                  key={promo.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-border/80 flex items-center justify-between gap-3 hover:border-accent/40 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent font-black text-[11px] uppercase tracking-wider">
                        {promo.code}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {promo.discountType === "PERCENT"
                          ? `Giảm ${promo.discountValue}%`
                          : `Giảm ${formatPriceSync(promo.discountValue, language)}`}
                      </span>
                      {promo.name && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          - {promo.name}
                        </span>
                      )}
                    </div>

                    {/* Show validity date ONLY if returned in data response */}
                    {hasDate && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <Calendar size={11} className="shrink-0 text-slate-400" />
                        <span>
                          {fromDate && toDate
                            ? `Áp dụng: từ ${fromDate} đến ${toDate}`
                            : toDate
                              ? `Hạn dùng đến ${toDate}`
                              : `Bắt đầu từ ${fromDate}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyCode(promo.code)}
                    className="h-8 px-3 rounded-lg text-xs font-bold border border-accent/40 text-accent hover:bg-accent hover:text-accent-foreground cursor-pointer shrink-0 transition-colors"
                  >
                    {t.discounts.apply}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
