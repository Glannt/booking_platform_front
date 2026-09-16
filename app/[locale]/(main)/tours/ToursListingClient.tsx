"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock,
  Star,
  Users,
  ArrowUpDown,
  Search,
  MapPin,
  Tag,
  CheckCircle,
  Calendar,
  Filter,
  X,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button, Input, Label, SearchField, Skeleton, Select, ListBox, Popover, Checkbox } from "@heroui/react";
import { SvgIconRenderer } from "@/components/common/SvgIconRenderer";

import { getTours, getTourCategories, TourDto, TourCategoryDto, getPackagePrice } from "@/lib/api/tours";
import { useI18n } from "@/context/LanguageContext";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { resolveImageUrls } from "@/lib/api/media";
import { resolveLocalizedName, resolveLocalizedDescription, resolveLocalizedSlug, resolveTranslation } from "@/lib/i18n-helpers";
import { getCanonicalSlug } from "@/lib/slug-helpers";
import { ImageGrid } from "@/components/ImageGallery";
import type { SectionDto } from "@/lib/api/sections";

interface ToursListingClientProps {
  sections: SectionDto[];
}

export default function ToursListingClient({ sections }: ToursListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useI18n();

  const heroSection = sections.find(s => s.sectionType === "HERO_BANNER") || null;

  const initialKeyword = searchParams.get("keyword") || "";
  const initialDate = searchParams.get("date") || "";
  const initialGuests = searchParams.get("guests") || "1";

  const [tours, setTours] = useState<TourDto[]>([]);
  const [categories, setCategories] = useState<TourCategoryDto[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0);
  const [selectedCatIds, setSelectedCatIds] = useState<number[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [onlyRecommended, setOnlyRecommended] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState(initialKeyword);
  const [sortOrder, setSortOrder] = useState<"default" | "price_asc" | "price_desc">("default");
  const [loading, setLoading] = useState(true);
  const [tourImages, setTourImages] = useState<Record<number, { id: number; url: string }[]>>({});

  const activeFilterCount =
    selectedCatIds.length +
    selectedPriceRanges.length +
    selectedDurations.length +
    (onlyRecommended ? 1 : 0);

  const toggleCategory = (catId: number) => {
    setSelectedCatIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const togglePriceRange = (range: string) => {
    setSelectedPriceRanges((prev) =>
      prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range]
    );
  };

  const toggleDuration = (dur: string) => {
    setSelectedDurations((prev) =>
      prev.includes(dur) ? prev.filter((d) => d !== dur) : [...prev, dur]
    );
  };

  const handleResetFilters = () => {
    setSelectedCatIds([]);
    setSelectedPriceRanges([]);
    setSelectedDurations([]);
    setOnlyRecommended(false);
    setActiveCategoryId(0);
  };

  useEffect(() => {
    if (tours.length === 0) {
      setTourImages({});
      return;
    }
    let cancelled = false;
    const resolve = async () => {
      const entries = await Promise.all(
        tours.map(async (tour) => {
          const imageIds = tour.imageIds || (tour.thumbnailId ? [tour.thumbnailId] : null);
          const resolved = await resolveImageUrls(imageIds);
          return [tour.id, resolved] as const;
        })
      );
      if (!cancelled) {
        setTourImages(Object.fromEntries(entries));
      }
    };
    resolve();
    return () => { cancelled = true; };
  }, [tours]);

  // Fetch categories once on mount
  useEffect(() => {
    let active = true;
    const fetchCategories = async () => {
      try {
        const catRes = await getTourCategories();
        if (catRes?.data?.content && catRes.data.content.length > 0) {
          const list = catRes.data.content;
          if (active) {
            setCategories([
              {
                id: 0, code: "all", active: true, translations: [
                  { locale: "vi", name: "Tất cả" },
                  { locale: "en", name: "All Tours" },
                  { locale: "ko", name: "전체" },
                  { locale: "ru", name: "Все туры" }
                ]
              } as any,
              ...list
            ]);
          }
        }
      } catch (err) {
        console.error("Error fetching tour categories:", err);
      }
    };
    fetchCategories();
    return () => { active = false; };
  }, []);

  // Fetch tours whenever activeCategoryId changes
  useEffect(() => {
    let active = true;
    const fetchTours = async () => {
      setLoading(true);
      try {
        const toursRes = await getTours({
          search: searchQuery || undefined,
          tourCategoryId: activeCategoryId > 0 ? activeCategoryId : undefined
        });

        if (!active) return;

        if (toursRes?.data?.content) {
          setTours(toursRes.data.content);
        } else {
          setTours([]);
        }
      } catch (err) {
        if (!active) return;
        console.error("Error fetching tours directory:", err);
        setTours([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchTours();
    return () => { active = false; };
  }, [activeCategoryId]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const toursRes = await getTours({
        search: searchQuery || undefined,
        tourCategoryId: activeCategoryId > 0 ? activeCategoryId : undefined
      });
      if (toursRes?.data?.content) {
        setTours(toursRes.data.content);
      } else {
        setTours([]);
      }
    } catch (err) {
      console.error(err);
      setTours([]);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedCatName = (c: TourCategoryDto) => {
    return resolveLocalizedName(c.translations, language, c.code);
  };

  const getLocalizedName = (tour: TourDto) => {
    return resolveLocalizedName(tour.translations, language, "Tour");
  };

  const getLocalizedDesc = (tour: TourDto) => {
    return resolveLocalizedDescription(tour.translations, language);
  };

  const getMinPrice = (t: TourDto) => {
    if (t.packages && t.packages.length > 0) {
      const activePackages = t.packages.filter(p => p.active && !p.isContactOnly);
      const pkgPrices = activePackages
        .map(p => getPackagePrice(p, "ADULT"))
        .filter(price => price > 0);
      if (pkgPrices.length > 0) {
        return Math.min(...pkgPrices);
      }
    }
    if (!t.prices || t.prices.length === 0) return 0;
    const activePrices = t.prices.filter(p => p.active);
    if (activePrices.length === 0) return 0;
    return Math.min(...activePrices.map(p => p.amount));
  };

  const formatPrice = (value: number) => {
    if (value <= 0) return t.common.contact;
    return _formatPrice(value, language);
  };

  const renderIcon = (iconName?: string) => {
    return <SvgIconRenderer svgString={iconName} size={11} className="shrink-0" />;
  };

  const PRICE_OPTIONS = [
    { id: "under_500", label: t.tours.priceUnder500 },
    { id: "500_1500", label: t.tours.price500to1500 },
    { id: "over_1500", label: t.tours.priceOver1500 },
  ];

  const DURATION_OPTIONS = [
    { id: "same_day", label: t.tours.durationSameDay },
    { id: "multi_day", label: t.tours.durationMultiDay },
  ];

  const filteredAndSortedTours = useMemo(() => {
    const list = tours.filter((tour) => {
      // 1. Popover Categories filter
      if (selectedCatIds.length > 0) {
        if (!tour.tourCategoryId || !selectedCatIds.includes(tour.tourCategoryId)) return false;
      }

      // 2. Recommended filter
      if (onlyRecommended && !tour.isRecommended) {
        return false;
      }

      // 3. Duration filter
      if (selectedDurations.length > 0) {
        const isSameDay = (tour.durationDays === 1 || tour.durationNights === 0);
        const isMultiDay = (tour.durationDays > 1 || tour.durationNights >= 1);
        const matchSameDay = selectedDurations.includes("same_day") && isSameDay;
        const matchMultiDay = selectedDurations.includes("multi_day") && isMultiDay;
        if (!matchSameDay && !matchMultiDay) return false;
      }

      // 4. Price range filter
      if (selectedPriceRanges.length > 0) {
        const minP = getMinPrice(tour);
        const matchUnder500 = selectedPriceRanges.includes("under_500") && minP > 0 && minP < 500000;
        const match500to1500 = selectedPriceRanges.includes("500_1500") && minP >= 500000 && minP <= 1500000;
        const matchOver1500 = selectedPriceRanges.includes("over_1500") && minP > 1500000;
        if (!matchUnder500 && !match500to1500 && !matchOver1500) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortOrder === "default") return 0;
      const priceA = getMinPrice(a);
      const priceB = getMinPrice(b);
      return sortOrder === "price_asc" ? priceA - priceB : priceB - priceA;
    });
  }, [tours, selectedCatIds, onlyRecommended, selectedDurations, selectedPriceRanges, sortOrder]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      <section className="relative w-full pt-28 pb-12 px-6 bg-slate-900 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: heroSection?.imageUrls?.[0]
              ? `url('${heroSection.imageUrls[0]}')`
              : `url('')`
          }}
        />
        <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 relative z-10 text-white flex flex-col gap-5 items-center">
          <div className="text-center space-y-2 max-w-2xl">
            <h1 className="text-2xl md:text-4xl font-black tracking-tight uppercase">
              {resolveTranslation(heroSection?.translations, language)?.title || t.tours.catalogTitle}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium">
              {resolveTranslation(heroSection?.translations, language)?.description || t.tours.catalogSubtitle}
            </p>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="w-full max-w-lg flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:bg-white sm:dark:bg-black sm:rounded-2xl sm:p-1.5 sm:shadow-xl sm:border sm:border-white/15"
          >
            <div className="flex items-center gap-2 pl-3 flex-1 bg-white dark:bg-black rounded-2xl p-3 sm:p-0 shadow-lg sm:shadow-none border border-slate-200 dark:border-white/10 sm:border-none min-h-[46px] sm:min-h-0">
              <SearchField
                name="search_tour"
                aria-label={t.tours.searchPlaceholder || "Search tours"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none w-full p-0"
              >
                <Label className="sr-only">{t.tours.searchPlaceholder || "Search tours"}</Label>
                <SearchField.Group className="w-full flex items-center bg-transparent border-none shadow-none">
                  <SearchField.SearchIcon className="text-slate-400 dark:text-slate-500 mr-2 flex-shrink-0" />
                  <SearchField.Input
                    aria-label={t.tours.searchPlaceholder || "Search tours"}
                    placeholder={t.tours.searchPlaceholder}
                    className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none w-full border-none p-0 focus:ring-0"
                  />
                </SearchField.Group>
              </SearchField>
            </div>
            <Button
              type="submit"
              className="bg-accent hover:bg-accent-hover text-white font-bold text-xs py-3 sm:py-2.5 px-6 rounded-2xl sm:rounded-xl border-none cursor-pointer shadow-md sm:shadow-none min-h-[46px] sm:min-h-0 w-full sm:w-auto flex-shrink-0"
            >
              {t.tours.search}
            </Button>
          </form>
        </div>
      </section>

      <main className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 flex-1 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between overflow-x-auto scrollbar-hide pb-2 gap-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
            {categories.map((c) => {
              const isActive = activeCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCategoryId(c.id);
                    if (c.id === 0) {
                      setSelectedCatIds([]);
                    } else {
                      setSelectedCatIds([c.id]);
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border-none shrink-0 cursor-pointer ${isActive
                    ? "bg-accent text-white shadow-md"
                    : "bg-white dark:bg-black text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                >
                  {getLocalizedCatName(c)}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            {/* Filter Popover Button */}
            <Popover>
              <Button
                type="button"
                variant="outline"
                className={`h-8 px-3 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeFilterCount > 0 ? "border-accent/60 bg-accent/5 text-accent dark:text-accent font-extrabold" : ""
                }`}
              >
                <Filter size={13} className={activeFilterCount > 0 ? "text-accent" : "text-slate-500"} />
                <span>{t.tours.filter}</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-accent text-accent-foreground text-[9px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              <Popover.Content
                placement="bottom end"
                className="w-80 p-0 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
              >
                <Popover.Dialog className="p-4 space-y-4 outline-none">
                  {/* Popover Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        {t.tours.filterTitle}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                        {t.tours.appliedFilters}: <span className="font-bold text-accent">{activeFilterCount}</span>
                      </p>
                    </div>
                    {activeFilterCount > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResetFilters}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 p-1 h-auto cursor-pointer"
                      >
                        <RotateCcw size={12} className="mr-1 inline" />
                        {t.tours.filterReset}
                      </Button>
                    )}
                  </div>

                  {/* Categories */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      {t.tours.filterCategory}
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {categories.filter(c => c.id > 0).map((cat) => {
                        const checked = selectedCatIds.includes(cat.id);
                        return (
                          <Checkbox
                            key={cat.id}
                            isSelected={checked}
                            onChange={() => toggleCategory(cat.id)}
                            className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <span className="truncate">{getLocalizedCatName(cat)}</span>
                            </Checkbox.Content>
                          </Checkbox>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price Ranges */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      {t.tours.filterPrice}
                    </span>
                    <div className="space-y-1.5">
                      {PRICE_OPTIONS.map((po) => {
                        const checked = selectedPriceRanges.includes(po.id);
                        return (
                          <Checkbox
                            key={po.id}
                            isSelected={checked}
                            onChange={() => togglePriceRange(po.id)}
                            className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <span>{po.label}</span>
                            </Checkbox.Content>
                          </Checkbox>
                        );
                      })}
                    </div>
                  </div>

                  {/* Durations */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      {t.tours.filterDuration}
                    </span>
                    <div className="space-y-1.5">
                      {DURATION_OPTIONS.map((dur) => {
                        const checked = selectedDurations.includes(dur.id);
                        return (
                          <Checkbox
                            key={dur.id}
                            isSelected={checked}
                            onChange={() => toggleDuration(dur.id)}
                            className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <span>{dur.label}</span>
                            </Checkbox.Content>
                          </Checkbox>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recommended Only */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Checkbox
                      isSelected={onlyRecommended}
                      onChange={() => setOnlyRecommended(!onlyRecommended)}
                      className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-bold text-amber-600 dark:text-amber-400">
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <span className="flex items-center gap-1">
                          <Sparkles size={13} className="text-amber-500" />
                          {t.tours.recommendedOnly}
                        </span>
                      </Checkbox.Content>
                    </Checkbox>
                  </div>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>

            {/* Price Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={14} className="text-slate-400 dark:text-slate-500" />
              <Select
                aria-label={t.tours.sortDefault || "Sort tours"}
                selectedKey={sortOrder}
                onSelectionChange={(key) => { if (key) setSortOrder(key as typeof sortOrder); }}
                className="w-32 sm:w-36"
              >
                <Label className="sr-only">Sort</Label>
                <Select.Trigger aria-label={t.tours.sortDefault || "Sort"} className="h-8 px-3 text-[10px] font-bold bg-slate-100 dark:bg-[var(--bg-surface)] text-slate-600 dark:text-slate-300 rounded-lg border-none cursor-pointer">
                  <Select.Value className="text-[10px]" />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50">
                  <ListBox aria-label="Sort options">
                    <ListBox.Item key="default" id="default" textValue={t.tours.sortDefault} className="px-3 py-2 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                      {t.tours.sortDefault}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item key="price_asc" id="price_asc" textValue={t.tours.sortPriceLow} className="px-3 py-2 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                      {t.tours.sortPriceLow}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item key="price_desc" id="price_desc" textValue={t.tours.sortPriceHigh} className="px-3 py-2 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                      {t.tours.sortPriceHigh}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 -mt-2">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Filter size={12} />
              {t.tours.appliedFilters}:
            </span>
            {selectedCatIds.map((cId) => {
              const cat = categories.find((c) => c.id === cId);
              const label = cat ? getLocalizedCatName(cat) : `Cat #${cId}`;
              return (
                <span
                  key={`cat-${cId}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-accent/10 text-accent dark:bg-accent/20 border border-accent/30"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => toggleCategory(cId)}
                    className="hover:opacity-70 cursor-pointer border-none bg-transparent p-0 flex items-center"
                    aria-label="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            {selectedPriceRanges.map((pId) => {
              const label = PRICE_OPTIONS.find((p) => p.id === pId)?.label || pId;
              return (
                <span
                  key={`price-${pId}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => togglePriceRange(pId)}
                    className="hover:opacity-70 cursor-pointer border-none bg-transparent p-0 flex items-center"
                    aria-label="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            {selectedDurations.map((dId) => {
              const label = DURATION_OPTIONS.find((d) => d.id === dId)?.label || dId;
              return (
                <span
                  key={`dur-${dId}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => toggleDuration(dId)}
                    className="hover:opacity-70 cursor-pointer border-none bg-transparent p-0 flex items-center"
                    aria-label="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            {onlyRecommended && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Sparkles size={11} />
                <span>{t.tours.recommendedOnly}</span>
                <button
                  type="button"
                  onClick={() => setOnlyRecommended(false)}
                  className="hover:opacity-70 cursor-pointer border-none bg-transparent p-0 flex items-center"
                  aria-label="Remove filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 underline ml-1 cursor-pointer bg-transparent border-none p-0"
            >
              {t.tours.clearAll}
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-black shadow-sm">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-3/5 rounded-lg" />
                  <Skeleton className="h-3 w-full rounded-lg" />
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Skeleton className="h-5 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedTours.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-xs font-bold bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-3xl">
            {t.common.noResults}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedTours.map((tour: TourDto) => {
              const minPrice = getMinPrice(tour);
              const name = getLocalizedName(tour);
              const desc = getLocalizedDesc(tour);
              const duration = tour.durationDays > 0
                ? `${tour.durationDays} ${t.tours.days}`
                : `${tour.durationNights} ${t.tours.days}`;

              const resolvedImgs = tourImages[tour.id] || [];
              const thumbnailImg = resolvedImgs.find(img => img.id === tour.thumbnailId);
              const bgImg = thumbnailImg ? thumbnailImg.url : (resolvedImgs[0]?.url || "");

              return (
                <div
                  key={tour.id}
                  className="group bg-white dark:bg-black rounded-3xl border border-slate-250 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300 transform hover:scale-[1.01]"
                >
                  <div>
                    <div className="h-48 overflow-hidden relative bg-slate-100 dark:bg-[var(--bg-surface)] flex items-center justify-center text-center p-4">
                      {bgImg ? (
                        <img
                          src={bgImg}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 z-10"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : null}
                      <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider relative z-0 px-2 line-clamp-3">{name}</span>
                      {resolvedImgs.length > 1 && (
                        <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/40 z-20">
                          <ImageGrid images={resolvedImgs} thumbnailId={tour.thumbnailId} maxVisible={3} className="h-14" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 z-20">
                        <Clock size={10} /><span>{duration}</span>
                      </div>
                      {(() => {
                        const cat = categories.find(c => c.id === tour.tourCategoryId) || tour.tourCategory;
                        if (!cat || cat.id === 0) return null;
                        const catName = getLocalizedCatName(cat);
                        return (
                          <div className="absolute bottom-3 left-3 bg-accent/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 z-20 shadow-sm">
                            {renderIcon(cat.icon)}
                            <span>{catName}</span>
                          </div>
                        );
                      })()}
                      {tour.isRecommended && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <Star size={9} className="fill-white" /><span>{t.tours.recommended || t.tours.bestSeller}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-3">
                      <h3 className="font-extrabold text-base text-slate-950 dark:text-white leading-tight group-hover:text-accent transition-colors line-clamp-2">{name}</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-400 leading-normal line-clamp-2">{desc}</p>
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {tour.options?.slice(0, 3).map((opt: any) => {
                          const trans = resolveTranslation(opt.translations, language);
                          return (
                            <span key={opt.id} style={{ color: opt.colorText || "#3b82f6", backgroundColor: `${opt.colorText || "#3b82f6"}10` }} className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                              {renderIcon(opt.iconUrl)}<span>{trans ? trans.content : ""}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-5 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold block uppercase tracking-wider">{t.tours.priceFrom}</span>
                      <span className="text-base font-black text-amber-500">{formatPrice(minPrice)}</span>
                    </div>
                    <Button
                      onClick={() => {
                        const tourSlug = getCanonicalSlug(tour, language, "tour");
                        router.push(`/${language}/tours/${tourSlug}?id=${tour.id}`);
                      }}
                      className="bg-accent hover:bg-accent-hover font-extrabold text-[11px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-sm border-none cursor-pointer"
                    >
                      {t.tours.bookNow} →
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
