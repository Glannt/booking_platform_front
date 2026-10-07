"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Check,
  RotateCcw,
  Calendar as CalendarIcon,
  Car,
  Users,
  Briefcase,
  Fuel,
  Sparkles,
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
import { getActiveSections, type SectionDto } from "@/lib/api/sections";
import { getActiveRentals, getRentalPricesByRental, type RentalPriceDto, type RentalDto } from "@/lib/api/selfDrive";
import { getVehicleCategories, getRentableVehiclesByCategory, type VehicleCategoryDto } from "@/lib/api/fleet";
import { SelfDriveVehicleCard, type SelfDriveVehicleItem } from "@/components/self-drive/SelfDriveVehicleCard";
import { backendUrl } from "@/lib/api/client";
import { getCanonicalSlug } from "@/lib/slug-helpers";
import { resolveTranslation } from "@/lib/i18n-helpers";

type SortOption = "default" | "price_asc" | "price_desc" | "capacity_desc";

const PAGE_SIZE = 12;

interface VehiclesListingClientProps {
  sections: SectionDto[];
}

export default function VehiclesListingClient({ sections }: VehiclesListingClientProps) {
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
  const initialCategory = searchParams.get("category") || searchParams.get("cat") || "all";

  const [vehicles, setVehicles] = useState<SelfDriveVehicleItem[]>([]);
  const [categories, setCategories] = useState<VehicleCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState(initialKeyword);
  const [selectedCatId, setSelectedCatId] = useState<string>(initialCategory);
  const [selectedDate, setSelectedDate] = useState<DateValue | null>(null);

  // Detailed filters inside popover
  const [selectedCapacities, setSelectedCapacities] = useState<string[]>([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [selectedFuels, setSelectedFuels] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);

  // Sorting & Pagination
  const [sortOrder, setSortOrder] = useState<SortOption>("default");
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const kw = searchParams.get("keyword") || searchParams.get("search") || "";
    setSearchQuery(kw);
    const cat = searchParams.get("category") || searchParams.get("cat") || "all";
    setSelectedCatId(cat);
  }, [searchParams]);

  // Load categories and vehicles
  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      try {
        const [catRes, rentRes] = await Promise.all([
          getVehicleCategories({ active: true }, { skipTranslationFilter: true }),
          getActiveRentals({ skipTranslationFilter: true }),
        ]);

        const cats = (catRes?.data?.content || []) as VehicleCategoryDto[];
        const rentals = (rentRes?.data || []) as RentalDto[];

        if (!active) return;
        setCategories(cats);

        if (rentals.length > 0 && cats.length > 0) {
          const catMap = new Map<number, VehicleCategoryDto>();
          cats.forEach((c) => catMap.set(c.id, c));

          // Fetch prices & category thumbnails
          const [priceResults, categoryThumbResults] = await Promise.all([
            Promise.all(
              rentals
                .filter((r) => !r.driverRequired)
                .map((r) =>
                  getRentalPricesByRental(r.id)
                    .then((res) => ({
                      rentalId: r.id,
                      prices: (res?.data || []) as RentalPriceDto[],
                    }))
                    .catch(() => ({ rentalId: r.id, prices: [] as RentalPriceDto[] }))
                )
            ),
            Promise.all(
              cats.map(async (c) => {
                if (c.thumbnailUrl) {
                  const url = c.thumbnailUrl.startsWith("http")
                    ? c.thumbnailUrl
                    : `${backendUrl}${c.thumbnailUrl}`;
                  return { categoryId: c.id, thumbnailUrl: url };
                }
                try {
                  const vehsRes = await getRentableVehiclesByCategory(c.id);
                  const firstVehWithImg = (vehsRes?.data || []).find((v) => v.thumbnailUrl);
                  if (firstVehWithImg?.thumbnailUrl) {
                    const url = firstVehWithImg.thumbnailUrl.startsWith("http")
                      ? firstVehWithImg.thumbnailUrl
                      : `${backendUrl}${firstVehWithImg.thumbnailUrl}`;
                    return { categoryId: c.id, thumbnailUrl: url };
                  }
                } catch {
                  // ignore
                }
                return { categoryId: c.id, thumbnailUrl: "" };
              })
            ),
          ]);

          const priceMap = new Map<number, RentalPriceDto[]>();
          priceResults.forEach((p) => priceMap.set(p.rentalId, p.prices));

          const catThumbMap = new Map<number, string>();
          categoryThumbResults.forEach((ct) => catThumbMap.set(ct.categoryId, ct.thumbnailUrl));

          const items: SelfDriveVehicleItem[] = rentals
            .filter((r) => !r.driverRequired)
            .map((r) => {
              const cat = catMap.get(r.vehicleCategoryId);
              const tr = cat?.translations?.find((t) => t.locale === language) ||
                cat?.translations?.find((t) => t.locale === "vi") ||
                cat?.translations?.[0];

              const nameVi = cat?.translations?.find((t) => t.locale === "vi")?.name || cat?.code || "Xe tự lái";
              const nameEn = cat?.translations?.find((t) => t.locale === "en")?.name || nameVi;
              const descVi = cat?.translations?.find((t) => t.locale === "vi")?.description || "";
              const descEn = cat?.translations?.find((t) => t.locale === "en")?.description || descVi;

              let capacity = "5";
              let luggage = "2-3 vali";
              if (cat) {
                capacity = cat.minSeat === cat.maxSeat ? `${cat.minSeat}` : `${cat.minSeat}-${cat.maxSeat}`;
                luggage = cat.minLuggage === cat.maxLuggage ? `${cat.minLuggage} vali` : `${cat.minLuggage}-${cat.maxLuggage} vali`;
              }

              const rentalPrices = priceMap.get(r.id) || [];
              const activePrice = rentalPrices.find(
                (p) => p.active && p.vehicleCategoryId === r.vehicleCategoryId
              );
              const dailyRate = activePrice ? Number(activePrice.amount) : 0;
              const categorySlug = getCanonicalSlug(cat, language, "xe-tu-lai");
              const imgUrl = catThumbMap.get(r.vehicleCategoryId) || "";

              const featuresVi = descVi
                .split(/[,\n;•✓]/)
                .map((f) => f.trim())
                .filter((f) => f.length > 2);

              const featuresEn = descEn
                .split(/[,\n;•✓]/)
                .map((f) => f.trim())
                .filter((f) => f.length > 2);

              return {
                id: `rental-${r.id}-${r.vehicleCategoryId}`,
                rentalId: r.id,
                vehicleCategoryId: r.vehicleCategoryId,
                categorySlug,
                nameVi,
                nameEn,
                descVi,
                descEn,
                pricePerDay: dailyRate,
                deposit: r.deposit || 0,
                minimumDays: r.minimumDays || 1,
                featuresVi: featuresVi.length > 0 ? featuresVi : ["Bảo hiểm thân vỏ", "Giao xe tận nơi"],
                featuresEn: featuresEn.length > 0 ? featuresEn : ["Comprehensive insurance", "Door-to-door delivery"],
                capacity,
                luggage,
                transmission: "Tự động",
                fuelType: "Xăng",
                imgUrl,
              };
            });

          if (active) {
            setVehicles(items);
          }
        }
      } catch (err) {
        console.error("Failed to load self-drive vehicles:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [language]);

  // Options for Detailed Filter Popover
  const CAPACITY_OPTIONS = [
    { id: "4", label: "4 chỗ" },
    { id: "5", label: "5 chỗ" },
    { id: "7", label: "7 chỗ" },
    { id: "16", label: "16 chỗ" },
  ];

  const TRANSMISSION_OPTIONS = [
    { id: "auto", label: "Số tự động" },
    { id: "manual", label: "Số sàn" },
  ];

  const FUEL_OPTIONS = [
    { id: "gasoline", label: "Xăng" },
    { id: "diesel", label: "Dầu" },
    { id: "electric", label: "Điện" },
  ];

  const PRICE_OPTIONS = [
    { id: "under_800", label: "Dưới 800.000đ/ngày" },
    { id: "800_1200", label: "800.000đ - 1.200.000đ/ngày" },
    { id: "1200_2000", label: "1.200.000đ - 2.000.000đ/ngày" },
    { id: "over_2000", label: "Trên 2.000.000đ/ngày" },
  ];

  const toggleCapacity = (id: string) => {
    setSelectedCapacities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
    setCurrentPage(1);
  };

  const toggleTransmission = (id: string) => {
    setSelectedTransmissions((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
    setCurrentPage(1);
  };

  const toggleFuel = (id: string) => {
    setSelectedFuels((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
    setCurrentPage(1);
  };

  const togglePriceRange = (range: string) => {
    setSelectedPriceRanges((prev) =>
      prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range]
    );
    setCurrentPage(1);
  };

  const activeFilterCount =
    (selectedCatId !== "all" ? 1 : 0) +
    (selectedDate ? 1 : 0) +
    selectedCapacities.length +
    selectedTransmissions.length +
    selectedFuels.length +
    selectedPriceRanges.length;

  const handleResetFilters = () => {
    setSelectedCatId("all");
    setSelectedDate(null);
    setSelectedCapacities([]);
    setSelectedTransmissions([]);
    setSelectedFuels([]);
    setSelectedPriceRanges([]);
    setSearchQuery("");
    setSortOrder("default");
    setCurrentPage(1);
  };

  // Filtered & Sorted Vehicles
  const filteredAndSortedVehicles = useMemo(() => {
    const list = vehicles.filter((v) => {
      // 1. Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const name = (language === "vi" ? v.nameVi : v.nameEn).toLowerCase();
        const desc = (language === "vi" ? v.descVi : v.descEn).toLowerCase();
        if (!name.includes(q) && !desc.includes(q) && !v.capacity.includes(q)) return false;
      }

      // 2. Category / Segment filter
      if (selectedCatId !== "all") {
        if (String(v.vehicleCategoryId) !== selectedCatId) return false;
      }

      // 3. Capacities filter
      if (selectedCapacities.length > 0) {
        const matchCap = selectedCapacities.some((cap) => v.capacity.includes(cap));
        if (!matchCap) return false;
      }

      // 4. Transmission filter
      if (selectedTransmissions.length > 0) {
        const trans = (v.transmission || "Tự động").toLowerCase();
        const matchAuto = selectedTransmissions.includes("auto") && (trans.includes("tự động") || trans.includes("auto"));
        const matchManual = selectedTransmissions.includes("manual") && (trans.includes("số sàn") || trans.includes("manual"));
        if (!matchAuto && !matchManual) return false;
      }

      // 5. Fuel filter
      if (selectedFuels.length > 0) {
        const fuel = (v.fuelType || "Xăng").toLowerCase();
        const matchGasoline = selectedFuels.includes("gasoline") && (fuel.includes("xăng") || fuel.includes("petrol"));
        const matchDiesel = selectedFuels.includes("diesel") && fuel.includes("dầu");
        const matchElectric = selectedFuels.includes("electric") && fuel.includes("điện");
        if (!matchGasoline && !matchDiesel && !matchElectric) return false;
      }

      // 6. Price range filter
      if (selectedPriceRanges.length > 0) {
        const p = v.pricePerDay;
        const matchUnder800 = selectedPriceRanges.includes("under_800") && p <= 800000;
        const match800to1200 = selectedPriceRanges.includes("800_1200") && p > 800000 && p <= 1200000;
        const match1200to2000 = selectedPriceRanges.includes("1200_2000") && p > 1200000 && p <= 2000000;
        const matchOver2000 = selectedPriceRanges.includes("over_2000") && p > 2000000;
        if (!matchUnder800 && !match800to1200 && !match1200to2000 && !matchOver2000) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortOrder === "price_asc") {
        return a.pricePerDay - b.pricePerDay;
      }
      if (sortOrder === "price_desc") {
        return b.pricePerDay - a.pricePerDay;
      }
      if (sortOrder === "capacity_desc") {
        const capA = parseInt(a.capacity) || 0;
        const capB = parseInt(b.capacity) || 0;
        return capB - capA;
      }
      return 0;
    });
  }, [
    vehicles,
    searchQuery,
    selectedCatId,
    selectedCapacities,
    selectedTransmissions,
    selectedFuels,
    selectedPriceRanges,
    sortOrder,
    language,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedVehicles.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedVehicles = filteredAndSortedVehicles.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const getSelectedCatName = () => {
    if (selectedCatId === "all") return t.selfDrive.segment || "Phân khúc xe";
    const c = categories.find((cat) => String(cat.id) === selectedCatId);
    if (!c) return t.selfDrive.segment || "Phân khúc xe";
    const tr = c.translations?.find((t) => t.locale === language) || c.translations?.[0];
    return tr?.name || c.code;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Banner Section (Tours Image 1 style) */}
      <section className="relative w-full min-h-[300px] md:min-h-[340px] flex flex-col justify-center items-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-black/90 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: heroSection?.imageUrls?.[0]
              ? `url('${heroSection.imageUrls[0]}')`
              : "url('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1600&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-[1px]" />
        </div>

        <div className="max-w-3xl mx-auto w-full relative z-10 text-white flex flex-col items-center text-center gap-4">
          <button
            type="button"
            onClick={() => router.push(prefixUrl("/self-drive"))}
            className="self-start sm:self-center flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft size={13} />
            <span>{t.common.goBack || "Quay lại"}</span>
          </button>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
            {resolveTranslation(heroSection?.translations, language)?.title || t.selfDrive.title || "Thuê Xe Tự Lái Nha Trang"}
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl font-medium">
            {resolveTranslation(heroSection?.translations, language)?.description ||
              t.selfDrive.subtitle ||
              "Trải nghiệm tự do khám phá Nha Trang với đội xe đời mới, giá cạnh tranh."}
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
                placeholder={t.selfDrive.desiredVehicle || "Tìm kiếm theo tên xe, hãng xe, số chỗ..."}
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
      </section>

      {/* Main Listing Area */}
      <main className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 flex-1 flex flex-col gap-5">
        {/* Top Filters Bar (Tours pattern) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex flex-wrap items-center gap-2">
            {/* Pill 1: Phân khúc xe ∨ */}
            <Popover>
              <Button
                type="button"
                variant="outline"
                className={`h-9 px-4 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedCatId !== "all"
                    ? "border-accent bg-accent/10 text-accent font-black"
                    : "border-border bg-white dark:bg-[var(--bg-card)] hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] text-foreground"
                }`}
              >
                <Car size={13} className={selectedCatId !== "all" ? "text-accent" : "text-foreground/50"} />
                <span>{getSelectedCatName()}</span>
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
                      setSelectedCatId("all");
                      setCurrentPage(1);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer border-none ${
                      selectedCatId === "all"
                        ? "bg-accent/10 text-accent font-bold"
                        : "hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] text-foreground"
                    }`}
                  >
                    <span>{t.common.all || "Tất cả dòng xe"}</span>
                    {selectedCatId === "all" && <Check size={14} className="text-accent shrink-0" />}
                  </button>
                  {categories.map((cat) => {
                    const isSelected = selectedCatId === String(cat.id);
                    const tr = cat.translations?.find((t) => t.locale === language) || cat.translations?.[0];
                    const catName = tr?.name || cat.code;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCatId(String(cat.id));
                          setCurrentPage(1);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer border-none ${
                          isSelected
                            ? "bg-accent/10 text-accent font-bold"
                            : "hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] text-foreground"
                        }`}
                      >
                        <span>{catName}</span>
                        {isSelected && <Check size={14} className="text-accent shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </Popover.Content>
            </Popover>

            {/* Pill 2: Ngày nhận xe ∨ */}
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
                    : t.selfDrive.pickupDate || "Ngày nhận xe"}
                </span>
                <ChevronDown size={13} />
              </Button>
              <Popover.Content
                placement="bottom start"
                className="p-3 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-border shadow-2xl z-50"
              >
                <Calendar
                  aria-label="Chọn ngày nhận xe"
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
              <span>{t.selfDrive.filterByType || "Bộ lọc"}</span>
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
                      Bộ lọc xe tự lái
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
                      <span>{t.common.cancel || "Đặt lại"}</span>
                    </button>
                  )}
                </div>

                {/* Section: Capacity / Seats */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
                    Số chỗ ngồi
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {CAPACITY_OPTIONS.map((opt) => {
                      const isChecked = selectedCapacities.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleCapacity(opt.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                            isChecked
                              ? "bg-accent/15 border-accent text-accent font-bold"
                              : "bg-black/5 dark:bg-[var(--bg-card)] border-border text-foreground hover:bg-black/10"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section: Transmission */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
                    Hộp số
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {TRANSMISSION_OPTIONS.map((opt) => (
                      <Checkbox
                        key={opt.id}
                        isSelected={selectedTransmissions.includes(opt.id)}
                        onChange={() => toggleTransmission(opt.id)}
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

                {/* Section: Fuel Type */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
                    Nhiên liệu
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {FUEL_OPTIONS.map((opt) => (
                      <Checkbox
                        key={opt.id}
                        isSelected={selectedFuels.includes(opt.id)}
                        onChange={() => toggleFuel(opt.id)}
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
                    Mức giá thuê theo ngày
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
              </div>
            </Popover.Content>
          </Popover>
        </div>

        {/* Results Count & Sorting Row (Tours pattern) */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-sm sm:text-base font-extrabold text-foreground">
            {filteredAndSortedVehicles.length} {t.selfDrive.vehicleList || "dòng xe"}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground/60 hidden sm:inline">
              Sắp xếp theo:
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
                  <ListBox.Item id="price_asc" textValue="Giá thấp → cao" className="px-3 py-2 text-xs font-semibold rounded-lg hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] cursor-pointer">
                    Giá thấp → cao
                  </ListBox.Item>
                  <ListBox.Item id="price_desc" textValue="Giá cao → thấp" className="px-3 py-2 text-xs font-semibold rounded-lg hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] cursor-pointer">
                    Giá cao → thấp
                  </ListBox.Item>
                  <ListBox.Item id="capacity_desc" textValue="Số chỗ nhiều nhất" className="px-3 py-2 text-xs font-semibold rounded-lg hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] cursor-pointer">
                    Số chỗ nhiều nhất
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        </div>

        {/* Vehicle Cards Grid */}
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
        ) : paginatedVehicles.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[var(--bg-card)] rounded-3xl border border-border space-y-3">
            <p className="text-sm font-bold text-foreground">
              {t.selfDrive.categoryNotFound || "Không tìm thấy xe nào phù hợp với bộ lọc"}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-bold text-accent border border-accent/40 rounded-xl hover:bg-accent/10 cursor-pointer"
            >
              {t.common.cancel || "Đặt lại bộ lọc"}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {paginatedVehicles.map((vehicle) => (
              <SelfDriveVehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
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
