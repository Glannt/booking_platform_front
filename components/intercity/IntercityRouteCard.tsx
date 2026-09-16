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

  const formatPrice = (value: number) => _formatPrice(value, language);

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
      className={`group relative bg-white dark:bg-[var(--bg-surface)] border rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full ${
        highlightShared
          ? "border-amber-500/40 hover:border-amber-500 dark:border-amber-500/30"
          : "border-slate-200 dark:border-slate-800 hover:border-accent"
      }`}
    >
      {/* Cover Image Header */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden shrink-0 bg-slate-100 dark:bg-[var(--bg-elevated)]">
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
            <MapPin size={32} className="text-accent/40" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

        {/* Top-Left: Distance & Time Badge */}
        <div className="absolute top-3 left-3 bg-black/65 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          {route.distanceKm && <span>{route.distanceKm} km</span>}
          {route.distanceKm && route.estimatedHours && <span>·</span>}
          {route.estimatedHours && (
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-accent" />
              ~{route.estimatedHours}h
            </span>
          )}
        </div>

        {/* Top-Right: Badges for available services */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {hasSharedService && (
            <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              <Users size={11} />
              {t.rentCar.sharedService}
            </span>
          )}
          <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
            <Car size={11} />
            {t.rentCar.privateService}
          </span>
        </div>

        {/* Bottom of Image: Origin -> Destination */}
        <div className="absolute bottom-3 left-3 right-3 text-white flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 truncate drop-shadow-sm">
            <MapPin size={13} className="text-accent shrink-0" />
            <span className="truncate">{route.originCity} → {route.destinationCity}</span>
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-accent transition-colors line-clamp-1 leading-snug">
            {routeName}
          </h3>
        </div>

        {/* Dual Pricing Box - Show 2 loại dịch vụ: Xe riêng & Xe ghép */}
        <div className="bg-slate-50 dark:bg-[var(--bg-card)] rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800/80 space-y-2.5">
          {/* Row 1: Xe riêng */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Car size={14} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                {t.rentCar.privateService}
              </span>
            </div>
            <div className="text-right shrink-0">
              {lowestPrivatePrice ? (
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mr-1">
                    {t.rentCar.priceFrom}
                  </span>
                  {formatPrice(lowestPrivatePrice)}
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  {t.common?.contact || "Liên hệ"}
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200/60 dark:border-slate-700/50" />

          {/* Row 2: Vé xe ghép */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Users size={14} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                {t.rentCar.sharedService}
              </span>
            </div>
            <div className="text-right shrink-0">
              {lowestSharedPrice ? (
                <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mr-1">
                    {t.rentCar.priceFrom}
                  </span>
                  {formatPrice(lowestSharedPrice)}
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-0.5">
                    {t.rentCar.perTicket}
                  </span>
                </span>
              ) : hasSharedService ? (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {t.common?.contact || "Liên hệ"}
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 italic">
                  {t.rentCar.sharedNotAvailable}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-accent transition-colors flex items-center gap-1">
            {t.rentCar.viewDetails}
          </span>
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[var(--bg-elevated)] group-hover:bg-accent group-hover:text-white flex items-center justify-center transition-all text-slate-500 dark:text-slate-300 group-hover:translate-x-1">
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
