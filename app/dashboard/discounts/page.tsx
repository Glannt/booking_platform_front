"use client";

import React, { useState, useMemo } from "react";
import {
  Tag,
  Gift,
  Search,
  Sparkles,
  Ticket,
  Percent,
  CheckCircle2,
  Clock,
  Compass,
} from "lucide-react";
import { Button, SearchField, Skeleton } from "@heroui/react";
import { useI18n } from "@/context/LanguageContext";
import { useMyVouchers, useActiveDiscounts } from "@/lib/queries/useDiscounts";
import { VoucherCard } from "@/components/customer/VoucherCard";
import { PromotionGrantDto, PromotionDto } from "@/lib/api/discount";

export default function CustomerDiscountsDashboardPage() {
  const { t } = useI18n();

  // Active Tab: "my-vouchers" | "public-offers"
  const [activeTab, setActiveTab] = useState<"my-vouchers" | "public-offers">("my-vouchers");

  // Filters for My Vouchers
  const [voucherStatusFilter, setVoucherStatusFilter] = useState<"ALL" | "AVAILABLE" | "USED_EXPIRED">("ALL");

  // Filters for Public Offers
  const [selectedScope, setSelectedScope] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Queries
  const { data: myVouchers = [], isLoading: loadingVouchers } = useMyVouchers();
  const { data: activeOffers = [], isLoading: loadingOffers } = useActiveDiscounts();

  // Thống kê nhanh
  const availableVouchersCount = useMemo(() => {
    return myVouchers.filter((v: PromotionGrantDto) => {
      if (v.used) return false;
      if (v.expiresAt) {
        const isExp = new Date(v.expiresAt).getTime() <= new Date().getTime();
        if (isExp) return false;
      }
      return true;
    }).length;
  }, [myVouchers]);

  // Lọc danh sách Voucher của tôi
  const filteredMyVouchers = useMemo(() => {
    return myVouchers.filter((v: PromotionGrantDto) => {
      const now = new Date().getTime();
      const isExp = v.expiresAt ? new Date(v.expiresAt).getTime() <= now : false;
      const isAvailable = !v.used && !isExp;

      if (voucherStatusFilter === "AVAILABLE" && !isAvailable) return false;
      if (voucherStatusFilter === "USED_EXPIRED" && isAvailable) return false;

      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const match =
          v.uniqueCode?.toLowerCase().includes(q) ||
          v.promotionCode?.toLowerCase().includes(q) ||
          v.promotionName?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [myVouchers, voucherStatusFilter, searchKeyword]);

  // Lọc danh sách Ưu đãi công khai
  const filteredPublicOffers = useMemo(() => {
    return activeOffers.filter((promo: PromotionDto) => {
      // Filter scope
      if (selectedScope !== "ALL") {
        const hasScope =
          promo.scopeType === selectedScope ||
          (promo.scopes && promo.scopes.some((s) => s.scopeType === selectedScope)) ||
          promo.scopeType === "GLOBAL";
        if (!hasScope) return false;
      }

      // Filter keyword
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const match =
          promo.code?.toLowerCase().includes(q) ||
          promo.name?.toLowerCase().includes(q) ||
          promo.description?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [activeOffers, selectedScope, searchKeyword]);

  const scopeTabs = [
    { id: "ALL", label: t.discounts.categoryAll },
    { id: "GLOBAL", label: t.discounts.scopeGlobal },
    { id: "TOUR", label: t.discounts.scopeTour },
    { id: "SELF_DRIVE", label: t.discounts.scopeSelfDrive },
    { id: "INTERCITY_ROUTE", label: t.discounts.scopeRoute },
    { id: "AIRPORT_TRANSFER", label: t.discounts.scopeAirport },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card with VIP Theme */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/30 dark:border-amber-700/30 bg-white dark:bg-[var(--bg-card)] shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50">
              <Sparkles size={12} className="text-amber-600 dark:text-amber-400" />
              <span>{t.discounts.myVouchers}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.discounts.customerDiscountsTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {t.discounts.customerDiscountsSubtitle}
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-[var(--bg-surface)]/80 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                <Gift size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Voucher khả dụng
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {availableVouchersCount}
                </span>
              </div>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-[var(--bg-surface)]/80 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
                <Tag size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Ưu đãi hệ thống
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {activeOffers.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant={activeTab === "my-vouchers" ? "primary" : "ghost"}
            onClick={() => {
              setActiveTab("my-vouchers");
              setSearchKeyword("");
            }}
            className={`rounded-xl font-black text-xs h-10 px-5 transition-colors cursor-pointer border-none flex items-center gap-2 ${
              activeTab === "my-vouchers"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)]"
            }`}
          >
            <Ticket size={16} />
            <span>{t.discounts.myVouchersTab}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "my-vouchers"
                  ? "bg-accent-foreground/20 text-accent-foreground"
                  : "bg-slate-200 dark:bg-[var(--bg-elevated)] text-slate-600 dark:text-slate-300"
              }`}
            >
              {myVouchers.length}
            </span>
          </Button>

          <Button
            type="button"
            variant={activeTab === "public-offers" ? "primary" : "ghost"}
            onClick={() => {
              setActiveTab("public-offers");
              setSearchKeyword("");
            }}
            className={`rounded-xl font-black text-xs h-10 px-5 transition-colors cursor-pointer border-none flex items-center gap-2 ${
              activeTab === "public-offers"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)]"
            }`}
          >
            <Compass size={16} />
            <span>{t.discounts.publicPromotionsTab}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "public-offers"
                  ? "bg-accent-foreground/20 text-accent-foreground"
                  : "bg-slate-200 dark:bg-[var(--bg-elevated)] text-slate-600 dark:text-slate-300"
              }`}
            >
              {activeOffers.length}
            </span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="w-full sm:w-72">
          <SearchField
            name="search_vouchers"
            value={searchKeyword}
            onChange={(val: string) => setSearchKeyword(val)}
            className="w-full"
          >
            <SearchField.Group className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent text-xs font-semibold h-10">
              <SearchField.SearchIcon />
              <SearchField.Input
                className="w-full"
                placeholder={t.discounts.searchOffersPlaceholder}
              />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
      </div>

      {/* Content for TAB 1: Ví Voucher Của Tôi */}
      {activeTab === "my-vouchers" && (
        <div className="space-y-5">
          {/* Sub-status Filter Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVoucherStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                voucherStatusFilter === "ALL"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs"
                  : "bg-white dark:bg-[var(--bg-card)] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)]"
              }`}
            >
              Tất cả ({myVouchers.length})
            </button>
            <button
              type="button"
              onClick={() => setVoucherStatusFilter("AVAILABLE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                voucherStatusFilter === "AVAILABLE"
                  ? "bg-emerald-600 text-white border-transparent shadow-xs"
                  : "bg-white dark:bg-[var(--bg-card)] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)]"
              }`}
            >
              Khả dụng ({availableVouchersCount})
            </button>
            <button
              type="button"
              onClick={() => setVoucherStatusFilter("USED_EXPIRED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                voucherStatusFilter === "USED_EXPIRED"
                  ? "bg-slate-600 text-white border-transparent shadow-xs"
                  : "bg-white dark:bg-[var(--bg-card)] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)]"
              }`}
            >
              Đã dùng / Hết hạn ({myVouchers.length - availableVouchersCount})
            </button>
          </div>

          {/* Loading Skeleton */}
          {loadingVouchers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 bg-white dark:bg-[var(--bg-card)]"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-11 h-11 rounded-xl" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32 rounded-lg" />
                      <Skeleton className="h-3 w-20 rounded-lg" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredMyVouchers.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center bg-white dark:bg-[var(--bg-card)] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center max-w-lg mx-auto my-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold mb-3.5">
                <Gift size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1.5">
                {t.discounts.emptyMyVouchersTitle}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mb-5 leading-relaxed">
                {t.discounts.emptyMyVouchersDesc}
              </p>
              <Button
                type="button"
                onClick={() => setActiveTab("public-offers")}
                className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
              >
                <Tag size={15} />
                <span>{t.discounts.explorePublicOffers}</span>
              </Button>
            </div>
          ) : (
            /* Vouchers Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMyVouchers.map((voucher) => (
                <VoucherCard
                  key={voucher.id}
                  item={voucher}
                  variant="grant"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content for TAB 2: Ưu Đãi Toàn Hệ Thống */}
      {activeTab === "public-offers" && (
        <div className="space-y-5">
          {/* Scope Pills Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {scopeTabs.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSelectedScope(sc.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                  selectedScope === sc.id
                    ? "bg-accent text-accent-foreground border-accent shadow-xs"
                    : "bg-white dark:bg-[var(--bg-card)] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)]"
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>

          {/* Loading Skeleton */}
          {loadingOffers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 bg-white dark:bg-[var(--bg-card)]"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-11 h-11 rounded-xl" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32 rounded-lg" />
                      <Skeleton className="h-3 w-20 rounded-lg" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredPublicOffers.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center bg-white dark:bg-[var(--bg-card)] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center max-w-lg mx-auto my-8">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold mb-3.5">
                <Tag size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1.5">
                {t.discounts.emptyPublicTitle}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
                {t.discounts.emptyPublicDesc}
              </p>
            </div>
          ) : (
            /* Public Offers Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPublicOffers.map((promo) => (
                <VoucherCard
                  key={promo.id}
                  item={promo}
                  variant="public"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
