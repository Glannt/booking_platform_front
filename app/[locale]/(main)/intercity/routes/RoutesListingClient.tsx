"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Check,
  RotateCcw,
  Calendar as CalendarIcon,
  Car,
  Users,
  ShieldCheck,
} from "lucide-react";
import {
  Button,
  Popover,
  Select,
  ListBox,
  Checkbox,
  Calendar,
  Pagination,
  Skeleton,
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { today, getLocalTimeZone } from "@internationalized/date";

import { useI18n } from "@/context/LanguageContext";
import { getActiveIntercityRoutes, type IntercityRouteDto } from "@/lib/api/intercity";
import { getSharedRoutes, type SharedRouteDto } from "@/lib/api/sharedRoute";
import { getVehicleCategories, type VehicleCategoryDto } from "@/lib/api/fleet";
import IntercityRouteCard from "@/components/intercity/IntercityRouteCard";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { useIntercityRoutePrices, lowestPriceForRoute } from "@/lib/queries/useIntercityPrices";
import { resolveTranslation } from "@/lib/i18n-helpers";
import type { SectionDto } from "@/lib/api/sections";
import { Reveal } from "@/components/Reveal";

type SortOption = "default" | "price_asc" | "price_desc" | "distance_asc";

const PAGE_SIZE = 12;

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

  const heroSection = sections.find((s) => s.sectionType === "HERO_BANNER");

  const initialKeyword = searchParams.get("keyword") || searchParams.get("search") || "";
  const serviceParam = searchParams.get("service") || searchParams.get("serviceType") || searchParams.get("tab");

  const [routes, setRoutes] = useState<IntercityRouteDto[]>([]);
  const [sharedRoutes, setSharedRoutes] = useState<SharedRouteDto[]>([]);
  const [catMap, setCatMap] = useState<Map<number, VehicleCategoryDto>>(new Map());
  const [loading, setLoading] = useState(true);

  // Prices live in price_lists and are fetched once, not derived from distanceKm.
  const { data: prices = [] } = useIntercityRoutePrices();

  // Search & Filter states (matching Tours pattern)
  const [searchQuery, setSearchQuery] = useState(initialKeyword);
  const [selectedOrigin, setSelectedOrigin] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<DateValue | null>(null);

  // Detailed filters inside popover
  const [selectedServices, setSelectedServices] = useState<string[]>(() => {
    if (serviceParam?.toLowerCase() === "shared") return ["shared"];
    if (serviceParam?.toLowerCase() === "private") return ["private"];
    return [];
  });
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedDistances, setSelectedDistances] = useState<string[]>([]);

  // Sorting & Pagination
  const [sortOrder, setSortOrder] = useState<SortOption>("default");
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const kw = searchParams.get("keyword") || searchParams.get("search") || "";
    setSearchQuery(kw);
    const srv = searchParams.get("service") || searchParams.get("serviceType") || searchParams.get("tab");
    if (srv?.toLowerCase() === "shared") setSelectedServices(["shared"]);
    else if (srv?.toLowerCase() === "private") setSelectedServices(["private"]);
  }, [searchParams]);

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
    return () => {
      active = false;
    };
  }, []);

  /** Lowest configured one-way fare from price_lists; Infinity when the route is unpriced. */
  const getLowestOneWay = (r: IntercityRouteDto) =>
    lowestPriceForRoute(prices, r.id!) ?? Infinity;

  // Distinct origin cities for Pill 1
  const originCities = useMemo(() => {
    const set = new Set<string>();
    routes.forEach((r) => {
      if (r.originCity) set.add(r.originCity);
    });
    return Array.from(set).sort();
  }, [routes]);

  // Options for Detailed Filter Popover
  const SERVICE_OPTIONS = [
    { id: "private", label: t.rentCar.privateService || "Xe riêng" },
    { id: "shared", label: t.rentCar.sharedService || "Xe ghép" },
  ];

  const PRICE_OPTIONS = [
    { id: "under_500", label: "Dưới 500.000đ" },
    { id: "500_1500", label: "500.000đ - 1.500.000đ" },
    { id: "over_1500", label: "Trên 1.500.000đ" },
  ];

  const DISTANCE_OPTIONS = [
    { id: "under_100", label: "Dưới 100 km" },
    { id: "100_200", label: "100 km - 200 km" },
    { id: "over_200", label: "Trên 200 km" },
  ];

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setCurrentPage(1);
  };

  const togglePriceRange = (range: string) => {
    setSelectedPriceRanges((prev) =>
      prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range]
    );
    setCurrentPage(1);
  };

  const toggleDistance = (dist: string) => {
    setSelectedDistances((prev) =>
      prev.includes(dist) ? prev.filter((d) => d !== dist) : [...prev, dist]
    );
    setCurrentPage(1);
  };

  const activeFilterCount =
    (selectedOrigin !== "all" ? 1 : 0) +
    (selectedDate ? 1 : 0) +
    selectedServices.length +
    selectedPriceRanges.length +
    selectedDistances.length;

  const handleResetFilters = () => {
    setSelectedOrigin("all");
    setSelectedDate(null);
    setSelectedServices([]);
    setSelectedPriceRanges([]);
    setSelectedDistances([]);
    setSearchQuery("");
    setSortOrder("default");
    setCurrentPage(1);
  };

  // Filter and sort routes
  const filteredAndSortedRoutes = useMemo(() => {
    const list = routes.filter((r) => {
      // 1. Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const name = getRouteName(r).toLowerCase();
        const origin = r.originCity.toLowerCase();
        const dest = r.destinationCity.toLowerCase();
        if (!name.includes(q) && !origin.includes(q) && !dest.includes(q)) return false;
      }

      // 2. Origin City filter
      if (selectedOrigin !== "all") {
        if (r.originCity !== selectedOrigin) return false;
      }

      // 3. Service type filter
      if (selectedServices.length > 0) {
        const hasShared = Boolean(
          r.hasSharedRoute ||
            r.linkedSharedRouteId ||
            sharedRoutes.some((s) => s.linkedIntercityRouteId === r.id || s.id === r.linkedSharedRouteId)
        );
        const hasPrivate = getLowestOneWay(r) !== Infinity;

        const matchShared = selectedServices.includes("shared") && hasShared;
        const matchPrivate = selectedServices.includes("private") && hasPrivate;
        if (!matchShared && !matchPrivate) return false;
      }

      // 4. Price range filter
      if (selectedPriceRanges.length > 0) {
        const minP = getLowestOneWay(r);
        if (minP !== Infinity) {
          const matchUnder500 = selectedPriceRanges.includes("under_500") && minP <= 500000;
          const match500to1500 =
            selectedPriceRanges.includes("500_1500") && minP > 500000 && minP <= 1500000;
          const matchOver1500 = selectedPriceRanges.includes("over_1500") && minP > 1500000;
          if (!matchUnder500 && !match500to1500 && !matchOver1500) return false;
        }
      }

      // 5. Distance filter
      if (selectedDistances.length > 0) {
        const dist = r.distanceKm || 0;
        const matchUnder100 = selectedDistances.includes("under_100") && dist <= 100;
        const match100to200 = selectedDistances.includes("100_200") && dist > 100 && dist <= 200;
        const matchOver200 = selectedDistances.includes("over_200") && dist > 200;
        if (!matchUnder100 && !match100to200 && !matchOver200) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortOrder === "price_asc") {
        return getLowestOneWay(a) - getLowestOneWay(b);
      }
      if (sortOrder === "price_desc") {
        return getLowestOneWay(b) - getLowestOneWay(a);
      }
      if (sortOrder === "distance_asc") {
        return (a.distanceKm || 0) - (b.distanceKm || 0);
      }
      return 0;
    });
  }, [
    routes,
    searchQuery,
    selectedOrigin,
    selectedServices,
    selectedPriceRanges,
    selectedDistances,
    sortOrder,
    sharedRoutes,
    language,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRoutes.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRoutes = filteredAndSortedRoutes.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Banner Section (Tours Image 1 style) */}
      <Reveal as="section" variant="fade" className="relative w-full min-h-[300px] md:min-h-[340px] flex flex-col justify-center items-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-black/90 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: heroSection?.imageUrls?.[0]
              ? `url('${heroSection.imageUrls[0]}')`
              : "url('/dcar-2.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-[1px]" />
        </div>

        <div className="max-w-3xl mx-auto w-full relative z-10 text-white flex flex-col items-center text-center gap-4">
          <button
            type="button"
            onClick={() => router.push(prefixUrl("/intercity"))}
            className="self-start sm:self-center flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft size={13} />
            <span>{t.common.goBack || "Quay lại"}</span>
          </button>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
            {resolveTranslation(heroSection?.translations, language)?.title || t.rentCar.intercityRoutes || "Tuyến đường liên tỉnh"}
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl font-medium">
            {resolveTranslation(heroSection?.translations, language)?.description ||
              t.rentCar.intercityRoutesDesc ||
              "Khám phá các tuyến đường liên tỉnh từ Nha Trang với tài xế chuyên nghiệp."}
          </p>

          {/* Clean Pill Search Bar (Tours pattern) */}
          <div className="w-full max-w-xl relative mt-2">
            <div className="relative flex items-center">
              <Search size={18} className="absolute left-4.5 text-foreground/50 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t.rentCar.searchPlaceholder || "Tìm tuyến theo tên hoặc thành phố..."}
                className="w-full h-11 sm:h-12 pl-12 pr-10 rounded-full bg-white dark:bg-[var(--bg-surface)] text-foreground placeholder:text-foreground/40 text-xs sm:text-sm font-semibold shadow-lg border border-white/20 dark:border-border outline-none focus:ring-2 focus:ring-accent transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 text-foreground/50 hover:text-foreground cursor-pointer bg-transparent border-none p-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {/* Main Listing Area */}
      <main className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 flex-1 flex flex-col gap-5">
        {/* Top Filters Bar (Tours pattern) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex flex-wrap items-center gap-2">
            {/* Pill 1: Điểm khởi hành ∨ */}
            <Popover>
              <Button
                type="button"
                variant="outline"
                className={`h-9 px-4 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedOrigin !== "all"
                    ? "border-accent bg-accent/10 text-accent font-black"
                    : "border-border bg-white dark:bg-[var(--bg-card)] hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] text-foreground"
                }`}
              >
                <MapPin size={13} className={selectedOrigin !== "all" ? "text-accent" : "text-foreground/50"} />
                <span>
                  {selectedOrigin !== "all"
                    ? `Từ: ${selectedOrigin}`
                    : t.rentCar.departure || "Điểm khởi hành"}
                </span>
                <ChevronDown size={13} />
              </Button>
              <Popover.Content
                placement="bottom start"
                className="w-56 p-2 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-border shadow-2xl z-50"
              >
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrigin("all");
                      setCurrentPage(1);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer border-none ${
                      selectedOrigin === "all"
                        ? "bg-accent/10 text-accent font-bold"
                        : "hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] text-foreground"
                    }`}
                  >
                    <span>{t.common.all || "Tất cả điểm đi"}</span>
                    {selectedOrigin === "all" && <Check size={14} className="text-accent shrink-0" />}
                  </button>
                  {originCities.map((city) => {
                    const isSelected = selectedOrigin === city;
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setSelectedOrigin(city);
                          setCurrentPage(1);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer border-none ${
                          isSelected
                            ? "bg-accent/10 text-accent font-bold"
                            : "hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] text-foreground"
                        }`}
                      >
                        <span>{city}</span>
                        {isSelected && <Check size={14} className="text-accent shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </Popover.Content>
            </Popover>

            {/* Pill 2: Ngày khả dụng ∨ */}
            <Popover>
              <Button
                type="button"
                variant="outline"
                className={`h-9 px-4 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedDate
                    ? "border-accent bg-accent/10 text-accent font-black"
                    : "border-border bg-white dark:bg-[var(--bg-card)] hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] text-foreground"
                }`}
              >
                <CalendarIcon size={13} className={selectedDate ? "text-accent" : "text-foreground/50"} />
                <span>
                  {selectedDate
                    ? `${selectedDate.day}/${selectedDate.month}/${selectedDate.year}`
                    : t.rentCar.date || "Ngày khả dụng"}
                </span>
                <ChevronDown size={13} />
              </Button>
              <Popover.Content
                placement="bottom start"
                className="p-3 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-border shadow-2xl z-50"
              >
                <Calendar
                  aria-label="Chọn ngày khởi hành"
                  value={selectedDate as any}
                  onChange={(d) => {
                    if (d) setSelectedDate(d as DateValue);
                    setCurrentPage(1);
                  }}
                  minValue={today(getLocalTimeZone()) as any}
                >
                  <Calendar.Header className="flex items-center justify-between mb-2">
                    <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                      <Calendar.YearPickerTriggerHeading />
                      <Calendar.YearPickerTriggerIndicator />
                    </Calendar.YearPickerTrigger>
                    <div className="flex gap-1">
                      <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-black/5 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
                      <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-black/5 dark:hover:bg-[var(--bg-card)] cursor-pointer" />
                    </div>
                  </Calendar.Header>
                  <Calendar.Grid className="w-full">
                    <Calendar.GridHeader className="text-[10px] font-bold text-foreground/50">
                      {(day) => <Calendar.HeaderCell className="w-8 h-8 text-center">{day}</Calendar.HeaderCell>}
                    </Calendar.GridHeader>
                    <Calendar.GridBody>
                      {(date) => (
                        <Calendar.Cell
                          date={date}
                          className="w-8 h-8 text-xs font-semibold text-center cursor-pointer rounded-lg hover:bg-accent/10 hover:text-accent aria-selected:bg-accent aria-selected:text-accent-foreground"
                        />
                      )}
                    </Calendar.GridBody>
                  </Calendar.Grid>
                </Calendar>
                {selectedDate && (
                  <div className="pt-2 border-t border-border flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(null)}
                      className="text-xs font-bold text-rose-500 hover:underline cursor-pointer border-none bg-transparent"
                    >
                      {t.common.cancel || "Xóa"}
                    </button>
                  </div>
                )}
              </Popover.Content>
            </Popover>
          </div>

          {/* Right: Pill 3: [ Lọc · {count} ] */}
          <Popover>
            <Button
              type="button"
              variant="outline"
              className={`h-9 px-4 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeFilterCount > 0
                  ? "border-accent/80 bg-accent/10 text-accent font-black"
                  : "border-border bg-white dark:bg-[var(--bg-card)] hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] text-foreground"
              }`}
            >
              <SlidersHorizontal size={13} className={activeFilterCount > 0 ? "text-accent" : "text-foreground/50"} />
              <span>{t.rentCar.filtered || "Bộ lọc"}</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <Popover.Content
              placement="bottom end"
              className="w-80 p-0 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-border shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 space-y-4 outline-none">
                {/* Popover Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                      Bộ lọc tuyến xe
                    </h4>
                    <p className="text-[11px] font-medium mt-0.5 text-foreground/70">
                      Đang áp dụng: <span className="font-bold text-accent">{activeFilterCount}</span>
                    </p>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer border-none bg-transparent"
                    >
                      <RotateCcw size={11} />
                      <span>{t.rentCar.clearFilters || "Đặt lại"}</span>
                    </button>
                  )}
                </div>

                {/* Section: Service Type */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
                    Loại dịch vụ
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {SERVICE_OPTIONS.map((opt) => (
                      <Checkbox
                        key={opt.id}
                        isSelected={selectedServices.includes(opt.id)}
                        onChange={() => toggleService(opt.id)}
                      >
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Content className="text-xs font-medium text-foreground cursor-pointer">
                          {opt.label}
                        </Checkbox.Content>
                      </Checkbox>
                    ))}
                  </div>
                </div>

                {/* Section: Price Range */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
                    Khoảng giá (1 chiều)
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {PRICE_OPTIONS.map((opt) => (
                      <Checkbox
                        key={opt.id}
                        isSelected={selectedPriceRanges.includes(opt.id)}
                        onChange={() => togglePriceRange(opt.id)}
                      >
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Content className="text-xs font-medium text-foreground cursor-pointer">
                          {opt.label}
                        </Checkbox.Content>
                      </Checkbox>
                    ))}
                  </div>
                </div>

                {/* Section: Distance */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
                    Khoảng cách
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {DISTANCE_OPTIONS.map((opt) => (
                      <Checkbox
                        key={opt.id}
                        isSelected={selectedDistances.includes(opt.id)}
                        onChange={() => toggleDistance(opt.id)}
                      >
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Content className="text-xs font-medium text-foreground cursor-pointer">
                          {opt.label}
                        </Checkbox.Content>
                      </Checkbox>
                    ))}
                  </div>
                </div>
              </div>
            </Popover.Content>
          </Popover>
        </div>

        {/* Results Count & Sorting Row (Tours pattern) */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-sm sm:text-base font-extrabold text-foreground">
            {filteredAndSortedRoutes.length} {t.rentCar.routeCount || "tuyến đường"}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground/60 hidden sm:inline">
              {t.rentCar.sortPrice || "Sắp xếp theo"}
            </span>
            <Select
              aria-label="Sắp xếp theo"
              selectedKey={sortOrder}
              onSelectionChange={(key) => setSortOrder(key as SortOption)}
              className="w-40 sm:w-48"
            >
              <Select.Trigger className="h-9 rounded-xl text-xs font-bold border border-border bg-white dark:bg-[var(--bg-card)] px-3 flex items-center justify-between outline-none cursor-pointer">
                <Select.Value />
                <Select.Indicator>
                  <ChevronDown size={13} />
                </Select.Indicator>
              </Select.Trigger>
              <Select.Popover className="w-[var(--trigger-width)] bg-white dark:bg-[var(--bg-card)] border border-border rounded-xl p-1 shadow-xl z-50">
                <ListBox className="outline-none">
                  <ListBox.Item id="default" textValue="Mặc định" className="px-3 py-2 text-xs font-semibold rounded-lg hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] cursor-pointer">
                    Mặc định
                  </ListBox.Item>
                  <ListBox.Item id="price_asc" textValue={t.rentCar.sortPriceAsc || "Giá thấp → cao"} className="px-3 py-2 text-xs font-semibold rounded-lg hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] cursor-pointer">
                    {t.rentCar.sortPriceAsc || "Giá thấp → cao"}
                  </ListBox.Item>
                  <ListBox.Item id="price_desc" textValue={t.rentCar.sortPriceDesc || "Giá cao → thấp"} className="px-3 py-2 text-xs font-semibold rounded-lg hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] cursor-pointer">
                    {t.rentCar.sortPriceDesc || "Giá cao → thấp"}
                  </ListBox.Item>
                  <ListBox.Item id="distance_asc" textValue="Khoảng cách gần nhất" className="px-3 py-2 text-xs font-semibold rounded-lg hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] cursor-pointer">
                    Khoảng cách gần nhất
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        </div>

        {/* Route Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden p-3 space-y-3 bg-white dark:bg-[var(--bg-card)]">
                <Skeleton className="h-36 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : paginatedRoutes.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[var(--bg-card)] rounded-3xl border border-border space-y-3">
            <p className="text-sm font-bold text-foreground">
              {t.rentCar.routeNotFound || "Không tìm thấy tuyến đường nào phù hợp"}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-bold text-accent border border-accent/40 rounded-xl hover:bg-accent/10 cursor-pointer"
            >
              {t.rentCar.clearFilters || "Đặt lại bộ lọc"}
            </Button>
          </div>
        ) : (
          <Reveal variant="up" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {paginatedRoutes.map((route) => (
              <IntercityRouteCard
                key={route.id}
                route={route}
                sharedRoutes={sharedRoutes}
              />
            ))}
          </Reveal>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-8 pb-4">
            <Pagination size="sm">
              <Pagination.Summary>
                {`${currentPage} / ${totalPages} ${t.common.page || "trang"}`}
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={currentPage <= 1}
                    onPress={() => {
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                      window.scrollTo({ top: 320, behavior: "smooth" });
                    }}
                  >
                    <Pagination.PreviousIcon />
                  </Pagination.Previous>
                </Pagination.Item>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Pagination.Item key={p}>
                    <Pagination.Link
                      isActive={p === currentPage}
                      onPress={() => {
                        setCurrentPage(p);
                        window.scrollTo({ top: 320, behavior: "smooth" });
                      }}
                    >
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={currentPage >= totalPages}
                    onPress={() => {
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                      window.scrollTo({ top: 320, behavior: "smooth" });
                    }}
                  >
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </div>
        )}
      </main>
    </div>
  );
}
