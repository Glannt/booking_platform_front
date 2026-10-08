"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2, Images } from "lucide-react";
import { useI18n } from "@/context/LanguageContext";

export interface HomeActivityCardProps {
  id: string | number;
  imageUrl: string;
  category?: string;
  location?: string;
  title: string;
  badges?: string[];
  bookingCount?: string | number;
  price: number;
  originalPrice?: number;
  /** All active discounts for this item; the card shows up to 2 then "...". */
  discountTags?: string[];
  comboTag?: string;
  href: string;
  currency?: string;
  priceUnit?: string; // e.g. "/người", "/ngày", "/chuyến"
  className?: string;
}

const MAX_DISCOUNT_TAGS = 2;

export function HomeActivityCard({
  imageUrl,
  category,
  location,
  title,
  badges = [],
  bookingCount = "",
  price,
  originalPrice,
  discountTags = [],
  comboTag,
  href,
  currency = "₫",
  priceUnit = "",
  className = "",
}: HomeActivityCardProps) {
  const { t } = useI18n();
  const metaLabel = [category, location].filter(Boolean).join(" • ");
  const visibleDiscounts = discountTags.slice(0, MAX_DISCOUNT_TAGS);
  const hasMoreDiscounts = discountTags.length > MAX_DISCOUNT_TAGS;
  // Ảnh lỗi => hiện placeholder "Không có ảnh" (không fallback sang ảnh khác).
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(imageUrl) && failedUrl !== imageUrl;

  return (
    <Link
      href={href}
      className={`group flex flex-col bg-surface rounded-2xl border border-separator/70 hover:border-accent/40 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden w-full h-full ${className}`}
    >
      {/* Thumbnail — không có ảnh từ backend => placeholder như ImageGalleryGrid */}
      {showImage ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted shrink-0">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
            onError={() => setFailedUrl(imageUrl)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div className="relative aspect-[16/10] w-full bg-muted shrink-0 flex flex-col items-center justify-center gap-1.5 text-foreground/50">
          <Images size={26} className="opacity-50" />
          <span className="text-[11px] font-semibold">{t.tours.noPhotos}</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow justify-between gap-3">
        <div className="space-y-1.5">
          {/* Category & Location */}
          {metaLabel && (
            <span className="text-[11px] font-semibold text-foreground/50 block line-clamp-1">
              {metaLabel}
            </span>
          )}

          {/* Title */}
          <h3 className="text-sm sm:text-base font-extrabold text-foreground line-clamp-2 leading-snug group-hover:text-accent transition-colors">
            {title}
          </h3>

          {/* Feature Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {badges.slice(0, 2).map((b, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md text-foreground/70 border border-separator"
                >
                  <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                  <span>{b}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 pt-1 border-t border-separator/40">
          {/* Booking count (only when backend provides it) */}
          {bookingCount && (
            <div className="text-[11px] font-medium text-foreground/60">
              {typeof bookingCount === "number" ? `${bookingCount}+` : bookingCount} {t.homePage.bookedLabel}
            </div>
          )}

          {/* Pricing — no configured price means no figure, not a stand-in one. */}
          <div className="flex flex-wrap items-baseline gap-1.5">
            {price > 0 ? (
              <>
                <span className="text-xs font-bold text-foreground/70">{t.homePage.priceFrom}</span>
                <span className="text-base sm:text-lg font-black text-accent tracking-tight">
                  {price.toLocaleString("vi-VN")} {currency}
                </span>
                {priceUnit && (
                  <span className="text-xs font-semibold text-foreground/50">{priceUnit}</span>
                )}

                {originalPrice && originalPrice > price && (
                  <span className="text-xs font-medium text-foreground/40 line-through ml-1">
                    {originalPrice.toLocaleString("vi-VN")} {currency}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs font-bold text-foreground/60">{t.common.contact}</span>
            )}
          </div>

          {/* Discount and Combo tags */}
          {(visibleDiscounts.length > 0 || hasMoreDiscounts || comboTag) && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {visibleDiscounts.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                >
                  <Sparkles size={9} />
                  <span>{tag}</span>
                </span>
              ))}
              {hasMoreDiscounts && (
                <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  ...
                </span>
              )}
              {comboTag && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  <span>{comboTag}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default HomeActivityCard;
