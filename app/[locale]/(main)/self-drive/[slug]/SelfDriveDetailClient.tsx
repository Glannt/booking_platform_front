"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  Users,
  Luggage,
  Fuel,
  CheckCircle,
  Phone,
  Calendar,
  MapPin,
  ShieldCheck,
  Headset,
  MessageCircle,
  ChevronUp,
} from "lucide-react";
import { Button, Skeleton } from "@heroui/react";

import { useI18n } from "@/context/LanguageContext";
import { getVehicleCategories, getRentableVehiclesByCategory, getVehicleCategoryByIdOrSlug, type VehicleCategoryDto, type VehicleDto } from "@/lib/api/fleet";
import { getActiveRentals, getRentalPricesByRental, type RentalDto, type RentalPriceDto } from "@/lib/api/rental";
import type { SectionDto } from "@/lib/api/sections";

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
  const { language, t, contacts } = useI18n();
  const vi = language === "vi";

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

  const [category, setCategory] = useState<VehicleCategoryDto | null>(null);
  const [rentals, setRentals] = useState<RentalWithPrice[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [loading, setLoading] = useState(true);

  const getCatName = (cat: VehicleCategoryDto) => {
    const tr = cat.translations?.find((t) => t.locale === language);
    return tr?.name || cat.code;
  };

  const getCatDesc = (cat: VehicleCategoryDto) => {
    const tr = cat.translations?.find((t) => t.locale === language);
    return tr?.description || "";
  };

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [catRes, catsRes, rentalsRes] = await Promise.all([
          getVehicleCategoryByIdOrSlug(categoryIdentifier),
          getVehicleCategories({ active: true, page: 0, size: 100 }),
          getActiveRentals(),
        ]);

        if (!active) return;

        const foundCat = (catRes?.data ?? null) as VehicleCategoryDto | null;
        const cats = (catsRes?.data?.content ?? []) as VehicleCategoryDto[];

        if (foundCat) {
          setCategory(foundCat);

          const allRentals = (rentalsRes?.data ?? []) as RentalDto[];
          const selfDriveRentals = allRentals.filter((r) => !r.driverRequired && r.vehicleCategoryId === foundCat.id);

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
          rentalPricesResults.forEach((p) => priceMap.set(p.rentalId, p.prices));

          const enrichedRentals: RentalWithPrice[] = selfDriveRentals.map((r) => {
            const rentalPrices = priceMap.get(r.id) ?? [];
            const activePrice = rentalPrices.find((p) => p.active && p.vehicleCategoryId === r.vehicleCategoryId);
            const dailyRate = activePrice ? Number(activePrice.amount) : 0;
            const cat = cats.find((c) => c.id === r.vehicleCategoryId) ?? null;
            return { ...r, dailyRate, category: cat };
          });

          if (active) setRentals(enrichedRentals);

          try {
            const vehiclesRes = await getRentableVehiclesByCategory(foundCat.id);
            if (active) setVehicles((vehiclesRes?.data ?? []) as VehicleDto[]);
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
  }, [categoryIdentifier, language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-sm font-bold text-slate-500">{t.common.noResults}</p>
        <Button onClick={() => router.push(prefixUrl("/self-drive"))} className="bg-accent text-white text-xs font-bold px-4 py-2 rounded-xl border-none cursor-pointer">
          {t.common.goBack}
        </Button>
      </div>
    );
  }

  const rental = rentals[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <section className="bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-4 flex items-center gap-4">
          <Button
            onClick={() => router.push(prefixUrl("/self-drive"))}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-accent bg-slate-100 dark:bg-black hover:bg-slate-200 dark:hover:bg-[var(--bg-surface)] border-none rounded-full px-3 py-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft size={13} />
            <span>{t.common.goBack}</span>
          </Button>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <span>{t.selfDrive.title}</span>
            <span>/</span>
            <span className="text-slate-700 dark:text-white font-bold">{getCatName(category)}</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Category Info & Vehicles */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent block mb-1">
                  {t.selfDrive.segment}
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white">
                  {getCatName(category)}
                </h1>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                <Car size={24} />
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              {getCatDesc(category) || t.selfDrive.overview}
            </p>

            {/* Spec Badges */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users size={13} className="text-accent" />
                {category.minSeat === category.maxSeat ? `${category.minSeat} ${t.common.seats}` : `${category.minSeat}-${category.maxSeat} ${t.common.seats}`}
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Luggage size={13} className="text-accent" />
                {category.minLuggage === category.maxLuggage ? `${category.minLuggage} ${category.unitLuggage || "kg"}` : `${category.minLuggage}-${category.maxLuggage} ${category.unitLuggage || "kg"}`}
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 flex items-center gap-1.5">
                <CheckCircle size={13} />
                {t.selfDrive.features}
              </span>
            </div>
          </div>

          {/* Vehicles in this category */}
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider">
                {t.selfDrive.representativeVehicles}
              </h2>
              <span className="text-xs font-bold text-accent">
                {vehicles.length} {t.selfDrive.capacity}
              </span>
            </div>

            {vehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-black/50 space-y-3 hover:border-accent/40 transition-colors"
                  >
                    {v.thumbnailUrl && (
                      <div className="h-40 rounded-xl overflow-hidden bg-white dark:bg-black">
                        <img
                          src={getImageUrl(v.thumbnailUrl)}
                          alt={`${v.brand} ${v.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {v.brand} {v.model}
                        </h3>
                        <span className="text-xs font-bold text-slate-400">{v.year}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
                        {v.fuelType && (
                          <span className="flex items-center gap-0.5">
                            <Fuel size={11} className="text-accent" />
                            {v.fuelType}
                          </span>
                        )}
                        {v.luggage && (
                          <span>{v.luggage} {v.luggageUnit || t.common.baggage}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center font-semibold">
                {t.common.noResults}
              </p>
            )}
          </div>

          {/* Booking Procedures */}
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              {t.selfDrive.procedureTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-black">
                  1
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">{t.selfDrive.docRequirements}</h4>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  {t.selfDrive.docDesc}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-black">
                  2
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">{t.selfDrive.deposit}</h4>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  {t.selfDrive.bookingNotes}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-black">
                  3
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">{t.selfDrive.minDays}</h4>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  {t.selfDrive.minimumDays}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Booking Sidebar */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">
                {t.selfDrive.dailyRate}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                {t.selfDrive.overview}
              </p>
            </div>

            {rental && rental.dailyRate > 0 ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-accent/5 dark:bg-black border border-accent/20 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    {t.selfDrive.dailyRate}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-amber-500">
                      {new Intl.NumberFormat("vi-VN").format(rental.dailyRate)}đ
                    </span>
                    <span className="text-xs text-slate-400 font-bold">{`/${t.common.days}`}</span>
                  </div>
                </div>

                {rental.minimumDays && rental.minimumDays > 1 && (
                  <p className="text-[10px] text-slate-400 font-bold">
                    {vi ? `Tối thiểu ${rental.minimumDays} ngày` : `Minimum ${rental.minimumDays} days`}
                  </p>
                )}
                <Button
                  onClick={() => router.push(`/${language}/self-drive/booking?vehicleId=${rental.vehicleCategoryId}-${rental.id}`)}
                  className="w-full h-12 rounded-2xl font-black text-sm bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
                >
                  <CheckCircle size={15} />
                  {t.selfDrive.bookNow}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-400 font-bold mb-3">{t.selfDrive.contactForInfo}</p>
                <Button
                  onClick={() => window.open(`tel:${contacts.phone || "0764971971"}`)}
                  className="w-full h-12 rounded-2xl font-black text-sm bg-accent text-white hover:bg-accent-hover shadow-md gap-2 border-none cursor-pointer"
                >
                  <Phone size={15} />
                  {`${t.common.callNow} ${contacts.phone || "0764.971.971"}`}
                </Button>
              </div>
            )}

            <p className="text-[10px] text-center text-slate-450 dark:text-slate-500 font-medium">
              🔒 {t.selfDrive.guaranteeText}
            </p>
          </div>

          {/* Quick Info */}
          <div className="bg-white dark:bg-black p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">{t.selfDrive.quickInfo}</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">{t.selfDrive.seats}</span>
                <span className="font-bold text-slate-700 dark:text-white">{category.minSeat}-{category.maxSeat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">{t.selfDrive.luggageLabel}</span>
                <span className="font-bold text-slate-700 dark:text-white">{category.minLuggage}-{category.maxLuggage} {category.unitLuggage || "kg"}</span>
              </div>
              {rental?.minimumDays && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">{t.selfDrive.minDaysLabel}</span>
                  <span className="font-bold text-slate-700 dark:text-white">{rental.minimumDays} {t.common.days}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">{t.selfDrive.available}</span>
                <span className="font-bold text-green-600">{vehicles.length} {t.selfDrive.capacity}</span>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-blue-50/40 dark:bg-blue-950/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30 space-y-3">
            <p className="text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1.5">
              <Headset size={14} className="text-accent" />
              {t.selfDrive.support247}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              {t.selfDrive.supportDesc}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(`tel:${contacts.phone}`)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white dark:bg-black py-2.5 rounded-xl text-xs font-black text-slate-700 dark:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[var(--bg-surface)] cursor-pointer transition-all"
              >
                <Phone size={13} className="text-accent" />
                {t.common.callNow}
              </button>
              <button
                onClick={() => window.open(contacts.zalo.startsWith("http") ? contacts.zalo : `https://zalo.me/${contacts.zalo}`, "_blank")}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white dark:bg-black py-2.5 rounded-xl text-xs font-black text-slate-700 dark:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[var(--bg-surface)] cursor-pointer transition-all"
              >
                <MessageCircle size={13} className="text-accent" />
                Zalo
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
