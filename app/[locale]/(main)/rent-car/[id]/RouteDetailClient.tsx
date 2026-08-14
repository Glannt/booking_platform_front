"use client";

import React, { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  Car,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button, Skeleton, Select, ListBox, DatePicker, DateField, Calendar, Label, Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalHeader, ModalBody } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import dynamic from "next/dynamic";

import { useI18n } from "@/context/LanguageContext";
import { getActiveIntercityRoutes, getIntercityRouteById, type IntercityRouteDto, type IntercityRoutePriceDto } from "@/lib/api/rental";
import { resolveImageUrls } from "@/lib/api/media";
import { getVehicleCategories, getRentableVehiclesByCategory, type VehicleCategoryDto, type VehicleDto } from "@/lib/api/fleet";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { calcIntercityPrice } from "@/lib/pricing";
import { backendUrl } from "@/lib/api/client";

const RouteMap = dynamic(() => import("@/components/route-map"), { ssr: false });
import type { SectionDto } from "@/lib/api/sections";

interface CategoryWithVehicles {
  category: VehicleCategoryDto;
  vehicles: VehicleDto[];
  price: number;
}

interface RouteDetailClientProps {
  sections: SectionDto[];
  routeId: number;
}

export default function RouteDetailClient({ sections, routeId }: RouteDetailClientProps) {
  const router = useRouter();

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${backendUrl}${url}`;
  };
  const { language, t } = useI18n();

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
  const [vehicleModalCategoryId, setVehicleModalCategoryId] = useState<number | null>(null);
  const carouselRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  const currentDate = today(getLocalTimeZone());
  const formatPrice = (value: number) => _formatPrice(value, language);

  const scrollCarousel = (vehicleId: number, dir: "left" | "right") => {
    const el = carouselRefs.current.get(vehicleId);
    if (!el) return;
    const img = el.querySelector<HTMLElement>("[data-carousel-img]");
    if (!img) return;
    el.scrollBy({ left: dir === "left" ? -img.offsetWidth : img.offsetWidth, behavior: "smooth" });
  };

  const getRouteName = (r: IntercityRouteDto) => {
    const tr = r.translations?.find((t) => t.locale === language);
    if (tr?.name) return tr.name;
    return `${r.originCity} ⇌ ${r.destinationCity}`;
  };

  const getRouteDescription = (r: IntercityRouteDto) => {
    const tr = r.translations?.find((t) => t.locale === language);
    return tr?.description || "";
  };

  const [routeImages, setRouteImages] = useState<string[]>([]);

  const heroSection = sections.find((s) => s.sectionType === "HERO_BANNER");
  const fallbackHeroImages = heroSection?.imageUrls?.filter(url => url) ?? [];
  const displayHeroImages = routeImages.length > 0 ? routeImages : fallbackHeroImages;
  const isHeroCarousel = displayHeroImages.length > 1;

  useEffect(() => {
    if (!isHeroCarousel) return;
    const timer = setInterval(() => {
      setHeroImageIndex(prev => (prev + 1) % displayHeroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHeroCarousel, displayHeroImages.length]);

  const prevHero = () => setHeroImageIndex(prev => (prev - 1 + displayHeroImages.length) % displayHeroImages.length);
  const nextHero = () => setHeroImageIndex(prev => (prev + 1) % displayHeroImages.length);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [routeRes, catsRes] = await Promise.all([
          getIntercityRouteById(routeId),
          getVehicleCategories({ active: true, page: 0, size: 100 }),
        ]);

        const foundRoute = (routeRes?.data ?? null) as IntercityRouteDto | null;

        if (foundRoute) {
          setRoute(foundRoute);

          if (foundRoute.imageIds && foundRoute.imageIds.length > 0) {
            try {
              const resolved = await resolveImageUrls(foundRoute.imageIds);
              setRouteImages(resolved.map(r => r.url));
            } catch (err) {
              console.error("Failed to resolve route images:", err);
            }
          }

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

              const price = calcIntercityPrice(foundRoute.distanceKm, priceEntry.perKmAmount, false);
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
  }, [routeId, language]);

  const selectedCategory = categories.find((c) => c.category.id === selectedCategoryId);
  const selectedModalCategory = categories.find((c) => c.category.id === vehicleModalCategoryId);

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">

      {/* Hero Banner */}
      <section className="relative w-full h-[300px] md:h-[360px] bg-slate-950 overflow-hidden flex items-end">
        {/* Floating Back Button at Top Left */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-30">
          <Button
            onClick={() => router.push(prefixUrl("/rent-car"))}
            className="flex items-center gap-2 text-xs font-bold text-white/90 hover:text-white bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 cursor-pointer transition-all shadow-lg"
          >
            <ArrowLeft size={14} />
            <span>{t.rentCar.allIntercityRoutes || "Tất cả tuyến xe đi tỉnh"}</span>
          </Button>
        </div>

        {/* Background images — layered with fade transition */}
        {displayHeroImages.length > 0 && (
          <div className="absolute inset-0">
            {displayHeroImages.map((url, idx) => (
              <div
                key={url}
                className="absolute inset-0 transition-opacity duration-1000"
                style={{ opacity: idx === heroImageIndex ? 1 : 0 }}
              >
                <img src={url} alt="" className="w-full h-full object-cover brightness-[0.80]" />
              </div>
            ))}
          </div>
        )}

        {/* Balanced Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

        {/* Chevron arrows */}
        {isHeroCarousel && (
          <>
            <button
              onClick={prevHero}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button
              onClick={nextHero}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          </>
        )}

        {/* Dots indicator */}
        {isHeroCarousel && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {displayHeroImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHeroImageIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${idx === heroImageIndex
                  ? "bg-[#C9A227] scale-125"
                  : "bg-white/40 hover:bg-white/70"
                  }`}
              />
            ))}
          </div>
        )}

        <div className="max-w-7xl mx-auto w-full px-6 pb-8 relative z-10 text-white space-y-3">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-white/90">
              <MapPin size={13} className="text-[#C9A227]" />
              <span>{route.originCity}</span>
              <span className="text-white/40">→</span>
              <span>{route.destinationCity}</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white drop-shadow-md">
              {heroSection?.translations?.find((tr) => tr.locale === language)?.title
                ?? getRouteName(route)}
            </h1>

            <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold pt-0.5">
              {route.distanceKm && (
                <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/15 text-white/95">
                  <Info size={13} className="text-[#C9A227]" />
                  {route.distanceKm} km
                </span>
              )}
              {route.estimatedHours && (
                <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/15 text-white/95">
                  <Clock size={13} className="text-[#C9A227]" />
                  ~{route.estimatedHours} {t.common.hours}
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-[#C9A227] text-slate-950 px-3 py-1 rounded-full font-black shadow-md">
                <Car size={13} />
                {t.homePage?.withDriver ? `${t.homePage.withDriver} (100%)` : "Kèm tài xế riêng"}
              </span>
              {departureTimes.length > 0 && (
                <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/15 text-white/95">
                  <CalendarIcon size={13} className="text-[#C9A227]" />
                  {departureTimes.length} {t.rentCar.tripsPerDay}
                </span>
              )}
            </div>

            {departureTimes.length > 0 && (
              <p className="text-[11px] text-white/70 font-semibold pt-1">
                {t.rentCar.fixedSchedule}: {departureTimes.map(dt => dt.departureTime).join(" · ")}
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
          <div className="bg-white dark:bg-[var(--bg-card)] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              {t.common.overview}
            </h2>
            <p className="text-xs leading-relaxed font-semibold text-slate-600 dark:text-slate-300">
              {getRouteDescription(route) || t.rentCar.heroDesc}
            </p>

            {/* Route stats */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-700/60">
                <MapPin size={18} className="text-accent mx-auto mb-1" />
                <p className="text-lg font-black text-slate-900 dark:text-white">{route.distanceKm || "?"}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">km</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-700/60">
                <Clock size={18} className="text-accent mx-auto mb-1" />
                <p className="text-lg font-black text-slate-900 dark:text-white">{route.estimatedHours || "?"}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t.common.hours}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-700/60">
                <Car size={18} className="text-accent mx-auto mb-1" />
                <p className="text-lg font-black text-slate-900 dark:text-white">{categories.length}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t.rentCar.vehicleTypes}</p>
              </div>
            </div>
          </div>

          {/* Departure Times */}
          {departureTimes.length > 0 && (
            <div className="bg-white dark:bg-[var(--bg-card)] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                {t.rentCar.fixedDepartureTimes}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {departureTimes.map((dt) => (
                  <div
                    key={dt.departureTime}
                    className="text-center p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50 dark:bg-[var(--bg-surface)]"
                  >
                    <Clock size={16} className="text-accent mx-auto mb-1" />
                    <p className="text-sm font-black text-slate-900 dark:text-white">{dt.departureTime}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Table */}
          <div className="bg-white dark:bg-[var(--bg-card)] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {t.rentCar.priceTableTitle}
              </h2>
              <span className="text-[11px] font-bold text-[#C9A227] bg-[#C9A227]/10 dark:bg-[#C9A227]/20 px-2.5 py-0.5 rounded-full border border-[#C9A227]/30">
                {t.homePage?.withDriver ? `${t.homePage.withDriver}` : "Trọn gói tài xế"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="text-left py-2 font-bold uppercase tracking-wider">{t.rentCar.vehicleType}</th>
                    <th className="text-center py-2 font-bold uppercase tracking-wider">{t.common.seats}</th>
                    <th className="text-right py-2 font-bold uppercase tracking-wider">{t.rentCar.oneWay}</th>
                    <th className="text-right py-2 font-bold uppercase tracking-wider">{t.rentCar.roundTrip}</th>
                    <th className="text-center py-2 font-bold uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {route.prices?.filter(p => p.active).map((price) => {
                    const catWithVehicles = categories.find(c => c.category.id === price.vehicleCategoryId);
                    const cat = catWithVehicles?.category;
                    if (!cat) return null;
                    const catName = cat.translations?.find(tr => tr.locale === language)?.name || cat.code;
                    const hasVehicles = (catWithVehicles?.vehicles.length ?? 0) > 0;
                    return (
                      <tr key={price.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-[var(--bg-surface)]/50 transition-colors">
                        <td className="py-3 font-bold text-slate-900 dark:text-white">{catName}</td>
                        <td className="py-3 text-center text-slate-600 dark:text-slate-400">{cat.minSeat}-{cat.maxSeat}</td>
                        <td className="py-3 text-right font-black text-accent">{formatPrice(calcIntercityPrice(route.distanceKm, price.perKmAmount, false))}</td>
                        <td className="py-3 text-right font-bold text-slate-700 dark:text-slate-300">{formatPrice(calcIntercityPrice(route.distanceKm, price.perKmAmount, true))}</td>
                        <td className="py-3 text-center">
                          {hasVehicles && (
                            <button
                              onClick={() => setVehicleModalCategoryId(price.vehicleCategoryId)}
                              className="text-[10px] font-bold text-accent hover:underline cursor-pointer"
                            >
                              {t.rentCar.viewRepresentativeVehicles}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Booking Sidebar */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
          <div className="bg-white dark:bg-[var(--bg-card)] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {t.common.bookNow}
              </h3>
              <span className="text-[10px] font-bold text-[#C9A227] bg-[#C9A227]/10 dark:bg-[#C9A227]/20 px-2 py-0.5 rounded-md border border-[#C9A227]/30">
                100% Có tài xế
              </span>
            </div>

            {/* Prominent Driver Included Notice */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#C9A227] text-slate-950 flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-sm">
                <Car size={14} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {t.rentCar.benefit1Title || "Tài xế chuyên tuyến"}
                </p>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-snug">
                  {t.rentCar.heroDesc || "Xe riêng đưa đón tận nơi kèm tài xế phục vụ chu đáo, an toàn suốt chuyến đi."}
                </p>
              </div>
            </div>

            {/* Trip Type */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.rentCar.tripType}</p>
              <Select
                selectedKey={tripType}
                onSelectionChange={(key) => { if (key) setTripType(key as string); }}
              >
                <Select.Trigger className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-900 dark:text-slate-100 text-sm font-bold flex items-center justify-between cursor-pointer">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="bg-white dark:bg-[var(--bg-surface)]/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 z-50">
                  <ListBox>
                    <ListBox.Item key="one-way" id="one-way" textValue={t.rentCar.oneWay} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)]">
                      {t.rentCar.oneWay}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item key="round-trip" id="round-trip" textValue={t.rentCar.roundTrip} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)]">
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
                <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.rentCar.date}</Label>
                <DateField.Group fullWidth className="h-10 bg-slate-50 dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 flex items-center justify-between">
                  <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none text-slate-900 dark:text-slate-100">
                    {(segment) => <DateField.Segment segment={segment} />}
                  </DateField.Input>
                  <DateField.Suffix>
                    <DatePicker.Trigger className="cursor-pointer">
                      <DatePicker.TriggerIndicator />
                    </DatePicker.Trigger>
                  </DateField.Suffix>
                </DateField.Group>
                <DatePicker.Popover className="bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                  <Calendar aria-label="Pick date">
                    <Calendar.Header className="flex items-center justify-between mb-2">
                      <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                        <Calendar.YearPickerTriggerHeading />
                        <Calendar.YearPickerTriggerIndicator />
                      </Calendar.YearPickerTrigger>
                      <div className="flex gap-1">
                        <Calendar.NavButton slot="previous" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
                        <Calendar.NavButton slot="next" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer" />
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
                            className="text-xs font-semibold px-2 py-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] rounded"
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
              className="w-full h-12 rounded-xl font-black text-sm sm:text-base bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
            >
              {t.common.bookNow}
            </Button>
          </div>

          {/* Route Map */}
          {route && (
            <div className="bg-white dark:bg-[var(--bg-card)] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {t.rentCar.routeMap}
              </h3>
              <RouteMap
                originLat={route.originLat ? Number(route.originLat) : null}
                originLng={route.originLng ? Number(route.originLng) : null}
                originLabel={route.originCity}
                destinationLat={route.destinationLat ? Number(route.destinationLat) : null}
                destinationLng={route.destinationLng ? Number(route.destinationLng) : null}
                destinationLabel={route.destinationCity}
              />
            </div>
          )}
        </div>
      </main>

      {/* Vehicle List Modal */}
      <Modal isOpen={!!vehicleModalCategoryId} onOpenChange={(open) => { if (!open) setVehicleModalCategoryId(null); }}>
        <ModalBackdrop>
          <ModalContainer>
            <ModalDialog className="max-w-lg w-[calc(100vw-2rem)]">
              <ModalHeader className="flex items-center justify-between">
                <span>
                  {selectedModalCategory?.category.translations?.find(tr => tr.locale === language)?.name
                    || selectedModalCategory?.category.code}
                  <span className="text-xs font-normal text-slate-400 ml-2">
                    ({selectedModalCategory?.vehicles.length} {t.rentCar.vehicleList})
                  </span>
                </span>
                <button onClick={() => setVehicleModalCategoryId(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer">
                  <X size={16} className="text-slate-400" />
                </button>
              </ModalHeader>
              <ModalBody className="gap-4 max-h-[70vh] overflow-y-auto p-1">
                {selectedModalCategory?.vehicles.map((v) => {
                  const images = v.images && v.images.length > 0
                    ? v.images.map(img => getImageUrl(img.filePath))
                    : v.thumbnailUrl
                      ? [getImageUrl(v.thumbnailUrl)]
                      : [];
                  const hasMultiple = images.length > 1;

                  return (
                    <div key={v.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-surface)] overflow-hidden">
                      {/* Image Carousel */}
                      <div className="relative">
                        <div
                          ref={(el) => { if (el) carouselRefs.current.set(v.id, el); }}
                          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                        >
                          {images.length > 0 ? images.map((src, i) => (
                            <div key={i} data-carousel-img className="w-full shrink-0 snap-start">
                              <img
                                src={src}
                                alt={`${v.brand} ${v.model} ${i + 1}`}
                                className="w-full h-40 sm:h-48 object-cover"
                              />
                            </div>
                          )) : (
                            <div className="w-full h-40 sm:h-48 flex items-center justify-center bg-slate-100 dark:bg-[var(--bg-card)]">
                              <Car size={32} className="text-slate-300 dark:text-slate-600" />
                            </div>
                          )}
                        </div>
                        {hasMultiple && (
                          <>
                            <button
                              onClick={() => scrollCarousel(v.id, "left")}
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white cursor-pointer transition-colors"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <button
                              onClick={() => scrollCarousel(v.id, "right")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white cursor-pointer transition-colors"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Vehicle Info */}
                      <div className="p-3">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{v.brand} {v.model}</p>
                        <p className="text-[11px] text-black dark:text-white mt-0.5">{v.year} · {v.fuelType} · {v.luggage} {v.luggageUnit}{v.luggageWeight ? ` · ${v.luggageWeight}kg` : ""}</p>
                      </div>
                    </div>
                  );
                })}
                {(!selectedModalCategory?.vehicles || selectedModalCategory.vehicles.length === 0) && (
                  <p className="text-xs text-slate-400 text-center py-8">{t.rentCar.noVehiclesFound}</p>
                )}
              </ModalBody>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>
    </div>
  );
}
