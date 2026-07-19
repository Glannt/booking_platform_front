"use client";

import React, { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  Car,
  Users,
  Luggage,
  CheckCircle,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button, Skeleton, Select, ListBox, DatePicker, DateField, Calendar, Label } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";

import { useI18n } from "@/context/LanguageContext";
import { getActiveIntercityRoutes, type IntercityRouteDto, type IntercityRoutePriceDto } from "@/lib/api/rental";
import { getVehicleCategories, getRentableVehiclesByCategory, type VehicleCategoryDto, type VehicleDto } from "@/lib/api/fleet";
import { formatPrice as _formatPrice } from "@/lib/format";
import type { SectionDto } from "@/lib/api/sections";

interface CategoryWithVehicles {
  category: VehicleCategoryDto;
  vehicles: VehicleDto[];
  price: number;
}

interface RouteDetailClientProps {
  sections: SectionDto[];
}

export default function RouteDetailClient({ sections }: RouteDetailClientProps) {
  const router = useRouter();
  const { language, t } = useI18n();
  const vi = language === "vi";

  const prefixUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const segments = url.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) return url;
    return `/${language}${url === "/" ? "" : url}`;
  };

  const [route, setRoute] = useState<IntercityRouteDto | null>(null);
  const [categories, setCategories] = useState<CategoryWithVehicles[]>([]);
  const [loading, setLoading] = useState(true);

  const [tripType, setTripType] = useState("one-way");
  const [dateValue, setDateValue] = useState<DateValue | null>(null);
  const [departureTime, setDepartureTime] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const vehicleScrollRef = useRef<HTMLDivElement>(null);
  const [activeVehicleSlide, setActiveVehicleSlide] = useState(0);
  const [vehicleDotCount, setVehicleDotCount] = useState(0);

  const currentDate = today(getLocalTimeZone());
  const formatPrice = (value: number) => _formatPrice(value, language);

  const getRouteName = (r: IntercityRouteDto) => {
    const tr = r.translations?.find((t) => t.locale === language);
    if (tr?.name) return tr.name;
    return `${r.originCity} ⇌ ${r.destinationCity}`;
  };

  const getRouteDescription = (r: IntercityRouteDto) => {
    const tr = r.translations?.find((t) => t.locale === language);
    return tr?.description || "";
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [routesRes, catsRes] = await Promise.all([
          getActiveIntercityRoutes(),
          getVehicleCategories({ active: true, page: 0, size: 100 }),
        ]);

        const routes = (routesRes?.data ?? []) as IntercityRouteDto[];
        const foundRoute = routes[0];

        if (foundRoute) {
          setRoute(foundRoute);

          const allCats = (catsRes?.data?.content ?? []) as VehicleCategoryDto[];
          const routePrices = foundRoute.prices ?? [];

          const catsWithVehicles: CategoryWithVehicles[] = [];
          for (const cat of allCats) {
            const priceEntry = routePrices.find(
              (p) => p.vehicleCategoryId === cat.id && p.active
            );
            if (!priceEntry) continue;

            try {
              const vehiclesRes = await getRentableVehiclesByCategory(cat.id);
              const vehicles = (vehiclesRes?.data ?? []) as VehicleDto[];
              if (vehicles.length === 0) continue;

              const price = priceEntry.oneWayAmount;
              catsWithVehicles.push({ category: cat, vehicles, price });
            } catch {
              continue;
            }
          }

          setCategories(catsWithVehicles);
          if (catsWithVehicles.length > 0) {
            setSelectedCategoryId(catsWithVehicles[0].category.id);
          }

          if (foundRoute.hasDepartureTimes && foundRoute.departureTimes?.length) {
            const sorted = foundRoute.departureTimes.sort((a, b) => a.orderIndex - b.orderIndex);
            if (sorted.length > 0) setDepartureTime(sorted[0].departureTime);
          }
        }
      } catch (err) {
        console.error("Failed to load route detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [language]);

  useEffect(() => {
    const el = vehicleScrollRef.current;
    if (!el || categories.length === 0) return;

    const calcDots = () => {
      const cards = el.querySelectorAll<HTMLElement>("[data-vehicle-card]");
      if (cards.length === 0) { setVehicleDotCount(0); return; }
      const cardWidth = cards[0].offsetWidth + 16;
      const visibleCount = Math.max(1, Math.floor(el.clientWidth / cardWidth));
      const dots = Math.max(1, categories.length - visibleCount + 1);
      setVehicleDotCount(dots);
      setActiveVehicleSlide((prev) => Math.min(prev, dots - 1));
    };

    const handleScroll = () => {
      const cards = el.querySelectorAll<HTMLElement>("[data-vehicle-card]");
      if (cards.length === 0) return;
      const cardWidth = cards[0].offsetWidth + 16;
      const idx = Math.round(el.scrollLeft / cardWidth);
      setActiveVehicleSlide(Math.min(idx, Math.max(0, vehicleDotCount - 1)));
    };

    calcDots();
    el.addEventListener("scroll", handleScroll, { passive: true });
    const ro = new ResizeObserver(calcDots);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", handleScroll);
      ro.disconnect();
    };
  }, [categories.length, vehicleDotCount]);

  const selectedCategory = categories.find((c) => c.category.id === selectedCategoryId);

  const handleBooking = () => {
    if (!route) return;

    let dateStr = "";
    if (dateValue) {
      const y = dateValue.year;
      const m = String(dateValue.month).padStart(2, "0");
      const d = String(dateValue.day).padStart(2, "0");
      dateStr = `${y}-${m}-${d}`;
    }

    const params = new URLSearchParams({
      routeId: String(route.id),
      tripType,
    });
    if (dateStr) params.set("departureDate", dateStr);
    if (departureTime) params.set("departureTime", departureTime);

    router.push(prefixUrl(`/rent-car/confirm?${params.toString()}`));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
        <div className="relative w-full h-[280px] md:h-[340px] bg-slate-900 overflow-hidden">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          <div className="max-w-7xl mx-auto w-full px-6 pb-8 relative z-10 space-y-4 pt-40">
            <Skeleton className="h-8 w-48 rounded-lg bg-white/20" />
            <Skeleton className="h-4 w-64 rounded-lg bg-white/20" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-48 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-sm font-bold text-slate-500">
          {t.rentCar.routeNotFound}
        </p>
          <Button
          onClick={() => router.push(prefixUrl("/rent-car"))}
          className="bg-accent text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          {t.common.goBack}
        </Button>
      </div>
    );
  }

  const departureTimes = route.departureTimes
    ? [...route.departureTimes].sort((a, b) => a.orderIndex - b.orderIndex)
    : [];

  const heroSection = sections.find((s) => s.sectionType === "HERO_BANNER");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">

      {/* Hero Banner */}
      <section className="relative w-full h-[280px] md:h-[340px] bg-gradient-to-br from-accent/90 to-blue-600/80 overflow-hidden flex items-end">
        {heroSection?.imageUrls?.[0] && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url('${heroSection.imageUrls[0]}')` }}
          />
        )}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

        <div className="max-w-7xl mx-auto w-full px-6 pb-8 relative z-10 text-white space-y-3">
          <Button
            onClick={() => router.push(prefixUrl("/rent-car"))}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white bg-black/40 hover:bg-black/60 border-none rounded-full px-4 py-2 cursor-pointer mb-2"
          >
            <ArrowLeft size={13} />
            <span>{t.common.goBack}</span>
          </Button>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-white/70 font-semibold">
              <MapPin size={14} className="text-white" />
              <span>{route.originCity}</span>
              <span className="text-white/40">→</span>
              <span>{route.destinationCity}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              {heroSection?.translations?.find((tr) => tr.locale === language)?.title
                ?? getRouteName(route)}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/80 font-semibold">
              {route.distanceKm && (
                <span className="flex items-center gap-1">
                  <Info size={13} className="text-white/60" />
                  {route.distanceKm} km
                </span>
              )}
              {route.estimatedHours && (
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-white/60" />
                  ~{route.estimatedHours} {t.common.hours}
                </span>
              )}
              {departureTimes.length > 0 && (
                <span className="flex items-center gap-1">
                  <CalendarIcon size={13} className="text-white/60" />
                  {departureTimes.length} {t.rentCar.tripsPerDay}
                </span>
              )}
            </div>
            {departureTimes.length > 0 && (
              <p className="text-[11px] text-white/60 font-semibold">
                {t.rentCar.fixedSchedule}
                {departureTimes.map(dt => dt.departureTime).join(" · ")}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Detail Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Route Info */}
        <div className="lg:col-span-7 space-y-6">
          {/* Overview */}
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              {t.common.overview}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              {getRouteDescription(route) || t.rentCar.heroDesc}
            </p>

            {/* Route stats */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <MapPin size={18} className="text-accent mx-auto mb-1" />
                <p className="text-lg font-black text-slate-800 dark:text-white">{route.distanceKm || "?"}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">km</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <Clock size={18} className="text-accent mx-auto mb-1" />
                <p className="text-lg font-black text-slate-800 dark:text-white">{route.estimatedHours || "?"}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{t.common.hours}</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <Car size={18} className="text-accent mx-auto mb-1" />
                <p className="text-lg font-black text-slate-800 dark:text-white">{categories.length}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{t.rentCar.vehicleTypes}</p>
              </div>
            </div>
          </div>

          {/* Departure Times */}
          {departureTimes.length > 0 && (
            <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                {t.rentCar.fixedDepartureTimes}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {departureTimes.map((dt) => (
                  <div
                    key={dt.departureTime}
                    className="text-center p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                  >
                    <Clock size={16} className="text-accent mx-auto mb-1" />
                    <p className="text-sm font-black text-slate-800 dark:text-white">{dt.departureTime}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Table */}
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              {t.rentCar.priceTableTitle}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left py-2 font-bold text-slate-500 uppercase tracking-wider">{t.rentCar.vehicleType}</th>
                    <th className="text-center py-2 font-bold text-slate-500 uppercase tracking-wider">{t.common.seats}</th>
                    <th className="text-right py-2 font-bold text-slate-500 uppercase tracking-wider">{t.rentCar.oneWay}</th>
                    <th className="text-right py-2 font-bold text-slate-500 uppercase tracking-wider">{t.rentCar.roundTrip}</th>
                  </tr>
                </thead>
                <tbody>
                  {route.prices?.filter(p => p.active).map((price) => {
                    const cat = categories.find(c => c.category.id === price.vehicleCategoryId)?.category;
                    if (!cat) return null;
                    const catName = cat.translations?.find(tr => tr.locale === language)?.name || cat.code;
                    return (
                      <tr key={price.id} className="border-b border-slate-50 dark:border-slate-900">
                        <td className="py-3 font-bold text-slate-800 dark:text-white">{catName}</td>
                        <td className="py-3 text-center text-slate-500">{cat.minSeat}-{cat.maxSeat}</td>
                        <td className="py-3 text-right font-black text-accent">{formatPrice(price.oneWayAmount)}</td>
                        <td className="py-3 text-right font-bold text-slate-600 dark:text-slate-300">{formatPrice(price.roundTripAmount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vehicle Examples - Slider */}
          {categories.length > 0 && (
            <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider">
                  {t.rentCar.representativeVehicles}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!vehicleScrollRef.current) return;
                      const card = vehicleScrollRef.current.querySelector<HTMLElement>("[data-vehicle-card]");
                      if (card) vehicleScrollRef.current.scrollBy({ left: -(card.offsetWidth + 16), behavior: "smooth" });
                    }}
                    className="p-2 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} className="text-slate-500" />
                  </button>
                  <button
                    onClick={() => {
                      if (!vehicleScrollRef.current) return;
                      const card = vehicleScrollRef.current.querySelector<HTMLElement>("[data-vehicle-card]");
                      if (card) vehicleScrollRef.current.scrollBy({ left: card.offsetWidth + 16, behavior: "smooth" });
                    }}
                    className="p-2 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} className="text-slate-500" />
                  </button>
                </div>
              </div>

              <div
                ref={vehicleScrollRef}
                className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-4 pb-2"
              >
                {categories.map((item) => {
                  const catName = item.category.translations?.find(tr => tr.locale === language)?.name || item.category.code;
                  const displayVehicles = item.vehicles.slice(0, 3);
                  return (
                    <div
                      key={item.category.id}
                      data-vehicle-card
                      className="min-w-[75vw] sm:min-w-[calc(50%-8px)] lg:min-w-[calc(25%-12px)] snap-start flex flex-col rounded-tl-3xl rounded-bl-3xl rounded-br-3xl rounded-tr-[48px] overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0"
                    >
                      {/* Vehicle thumbnail */}
                      <div className="relative h-40 overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {displayVehicles[0]?.thumbnailUrl ? (
                          <img
                            src={displayVehicles[0].thumbnailUrl}
                            alt={catName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/5 to-accent/15">
                            <Car size={36} className="text-accent/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-white text-sm font-black leading-tight">{catName}</p>
                          <p className="text-white/70 text-[10px] font-bold mt-0.5">
                            {item.category.minSeat}-{item.category.maxSeat} {t.common.seats}
                          </p>
                        </div>
                      </div>

                      {/* Vehicle list */}
                      <div className="p-4 space-y-2.5 flex-1">
                        {displayVehicles.map((v) => (
                          <div key={v.id} className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-black">
                              {v.thumbnailUrl ? (
                                <img src={v.thumbnailUrl} alt={`${v.brand} ${v.model}`} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Car size={14} className="text-slate-300 dark:text-slate-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{v.brand} {v.model}</p>
                              <p className="text-[10px] text-slate-400">{v.year} · {v.fuelType}</p>
                            </div>
                          </div>
                        ))}
                        {item.vehicles.length > 3 && (
                          <p className="text-[10px] text-slate-400 font-bold text-center pt-1">
                            +{item.vehicles.length - 3} {t.rentCar.otherVehiclesHint}
                          </p>
                        )}
                      </div>

                      {/* Price footer */}
                      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-black/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.rentCar.from}</p>
                        <p className="text-sm font-black text-accent">{formatPrice(item.price)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination dots */}
              {vehicleDotCount > 1 && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  {Array.from({ length: vehicleDotCount }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (!vehicleScrollRef.current) return;
                        const cards = vehicleScrollRef.current.querySelectorAll<HTMLElement>("[data-vehicle-card]");
                        if (!cards[i]) return;
                        vehicleScrollRef.current.scrollTo({ left: cards[i].offsetLeft - 16, behavior: "smooth" });
                      }}
                      className={`rounded-full transition-all duration-300 cursor-pointer border-none ${
                        i === activeVehicleSlide
                          ? "w-6 h-2 bg-accent"
                          : "w-2 h-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Booking Sidebar */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">
              {t.common.bookNow}
            </h3>

            {/* Trip Type */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.rentCar.tripType}</p>
              <Select
                selectedKey={tripType}
                onSelectionChange={(key) => { if (key) setTripType(key as string); }}
              >
                <Select.Trigger className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 text-sm font-bold flex items-center justify-between cursor-pointer">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50">
                  <ListBox>
                    <ListBox.Item key="one-way" id="one-way" textValue={t.rentCar.oneWay} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                      {t.rentCar.oneWay}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item key="round-trip" id="round-trip" textValue={t.rentCar.roundTrip} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                      {t.rentCar.roundTrip}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            {/* Date Picker */}
            <div className="space-y-1.5">
              <DatePicker
                className="w-full"
                minValue={currentDate}
                value={dateValue}
                onChange={setDateValue}
              >
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.rentCar.date}</Label>
                <DateField.Group fullWidth className="h-10 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between">
                  <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                    {(segment) => <DateField.Segment segment={segment} />}
                  </DateField.Input>
                  <DateField.Suffix>
                    <DatePicker.Trigger className="cursor-pointer">
                      <DatePicker.TriggerIndicator />
                    </DatePicker.Trigger>
                  </DateField.Suffix>
                </DateField.Group>
                <DatePicker.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                  <Calendar aria-label="Pick date">
                    <Calendar.Header className="flex items-center justify-between mb-2">
                      <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                        <Calendar.YearPickerTriggerHeading />
                        <Calendar.YearPickerTriggerIndicator />
                      </Calendar.YearPickerTrigger>
                      <div className="flex gap-1">
                        <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" />
                        <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" />
                      </div>
                    </Calendar.Header>
                    <Calendar.Grid className="w-full">
                      <Calendar.GridHeader className="text-slate-400 text-[10px] font-bold">
                        {(day) => <Calendar.HeaderCell className="w-8 h-8 text-center">{day}</Calendar.HeaderCell>}
                      </Calendar.GridHeader>
                      <Calendar.GridBody>
                        {(date) => (
                          <Calendar.Cell
                            date={date}
                            className="w-8 h-8 text-xs font-semibold text-center cursor-pointer rounded-lg hover:bg-accent/10 hover:text-accent aria-selected:bg-accent aria-selected:text-white"
                          />
                        )}
                      </Calendar.GridBody>
                    </Calendar.Grid>
                    <Calendar.YearPickerGrid className="w-full mt-2 border-t pt-2">
                      <Calendar.YearPickerGridBody>
                        {({ year }) => (
                          <Calendar.YearPickerCell
                            year={year}
                            className="text-xs font-semibold px-2 py-1 cursor-pointer hover:bg-slate-100 rounded"
                          />
                        )}
                      </Calendar.YearPickerGridBody>
                    </Calendar.YearPickerGrid>
                  </Calendar>
                </DatePicker.Popover>
              </DatePicker>
            </div>

            <Button
              onClick={handleBooking}
              isDisabled={!selectedCategory}
              className="w-full h-12 rounded-2xl font-black text-sm sm:text-base bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
            >
              {t.common.bookNow}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
