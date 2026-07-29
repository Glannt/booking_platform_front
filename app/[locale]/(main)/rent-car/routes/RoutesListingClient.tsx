"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { Button, Skeleton, Input, Select, ListBox, Label, Pagination } from "@heroui/react";

import { useI18n } from "@/context/LanguageContext";
import { getActiveIntercityRoutes, type IntercityRouteDto, type IntercityRoutePriceDto } from "@/lib/api/rental";
import { getVehicleCategories, type VehicleCategoryDto } from "@/lib/api/fleet";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { backendUrl } from "@/lib/api/client";
import type { SectionDto } from "@/lib/api/sections";

type Direction = "all" | "one-way" | "round-trip";
type SortPrice = "asc" | "desc" | null;

const PAGE_SIZE = 6;

interface RoutesListingClientProps {
  sections: SectionDto[];
}

export default function RoutesListingClient({ sections }: RoutesListingClientProps) {
  const router = useRouter();
  const { language, t } = useI18n();

  const prefixUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const segments = url.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) return url;
    return `/${language}${url === "/" ? "" : url}`;
  };

  const [routes, setRoutes] = useState<IntercityRouteDto[]>([]);
  const [catMap, setCatMap] = useState<Map<number, VehicleCategoryDto>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<Direction>("all");
  const [sortPrice, setSortPrice] = useState<SortPrice>(null);
  const [page, setPage] = useState(1);

  const formatPrice = (value: number) => _formatPrice(value, language);

  const getRouteName = (r: IntercityRouteDto) => {
    const tr = r.translations?.find((t) => t.locale === language);
    if (tr?.name) return tr.name;
    return `${r.originCity} ⇌ ${r.destinationCity}`;
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [routesRes, catsRes] = await Promise.all([
          getActiveIntercityRoutes(),
          getVehicleCategories({ active: true, page: 0, size: 100 }),
        ]);
        if (!active) return;
        setRoutes((routesRes?.data ?? []) as IntercityRouteDto[]);
        const cats = (catsRes?.data?.content ?? []) as VehicleCategoryDto[];
        const map = new Map<number, VehicleCategoryDto>();
        cats.forEach((c) => map.set(c.id, c));
        setCatMap(map);
      } catch (err) {
        console.error("Failed to load routes:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const getLowestOneWay = (r: IntercityRouteDto) => {
    const active = r.prices?.filter((p) => p.active) ?? [];
    if (active.length === 0) return Infinity;
    return Math.min(...active.map((p) => p.oneWayAmount));
  };

  const getLowestRoundTrip = (r: IntercityRouteDto) => {
    const active = r.prices?.filter((p) => p.active) ?? [];
    if (active.length === 0) return Infinity;
    return Math.min(...active.map((p) => p.roundTripAmount));
  };

  const getCheapestWithSeatInfo = (r: IntercityRouteDto) => {
    const active = r.prices?.filter((p) => p.active) ?? [];
    if (active.length === 0) return null;
    const sorted = [...active].sort((a, b) => a.oneWayAmount - b.oneWayAmount);
    const cheapest = sorted[0];
    const cat = catMap.get(cheapest.vehicleCategoryId);
    const seatLabel = cat ? `${cat.minSeat}-${cat.maxSeat}` : null;
    return { price: cheapest.oneWayAmount, seatLabel, categoryId: cheapest.vehicleCategoryId };
  };

  const filteredRoutes = useMemo(() => {
    let result = [...routes];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) => {
        const name = getRouteName(r).toLowerCase();
        return (
          name.includes(q) ||
          r.originCity.toLowerCase().includes(q) ||
          r.destinationCity.toLowerCase().includes(q)
        );
      });
    }

    if (direction === "one-way") {
      result = result.filter((r) => {
        const prices = r.prices?.filter((p) => p.active) ?? [];
        return prices.some((p) => p.oneWayAmount > 0);
      });
    } else if (direction === "round-trip") {
      result = result.filter((r) => {
        const prices = r.prices?.filter((p) => p.active) ?? [];
        return prices.some((p) => p.roundTripAmount > 0);
      });
    }

    if (sortPrice === "asc") {
      result.sort((a, b) => getLowestOneWay(a) - getLowestOneWay(b));
    } else if (sortPrice === "desc") {
      result.sort((a, b) => getLowestOneWay(b) - getLowestOneWay(a));
    }

    return result;
  }, [routes, search, direction, sortPrice, language]);

  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const displayedRoutes = filteredRoutes.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, direction, sortPrice]);

  const hasActiveFilter = search.trim() || direction !== "all" || sortPrice !== null;

  const heroSection = sections.find((s) => s.sectionType === "HERO_BANNER");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">

      {/* Header */}
      <section
        className="relative w-full bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden"
        style={heroSection?.bgColor ? { backgroundColor: heroSection.bgColor } : undefined}
      >
        {heroSection?.imageUrls?.[0] && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url('${heroSection.imageUrls[0]}')` }}
          />
        )}
        <div className="max-w-7xl mx-auto w-full px-6 py-10 relative z-10 text-white space-y-4">
          <Button
            onClick={() => router.push(prefixUrl("/rent-car"))}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 border-none rounded-full px-4 py-2 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>{t.common.goBack}</span>
          </Button>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              {heroSection?.translations?.find((tr) => tr.locale === language)?.title
                ?? t.rentCar.intercityRoutes}
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              {filteredRoutes.length} {t.rentCar.routeCount}
              {hasActiveFilter && ` · ${t.rentCar.filtered}`}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6">
        <div className="bg-white dark:bg-black rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={t.rentCar.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-10 rounded-xl bg-slate-50 dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 text-xs font-semibold"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-[var(--bg-surface)] p-1 rounded-xl">
              {(["all", "one-way", "round-trip"] as Direction[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer border-none ${direction === d
                    ? "bg-white dark:bg-[var(--bg-card)] text-accent shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                    }`}
                >
                  {d === "all" ? t.common.all : d === "one-way" ? t.rentCar.oneWay : t.rentCar.roundTrip}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={14} className="text-slate-400" />
              <Select
                selectedKey={sortPrice ?? undefined}
                onSelectionChange={(key) => setSortPrice((key as SortPrice) ?? null)}
                className="w-26"
              >
                <Label className="sr-only">{t.rentCar.sortPrice}</Label>
                <Select.Trigger className="h-8 px-3 text-[10px] font-bold bg-slate-100 dark:bg-[var(--bg-surface)] text-slate-600 dark:text-slate-300 rounded-lg border-none cursor-pointer">
                  <Select.Value className={`text-xs`}>{t.rentCar.sortPrice}</Select.Value>
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50">
                  <ListBox>
                    <ListBox.Item key="asc" id="asc" textValue={t.rentCar.sortPriceAsc} className="px-3 py-2 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                      {t.rentCar.sortPriceAsc}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item key="desc" id="desc" textValue={t.rentCar.sortPriceDesc} className="px-3 py-2 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                      {t.rentCar.sortPriceDesc}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            {hasActiveFilter && (
              <button
                onClick={() => { setSearch(""); setDirection("all"); setSortPrice(null); }}
                className="text-[10px] font-bold text-accent hover:text-accent-hover cursor-pointer border-none bg-transparent"
              >
                {t.rentCar.clearFilters}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Route Cards */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 pb-16 flex-1">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-9 h-9 rounded-xl" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32 rounded-lg" />
                    <Skeleton className="h-3 w-24 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-3 w-40 rounded-lg" />
                <Skeleton className="h-4 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        ) : displayedRoutes.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <MapPin size={32} className="text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-500">
              {t.rentCar.noRoutes}
            </p>
            <p className="text-xs text-slate-400">
              {t.rentCar.noRoutesDesc}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedRoutes.map((route) => {
                const routeName = getRouteName(route);
                const thumbUrl = route.thumbnailUrl
                  ? (route.thumbnailUrl.startsWith("http") ? route.thumbnailUrl : `${backendUrl}${route.thumbnailUrl}`)
                  : "";
                return (
                  <div
                    key={route.id}
                    className="group relative bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:border-accent hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col md:flex-row"
                    onClick={() => router.push(prefixUrl(`/rent-car/${route.id}`))}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-40 md:h-auto md:w-36 shrink-0 overflow-hidden">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={routeName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                          <MapPin size={24} className="text-accent/40" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div className="space-y-2">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
                          {routeName}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold truncate">
                          {route.originCity} → {route.destinationCity}
                        </p>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-slate-400">
                          {route.distanceKm && <span>{route.distanceKm} km</span>}
                          {route.estimatedHours && <span>~{route.estimatedHours}h</span>}
                          {route.hasDepartureTimes && route.departureTimes?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {route.departureTimes.length} {t.rentCar.tripsPerDay}
                            </span>
                          )}
                        </div>

                        {route.prices && route.prices.filter(p => p.active).length > 0 && (() => {
                          const cheapest = getCheapestWithSeatInfo(route);
                          if (!cheapest) return null;
                          return (
                            <div className="space-y-1.5 pt-1">
                              <p className="text-sm font-black text-accent">
                                {t.rentCar.priceFrom}{" "}
                                {formatPrice(cheapest.price)}
                                {cheapest.seatLabel && (
                                  <span className="text-[10px] font-bold text-slate-400 ml-1">
                                    {` / ${cheapest.seatLabel}-${t.rentCar.seater}`}
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 font-semibold">
                                {t.rentCar.otherVehiclesHint}
                              </p>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-accent transition-colors">
                          {t.rentCar.viewDetails}
                        </span>
                        {/* <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full group-hover:bg-accent group-hover:text-white transition-colors">
                          {t.rentCar.viewRepresentativeVehicles}
                        </span> */}
                        <ArrowLeft size={14} className="text-slate-300 group-hover:text-accent group-hover:-translate-x-1 transition-all rotate-180" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center pt-8">
                <Pagination size="sm">
                  <Pagination.Summary>
                    {`${safePage} / ${totalPages} ${t.common.page}`}
                  </Pagination.Summary>
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.Previous isDisabled={safePage <= 1} onPress={() => setPage(Math.max(1, safePage - 1))}>
                        <Pagination.PreviousIcon />
                      </Pagination.Previous>
                    </Pagination.Item>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Pagination.Item key={p}>
                        <Pagination.Link isActive={p === safePage} onPress={() => setPage(p)}>{p}</Pagination.Link>
                      </Pagination.Item>
                    ))}
                    <Pagination.Item>
                      <Pagination.Next isDisabled={safePage >= totalPages} onPress={() => setPage(Math.min(totalPages, safePage + 1))}>
                        <Pagination.NextIcon />
                      </Pagination.Next>
                    </Pagination.Item>
                  </Pagination.Content>
                </Pagination>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
