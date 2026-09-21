"use client";

import React from "react";
import Link from "next/link";
import {
  Plane,
  Users,
  Briefcase,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useI18n } from "@/context/LanguageContext";
import { formatPriceSync } from "@/lib/format";
import { HomeSectionHeader } from "./HomeSectionHeader";
import type { AirportPackageCard } from "@/lib/airport-packages";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Resolve a per-locale value with fallback vi → en → first available. */
function pickLocal<T>(
  map: Record<string, T> | undefined,
  lang: string,
): T | undefined {
  if (!map) return undefined;
  return map[lang] ?? map.vi ?? map.en ?? map.ko ?? map.ru ?? Object.values(map)[0];
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface HomeAirportTransferSectionProps {
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
  packages?: AirportPackageCard[];
  className?: string;
}

export function HomeAirportTransferSection({
  title,
  subtitle,
  viewAllLink = "/airport-transfer",
  viewAllText,
  packages = [],
  className = "",
}: HomeAirportTransferSectionProps) {
  const { t, language } = useI18n();

  const resolvedTitle = title ?? t.airportTransfer.title;
  const resolvedSubtitle = subtitle ?? t.airportTransfer.subtitle;
  const resolvedViewAllText = viewAllText;
  const resolvedViewAllLink = viewAllLink.startsWith("/")
    ? `/${language}${viewAllLink}`
    : viewAllLink;

  return (
    <section className={`w-full py-8 ${className}`}>
      <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <HomeSectionHeader
          title={resolvedTitle}
          subtitle={resolvedSubtitle}
          viewAllLink={resolvedViewAllLink}
          viewAllText={resolvedViewAllText}
          showArrows={false}
        />

        {/* Packages Grid */}
        {packages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {packages.map((pkg) => {
              const name = pickLocal(pkg.name, language) || pkg.categoryCode || "";
              const category = pickLocal(pkg.category, language);
              const tag = pickLocal(pkg.tag, language);
              const capacity = pickLocal(pkg.capacityText, language);
              const luggage = pickLocal(pkg.luggageText, language);
              const features = pickLocal(pkg.features, language);
              const bookingHref = `/${language}/airport-transfer?pickup=${t.airportTransfer.camRanhAirport}&destination=${t.airportTransfer.nhaTrangCenter}&direction=to-nhatrang`;

              return (
                <div
                  key={pkg.id}
                  className="group flex flex-col bg-surface rounded-2xl border border-separator/70 hover:border-accent/40 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted shrink-0">
                    <img
                      src={pkg.imageUrl}
                      alt={name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Tag */}
                    {tag && (
                      <div className="absolute top-2.5 left-2.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black tracking-wider uppercase bg-accent text-accent-foreground shadow-sm">
                          <Sparkles size={11} />
                          <span>{tag}</span>
                        </span>
                      </div>
                    )}

                    {/* Seats & Luggage Badges */}
                    {(capacity || luggage) && (
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs font-bold">
                        {capacity && (
                          <span className="flex items-center gap-1 drop-shadow-md">
                            <Users size={12} />
                            <span>{capacity}</span>
                          </span>
                        )}
                        {luggage && (
                          <span className="flex items-center gap-1 drop-shadow-md">
                            <Briefcase size={12} />
                            <span>{luggage}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      {category && (
                        <span className="text-xs font-extrabold text-accent uppercase tracking-wider block mb-1">
                          {category}
                        </span>
                      )}
                      <h3 className="font-extrabold text-sm text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                        {name}
                      </h3>

                      {/* Features list */}
                      {features && features.length > 0 && (
                        <div className="mt-3 space-y-1.5 pt-2 border-t border-separator/40">
                          {features.map((feat: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 text-xs text-foreground/70 font-medium"
                            >
                              <CheckCircle2
                                size={12}
                                className="text-emerald-500 shrink-0"
                              />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pricing & Action */}
                    <div className="pt-3 border-t border-separator/50 flex items-center justify-between">
                      <div>
                        {pkg.minPrice != null && (
                          <div className="flex items-baseline gap-1">
                            <span className="text-base sm:text-lg font-black text-accent tracking-tight">
                              {formatPriceSync(pkg.minPrice, language)}
                            </span>
                            <span className="text-xs font-bold text-foreground/60">
                              {t.airportTransfer.priceUnit}
                            </span>
                          </div>
                        )}
                      </div>

                      <Link
                        href={bookingHref}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-black bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm transition-all cursor-pointer"
                      >
                        <span>{t.airportTransfer.bookNow}</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeAirportTransferSection;
