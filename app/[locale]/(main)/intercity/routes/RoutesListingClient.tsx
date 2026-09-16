"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Search,
  ArrowUpDown,
  Car,
  Users,
} from "lucide-react";
import { Button, Skeleton, Input, Select, ListBox, Label, Pagination } from "@heroui/react";

import { useI18n } from "@/context/LanguageContext";
import { getActiveIntercityRoutes, type IntercityRouteDto, type IntercityRoutePriceDto } from "@/lib/api/intercity";
import { getSharedRoutes, type SharedRouteDto } from "@/lib/api/sharedRoute";
import { getVehicleCategories, type VehicleCategoryDto } from "@/lib/api/fleet";
import IntercityRouteCard from "@/components/intercity/IntercityRouteCard";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { calcIntercityPrice } from "@/lib/pricing";
import { resolveLocalizedSlug } from "@/lib/i18n-helpers";
import { backendUrl } from "@/lib/api/client";
import type { SectionDto } from "@/lib/api/sections";

type ServiceFilter = "all" | "private" | "shared";
type SortPrice = "asc" | "desc" | null;

const PAGE_SIZE = 6;

interface RoutesListingClientProps {
  sections: SectionDto[];
}

export default function RoutesListingClient({ sections }: RoutesListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useI18n();

  const prefixUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const segments = url.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) return url;
    return `/${language}${url === "/" ? "" : url}`;
  };

  const serviceParam = searchParams.get("service") || searchParams.get("serviceType") || searchParams.get("tab");
  const initialFilter: ServiceFilter =
    serviceParam?.toLowerCase() === "shared"
      ? "shared"
      : serviceParam?.toLowerCase() === "private"
      ? "private"
      : "all";

  const [routes, setRoutes] = useState<IntercityRouteDto[]>([]);
  const [sharedRoutes, setSharedRoutes] = useState<SharedRouteDto[]>([]);
  const [catMap, setCatMap] = useState<Map<number, VehicleCategoryDto>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>(initialFilter);
  const [sortPrice, setSortPrice] = useState<SortPrice>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const param = searchParams.get("service") || searchParams.get("serviceType") || searchParams.get("tab");
    if (param?.toLowerCase() === "shared") {
      setServiceFilter("shared");
    } else if (param?.toLowerCase() === "private") {
      setServiceFilter("private");
    } else if (param?.toLowerCase() === "all") {
      setServiceFilter("all");
    }
  }, [searchParams]);

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
        const [routesRes, catsRes, sharedRes] = await Promise.allSettled([
          getActiveIntercityRoutes(),
          getVehicleCategories({ active: true, page: 0, size: 100 }),
          getSharedRoutes(true),
        ]);
        if (!active) return;
        if (routesRes.status === "fulfilled") {
          setRoutes((routesRes.value?.data ?? []) as IntercityRouteDto[]);
        }
        if (catsRes.status === "fulfilled") {
          const cats = (catsRes.value?.data?.content ?? []) as VehicleCategoryDto[];
          const map = new Map<number, VehicleCategoryDto>();
          cats.forEach((c) => map.set(c.id, c));
          setCatMap(map);
        }
        if (sharedRes.status === "fulfilled") {
          setSharedRoutes(sharedRes.value ?? []);
        }
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
    return Math.min(...active.map((p) => calcIntercityPrice(r.distanceKm, p.perKmAmount, false)));
  };

  const getLowestRoundTrip = (r: IntercityRouteDto) => {
    const active = r.prices?.filter((p) => p.active) ?? [];
    if (active.length === 0) return Infinity;
    return Math.min(...active.map((p) => p.fixedPriceOneWay || p.oneWayPrice || p.basePrice || calcIntercityPrice(r.distanceKm, p.perKmAmount || 0, true)));
  };

  const getCheapestWithSeatInfo = (r: IntercityRouteDto) => {
    const active = r.prices?.filter((p) => p.active) ?? [];
    if (active.length === 0) return null;
    const sorted = [...active].sort((a, b) => {
      const priceA = a.fixedPriceOneWay || a.oneWayPrice || a.basePrice || calcIntercityPrice(r.distanceKm, a.perKmAmount || 0, false);
      const priceB = b.fixedPriceOneWay || b.oneWayPrice || b.basePrice || calcIntercityPrice(r.distanceKm, b.perKmAmount || 0, false);
      return priceA - priceB;
    });
    const cheapest = sorted[0];
    const cat = catMap.get(cheapest.vehicleCategoryId);
    const seatLabel = cat ? `${cat.minSeat}-${cat.maxSeat}` : null;
    const lowestPrice = cheapest.fixedPriceOneWay || cheapest.oneWayPrice || cheapest.basePrice || calcIntercityPrice(r.distanceKm, cheapest.perKmAmount || 0, false);
    return { price: lowestPrice, seatLabel, categoryId: cheapest.vehicleCategoryId };
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

    if (serviceFilter === "private") {
      result = result.filter((r) => {
        const prices = r.prices?.filter((p) => p.active) ?? [];
        return prices.length > 0;
      });
    } else if (serviceFilter === "shared") {
      result = result.filter((r) =>
        Boolean(
          r.hasSharedRoute ||
          r.linkedSharedRouteId ||
          sharedRoutes.some((s) => s.linkedIntercityRouteId === r.id || s.id === r.linkedSharedRouteId)
        )
      );
    }

    if (sortPrice === "asc") {
      result.sort((a, b) => getLowestOneWay(a) - getLowestOneWay(b));
    } else if (sortPrice === "desc") {
      result.sort((a, b) => getLowestOneWay(b) - getLowestOneWay(a));
    }

    return result;
  }, [routes, search, serviceFilter, sortPrice, sharedRoutes, language]);

  const sharedCount = useMemo(() => {
    return routes.filter((r) =>
      Boolean(
        r.hasSharedRoute ||
        r.linkedSharedRouteId ||
        sharedRoutes.some((s) => s.linkedIntercityRouteId === r.id || s.id === r.linkedSharedRouteId)
      )
    ).length;
  }, [routes, sharedRoutes]);

  const privateCount = useMemo(() => {
    return routes.filter((r) => (r.prices?.filter((p) => p.active) ?? []).length > 0).length;
  }, [routes]);

  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const displayedRoutes = filteredRoutes.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, serviceFilter, sortPrice]);

  const hasActiveFilter = search.trim() || serviceFilter !== "all" || sortPrice !== null;

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
        <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-10 relative z-10 text-white space-y-4">
          <Button
            onClick={() => router.push(prefixUrl("/intercity"))}
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
      <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
        <div className="bg-white dark:bg-[var(--bg-surface)] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={t.rentCar.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-10 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 text-xs font-semibold"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap bg-slate-100 dark:bg-[var(--bg-card)] p-1.5 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setServiceFilter("all")}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                  serviceFilter === "all"
                    ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-transparent"
                }`}
              >
                <span>{t.common.all}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-[var(--bg-elevated)] font-semibold">
                  {routes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setServiceFilter("private")}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                  serviceFilter === "private"
                    ? "bg-white dark:bg-[var(--bg-surface)] text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-transparent"
                }`}
              >
                <Car size={13} />
                <span>{t.rentCar.privateService}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-[var(--bg-elevated)] font-semibold">
                  {privateCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setServiceFilter("shared")}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                  serviceFilter === "shared"
                    ? "bg-white dark:bg-[var(--bg-surface)] text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-transparent"
                }`}
              >
                <Users size={13} />
                <span>{t.rentCar.sharedService}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-[var(--bg-elevated)] font-semibold">
                  {sharedCount}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown size={14} className="text-slate-400 shrink-0" />
                <Select
                  selectedKey={sortPrice ?? undefined}
                  onSelectionChange={(key) => setSortPrice((key as SortPrice) ?? null)}
                  className="min-w-[130px] w-auto"
                >
                  <Label className="sr-only">{t.rentCar.sortPrice}</Label>
                  <Select.Trigger className="h-9 px-3 text-xs font-bold bg-slate-100 dark:bg-[var(--bg-card)] text-slate-600 dark:text-slate-300 rounded-xl border-none cursor-pointer flex items-center justify-between gap-2 whitespace-nowrap">
                    <Select.Value className="text-xs font-bold">{t.rentCar.sortPrice}</Select.Value>
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50 min-w-[130px]">
                    <ListBox>
                      <ListBox.Item key="asc" id="asc" textValue={t.rentCar.sortPriceAsc} className="px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)]">
                        {t.rentCar.sortPriceAsc}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item key="desc" id="desc" textValue={t.rentCar.sortPriceDesc} className="px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)]">
                        {t.rentCar.sortPriceDesc}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              {hasActiveFilter && (
                <button
                  onClick={() => { setSearch(""); setServiceFilter("all"); setSortPrice(null); }}
                  className="text-xs font-bold text-accent hover:text-accent-hover cursor-pointer border-none bg-transparent"
                >
                  {t.rentCar.clearFilters}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Route Cards */}
      <main className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 pb-16 flex-1">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] p-5 space-y-4">
                <Skeleton className="h-52 w-full rounded-2xl" />
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-4 w-1/3 rounded-lg" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedRoutes.map((route) => (
                <IntercityRouteCard
                  key={route.id}
                  route={route}
                  sharedRoutes={sharedRoutes}
                  defaultServiceType={
                    serviceFilter === "shared"
                      ? "SHARED"
                      : serviceFilter === "private"
                      ? "PRIVATE"
                      : undefined
                  }
                  highlightShared={serviceFilter === "shared"}
                />
              ))}
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
