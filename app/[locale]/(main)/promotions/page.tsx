"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Tag,
  Percent,
  Sparkles,
  Gift,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Ticket,
} from "lucide-react";
import { Button, SearchField, Skeleton } from "@heroui/react";
import { useI18n } from "@/context/LanguageContext";
import { useActiveDiscounts, useMyVouchers } from "@/lib/queries/useDiscounts";
import { useAuthStore } from "@/lib/store/authStore";
import { VoucherCard } from "@/components/customer/VoucherCard";
import { PromotionDto } from "@/lib/api/discount";

export default function PublicPromotionsPage() {
  const { t, language } = useI18n();
  const { user } = useAuthStore();

  const [selectedScope, setSelectedScope] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Lấy danh sách ưu đãi công khai
  const { data: activeOffers = [], isLoading: loadingOffers } = useActiveDiscounts();

  // Lấy số lượng voucher cá nhân nếu user đã đăng nhập
  const { data: myVouchers = [] } = useMyVouchers(Boolean(user));

  const availableVouchersCount = useMemo(() => {
    return myVouchers.filter((v) => {
      if (v.used) return false;
      if (v.expiresAt) {
        return new Date(v.expiresAt).getTime() > new Date().getTime();
      }
      return true;
    }).length;
  }, [myVouchers]);

  // Lọc theo danh mục và từ khóa tìm kiếm
  const filteredOffers = useMemo(() => {
    return activeOffers.filter((promo: PromotionDto) => {
      if (selectedScope !== "ALL") {
        const hasScope =
          promo.scopeType === selectedScope ||
          (promo.scopes && promo.scopes.some((s) => s.scopeType === selectedScope)) ||
          promo.scopeType === "GLOBAL";
        if (!hasScope) return false;
      }

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
    <div className="min-h-screen bg-slate-50/50 dark:bg-[var(--bg-page)] pb-24">
      {/* Hero Banner Section */}
      <div className="relative bg-gradient-to-b from-amber-500/15 via-accent/5 to-transparent border-b border-slate-200/80 dark:border-slate-800/80 pt-16 pb-14 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-accent/15 text-accent-foreground dark:text-accent border border-accent/30 shadow-xs">
            <Sparkles size={14} className="text-accent" />
            <span>{t.discounts.customerDiscountsTitle}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Kho Ưu Đãi & Khuyến Mãi Du Lịch
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            {t.discounts.customerDiscountsSubtitle}
          </p>

          {/* Banner dẫn tới Ví Voucher nếu đã đăng nhập */}
          {user && (
            <div className="pt-4 max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-amber-300/50 dark:border-amber-700/40 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                    <Gift size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {t.discounts.myVouchersBannerTitle}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Bạn có <span className="font-extrabold text-accent">{availableVouchersCount} voucher</span> đang khả dụng trong tài khoản.
                    </p>
                  </div>
                </div>

                <Link href={`/${language}/dashboard/discounts`}>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-xl font-bold text-xs h-9 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-xs cursor-pointer border-none flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
                  >
                    <span>{t.discounts.viewWallet}</span>
                    <ArrowRight size={13} />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 pt-8 space-y-8">
        {/* Controls: Scope Filter Tabs + Search Field */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Scope Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {scopeTabs.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSelectedScope(sc.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                  selectedScope === sc.id
                    ? "bg-accent text-accent-foreground border-accent shadow-xs"
                    : "bg-slate-50 dark:bg-[var(--bg-surface)] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)]"
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>

          {/* Search Field */}
          <div className="w-full md:w-72">
            <SearchField
              name="search_public_promotions"
              value={searchKeyword}
              onChange={(val: string) => setSearchKeyword(val)}
              className="w-full"
            >
              <SearchField.Group className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent text-xs font-semibold h-10">
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

        {/* Promotions Grid */}
        {loadingOffers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        ) : filteredOffers.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center bg-white dark:bg-[var(--bg-card)] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center max-w-lg mx-auto my-10">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((promo) => (
              <VoucherCard
                key={promo.id}
                item={promo}
                variant="public"
              />
            ))}
          </div>
        )}

        {/* How to use Promo Codes Section */}
        <div className="mt-16 p-8 rounded-3xl bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cách sử dụng mã giảm giá tại Minh Khoa Travel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chỉ với 3 bước đơn giản để nhận ngay ưu đãi khi đặt xe và tour du lịch
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[var(--bg-surface)]/70 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <span className="w-7 h-7 rounded-lg bg-accent text-accent-foreground font-black text-xs flex items-center justify-center">
                1
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Chọn dịch vụ phù hợp
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Xem chi tiết điều kiện áp dụng (Tour, Xe tự lái, Đưa đón sân bay hoặc Toàn hệ thống) và mức giảm tương ứng.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[var(--bg-surface)]/70 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <span className="w-7 h-7 rounded-lg bg-accent text-accent-foreground font-black text-xs flex items-center justify-center">
                2
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Sao chép mã ưu đãi
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Nhấn nút sao chép mã voucher trực tiếp trên thẻ hoặc ghi nhớ mã khuyến mãi để sử dụng.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[var(--bg-surface)]/70 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <span className="w-7 h-7 rounded-lg bg-accent text-accent-foreground font-black text-xs flex items-center justify-center">
                3
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Áp dụng tại bước đặt chỗ
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Dán mã vào ô &quot;Mã khuyến mãi&quot; tại màn hình xác nhận đặt chỗ để hệ thống tự động trừ tiền ngay lập tức.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
