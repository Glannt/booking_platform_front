"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Star, Shield, Ship, Utensils, Award, User, Briefcase, CheckCircle, Compass } from "lucide-react";
import { Button, Skeleton } from "@heroui/react";

import { getTourById, TourDto } from "@/lib/api/tours";
import { getVehicles, VehicleDto } from "@/lib/api/fleet";
import { getMediaDetails } from "@/lib/api/media";
import { useI18n } from "@/context/LanguageContext";
import { formatPriceSync as _formatPrice, formatTimeDisplay } from "@/lib/format";
import { resolveLocalizedName, resolveLocalizedContent, resolveTranslation } from "@/lib/i18n-helpers";
import { ImageGallery } from "@/components/ImageGallery";
import type { SectionDto } from "@/lib/api/sections";

interface TourDetailClientProps {
  sections: SectionDto[];
  tourId: number;
}

export default function TourDetailClient({ sections, tourId }: TourDetailClientProps) {
  const router = useRouter();
  const { language, t } = useI18n();
  const id = tourId;

  const [tour, setTour] = useState<TourDto | null>(null);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDto | null>(null);
  const [vehicleImages, setVehicleImages] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tourRes, fleetRes] = await Promise.all([
          getTourById(id),
          getVehicles()
        ]);

        if (tourRes?.data) {
          setTour(tourRes.data);
        }

        let list: VehicleDto[] = [];
        if (fleetRes?.data?.content && fleetRes.data.content.length > 0) {
          list = fleetRes.data.content.filter(v => v.active);
        }

        setVehicles(list);
        const defaultV = list.find(v => v.type?.default) || list[0];
        setSelectedVehicle(defaultV);

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const imagesMap: Record<number, string> = {};
        await Promise.all(
          list.map(async (v) => {
            if (v.thumbnailId) {
              try {
                const media = await getMediaDetails(v.thumbnailId);
                if (media && media.filePath) {
                  imagesMap[v.id] = media.filePath.startsWith("http")
                    ? media.filePath
                    : `${backendUrl}${media.filePath}`;
                }
              } catch (err) {
                console.error("Error fetching media for vehicle", v.id, err);
              }
            }
          })
        );
        setVehicleImages(imagesMap);

      } catch (err) {
        console.error("Error loading tour detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const resolveMediaUrl = (filePath: string): string => {
    return filePath.startsWith("http") ? filePath : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${filePath}`;
  };

  const getLocalizedName = () => {
    if (!tour) return "";
    return resolveLocalizedName(tour.translations, language, "Tour");
  };

  const getLocalizedContent = () => {
    if (!tour) return "";
    return resolveLocalizedContent(tour.translations, language);
  };

  const getLocalizedVehicleName = (v: VehicleDto) => {
    const cat = v.type;
    if (!cat) return `${v.brand} ${v.model}`;
    const translation = resolveTranslation(cat.translations, language);
    return translation ? `${translation.name} (${v.brand} ${v.model})` : `${v.brand} ${v.model}`;
  };

  const calculateCombinedPrice = (v: VehicleDto) => {
    if (tour == null || v.type == null) return 0;
    const foundPrice = tour?.prices?.find((p) => p.vehicleCategoryId === v.type?.id && p.active);
    if (foundPrice) return foundPrice.amount;
    const basePrice = 1200000;
    const code = v.type.code || "";
    if (code.includes("16")) return basePrice + 1500000;
    else if (code.includes("7")) return basePrice + 800000;
    else return basePrice + 400000;
  };

  const formatPrice = (value: number) => _formatPrice(value, language);

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case "ship": return <Ship size={13} />;
      case "utensils": return <Utensils size={13} />;
      case "shield": return <Shield size={13} />;
      case "award": return <Award size={13} />;
      default: return <Compass size={13} />;
    }
  };

  const handleProceedBooking = () => {
    if (!selectedVehicle) return;
    router.push(`/${language}/tours/${id}/confirm?vehicleId=${selectedVehicle.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
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
            <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <Skeleton className="h-4 w-48 rounded-lg" />
              <Skeleton className="h-3 w-full rounded-lg" />
              <Skeleton className="h-3 w-full rounded-lg" />
              <Skeleton className="h-3 w-4/5 rounded-lg" />
              <div className="flex gap-2.5 pt-3">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            </div>
            <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <Skeleton className="h-4 w-48 rounded-lg" />
              <div className="space-y-5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-4">
                    <Skeleton className="h-3 w-3 rounded-full shrink-0 mt-1" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3 w-32 rounded-lg" />
                      <Skeleton className="h-3 w-full rounded-lg" />
                      <Skeleton className="h-3 w-4/5 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="space-y-1">
                <Skeleton className="h-4 w-56 rounded-lg" />
                <Skeleton className="h-3 w-4/5 rounded-lg" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <Skeleton className="w-16 h-12 rounded-xl" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-32 rounded-lg" />
                        <Skeleton className="h-2.5 w-24 rounded-lg" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <Skeleton className="h-2.5 w-28 rounded-lg" />
                    <Skeleton className="h-2.5 w-36 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-lg" />
                </div>
                <Skeleton className="h-11 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-sm font-bold text-slate-500">{t.common.noResults}</p>
        <Button onClick={() => router.push(`/${language}/tours`)} className="bg-accent text-white text-xs font-bold px-4 py-2 rounded-xl">
          {t.tours.goBack}
        </Button>
      </div>
    );
  }

  const duration = tour.durationDays > 0
    ? `${tour.durationDays} ${t.tours.days}`
    : `${tour.durationNights} ${t.tours.days}`;

  const tourImageList = (tour?.images || []).map(img => ({
    id: img.id,
    url: resolveMediaUrl(img.filePath),
  }));
  const heroImg: string = tourImageList.length > 0
    ? tourImageList[0].url
    : tour?.thumbnail
      ? resolveMediaUrl(tour.thumbnail.filePath)
      : "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* Banner */}
      <section className="relative w-full h-[320px] md:h-[400px] bg-slate-900 overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroImg}')` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

        <div className="max-w-7xl mx-auto w-full px-6 pb-8 relative z-10 text-white space-y-4">
          <Button
            onClick={() => router.push(`/${language}/tours`)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white bg-black/40 hover:bg-black/60 border-none rounded-full px-4 py-2 cursor-pointer mb-2"
          >
            <ArrowLeft size={13} />
            <span>{t.tours.goBack}</span>
          </Button>

          <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">
              {getLocalizedName()}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1"><Clock size={13} className="text-accent" /> {duration}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin size={13} className="text-amber-500" /> {t.tours.pickupOnDemand}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      {tourImageList.length > 0 && (
        <section className="max-w-7xl mx-auto w-full px-4 md:px-6 -mt-4 relative z-10">
          <ImageGallery images={tourImageList} thumbnailId={tour.thumbnailId} className="rounded-2xl overflow-hidden shadow-lg" />
        </section>
      )}

      {/* Detail Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Details & Itinerary */}
        <div className="lg:col-span-7 space-y-6">
          {/* Overview */}
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-250 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">
              {t.tours.overview}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              {getLocalizedContent() || t.tours.overview}
            </p>

            {/* Options highlights */}
            <div className="flex flex-wrap gap-2.5 pt-3">
              {tour.options?.map((opt) => {
                const trans = resolveTranslation(opt.translations, language);
                return (
                  <div
                    key={opt.id}
                    style={{ color: opt.colorText || "#3b82f6", backgroundColor: `${opt.colorText || "#3b82f6"}10` }}
                    className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  >
                    {renderIcon(opt.iconUrl)}
                    <span>{trans ? trans.content : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Itinerary Accordion / List */}
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-250 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">
              {t.tours.itinerary}
            </h2>

            {tour.days && tour.days.length > 0 ? (
              <div className="space-y-6">
                {tour.days.map((day) => {
                  const dayTrans = resolveTranslation(day.translations, language);
                  return (
                    <div key={day.id} className="space-y-4">
                      <div className="flex items-center gap-2 bg-accent/5 dark:bg-black px-4 py-2 rounded-2xl">
                        <span className="bg-accent text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0">
                          {day.dayNumber}
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">
                            {dayTrans ? dayTrans.name : `${t.tours.days} ${day.dayNumber}`}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-semibold">{dayTrans?.description}</span>
                        </div>
                      </div>

                      {/* Activities */}
                      <div className="relative border-l border-dashed border-slate-200 dark:border-slate-800 pl-6 ml-3.5 space-y-5">
                        {day.activities?.map((act, index) => {
                          const actTrans = resolveTranslation(act.translations, language);
                          return (
                            <div key={act.id} className="relative space-y-1">
                              <div className="absolute -left-[30px] top-1 bg-white dark:bg-black w-3 h-3 rounded-full border-2 border-accent flex items-center justify-center" />

                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-accent uppercase tracking-wider">
                                <span className="bg-blue-50 dark:bg-[var(--bg-card)] px-2 py-0.5 rounded-full">{formatTimeDisplay(act.startTime)} - {formatTimeDisplay(act.endTime)}</span>
                                <span className="text-slate-400 font-normal">|</span>
                                <span className="text-slate-500 flex items-center gap-0.5"><MapPin size={10} /> {act.location}</span>
                              </div>
                              <h5 className="text-xs font-extrabold text-slate-900 dark:text-white mt-1">
                                {actTrans ? actTrans.name : ""}
                              </h5>
                              <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                                {actTrans ? actTrans.description : ""}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs font-bold">
                {t.tours.itineraryPending}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Vehicle Selection & CTA Sidebar */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
          <div className="bg-white dark:bg-black p-6 rounded-3xl border border-slate-250 dark:border-slate-800 shadow-sm space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">
                {t.tours.selectVehicleClass}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                {t.tours.vehicleClassDesc}
              </p>
            </div>

            <div className="space-y-3">
              {vehicles.map((v) => {
                const isSelected = selectedVehicle?.id === v.id;
                const price = calculateCombinedPrice(v);
                const name = getLocalizedVehicleName(v);

                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={`cursor-pointer rounded-2xl border p-3 transition-all duration-300 flex items-center justify-between ${isSelected
                      ? "border-accent bg-accent/5 ring-2 ring-accent/10 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-black"
                      }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-16 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 relative bg-slate-100 dark:bg-black">
                        <img
                          src={vehicleImages[v.id] || v.thumbnailUrl || ""}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-accent/15 flex items-center justify-center">
                            <div className="bg-accent text-white rounded-full p-0.5 shadow-sm">
                              <CheckCircle size={11} className="stroke-[2.5]" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5 text-left">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white block leading-tight">
                          {name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>{v.type ? (v.type.minSeat === v.type.maxSeat ? v.type.minSeat : `${v.type.minSeat}-${v.type.maxSeat}`) : "4"} {t.common.seats}</span>
                          <span>•</span>
                          <span>{v.luggage} {v.luggageUnit || t.common.baggage}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-black text-accent shrink-0 pl-2">
                      {formatPrice(price)}
                    </span>
                  </div>
                );
              })}
            </div>

            {selectedVehicle && (
              <div className="border-t border-slate-100 dark:border-slate-850 pt-4 space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      {t.tours.totalEstimate}
                    </span>
                    <span className="text-[10px] text-accent font-bold block mt-0.5">
                      {t.tours.packageDesc}
                    </span>
                  </div>
                  <span className="text-lg font-black text-amber-500">
                    {formatPrice(calculateCombinedPrice(selectedVehicle))}
                  </span>
                </div>

                <Button
                  onClick={handleProceedBooking}
                  className="w-full h-11 bg-accent hover:bg-accent-hover text-white font-black text-xs uppercase tracking-wider rounded-2xl border-none cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  {`${t.tours.continue} →`}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
