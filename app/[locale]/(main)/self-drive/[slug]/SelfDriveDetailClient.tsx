"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Gauge,
  Fuel,
  Cpu,
  Luggage,
  Route,
  Calendar,
  ShieldCheck,
  Check,
  BadgeCheck,
  Star,
  MapPin,
  Phone,
  Car,
  ChevronRight,
  Sparkles
} from "lucide-react";
import {
  Button,
  Skeleton
} from "@heroui/react";
import { HighlightBadge } from "@/components/common/HighlightBadge";

import { useI18n } from "@/context/LanguageContext";
import {
  getVehicleCategories,
  getRentableVehiclesByCategory,
  getVehicleCategoryById,
  getVehicleCategoryByIdOrSlug,
  type VehicleCategoryDto,
  type VehicleDto
} from "@/lib/api/fleet";
import { getActiveRentals, getRentalPricesByRental, type RentalDto, type RentalPriceDto } from "@/lib/api/selfDrive";
import type { SectionDto } from "@/lib/api/sections";
import { ImageGalleryGrid } from "@/components/ImageGalleryGrid";
import { DetailCMSSections } from "@/components/sections/detail/DetailSectionRenderer";
import { getCanonicalSlug } from "@/lib/slug-helpers";
import { getPublicSelfDrivePolicies, type SelfDrivePolicyDto } from "@/lib/api/self-drive-policy";
import { SvgIconRenderer } from "@/components/admin/self-drive";

interface RentalWithPrice extends RentalDto {
  dailyRate: number;
  category: VehicleCategoryDto | null;
}

interface SelfDriveDetailClientProps {
  sections: SectionDto[];
  categoryIdentifier: string | number;
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:8080";

export default function SelfDriveDetailClient({ sections, categoryIdentifier }: SelfDriveDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t, contacts } = useI18n();

  const [category, setCategory] = useState<VehicleCategoryDto | null>(null);
  const [allCategories, setAllCategories] = useState<VehicleCategoryDto[]>([]);
  const [categoryPriceMap, setCategoryPriceMap] = useState<Map<number, number>>(new Map());
  const [rentals, setRentals] = useState<RentalWithPrice[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected concrete vehicle
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  // Policies from API
  const [policies, setPolicies] = useState<SelfDrivePolicyDto[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getPublicSelfDrivePolicies()
      .then((res) => {
        if (isMounted && res?.data) {
          setPolicies(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load public self-drive policies:", err);
      })
      .finally(() => {
        if (isMounted) setPoliciesLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${backendUrl}${url}`;
  };

  const prefixUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const segments = url.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) return url;
    return `/${language}${url === "/" ? "" : url}`;
  };

  const getCatName = (cat: VehicleCategoryDto | null) => {
    if (!cat) return "";
    const tr = cat.translations?.find((item) => item.locale === language);
    return tr?.name || cat.code;
  };

  const getCatDesc = (cat: VehicleCategoryDto | null) => {
    if (!cat) return "";
    const tr = cat.translations?.find((item) => item.locale === language);
    return tr?.description || "";
  };

  // Load category, rentals, vehicles, and all categories for comparison
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const queryId = searchParams.get("id") || searchParams.get("categoryId");
        const catPromise = (queryId && !isNaN(Number(queryId)))
          ? getVehicleCategoryById(Number(queryId))
          : getVehicleCategoryByIdOrSlug(categoryIdentifier);

        const [catRes, catsRes, rentalsRes] = await Promise.all([
          catPromise,
          getVehicleCategories({ active: true, page: 0, size: 100 }),
          getActiveRentals(),
        ]);

        if (!active) return;

        const foundCat = (catRes?.data ?? null) as VehicleCategoryDto | null;
        const cats = (catsRes?.data?.content ?? []) as VehicleCategoryDto[];
        setAllCategories(cats);

        const allRentals = (rentalsRes?.data ?? []) as RentalDto[];
        const selfDriveRentals = allRentals.filter((r) => !r.driverRequired);

        const rentalPricesResults = await Promise.all(
          selfDriveRentals.map((r) =>
            getRentalPricesByRental(r.id)
              .then((res) => ({
                rentalId: r.id,
                prices: (res?.data ?? []) as RentalPriceDto[],
              }))
              .catch(() => ({ rentalId: r.id, prices: [] as RentalPriceDto[] }))
          )
        );

        const priceMap = new Map<number, RentalPriceDto[]>();
        const catMinPriceMap = new Map<number, number>();

        rentalPricesResults.forEach((p) => priceMap.set(p.rentalId, p.prices));

        selfDriveRentals.forEach((r) => {
          const rPrices = priceMap.get(r.id) ?? [];
          const activePrice = rPrices.find((p) => p.active && p.vehicleCategoryId === r.vehicleCategoryId);
          const rate = activePrice ? Number(activePrice.amount) : 0;
          if (rate > 0) {
            const existing = catMinPriceMap.get(r.vehicleCategoryId);
            if (!existing || rate < existing) {
              catMinPriceMap.set(r.vehicleCategoryId, rate);
            }
          }
        });
        setCategoryPriceMap(catMinPriceMap);

        if (foundCat) {
          setCategory(foundCat);

          const catRentals = selfDriveRentals.filter((r) => r.vehicleCategoryId === foundCat.id);
          const enrichedRentals: RentalWithPrice[] = catRentals.map((r) => {
            const rentalPrices = priceMap.get(r.id) ?? [];
            const activePrice = rentalPrices.find((p) => p.active && p.vehicleCategoryId === r.vehicleCategoryId);
            const dailyRate = activePrice ? Number(activePrice.amount) : (catMinPriceMap.get(foundCat.id) || 800000);
            const cat = cats.find((c) => c.id === r.vehicleCategoryId) ?? null;
            return { ...r, dailyRate, category: cat };
          });

          if (active) setRentals(enrichedRentals);

          try {
            const vehiclesRes = await getRentableVehiclesByCategory(foundCat.id);
            const vList = (vehiclesRes?.data ?? []) as VehicleDto[];
            if (active) {
              setVehicles(vList);
              const vehicleIdParam = searchParams.get("vehicleId");
              if (vehicleIdParam && !isNaN(Number(vehicleIdParam))) {
                const match = vList.find((v) => v.id === Number(vehicleIdParam));
                setSelectedVehicleId(match ? match.id : vList[0]?.id ?? null);
              } else if (vList.length > 0) {
                setSelectedVehicleId(vList[0].id);
              }
            }
          } catch {
            if (active) setVehicles([]);
          }
        }
      } catch (err) {
        console.error("Failed to load self-drive detail:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [categoryIdentifier, language, searchParams]);

  // Selected vehicle based on user selection or first available
  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return vehicles[0];
    return vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  }, [vehicles, selectedVehicleId]);

  // Gallery images combined
  const galleryImages = useMemo(() => {
    const images: string[] = [];

    if (selectedVehicle?.thumbnailUrl) {
      images.push(getImageUrl(selectedVehicle.thumbnailUrl));
    }
    if (category?.thumbnailUrl) {
      const catUrl = getImageUrl(category.thumbnailUrl);
      if (!images.includes(catUrl)) images.push(catUrl);
    }
    vehicles.forEach((v) => {
      if (v.thumbnailUrl) {
        const url = getImageUrl(v.thumbnailUrl);
        if (!images.includes(url)) images.push(url);
      }
    });

    return images;
  }, [selectedVehicle, category, vehicles]);

  // Pricing
  const rental = rentals[0];
  const dailyRate = rental?.dailyRate || (category ? categoryPriceMap.get(category.id) : 800000) || 800000;

  // Specifications
  const seatsCount = selectedVehicle?.type?.minSeat || category?.minSeat || 7;
  const vehicleTitle = selectedVehicle
    ? `${selectedVehicle.brand} ${selectedVehicle.model}`
    : `${category?.code?.toUpperCase() || "SUV"} Standard`;

  const engineSpec = selectedVehicle?.model?.toLowerCase().includes("fortuner")
    ? "2800cc"
    : selectedVehicle?.model?.toLowerCase().includes("everest")
      ? "2.0L Bi-Turbo"
      : "2.0L Turbo";

  // Amenities list
  const amenities = [
    "Bluetooth",
    "GPS Navigation",
    "Reverse Camera",
    "Apple CarPlay",
    "Cruise Control",
    "7 Airbags",
    "USB & Wireless Charging",
    "Tire Pressure Monitor",
    "ISOFIX Child Seat",
  ];

  // Navigate to Confirm Page
  const handleProceedToConfirm = () => {
    if (!category) return;
    const catSlug = getCanonicalSlug(category, language, "xe-tu-lai");
    const params = new URLSearchParams();
    params.set("id", String(category.id));
    if (selectedVehicleId) {
      params.set("vehicleId", String(selectedVehicleId));
    }
    router.push(prefixUrl(`/self-drive/${catSlug}/confirm?${params.toString()}`));
  };

  // Other vehicle categories excluding current category
  const otherCategories = useMemo(() => {
    if (!category) return [];
    return allCategories.filter((c) => c.id !== category.id && c.active);
  }, [allCategories, category]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-page)] flex flex-col font-sans">
        <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-6">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-96 w-full rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              <Skeleton className="h-64 w-full rounded-3xl" />
              <Skeleton className="h-48 w-full rounded-3xl" />
            </div>
            <div className="lg:col-span-5 xl:col-span-4">
              <Skeleton className="h-96 w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-page)] flex flex-col items-center justify-center gap-4">
        <p className="text-base font-bold dark:text-zinc-400">{t.common.noResults}</p>
        <Button onClick={() => router.push(prefixUrl("/self-drive"))} className="bg-accent text-accent-foreground text-sm font-bold px-4 py-2 rounded-xl border-none cursor-pointer">
          {t.common.goBack}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] dark:bg-[var(--bg-page)] flex flex-col font-sans">
      {/* Top Breadcrumb Navigation */}
      <section className="bg-white/80 dark:bg-[var(--bg-surface)] backdrop-blur border-b border-slate-200/80 dark:border-zinc-800">
        <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push(prefixUrl("/self-drive"))}
              className="flex items-center gap-1.5 text-sm font-bold hover:text-accent bg-slate-100 dark:bg-[var(--bg-card)] hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] border-none rounded-full px-3.5 py-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft size={15} />
              <span>{t.common.goBack}</span>
            </Button>
            <div className="flex items-center gap-2 text-sm dark:text-zinc-500 font-semibold">
              <Link href={prefixUrl("/self-drive")} className="hover:text-accent transition-colors no-underline text-inherit">
                {t.selfDrive.title}
              </Link>
              <span>/</span>
              <span className="dark:text-white font-bold">{getCatName(category)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 md:py-8 space-y-8 flex-1">
        {/* Category Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <HighlightBadge
                value={category.code?.toUpperCase()}
                variant="accent"
              />
              <HighlightBadge
                icon={<Users size={14} className="text-accent" />}
                value={`${seatsCount} ${t.common.seats}`}
                variant="default"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black dark:text-white tracking-tight leading-snug">
              {getCatName(category)}
            </h1>
            {getCatDesc(category) && (
              <p className="text-sm sm:text-base dark:text-zinc-400 font-medium mt-1 max-w-2xl leading-relaxed">
                {getCatDesc(category)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleProceedToConfirm}
              className="bg-accent hover:bg-accent-hover text-accent-foreground px-6 py-3 rounded-2xl font-black text-sm shadow-md cursor-pointer border-none flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Car size={18} />
              <span>{t.selfDrive.bookNowBtn}</span>
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        {/* Klook-style Image Gallery Grid */}
        <ImageGalleryGrid
          images={galleryImages.map((url, i) => ({ id: i + 1, url, alt: "" }))}
          galleryLabel={t.selfDrive.viewGallery}
          noPhotosLabel={t.selfDrive.noPhotos}
          modalTitleLabel={vehicleTitle}
          className="shadow-md"
        />

        {/* 2-Column Grid: Left (Inline Vehicles, Specs, Amenities, Policies) & Right (Sticky Booking Action Box) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">

            {/* 1. Concrete Vehicles List (Rendered Inline instead of modal) */}
            <div className="bg-white dark:bg-[var(--bg-card)] p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h2 className="text-lg sm:text-xl font-black dark:text-white flex items-center gap-2">
                  <Car size={22} className="text-accent" />
                  <span>{t.selfDrive.categoryVehiclesList}</span>
                </h2>
                <span className="text-sm dark:text-zinc-500 font-bold">
                  {vehicles.length} {t.selfDrive.type.toLowerCase()}
                </span>
              </div>
              <p className="text-xs font-medium -mt-2 opacity-75">
                {t.selfDrive.categoryVehiclesNote}
              </p>

              {vehicles.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-surface)] text-sm dark:text-zinc-400 font-medium">
                  {t.selfDrive.noVehiclesInCategory}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vehicles.map((v) => {
                    const isSelected = selectedVehicleId === v.id;
                    const vImage = v.thumbnailUrl ? getImageUrl(v.thumbnailUrl) : "";
                    const vFuel = v.fuelType
                      ? (t.selfDrive[v.fuelType as keyof typeof t.selfDrive] as string || v.fuelType)
                      : t.selfDrive.diesel;

                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVehicleId(v.id)}
                        className={`relative rounded-2xl p-4 transition-all cursor-pointer border flex flex-col justify-between gap-3 ${
                          isSelected
                            ? "bg-accent/5 dark:bg-accent/10 border-accent ring-2 ring-accent/20 shadow-md"
                            : "bg-white dark:bg-[var(--bg-surface)] border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs"
                        }`}
                      >
                        <div>
                          {/* Image & Badges */}
                          <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                            {vImage ? (
                              <img
                                src={vImage}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <Car size={26} className="opacity-40" />
                                <span className="text-sm font-semibold">{t.selfDrive.noPhotos}</span>
                              </div>
                            )}
                          </div>

                          {/* Model & Year */}
                          <h4 className="text-base font-extrabold dark:text-white leading-tight">
                            {v.brand} {v.model} <span className="text-sm font-medium">({v.year})</span>
                          </h4>

                          {/* Quick Specs Chips */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <HighlightBadge
                              icon={<Fuel size={14} className="text-accent" />}
                              value={vFuel}
                              rounded="rounded-md"
                              variant="muted"
                              className="px-2.5 py-1"
                            />
                            <HighlightBadge
                              icon={<Gauge size={14} className="text-accent" />}
                              value={t.selfDrive.transmissionAuto}
                              rounded="rounded-md"
                              variant="muted"
                              className="px-2.5 py-1"
                            />
                            <HighlightBadge
                              icon={<Luggage size={14} className="text-accent" />}
                              value={`${v.luggage || 2} ${t.selfDrive.bags}`}
                              rounded="rounded-md"
                              variant="muted"
                              className="px-2.5 py-1"
                            />
                          </div>
                        </div>

                        {/* Card footer */}
                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                          <span className="text-sm sm:text-base font-black text-accent">
                            {dailyRate.toLocaleString("vi-VN")}đ <span className="text-sm font-normal">/{t.selfDrive.dayUnit}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Key specifications Card */}
            <div className="bg-white dark:bg-[var(--bg-card)] p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-6">
              <h2 className="text-xl sm:text-2xl font-black dark:text-white tracking-tight">
                {t.selfDrive.keySpecifications}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-4">
                {/* 1. SEATS */}
                <div className="flex items-start gap-3">
                  <Users size={22} className="text-accent shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="block text-sm font-bold dark:text-zinc-500 uppercase tracking-wider">
                      {t.selfDrive.seats}
                    </span>
                    <span className="block text-base sm:text-lg font-extrabold dark:text-white">
                      {seatsCount}
                    </span>
                  </div>
                </div>

                {/* 2. TRANSMISSION */}
                <div className="flex items-start gap-3">
                  <Gauge size={22} className="text-accent shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="block text-sm font-bold dark:text-zinc-500 uppercase tracking-wider">
                      {t.selfDrive.transmission}
                    </span>
                    <span className="block text-base sm:text-lg font-extrabold dark:text-white">
                      {t.selfDrive.transmissionAuto}
                    </span>
                  </div>
                </div>

                {/* 3. FUEL */}
                <div className="flex items-start gap-3">
                  <Fuel size={22} className="text-accent shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="block text-sm font-bold dark:text-zinc-500 uppercase tracking-wider">
                      {t.selfDrive.filterFuel}
                    </span>
                    <span className="block text-base sm:text-lg font-extrabold dark:text-white">
                      {selectedVehicle?.fuelType
                        ? (t.selfDrive[selectedVehicle.fuelType as keyof typeof t.selfDrive] as string || selectedVehicle.fuelType)
                        : t.selfDrive.diesel}
                    </span>
                  </div>
                </div>

                {/* 4. ENGINE */}
                <div className="flex items-start gap-3">
                  <Cpu size={22} className="text-accent shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="block text-sm font-bold dark:text-zinc-500 uppercase tracking-wider">
                      {t.selfDrive.engine}
                    </span>
                    <span className="block text-base sm:text-lg font-extrabold dark:text-white">
                      {engineSpec}
                    </span>
                  </div>
                </div>

                {/* 5. LUGGAGE */}
                <div className="flex items-start gap-3">
                  <Luggage size={22} className="text-accent shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="block text-sm font-bold dark:text-zinc-500 uppercase tracking-wider">
                      {t.selfDrive.luggage}
                    </span>
                    <span className="block text-base sm:text-lg font-extrabold dark:text-white">
                      {selectedVehicle?.luggage || 4} {t.selfDrive.bags}
                    </span>
                  </div>
                </div>

                {/* 6. CONSUMPTION */}
                <div className="flex items-start gap-3">
                  <Route size={22} className="text-accent shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="block text-sm font-bold dark:text-zinc-500 uppercase tracking-wider">
                      {t.selfDrive.consumption}
                    </span>
                    <span className="block text-base sm:text-lg font-extrabold dark:text-white">
                      {`6.5 ${t.selfDrive.consumptionUnit}`}
                    </span>
                  </div>
                </div>

                {/* 7. YEAR */}
                <div className="flex items-start gap-3">
                  <Calendar size={22} className="text-accent shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="block text-sm font-bold dark:text-zinc-500 uppercase tracking-wider">
                      {t.selfDrive.year}
                    </span>
                    <span className="block text-base sm:text-lg font-extrabold dark:text-white">
                      {selectedVehicle?.year || 2024}
                    </span>
                  </div>
                </div>

                {/* 8. TYPE */}
                <div className="flex items-start gap-3">
                  <ShieldCheck size={22} className="text-accent shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="block text-sm font-bold dark:text-zinc-500 uppercase tracking-wider">
                      {t.selfDrive.type}
                    </span>
                    <span className="block text-base sm:text-lg font-extrabold dark:text-white uppercase">
                      {category.code || "SUV"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Features & amenities Card */}
            <div className="bg-white dark:bg-[var(--bg-card)] p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-6">
              <h2 className="text-xl sm:text-2xl font-black dark:text-white tracking-tight">
                {t.selfDrive.featuresAndAmenities}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {amenities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-semibold dark:text-zinc-200">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Rental policies Card */}
            <div className="bg-white dark:bg-[var(--bg-card)] p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-6">
              <h2 className="text-xl sm:text-2xl font-black dark:text-white tracking-tight">
                {t.selfDrive.rentalPolicies}
              </h2>

              {policiesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-zinc-800 shrink-0" />
                      <div className="space-y-2 flex-1 pt-1">
                        <div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded w-2/5" />
                        <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-4/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : policies.length === 0 ? (
                <p className="text-sm py-4 italic">
                  Chưa có chính sách nào được cấu hình.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {policies.map((pol) => {
                    const trans =
                      pol.translations?.find((tr) => tr.locale === language) ||
                      pol.translations?.find((tr) => tr.locale === "vi") ||
                      pol.translations?.[0];
                    const title = trans?.name || pol.code;
                    const desc = trans?.description || "";

                    return (
                      <div key={pol.id} className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-accent/15 text-accent flex items-center justify-center p-2.5 shrink-0 shadow-sm">
                          <SvgIconRenderer svgString={pol.icon} className="w-full h-full text-accent" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <h4 className="text-sm sm:text-base font-extrabold dark:text-white">
                            {title}
                          </h4>
                          {desc && (
                            <p className="text-sm dark:text-zinc-400 leading-relaxed font-medium">
                              {desc}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Vehicle Booking Action Box */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 space-y-6">
            <div className="bg-white dark:bg-[var(--bg-card)] p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xl space-y-5">
              {/* Category Badge */}
              <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-accent/15 text-accent font-black text-sm uppercase tracking-wider">
                {category.code?.toUpperCase() || "SUV"}
              </div>

              {/* Vehicle Title */}
              <div>
                <h3 className="text-2xl font-black dark:text-white tracking-tight leading-snug">
                  {vehicleTitle}
                </h3>

                {/* Rating & Location */}
                <div className="flex flex-wrap items-center gap-3 pt-2 text-sm font-semibold dark:text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Star size={15} className="text-accent fill-accent" />
                    <span className="font-extrabold dark:text-white">4.9</span>
                    <span>· 128 {t.selfDrive.reviews}</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1 dark:text-zinc-300">
                    <MapPin size={14} className="text-accent" />
                    <span>{t.selfDrive.locationDefault}</span>
                  </div>
                </div>
              </div>

              {/* Price & Unlimited Km Included */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black dark:text-white">
                    {new Intl.NumberFormat("vi-VN").format(dailyRate)}đ
                  </span>
                  <span className="text-sm font-bold dark:text-zinc-500">
                    / {t.selfDrive.dayUnit}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  <Route size={15} />
                  <span>{t.selfDrive.unlimitedKm}</span>
                </div>
              </div>

              {/* Service Highlights */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-sm font-semibold dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-accent" />
                  <span>{t.selfDrive.support247}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-accent" />
                  <span>{t.selfDrive.guarantee}</span>
                </div>
              </div>

              {/* Single CTA Action Button */}
              <div className="pt-2">
                <Button
                  onClick={handleProceedToConfirm}
                  className="w-full h-14 rounded-2xl font-black text-base bg-accent hover:bg-accent-hover text-accent-foreground shadow-lg cursor-pointer transition-all active:scale-[0.99] border-none flex items-center justify-center gap-2"
                >
                  <Car size={18} />
                  <span>{t.selfDrive.bookNowBtn}</span>
                  <ChevronRight size={18} />
                </Button>
              </div>

              <p className="text-sm text-center dark:text-zinc-500 font-medium">
                {t.selfDrive.guaranteeText}
              </p>
            </div>

            {/* Quick Contact Box */}
            <div className="bg-accent/10 dark:bg-[var(--bg-card)] p-4 rounded-3xl border border-accent/20 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center font-bold">
                  <Phone size={18} />
                </div>
                <div>
                  <h5 className="text-sm sm:text-base font-extrabold dark:text-white">
                    {t.selfDrive.contactSupportLabel}
                  </h5>
                  <p className="text-sm dark:text-zinc-400 font-bold">
                    {contacts.phone || "0764.971.971"}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => window.open(`tel:${contacts.phone || "0764971971"}`)}
                className="bg-accent text-accent-foreground text-sm font-black px-4 py-2 rounded-xl border-none cursor-pointer"
              >
                {t.common.callNow}
              </Button>
            </div>
          </div>
        </div>

        {/* 3. Section Các dòng xe khác (Other Vehicle Categories) - Excluding current category */}
        {otherCategories.length > 0 && (
          <section className="pt-8 border-t border-slate-200/80 dark:border-zinc-800 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black dark:text-white tracking-tight">
                  {t.selfDrive.otherCategories}
                </h2>
                <p className="text-sm dark:text-zinc-500 font-medium mt-0.5">
                  {otherCategories.length} {t.selfDrive.type.toLowerCase()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {otherCategories.map((otherCat) => {
                const otherSlug = getCanonicalSlug(otherCat, language, "xe-tu-lai");
                const otherName = getCatName(otherCat);
                const otherPrice = categoryPriceMap.get(otherCat.id);
                const otherImg = otherCat.thumbnailUrl ? getImageUrl(otherCat.thumbnailUrl) : "";

                return (
                  <div
                    key={otherCat.id}
                    onClick={() => router.push(prefixUrl(`/self-drive/${otherSlug}?id=${otherCat.id}`))}
                    className="group bg-white dark:bg-[var(--bg-card)] rounded-3xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-lg hover:border-accent transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Image */}
                      <div className="relative w-full h-44 overflow-hidden bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                        {otherImg ? (
                          <img
                            src={otherImg}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1.5">
                            <Car size={32} className="opacity-40" />
                            <span className="text-sm font-semibold">{t.selfDrive.noPhotos}</span>
                          </div>
                        )}
                        <div className="absolute top-2.5 left-2.5 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-black uppercase tracking-wider">
                          {otherCat.code?.toUpperCase()}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <h3 className="text-sm sm:text-base font-extrabold dark:text-white group-hover:text-accent transition-colors truncate">
                          {otherName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-sm dark:text-zinc-400 font-medium">
                          <Users size={14} className="text-accent shrink-0" />
                          <span>{otherCat.minSeat}-{otherCat.maxSeat} {t.common.seats}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                      {otherPrice ? (
                        <div className="text-sm sm:text-base font-black text-accent">
                          {otherPrice.toLocaleString("vi-VN")}đ <span className="text-sm font-normal">/{t.selfDrive.dayUnit}</span>
                        </div>
                      ) : (
                        <div className="text-sm font-bold">{t.selfDrive.contactForInfo}</div>
                      )}
                      <span className="text-sm font-bold text-accent flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        {t.selfDrive.viewDetails} <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* CMS Sections (Booking Process, FAQs) */}
      {sections && sections.length > 0 && (
        <section className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 pb-12">
          <DetailCMSSections sections={sections} locale={language} />
        </section>
      )}
    </div>
  );
}
