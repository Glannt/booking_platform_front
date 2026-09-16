"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  Button,
  Skeleton,
  DatePicker,
  DateField,
  Calendar,
  Label,
  TextField,
  Input,
  FieldError,
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalCloseTrigger,
  ModalHeader,
  ModalBody,
  Chip,
} from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import dynamic from "next/dynamic";

import { useI18n } from "@/context/LanguageContext";
import {
  getIntercityRouteByIdOrSlug,
  type IntercityRouteDto,
  type IntercityDepartureTimeDto,
} from "@/lib/api/rental";
import { resolveImageUrls } from "@/lib/api/media";
import {
  getVehicleCategories,
  getRentableVehiclesByCategory,
  type VehicleCategoryDto,
  type VehicleDto,
} from "@/lib/api/fleet";
import { formatPriceSync as _formatPrice } from "@/lib/format";
import { calcIntercityPrivatePrice, calcSharedPrice } from "@/lib/pricing";
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
  routeIdentifier: string | number;
}

export default function RouteDetailClient({ sections, routeIdentifier }: RouteDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Service Type: "PRIVATE" (Xe riêng) vs "SHARED" (Vé xe ghép chỗ)
  const [serviceType, setServiceType] = useState<"PRIVATE" | "SHARED">("PRIVATE");
  const [tripType, setTripType] = useState<"one-way" | "round-trip">("one-way");
  const [dateValue, setDateValue] = useState<DateValue | null>(null);
  const [departureTime, setDepartureTime] = useState("");
  const [returnDateValue, setReturnDateValue] = useState<DateValue | null>(null);
  const [returnDepartureTime, setReturnDepartureTime] = useState("");
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isPickupInvalid = Boolean(errors.pickupAddress);
  const isDropoffInvalid = Boolean(errors.dropoffAddress);
  const isDateInvalid = Boolean(errors.date);
  const isDepartureTimeInvalid = Boolean(errors.departureTime);
  const isReturnDateInvalid = Boolean(errors.returnDate);
  const isReturnTimeInvalid = Boolean(errors.returnTime);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [vehicleModalCategoryId, setVehicleModalCategoryId] = useState<number | null>(null);
  const carouselRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  useEffect(() => {
    const serviceTypeParam = searchParams.get("serviceType") || searchParams.get("type");
    if (serviceTypeParam === "SHARED" || serviceTypeParam === "shared") {
      setServiceType("SHARED");
    } else if (serviceTypeParam === "PRIVATE" || serviceTypeParam === "private") {
      setServiceType("PRIVATE");
    }

    const tripTypeParam = searchParams.get("tripType");
    if (tripTypeParam === "return" || tripTypeParam === "round-trip") {
      setTripType("round-trip");
    } else if (tripTypeParam === "one-way") {
      setTripType("one-way");
    }

    const paxParam = searchParams.get("passengers") || searchParams.get("pax");
    if (paxParam && Number(paxParam) > 0) {
      setPassengerCount(Math.min(9, Math.max(1, Number(paxParam))));
    }

    const dateParam = searchParams.get("date");
    if (dateParam) {
      try {
        setDateValue(parseDate(dateParam));
      } catch {}
    }

    const returnDateParam = searchParams.get("returnDate");
    if (returnDateParam) {
      try {
        setReturnDateValue(parseDate(returnDateParam));
      } catch {}
    }

    const timeParam = searchParams.get("time") || searchParams.get("departureTime");
    if (timeParam) setDepartureTime(timeParam);

    const returnTimeParam = searchParams.get("returnTime");
    if (returnTimeParam) setReturnDepartureTime(returnTimeParam);

    const pickupParam = searchParams.get("pickup") || searchParams.get("pickupAddress");
    if (pickupParam) setPickupAddress(pickupParam);

    const dropoffParam = searchParams.get("dropoff") || searchParams.get("dropoffAddress");
    if (dropoffParam) setDropoffAddress(dropoffParam);
  }, [searchParams]);

  const currentDate = today(getLocalTimeZone());
  const formatPrice = (value: number) => _formatPrice(value, language);

  const scrollCarousel = (vehicleId: number, dir: "left" | "right") => {
    const el = carouselRefs.current.get(vehicleId);
    if (!el) return;
    const amount = 220;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
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
  const fallbackHeroImages = heroSection?.imageUrls?.filter((url) => url) ?? [];
  const displayHeroImages = routeImages.length > 0 ? routeImages : fallbackHeroImages;
  const isHeroCarousel = displayHeroImages.length > 1;

  useEffect(() => {
    if (!isHeroCarousel) return;
    const timer = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % displayHeroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHeroCarousel, displayHeroImages.length]);

  const prevHero = () =>
    setHeroImageIndex((prev) => (prev - 1 + displayHeroImages.length) % displayHeroImages.length);
  const nextHero = () =>
    setHeroImageIndex((prev) => (prev + 1) % displayHeroImages.length);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [routeRes, catsRes] = await Promise.all([
          getIntercityRouteByIdOrSlug(routeIdentifier),
          getVehicleCategories({ active: true, page: 0, size: 100 }),
        ]);

        const foundRoute = (routeRes?.data ?? null) as IntercityRouteDto | null;

        if (foundRoute) {
          setRoute(foundRoute);

          if (foundRoute.imageIds && foundRoute.imageIds.length > 0) {
            try {
              const resolved = await resolveImageUrls(foundRoute.imageIds);
              setRouteImages(resolved.map((r) => r.url));
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

              const oneWayPrice = calcIntercityPrivatePrice(
                {
                  distanceKm: foundRoute.distanceKm,
                  pricingType: priceEntry.pricingType,
                  perKmAmount: priceEntry.perKmAmount,
                  fixedPriceOneWay: priceEntry.fixedPriceOneWay,
                  fixedPriceRoundTrip: priceEntry.fixedPriceRoundTrip,
                  roundTripPrice: priceEntry.roundTripPrice,
                  roundTripPerKmAmount: priceEntry.roundTripPerKmAmount,
                },
                false
              );
              catsWithVehicles.push({ category: cat, vehicles, price: oneWayPrice });
            } catch {
              continue;
            }
          }

          setCategories(catsWithVehicles);
          if (catsWithVehicles.length > 0) {
            const defaultCat = catsWithVehicles.find((c) => c.category.default);
            setSelectedCategoryId(defaultCat ? defaultCat.category.id : catsWithVehicles[0].category.id);
          }
        }
      } catch (err) {
        console.error("Failed to load route detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [routeIdentifier]);

  const selectedCategory =
    categories.find((c) => c.category.id === selectedCategoryId) || categories[0];

  // Price calculations
  const calculatePrivatePrice = (catId: number, isRoundTrip: boolean) => {
    if (!route) return 0;
    const priceEntry = route.prices?.find((p) => p.vehicleCategoryId === catId && p.active);
    if (!priceEntry) return 0;
    return calcIntercityPrivatePrice(
      {
        distanceKm: route.distanceKm,
        pricingType: priceEntry.pricingType,
        perKmAmount: priceEntry.perKmAmount,
        fixedPriceOneWay: priceEntry.fixedPriceOneWay,
        fixedPriceRoundTrip: priceEntry.fixedPriceRoundTrip,
        roundTripPrice: priceEntry.roundTripPrice,
        roundTripPerKmAmount: priceEntry.roundTripPerKmAmount,
      },
      isRoundTrip
    );
  };

  const calculateSharedTotalPrice = (isRoundTrip: boolean) => {
    if (!route) return 0;
    return calcSharedPrice(
      route.sharedPriceOneWay,
      route.sharedPriceRoundTrip,
      passengerCount,
      isRoundTrip
    );
  };

  const sharedPerPaxPrice =
    tripType === "round-trip"
      ? (route?.sharedPriceRoundTrip && Number(route.sharedPriceRoundTrip) > 0
          ? Number(route.sharedPriceRoundTrip)
          : Number(route?.sharedPriceOneWay ?? 0) * 2)
      : Number(route?.sharedPriceOneWay ?? 0);

  // Directional Departure Times for Shared Rides
  const outboundTimes: IntercityDepartureTimeDto[] = (route?.departureTimes ?? [])
    .filter((dt) => (dt.direction === "OUTBOUND" || !dt.direction) && dt.active)
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  const returnTimes: IntercityDepartureTimeDto[] = (route?.departureTimes ?? [])
    .filter((dt) => dt.direction === "RETURN" && dt.active)
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  const handleBooking = () => {
    const newErrors: Record<string, string> = {};
    if (!pickupAddress.trim()) newErrors.pickupAddress = t.errors.pickupAddressRequired;
    if (!dropoffAddress.trim()) newErrors.dropoffAddress = t.errors.dropoffAddressRequired;
    if (!dateValue) newErrors.date = t.errors.dateRequired;

    if (serviceType === "PRIVATE") {
      if (!departureTime) newErrors.departureTime = t.errors.timeRequired;
    } else {
      // SHARED requires selecting outbound slot
      if (!departureTime) newErrors.departureTime = t.rentCar.selectOutboundTime;
      if (tripType === "round-trip") {
        if (!returnDateValue) newErrors.returnDate = t.errors.dateRequired;
        if (!returnDepartureTime) newErrors.returnTime = t.rentCar.selectReturnTime;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const params = new URLSearchParams();
    if (route) params.set("routeId", String(route.id));
    params.set("serviceType", serviceType);
    params.set("tripType", tripType);
    if (dateValue) params.set("date", dateValue.toString());
    if (departureTime) params.set("departureTime", departureTime);
    if (pickupAddress.trim()) params.set("pickupAddress", pickupAddress.trim());
    if (dropoffAddress.trim()) params.set("dropoffAddress", dropoffAddress.trim());

    if (serviceType === "PRIVATE") {
      if (selectedCategory) {
        params.set("vehicleCategoryId", String(selectedCategory.category.id));
      }
    } else {
      params.set("passengerCount", String(passengerCount));
      if (tripType === "round-trip") {
        if (returnDateValue) params.set("returnDate", returnDateValue.toString());
        if (returnDepartureTime) params.set("returnTime", returnDepartureTime);
      }
    }

    router.push(`/${language}/rent-car/confirm?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-page)] text-slate-800 dark:text-slate-100 flex flex-col font-sans">
        <div className="relative w-full h-[320px] md:h-[400px] bg-slate-900 overflow-hidden">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          <div className="max-w-7xl mx-auto w-full px-6 pb-8 relative z-10 space-y-4 pt-48">
            <Skeleton className="h-8 w-48 rounded-lg bg-white/20" />
            <Skeleton className="h-10 w-3/5 rounded-lg bg-white/20" />
            <Skeleton className="h-4 w-1/3 rounded-lg bg-white/20" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <Skeleton className="h-4 w-48 rounded-lg" />
              <Skeleton className="h-3 w-full rounded-lg" />
              <Skeleton className="h-3 w-full rounded-lg" />
              <Skeleton className="h-3 w-4/5 rounded-lg" />
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-page)] flex flex-col items-center justify-center gap-4">
        <p className="text-sm font-bold text-slate-500">{t.common.noResults}</p>
        <Button
          onClick={() => router.push(`/${language}/rent-car`)}
          className="bg-accent text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          {t.common.goBack}
        </Button>
      </div>
    );
  }

  const modalCategory = categories.find((c) => c.category.id === vehicleModalCategoryId);
  const supportsShared = route.supportsShared ?? true;
  const currentTotal =
    serviceType === "PRIVATE"
      ? selectedCategory
        ? calculatePrivatePrice(selectedCategory.category.id, tripType === "round-trip")
        : 0
      : calculateSharedTotalPrice(tripType === "round-trip");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-page)] text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* Hero Banner */}
      <section className="relative w-full h-[320px] md:h-[400px] bg-slate-900 overflow-hidden flex items-end">
        {displayHeroImages.length > 0 ? (
          displayHeroImages.map((imgUrl, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                idx === heroImageIndex ? "opacity-100" : "opacity-0"
              }`}
              style={{ backgroundImage: `url('${getImageUrl(imgUrl)}')` }}
            />
          ))
        ) : (
          <div className="absolute inset-0 bg-slate-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

        {isHeroCarousel && (
          <>
            <button
              onClick={prevHero}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition cursor-pointer border-none"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextHero}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition cursor-pointer border-none"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <div className="max-w-7xl mx-auto w-full px-6 pb-8 relative z-10 text-white space-y-4">
          <Button
            onClick={() => router.push(`/${language}/rent-car`)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white bg-black/40 hover:bg-black/60 border-none rounded-full px-4 py-2 cursor-pointer mb-2"
          >
            <ArrowLeft size={13} />
            <span>{t.common.goBack}</span>
          </Button>

          <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">
              {getRouteName(route)}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-semibold">
              {route.distanceKm && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-accent" /> {route.distanceKm} km
                </span>
              )}
              {route.estimatedHours && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-amber-500" /> ~{route.estimatedHours}{" "}
                    {t.common.hours}
                  </span>
                </>
              )}
              {supportsShared && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md text-[11px] font-bold">
                    <Sparkles size={11} /> {route.sharedVehicleName || t.rentCar.sharedVehicleDefault}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Route Details, Fleet & Comparison */}
        <div className="lg:col-span-7 space-y-6">
          {/* Overview */}
          <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              {t.rentCar.tripInformation}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              {getRouteDescription(route) || t.rentCar.routeDetailDesc}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                  {t.rentCar.departure}
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {route.originCity}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                  {t.rentCar.route}
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {route.destinationCity}
                </span>
              </div>
              {route.distanceKm && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    {t.rentCar.durationMinutes}
                  </span>
                  <span className="text-xs font-black text-accent">{route.distanceKm} km</span>
                </div>
              )}
            </div>
          </div>

          {/* Route Map */}
          {route.originLat && route.originLng && route.destinationLat && route.destinationLng && (
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <MapPin size={16} className="text-accent" />
                {t.rentCar.routeMap}
              </h2>
              <div className="h-[300px] rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                <RouteMap
                  originLat={Number(route.originLat)}
                  originLng={Number(route.originLng)}
                  originLabel={route.originCity}
                  destinationLat={Number(route.destinationLat)}
                  destinationLng={Number(route.destinationLng)}
                  destinationLabel={route.destinationCity}
                />
              </div>
            </div>
          )}

          {/* SEO Comparison Table: PRIVATE vs SHARED */}
          {supportsShared && (
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  {t.rentCar.compareTitle}
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  {getRouteName(route)} — {t.rentCar.serviceType}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Private Box */}
                <div
                  onClick={() => setServiceType("PRIVATE")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    serviceType === "PRIVATE"
                      ? "border-accent bg-accent/5 ring-2 ring-accent/10"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-[var(--bg-card)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Car size={16} className="text-accent" />
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase">
                        {t.rentCar.comparePrivateTitle}
                      </span>
                    </div>
                    <Chip size="sm" color="accent" variant="soft" className="text-[10px] font-bold">
                      Xe riêng 4-45 chỗ
                    </Chip>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-3">
                    {t.rentCar.comparePrivateDesc}
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span>{t.rentCar.customDepartureTime}</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span>Đón trả tận nơi tại mọi địa chỉ</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span>Không đón thêm khách dọc đường</span>
                    </li>
                  </ul>
                </div>

                {/* Shared Box */}
                <div
                  onClick={() => setServiceType("SHARED")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    serviceType === "SHARED"
                      ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/10"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-[var(--bg-card)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-amber-500" />
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase">
                        {t.rentCar.compareSharedTitle}
                      </span>
                    </div>
                    <Chip size="sm" color="warning" variant="soft" className="text-[10px] font-bold">
                      {route.sharedVehicleName || t.rentCar.sharedVehicleDefault}
                    </Chip>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-3">
                    {t.rentCar.compareSharedDesc}
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span>
                        Chỉ từ <strong>{formatPrice(Number(route.sharedPriceOneWay ?? 250000))}</strong> / vé
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span>Ghế ngồi bọc da massage cao cấp</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span>Lịch chạy cố định đảm bảo đúng giờ</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Live Scheduled Departure Times Section (SEO Content rendering DB schedules) */}
          {supportsShared && (outboundTimes.length > 0 || returnTimes.length > 0) && (
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock size={16} className="text-accent" />
                    {t.rentCar.liveScheduleTitle}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {t.rentCar.liveScheduleDesc}
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  ● Cập nhật liên tục
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Outbound schedule */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                      <ArrowRight size={14} className="text-accent" />
                      {t.rentCar.outboundTrip}: {route.originCity} → {route.destinationCity}
                    </span>
                  </div>
                  {outboundTimes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {outboundTimes.map((dt) => (
                        <div
                          key={dt.id}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs"
                        >
                          {dt.departureTime}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      {t.rentCar.noDepartureTimesForDirection}
                    </p>
                  )}
                </div>

                {/* Return schedule */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                      <ArrowRight size={14} className="text-amber-500 rotate-180" />
                      {t.rentCar.returnTrip}: {route.destinationCity} → {route.originCity}
                    </span>
                  </div>
                  {returnTimes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {returnTimes.map((dt) => (
                        <div
                          key={dt.id}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs"
                        >
                          {dt.departureTime}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      {t.rentCar.noDepartureTimesForDirection}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Fleet for private charters */}
          <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
              <span>{t.rentCar.representativeVehicles}</span>
              <span className="text-xs text-slate-400 font-normal normal-case">
                {categories.reduce((acc, c) => acc + c.vehicles.length, 0)} {t.common.seats}
              </span>
            </h2>

            <div className="space-y-4">
              {categories.map(({ category, vehicles }) => {
                const tr = category.translations?.find((t) => t.locale === language);
                const catName = tr?.name || category.code || "";
                const displayCatPrice = calculatePrivatePrice(category.id, tripType === "round-trip");

                return (
                  <div
                    key={category.id}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car size={16} className="text-accent" />
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                          {catName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-[var(--bg-card)] px-2 py-0.5 rounded-full">
                          {category.minSeat === category.maxSeat
                            ? `${category.minSeat} ${t.common.seats}`
                            : `${category.minSeat}-${category.maxSeat} ${t.common.seats}`}
                        </span>
                      </div>
                      <span className="text-xs font-black text-amber-500">
                        {formatPrice(displayCatPrice)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {vehicles.slice(0, 3).map((v) => (
                        <div
                          key={v.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800 text-center"
                        >
                          {v.thumbnailUrl && (
                            <img
                              src={getImageUrl(v.thumbnailUrl)}
                              alt={`${v.brand} ${v.model}`}
                              className="w-full h-16 object-cover rounded-lg mb-1.5"
                            />
                          )}
                          <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 block truncate">
                            {v.brand} {v.model}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{v.year}</span>
                        </div>
                      ))}
                    </div>

                    {vehicles.length > 3 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setVehicleModalCategoryId(category.id)}
                        className="w-full text-[11px] font-bold text-accent py-1 cursor-pointer"
                      >
                        {t.rentCar.moreVehicles} ({vehicles.length - 3}+)
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Booking Form Sidebar */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
          <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            {/* Service Type Switcher (Only if route supports shared) */}
            {supportsShared && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t.rentCar.serviceType}
                </Label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-[var(--bg-card)] rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType("PRIVATE");
                      setDepartureTime("");
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                      serviceType === "PRIVATE"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent"
                    }`}
                  >
                    <Car size={14} />
                    <span>{t.rentCar.privateService}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType("SHARED");
                      setDepartureTime("");
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                      serviceType === "SHARED"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-amber-500 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent"
                    }`}
                  >
                    <Users size={14} />
                    <span>{t.rentCar.sharedService}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-medium px-1">
                  {serviceType === "PRIVATE" ? t.rentCar.privateDesc : t.rentCar.sharedDesc}
                </p>
              </div>
            )}

            {/* Trip Type Selector */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-[var(--bg-card)] rounded-2xl">
              <button
                type="button"
                onClick={() => setTripType("one-way")}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer border-none ${
                  tripType === "one-way"
                    ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent"
                }`}
              >
                {t.rentCar.oneWay}
              </button>
              <button
                type="button"
                onClick={() => setTripType("round-trip")}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer border-none ${
                  tripType === "round-trip"
                    ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent"
                }`}
              >
                {t.rentCar.roundTrip}
              </button>
            </div>

            {/* If PRIVATE: Vehicle Category Selector */}
            {serviceType === "PRIVATE" && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t.rentCar.vehicleType}
                </Label>
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {categories.map(({ category }) => {
                    const isSelected = selectedCategoryId === category.id;
                    const tr = category.translations?.find((t) => t.locale === language);
                    const catName = tr?.name || category.code || "";
                    const catPrice = calculatePrivatePrice(category.id, tripType === "round-trip");

                    return (
                      <div
                        key={category.id}
                        onClick={() => setSelectedCategoryId(category.id)}
                        className={`cursor-pointer rounded-2xl border p-3 transition-all duration-200 flex items-center justify-between ${
                          isSelected
                            ? "border-accent bg-accent/5 ring-2 ring-accent/10 shadow-xs"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[var(--bg-surface)]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                            <Car size={18} />
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                              {catName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {category.minSeat === category.maxSeat
                                ? `${category.minSeat} ${t.common.seats}`
                                : `${category.minSeat}-${category.maxSeat} ${t.common.seats}`}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-accent">
                          {formatPrice(catPrice)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If SHARED: Vehicle badge + Passenger count selector */}
            {serviceType === "SHARED" && (
              <div className="space-y-3">
                {/* Vehicle badge */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        {route.sharedVehicleName || t.rentCar.sharedVehicleDefault}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Ghế ngồi limousine êm ái, cổng sạc, nước khoáng
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                      {formatPrice(sharedPerPaxPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      / {t.rentCar.pax}
                    </span>
                  </div>
                </div>

                {/* Passenger count */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t.rentCar.paxCount}
                  </Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPassengerCount(num)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                          passengerCount === num
                            ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-2xs"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Outbound Departure Date */}
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {serviceType === "SHARED"
                  ? `${t.rentCar.departure} (${route.originCity} → ${route.destinationCity})`
                  : t.rentCar.departure}
              </Label>
              <DatePicker
                className="w-full"
                value={dateValue}
                minValue={currentDate}
                onChange={(val) => setDateValue(val as DateValue)}
              >
                <DateField.Group
                  fullWidth
                  className="h-10 bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between"
                >
                  <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                    {(segment) => <DateField.Segment segment={segment} />}
                  </DateField.Input>
                  <DateField.Suffix>
                    <DatePicker.Trigger className="cursor-pointer">
                      <DatePicker.TriggerIndicator />
                    </DatePicker.Trigger>
                  </DateField.Suffix>
                </DateField.Group>
                <DatePicker.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                  <Calendar aria-label="Pick departure date">
                    <Calendar.Header className="flex items-center justify-between mb-2">
                      <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                        <Calendar.YearPickerTriggerHeading />
                        <Calendar.YearPickerTriggerIndicator />
                      </Calendar.YearPickerTrigger>
                      <div className="flex gap-1">
                        <Calendar.NavButton
                          slot="previous"
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer"
                        />
                        <Calendar.NavButton
                          slot="next"
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer"
                        />
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
                  </Calendar>
                </DatePicker.Popover>
              </DatePicker>
              {isDateInvalid && <p className="text-[10px] text-red-500 font-semibold">{errors.date}</p>}
            </div>

            {/* Outbound Departure Time */}
            {serviceType === "PRIVATE" ? (
              // Private: Custom departure time picker (free choice)
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t.rentCar.customDepartureTime}
                </Label>
                <Input
                  type="time"
                  value={departureTime}
                  onChange={(e) => {
                    setDepartureTime(e.target.value);
                    if (errors.departureTime) setErrors((prev) => ({ ...prev, departureTime: "" }));
                  }}
                  className="h-10 text-xs font-semibold bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 outline-none w-full"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  {t.rentCar.customDepartureTimeDesc}
                </p>
                {isDepartureTimeInvalid && (
                  <p className="text-[10px] text-red-500 font-semibold">{errors.departureTime}</p>
                )}
              </div>
            ) : (
              // Shared: Outbound slots from DB
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t.rentCar.selectOutboundTime} ({route.originCity} → {route.destinationCity})
                </Label>
                {outboundTimes.length > 0 ? (
                  <div className="grid grid-cols-4 gap-1.5">
                    {outboundTimes.map((dt) => (
                      <button
                        key={dt.id}
                        type="button"
                        onClick={() => {
                          setDepartureTime(dt.departureTime);
                          if (errors.departureTime) setErrors((prev) => ({ ...prev, departureTime: "" }));
                        }}
                        className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          departureTime === dt.departureTime
                            ? "border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black shadow-2xs"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        {dt.departureTime}
                      </button>
                    ))}
                  </div>
                ) : (
                  <Input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="h-10 text-xs font-semibold bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 outline-none w-full"
                  />
                )}
                {isDepartureTimeInvalid && (
                  <p className="text-[10px] text-red-500 font-semibold">{errors.departureTime}</p>
                )}
              </div>
            )}

            {/* If SHARED and ROUND_TRIP: Return Date & Return Departure Time */}
            {serviceType === "SHARED" && tripType === "round-trip" && (
              <>
                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t.rentCar.returnSchedule} ({route.destinationCity} → {route.originCity})
                  </Label>
                  <DatePicker
                    className="w-full"
                    value={returnDateValue}
                    minValue={dateValue || currentDate}
                    onChange={(val) => setReturnDateValue(val as DateValue)}
                  >
                    <DateField.Group
                      fullWidth
                      className="h-10 bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex items-center justify-between"
                    >
                      <DateField.Input className="text-xs font-semibold bg-transparent border-none outline-none">
                        {(segment) => <DateField.Segment segment={segment} />}
                      </DateField.Input>
                      <DateField.Suffix>
                        <DatePicker.Trigger className="cursor-pointer">
                          <DatePicker.TriggerIndicator />
                        </DatePicker.Trigger>
                      </DateField.Suffix>
                    </DateField.Group>
                    <DatePicker.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50">
                      <Calendar aria-label="Pick return date">
                        <Calendar.Header className="flex items-center justify-between mb-2">
                          <Calendar.YearPickerTrigger className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                            <Calendar.YearPickerTriggerHeading />
                            <Calendar.YearPickerTriggerIndicator />
                          </Calendar.YearPickerTrigger>
                          <div className="flex gap-1">
                            <Calendar.NavButton
                              slot="previous"
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer"
                            />
                            <Calendar.NavButton
                              slot="next"
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer"
                            />
                          </div>
                        </Calendar.Header>
                        <Calendar.Grid className="w-full">
                          <Calendar.GridHeader className="text-slate-400 text-[10px] font-bold">
                            {(day) => (
                              <Calendar.HeaderCell className="w-8 h-8 text-center">{day}</Calendar.HeaderCell>
                            )}
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
                      </Calendar>
                    </DatePicker.Popover>
                  </DatePicker>
                  {isReturnDateInvalid && (
                    <p className="text-[10px] text-red-500 font-semibold">{errors.returnDate}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t.rentCar.selectReturnTime} ({route.destinationCity} → {route.originCity})
                  </Label>
                  {returnTimes.length > 0 ? (
                    <div className="grid grid-cols-4 gap-1.5">
                      {returnTimes.map((dt) => (
                        <button
                          key={dt.id}
                          type="button"
                          onClick={() => {
                            setReturnDepartureTime(dt.departureTime);
                            if (errors.returnTime) setErrors((prev) => ({ ...prev, returnTime: "" }));
                          }}
                          className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            returnDepartureTime === dt.departureTime
                              ? "border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black shadow-2xs"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          {dt.departureTime}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Input
                      type="time"
                      value={returnDepartureTime}
                      onChange={(e) => setReturnDepartureTime(e.target.value)}
                      className="h-10 text-xs font-semibold bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 outline-none w-full"
                    />
                  )}
                  {isReturnTimeInvalid && (
                    <p className="text-[10px] text-red-500 font-semibold">{errors.returnTime}</p>
                  )}
                </div>
              </>
            )}

            {/* Pickup Address */}
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t.rentCar.pickupAddress}
              </Label>
              <TextField isInvalid={isPickupInvalid} className="w-full">
                <Input
                  value={pickupAddress}
                  onChange={(e) => {
                    setPickupAddress(e.target.value);
                    if (errors.pickupAddress) setErrors((prev) => ({ ...prev, pickupAddress: "" }));
                  }}
                  placeholder={t.rentCar.pickupAddressPlaceholder}
                  className="h-10 text-xs font-semibold bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 outline-none"
                />
                {isPickupInvalid && (
                  <FieldError className="text-[10px] text-red-500">{errors.pickupAddress}</FieldError>
                )}
              </TextField>
            </div>

            {/* Dropoff Address */}
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t.rentCar.dropoffAddress}
              </Label>
              <TextField isInvalid={isDropoffInvalid} className="w-full">
                <Input
                  value={dropoffAddress}
                  onChange={(e) => {
                    setDropoffAddress(e.target.value);
                    if (errors.dropoffAddress) setErrors((prev) => ({ ...prev, dropoffAddress: "" }));
                  }}
                  placeholder={t.rentCar.dropoffAddressPlaceholder}
                  className="h-10 text-xs font-semibold bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl px-3 outline-none"
                />
                {isDropoffInvalid && (
                  <FieldError className="text-[10px] text-red-500">{errors.dropoffAddress}</FieldError>
                )}
              </TextField>
            </div>

            {/* Price Summary & CTA */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    {t.common.totalPrice}
                  </span>
                  <span className="text-[10px] text-accent font-bold block mt-0.5">
                    {serviceType === "PRIVATE" ? (
                      tripType === "round-trip" ? (
                        t.rentCar.roundTrip
                      ) : (
                        t.rentCar.oneWay
                      )
                    ) : (
                      <>
                        {passengerCount} {t.rentCar.pax} •{" "}
                        {tripType === "round-trip" ? t.rentCar.roundTrip : t.rentCar.oneWay}
                      </>
                    )}
                  </span>
                </div>
                <span className="text-xl font-black text-amber-500">
                  {formatPrice(currentTotal)}
                </span>
              </div>

              <Button
                onClick={handleBooking}
                className="w-full h-11 bg-accent hover:bg-accent-hover text-white font-black text-xs uppercase tracking-wider rounded-2xl border-none cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                {`${t.common.bookNow} →`}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Vehicle Modal */}
      {modalCategory && (
        <Modal isOpen={Boolean(modalCategory)} onOpenChange={() => setVehicleModalCategoryId(null)}>
          <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
            <ModalContainer>
              <ModalDialog className="max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                  <span className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    {modalCategory.category.code} - {t.rentCar.representativeVehicles}
                  </span>
                  <ModalCloseTrigger className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer">
                    <X size={16} />
                  </ModalCloseTrigger>
                </ModalHeader>
                <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {modalCategory.vehicles.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800 space-y-2"
                      >
                        {v.thumbnailUrl && (
                          <img
                            src={getImageUrl(v.thumbnailUrl)}
                            alt={`${v.brand} ${v.model}`}
                            className="w-full h-24 object-cover rounded-xl"
                          />
                        )}
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-white block">
                            {v.brand} {v.model}
                          </span>
                          <div className="flex gap-2 text-[10px] text-slate-400 font-bold mt-0.5">
                            <span>{v.year}</span>
                            {v.fuelType && (
                              <>
                                <span>•</span>
                                <span>{v.fuelType}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ModalBody>
              </ModalDialog>
            </ModalContainer>
          </ModalBackdrop>
        </Modal>
      )}
    </div>
  );
}
