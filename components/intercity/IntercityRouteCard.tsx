"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, ArrowRight, Car, Users } from "lucide-react";
import { useI18n } from "@/context/LanguageContext";
import type { IntercityRouteDto } from "@/lib/api/intercity";
import type { SharedRouteDto } from "@/lib/api/sharedRoute";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { calcIntercityPrice } from "@/lib/pricing";
import { resolveLocalizedSlug } from "@/lib/i18n-helpers";
import { backendUrl } from "@/lib/api/client";

interface IntercityRouteCardProps {
  route: IntercityRouteDto;
  sharedRoutes?: SharedRouteDto[];
  defaultServiceType?: "PRIVATE" | "SHARED";
  highlightShared?: boolean;
  onClick?: () => void;
}

export default function IntercityRouteCard({
  route,
  sharedRoutes = [],
  defaultServiceType,
  highlightShared = false,
  onClick,
}: IntercityRouteCardProps) {
  const router = useRouter();
  const { language, t } = useI18n();

  const prefixUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const segments = url.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) return url;
    return `/${language}${url === "/" ? "" : url}`;
  };

  const routeName = useMemo(() => {
    const tr = route.translations?.find((item) => item.locale === language);
    if (tr?.name) return tr.name;
    return `${route.originCity} ⇌ ${route.destinationCity}`;
  }, [route, language]);

  const thumbUrl = useMemo(() => {
    if (!route.thumbnailUrl) return "";
    return route.thumbnailUrl.startsWith("http")
      ? route.thumbnailUrl
      : `${backendUrl}${route.thumbnailUrl}`;
  }, [route.thumbnailUrl]);

  const lowestPrivatePrice = useMemo(() => {
    const activePrices = route.prices?.filter((p) => p.active) ?? [];
    if (activePrices.length === 0) return null;
    const amounts = activePrices
      .map((p) =>
        p.fixedPriceOneWay ||
        p.oneWayPrice ||
        p.basePrice ||
        calcIntercityPrice(route.distanceKm, p.perKmAmount || 0, false)
      )
      .filter((a) => a > 0);
    if (amounts.length === 0) return null;
    return Math.min(...amounts);
  }, [route]);

  const matchedSharedRoute = useMemo(() => {
    if (!sharedRoutes || sharedRoutes.length === 0) return null;
    if (route.linkedSharedRouteId) {
      const found = sharedRoutes.find((s) => s.id === route.linkedSharedRouteId);
      if (found) return found;
    }
    return sharedRoutes.find((s) => s.linkedIntercityRouteId === route.id) || null;
  }, [route, sharedRoutes]);

  const lowestSharedPrice = useMemo(() => {
    if (!matchedSharedRoute?.directions || matchedSharedRoute.directions.length === 0) {
      return null;
    }
    const activeDirs = matchedSharedRoute.directions.filter(
      (d) => d.active !== false && d.price > 0
    );
    if (activeDirs.length === 0) return null;
    return Math.min(...activeDirs.map((d) => d.price));
  }, [matchedSharedRoute]);

  const hasSharedService = Boolean(
    route.hasSharedRoute || route.linkedSharedRouteId || matchedSharedRoute
  );

  const minPrice = lowestSharedPrice || lowestPrivatePrice;

  const formatPriceNumber = (value: number | null) => {
    if (!value || value <= 0) return t.common?.contact || "Liên hệ";
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    const slug = resolveLocalizedSlug(route.translations, language) || route.id;
    const query = defaultServiceType === "SHARED"
      ? "?serviceType=SHARED"
      : defaultServiceType === "PRIVATE"
        ? "?serviceType=PRIVATE"
        : "";
    router.push(prefixUrl(`/intercity/${slug}${query}`));
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-white dark:bg-[var(--bg-card)] border rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full ${highlightShared
          ? "border-amber-500/40 hover:border-amber-500 dark:border-amber-500/30"
          : "border-slate-200/80 dark:border-slate-800/80 hover:border-accent"
        }`}
    >
      {/* Cover Image Header (Image 3 compact style) */}
      <div className="relative h-40 sm:h-44 w-full overflow-hidden shrink-0 bg-slate-100 dark:bg-[var(--bg-elevated)]">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={routeName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-accent/10 flex items-center justify-center">
            <MapPin size={28} className="text-accent/40" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Top-Left: Distance & Time Badge */}
        <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
          {route.distanceKm && <span>{route.distanceKm} km</span>}
          {route.distanceKm && route.estimatedHours && <span>·</span>}
          {route.estimatedHours && (
            <span className="flex items-center gap-1">
              <Clock size={10} className="text-accent" />
              ~{route.estimatedHours}h
            </span>
          )}
        </div>

        {/* Top-Right: Badges for available services */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          {hasSharedService && (
            <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
              <Users size={10} />
              {t.rentCar.sharedService}
            </span>
          )}
          <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
            <Car size={10} />
            {t.rentCar.privateService}
          </span>
        </div>
      </div>

      {/* Card Body (Image 3 compact layout) */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          {/* Subtitle / Category & Destination (Like Image 3) */}
          <div className="flex items-center gap-1 text-[11px] text-foreground/60 truncate font-medium">
            <MapPin size={11} className="text-accent shrink-0" />
            <span className="truncate">{route.originCity} • {route.destinationCity}</span>
          </div>

          {/* Route Title (2 lines max) */}
          <h3 className="font-bold text-sm sm:text-[15px] text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors">
            {routeName}
          </h3>

          {/* Tags (Image 3 style) */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/5 dark:bg-[var(--bg-elevated)] text-foreground/70">
              {t.tours?.hotelPickup || "Đón tận nơi"}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/5 dark:bg-[var(--bg-elevated)] text-foreground/70">
              {t.tours?.freeCancellation || "Miễn phí huỷ"}
            </span>
            {hasSharedService && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {t.rentCar.sharedService}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Section: Price */}
        <div className="pt-2 border-t border-border space-y-1.5">

          {/* Price & View arrow */}
          <div className="flex items-baseline justify-between pt-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-foreground">₫</span>
              <span className="text-base sm:text-lg font-black text-foreground tracking-tight">
                {formatPriceNumber(minPrice)}
              </span>
            </div>

            <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-[var(--bg-elevated)] group-hover:bg-accent group-hover:text-accent-foreground flex items-center justify-center transition-all text-foreground/60 group-hover:translate-x-0.5">
              <ArrowRight size={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
