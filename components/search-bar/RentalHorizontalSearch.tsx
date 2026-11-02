"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  MapPin,
  Calendar as CalendarIcon,
  Search,
  Check,
  CalendarDays,
  ShieldCheck
} from "lucide-react";
import { useI18n } from "@/context/LanguageContext";
import { SearchSegment } from "./SearchSegment";
import { RangeCalendar } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { today, getLocalTimeZone } from "@internationalized/date";
import { getVehicleCategories, VehicleCategoryDto } from "@/lib/api/fleet";
import { getIntercityRoutes, IntercityRouteDto } from "@/lib/api/intercity";
import { calculateRentalDays, formatToDisplayDate, formatToIsoDate } from "@/lib/utils/rentalDate";
import { resolveLocalizedSlug } from "@/lib/i18n-helpers";
import { getCanonicalSlug } from "@/lib/slug-helpers";

interface RentalHorizontalSearchProps {
  initialMode?: "self-drive" | "intercity";
  className?: string;
  isCard?: boolean;
  showModeSwitch?: boolean;
}

export function RentalHorizontalSearch({
  initialMode = "self-drive",
  className = "",
  isCard = true,
  showModeSwitch = false,
}: RentalHorizontalSearchProps) {
  const router = useRouter();
  const { language, t } = useI18n();

  const [rentalMode, setRentalMode] = useState<"self-drive" | "intercity">(initialMode);
  const [differentDropoff, setDifferentDropoff] = useState<boolean>(false);

  // Locations / Routes
  const [pickupLocation, setPickupLocation] = useState<string>("Nha Trang");
  const [dropoffLocation, setDropoffLocation] = useState<string>("Nha Trang");
  const [routes, setRoutes] = useState<IntercityRouteDto[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<IntercityRouteDto | null>(null);

  // Vehicle Categories
  const [categories, setCategories] = useState<VehicleCategoryDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategoryDto | null>(null);

  // Date Range
  const now = today(getLocalTimeZone());
  const [dateRange, setDateRange] = useState<{ start: DateValue; end: DateValue } | null>({
    start: now,
    end: now.add({ days: 2 }),
  });

  const rentalDays = useMemo(() => {
    if (!dateRange?.start || !dateRange?.end) return 1;
    return calculateRentalDays(dateRange.start, dateRange.end, 1);
  }, [dateRange]);

  // Dropdown Popovers
  const [activeDropdown, setActiveDropdown] = useState<"location" | "date" | "seats" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Intercity Routes & Vehicle Categories
  useEffect(() => {
    getIntercityRoutes(0, 50)
      .then((res) => {
        const list = res.data?.content || [];
        setRoutes(list);
        if (list.length > 0) setSelectedRoute(list[0]);
      })
      .catch(() => {});

    getVehicleCategories({ active: true }, { skipTranslationFilter: true })
      .then((res) => {
        const list = res.data?.content || [];
        setCategories(list);
        if (list.length > 0) {
          setSelectedCategory(list[0]);
        }
      })
      .catch(() => {});
  }, []);

  const getRouteDisplayName = (r: IntercityRouteDto | null) => {
    if (!r) return t.rentCar?.selectRoute || "Chọn tuyến đường";
    const tr = r.translations?.find((t) => t.locale === language);
    return tr?.name || `${r.originCity} ⇌ ${r.destinationCity}`;
  };

  const getCategoryDisplayName = (cat: VehicleCategoryDto | null) => {
    if (!cat) return t.selfDrive?.selectCategory || "Chọn xe";
    const tr = cat.translations?.find((t) => t.locale === language) || cat.translations?.[0];
    const name = tr?.name || cat.code;
    const seatInfo = cat.minSeat === cat.maxSeat ? `${cat.minSeat} chỗ` : `${cat.minSeat}-${cat.maxSeat} chỗ`;
    return `${name} (${seatInfo})`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (rentalMode === "self-drive") {
      const targetCat = selectedCategory || categories[0];
      const catSlug = targetCat
        ? getCanonicalSlug(targetCat, language, "xe-tu-lai")
        : "xe-tu-lai";

      const params = new URLSearchParams();
      if (targetCat) params.set("id", String(targetCat.id));
      if (dateRange?.start) params.set("pickupDate", formatToIsoDate(dateRange.start));
      if (dateRange?.end) params.set("returnDate", formatToIsoDate(dateRange.end));
      params.set("days", String(rentalDays));
      if (pickupLocation.trim()) params.set("pickupLocation", pickupLocation.trim());
      if (differentDropoff && dropoffLocation.trim()) {
        params.set("dropoffLocation", dropoffLocation.trim());
      }

      setActiveDropdown(null);
      router.push(`/${language}/self-drive/${catSlug}?${params.toString()}`);
    } else {
      if (!selectedRoute) return;
      const routeSlug = resolveLocalizedSlug(selectedRoute.translations, language) || selectedRoute.id;
      const params = new URLSearchParams();
      params.set("routeId", String(selectedRoute.id));
      if (dateRange?.start) params.set("date", formatToIsoDate(dateRange.start));
      if (dateRange?.end && dateRange.start.compare(dateRange.end) !== 0) {
        params.set("returnDate", formatToIsoDate(dateRange.end));
        params.set("tripType", "return");
      } else {
        params.set("tripType", "one-way");
      }
      if (pickupLocation.trim()) params.set("pickup", pickupLocation.trim());
      if (selectedCategory) params.set("categoryId", String(selectedCategory.id));

      setActiveDropdown(null);
      router.push(`/${language}/intercity/${routeSlug}?${params.toString()}`);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`w-full ${
        isCard
          ? "bg-white dark:bg-[var(--bg-surface)] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800"
          : ""
      } flex flex-col gap-3.5 ${className}`}
    >
      {/* Top Options Bar (Self-drive vs Intercity & Different Dropoff) */}
      {(showModeSwitch || rentalMode === "self-drive") && (
        <div className={`flex flex-wrap items-center ${showModeSwitch ? "justify-between" : "justify-end"} gap-2 px-1 text-xs`}>
          {/* Service Type Switcher (only shown when showModeSwitch is explicitly enabled) */}
          {showModeSwitch && (
            <div className="inline-flex items-center bg-black/5 dark:bg-[var(--bg-card)] p-1 rounded-2xl border border-border">
              <button
                type="button"
                onClick={() => setRentalMode("self-drive")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer border-none ${
                  rentalMode === "self-drive"
                    ? "bg-white dark:bg-[var(--bg-elevated)] text-accent shadow-xs"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                <Car size={13} />
                <span>{t.homePage?.selfDrive || "Thuê xe tự lái"}</span>
              </button>
              <button
                type="button"
                onClick={() => setRentalMode("intercity")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer border-none ${
                  rentalMode === "intercity"
                    ? "bg-white dark:bg-[var(--bg-elevated)] text-accent shadow-xs"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                <MapPin size={13} />
                <span>{t.homePage?.withDriver || "Xe liên tỉnh"}</span>
              </button>
            </div>
          )}

          {/* Checkbox: Return to different location (only for self-drive) */}
          {rentalMode === "self-drive" && (
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-foreground/80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={differentDropoff}
                onChange={(e) => setDifferentDropoff(e.target.checked)}
                className="rounded accent-accent w-4 h-4 cursor-pointer"
              />
              <span>Trả xe tại địa điểm khác</span>
            </label>
          )}
        </div>
      )}

      {/* Main Horizontal Search Bar Container */}
      <form
        onSubmit={handleSearch}
        className="relative w-full bg-black/5 dark:bg-[var(--bg-card)] rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 border border-border shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-1.5 sm:gap-2"
      >
        {/* Segment 1: Location or Intercity Route */}
        <div className="relative flex-1 min-w-0">
          {rentalMode === "self-drive" ? (
            <SearchSegment
              icon={<MapPin size={18} />}
              label="Địa điểm nhận xe"
              value={pickupLocation}
              placeholder="VD: Nha Trang, Cam Ranh..."
              onClear={() => setPickupLocation("")}
            >
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Nhập thành phố, địa điểm nhận xe..."
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-foreground placeholder:text-foreground/40 outline-none border-none p-0"
              />
            </SearchSegment>
          ) : (
            <SearchSegment
              icon={<MapPin size={18} />}
              label="Tuyến đường liên tỉnh"
              value={getRouteDisplayName(selectedRoute)}
              hasDropdown
              isActive={activeDropdown === "location"}
              onClick={() => setActiveDropdown(activeDropdown === "location" ? null : "location")}
            />
          )}

          {/* Intercity Route Popover */}
          {activeDropdown === "location" && rentalMode === "intercity" && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/60 px-3 py-1.5">
                {t.rentCar?.selectRoute || "Chọn tuyến đường liên tỉnh"}
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {routes.map((r) => {
                  const isSelected = selectedRoute?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedRoute(r);
                        setActiveDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer border-none ${
                        isSelected
                          ? "bg-accent/10 dark:bg-accent/20 text-accent font-bold"
                          : "hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] text-foreground"
                      }`}
                    >
                      <span className="truncate">{getRouteDisplayName(r)}</span>
                      {isSelected && <Check size={14} className="text-accent shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Optional Dropoff Location if checked */}
        {rentalMode === "self-drive" && differentDropoff && (
          <div className="relative flex-1 min-w-0 border-t md:border-t-0 md:border-l border-border">
            <SearchSegment
              icon={<MapPin size={18} />}
              label="Địa điểm trả xe"
              value={dropoffLocation}
              placeholder="VD: Đà Lạt, Cam Ranh..."
              onClear={() => setDropoffLocation("")}
            >
              <input
                type="text"
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
                placeholder="Nhập địa điểm trả xe..."
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-foreground placeholder:text-foreground/40 outline-none border-none p-0"
              />
            </SearchSegment>
          </div>
        )}

        {/* Segment 2: Rental Date Range with Days Badge (Like Image 3) */}
        <div className="relative flex-1 min-w-[240px] border-t md:border-t-0 md:border-l border-border">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveDropdown(activeDropdown === "date" ? null : "date")}
            className="flex items-center gap-3 px-4 py-2 sm:py-2.5 cursor-pointer hover:bg-black/5 dark:hover:bg-[var(--bg-card)] rounded-xl sm:rounded-2xl transition-all"
          >
            <CalendarIcon size={18} className="text-accent shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/60 truncate">
                  {t.selfDrive?.rentalPeriod || "Thời gian thuê xe"}
                </span>
                {/* Days Badge moved to top row */}
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 leading-none">
                  <CalendarDays size={10} />
                  <span>{rentalDays} ngày</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground whitespace-nowrap mt-0.5">
                <span>
                  {dateRange?.start ? formatToDisplayDate(dateRange.start) : "Chọn ngày"}
                </span>
                <span className="text-foreground/40 font-normal">→</span>
                <span>
                  {dateRange?.end ? formatToDisplayDate(dateRange.end) : "Chọn ngày"}
                </span>
              </div>
            </div>
          </div>

          {/* RangeCalendar Popover */}
          {activeDropdown === "date" && (
            <div className="absolute top-full left-0 md:left-auto md:right-0 mt-2 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-2xl z-50 w-80 sm:w-96 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-black uppercase text-foreground">
                  {t.selfDrive?.rentalPeriod || "Chọn thời gian thuê"}
                </span>
                <span className="text-xs font-black text-accent">
                  {rentalDays} ngày
                </span>
              </div>

              <RangeCalendar
                aria-label="Rental date range"
                value={dateRange as any}
                onChange={(val) => {
                  if (val) {
                    setDateRange(val as { start: DateValue; end: DateValue });
                    if (val.start && val.end && val.start.toString() !== val.end.toString()) {
                      setActiveDropdown(null);
                    }
                  }
                }}
                minValue={now as any}
              >
                <RangeCalendar.Header className="flex items-center justify-between mb-3 px-1">
                  <RangeCalendar.Heading className="text-xs font-black text-foreground" />
                  <div className="flex gap-1">
                    <RangeCalendar.NavButton slot="previous" className="p-1 rounded hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
                    <RangeCalendar.NavButton slot="next" className="p-1 rounded hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
                  </div>
                </RangeCalendar.Header>
                <RangeCalendar.Grid className="w-full">
                  <RangeCalendar.GridHeader className="text-foreground/50 text-[10px] font-bold">
                    {(day) => (
                      <RangeCalendar.HeaderCell className="w-full text-center py-1">
                        {day}
                      </RangeCalendar.HeaderCell>
                    )}
                  </RangeCalendar.GridHeader>
                  <RangeCalendar.GridBody>
                    {(date) => <RangeCalendar.Cell date={date} />}
                  </RangeCalendar.GridBody>
                </RangeCalendar.Grid>
              </RangeCalendar>
            </div>
          )}
        </div>

        {/* Segment 3: Concrete Vehicle Category Selection (No "Tất cả xe") */}
        <div className="relative flex-none md:w-56 border-t md:border-t-0 md:border-l border-border">
          <SearchSegment
            icon={<Car size={18} />}
            label={t.selfDrive?.selectCategory || "Dòng xe"}
            value={getCategoryDisplayName(selectedCategory)}
            hasDropdown
            isActive={activeDropdown === "seats"}
            onClick={() => setActiveDropdown(activeDropdown === "seats" ? null : "seats")}
          />

          {/* Vehicle Category Dropdown Popover */}
          {activeDropdown === "seats" && (
            <div className="absolute top-full right-0 mt-2 bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-2xl z-50 w-64 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/60 px-3 py-1.5">
                {t.selfDrive?.selectCategory || "Chọn phân khúc xe"}
              </div>
              <div className="space-y-1">
                {categories.map((cat) => {
                  const tr = cat.translations?.find((t) => t.locale === language) || cat.translations?.[0];
                  const name = tr?.name || cat.code;
                  const seatText = cat.minSeat === cat.maxSeat ? `${cat.minSeat} chỗ` : `${cat.minSeat}-${cat.maxSeat} chỗ`;
                  const isSelected = selectedCategory?.id === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setActiveDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer border-none ${
                        isSelected
                          ? "bg-accent/10 dark:bg-accent/20 text-accent font-bold"
                          : "hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] text-foreground"
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate">{name}</span>
                        <span className="text-[10px] text-foreground/50 font-medium">{seatText}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-accent shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Button: Search */}
        <div className="shrink-0 p-1">
          <button
            type="submit"
            className="w-full md:w-auto h-12 md:h-13 px-6 sm:px-8 bg-accent hover:bg-accent-hover text-accent-foreground font-black text-sm rounded-xl sm:rounded-2xl shadow-md transition-all cursor-pointer border-none flex items-center justify-center gap-2"
          >
            <Search size={16} />
            <span>{t.selfDrive?.bookCar || "Đặt xe"}</span>
          </button>
        </div>
      </form>

      {/* Bottom info badges (Like Image 3) */}
      <div className="hidden sm:flex items-center gap-4 px-2 text-[11px] font-semibold text-foreground/70">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-green-500" />
          <span>Bảo hiểm chuyến đi tiêu chuẩn & Hỗ trợ kỹ thuật 24/7</span>
        </div>
        <span className="opacity-30">•</span>
        <span>Thủ tục nhận xe nhanh chóng (CCCD / GPLX)</span>
      </div>
    </div>
  );
}
