"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Clock,
  MapPin,
  Shield,
  Ship,
  Car,
  Utensils,
  Award,
  CheckCircle,
  Compass,
  XCircle,
  Users,
  Minus,
  Plus,
  Sparkles,
  Zap,
  Check,
} from "lucide-react";
import { Button, Skeleton } from "@heroui/react";

import { getTourByIdOrSlug, TourDto, TourPackageDto } from "@/lib/api/tours";
import { useI18n } from "@/context/LanguageContext";
import { formatPriceSync as _formatPrice, formatTimeDisplay } from "@/lib/format";
import {
  resolveLocalizedName,
  resolveLocalizedDescription,
  resolveLocalizedContent,
  resolveLocalizedSlug,
  resolveTranslation,
} from "@/lib/i18n-helpers";
import { parseBulletList } from "@/lib/utils/bullet-helper";
import { ImageGalleryGrid } from "@/components/ImageGalleryGrid";
import { ContentPreviewModal } from "@/components/ContentPreviewModal";
import { FormattedDescription } from "@/components/FormattedDescription";
import type { SectionDto } from "@/lib/api/sections";

interface TourDetailClientProps {
  sections: SectionDto[];
  tourIdentifier: string | number;
}

export default function TourDetailClient({
  tourIdentifier,
}: TourDetailClientProps) {
  const router = useRouter();
  const { language, t } = useI18n();

  const [tour, setTour] = useState<TourDto | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<TourPackageDto | null>(null);
  const [adultCount, setAdultCount] = useState<number>(2);
  const [childCount, setChildCount] = useState<number>(0);
  const [infantCount, setInfantCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [contentModalOpen, setContentModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const tourRes = await getTourByIdOrSlug(tourIdentifier);
        if (tourRes?.data) {
          const tData = tourRes.data;
          setTour(tData);

          // Select first active package by default
          if (tData.packages && tData.packages.length > 0) {
            const activePkgs = tData.packages.filter((p) => p.active);
            setSelectedPackage(activePkgs[0] || tData.packages[0]);
          }
        }
      } catch (err) {
        console.error("Error loading tour detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tourIdentifier]);

  const resolveMediaUrl = (filePath: string): string => {
    return filePath.startsWith("http")
      ? filePath
      : `${process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:8080"}${filePath}`;
  };

  const getLocalizedName = () => {
    if (!tour) return "";
    return resolveLocalizedName(tour.translations, language, "Tour");
  };

  const getLocalizedDesc = () => {
    if (!tour) return "";
    return resolveLocalizedDescription(tour.translations, language);
  };

  const getLocalizedContent = () => {
    if (!tour) return "";
    return resolveLocalizedContent(tour.translations, language);
  };

  const getLocalizedPackageName = (pkg: TourPackageDto) => {
    const translation = resolveTranslation(pkg.translations, language);
    return translation?.name || pkg.code || t.tours.tourPackage;
  };

  const getLocalizedPackageDesc = (pkg: TourPackageDto) => {
    const translation = resolveTranslation(pkg.translations, language);
    return translation?.description || "";
  };

  const formatPrice = (value: number) => {
    if (value <= 0) return t.tours.contactOnly;
    return _formatPrice(value, language);
  };

  const availablePackages =
    tour?.packages && tour.packages.length > 0
      ? tour.packages.filter((p) => p.active)
      : [];

  const getStartingPrice = (): number => {
    if (availablePackages.length === 0) return 0;
    const validPrices = availablePackages
      .filter((p) => !p.isContactOnly)
      .map((p) =>
        p.pricingType === "PER_PERSON" ? p.adultPrice || 0 : p.fixedPrice || 0
      )
      .filter((price) => price > 0);
    return validPrices.length > 0 ? Math.min(...validPrices) : 0;
  };

  const calculateTotal = () => {
    if (!selectedPackage) return 0;
    if (selectedPackage.isContactOnly) return 0;
    if (selectedPackage.pricingType === "PER_PERSON") {
      const adultTotal = (selectedPackage.adultPrice || 0) * adultCount;
      const childTotal = (selectedPackage.childPrice || 0) * childCount;
      return adultTotal + childTotal;
    }
    return selectedPackage.fixedPrice || 0;
  };

  const renderCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case "ship":
        return <Ship size={12} />;
      case "car":
        return <Car size={12} />;
      case "compass":
        return <Compass size={12} />;
      case "utensils":
        return <Utensils size={12} />;
      case "award":
        return <Award size={12} />;
      case "shield":
        return <Shield size={12} />;
      default:
        return <Compass size={12} />;
    }
  };

  const renderOptionIcon = (iconName?: string) => {
    switch (iconName) {
      case "ship":
        return <Ship size={13} />;
      case "utensils":
        return <Utensils size={13} />;
      case "shield":
        return <Shield size={13} />;
      case "award":
        return <Award size={13} />;
      default:
        return <Compass size={13} />;
    }
  };

  const handleProceedBooking = () => {
    if (!selectedPackage || !tour) return;
    const slugOrId =
      resolveLocalizedSlug(tour.translations, language) ||
      tour.id ||
      tourIdentifier;
    const params = new URLSearchParams();
    if (selectedPackage.id)
      params.set("packageId", selectedPackage.id.toString());
    params.set("adults", adultCount.toString());
    params.set("children", childCount.toString());
    params.set("infants", infantCount.toString());
    router.push(`/${language}/tours/${slugOrId}/confirm?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-page)] text-slate-800 dark:text-slate-100 flex flex-col font-sans">
        {/* Top Info Skeleton */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4 space-y-3">
          <Skeleton className="h-4 w-48 rounded-md" />
          <Skeleton className="h-8 w-3/4 md:w-1/2 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        </div>

        {/* Gallery Grid Skeleton */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 h-[340px] md:h-[420px] rounded-3xl overflow-hidden">
            <Skeleton className="md:col-span-7 h-full w-full rounded-none" />
            <div className="hidden md:grid md:col-span-5 grid-cols-2 grid-rows-2 gap-2 h-full">
              <Skeleton className="w-full h-full rounded-none" />
              <Skeleton className="w-full h-full rounded-none" />
              <Skeleton className="w-full h-full rounded-none" />
              <Skeleton className="w-full h-full rounded-none" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-3 w-full rounded-lg" />
              <Skeleton className="h-3 w-5/6 rounded-lg" />
              <Skeleton className="h-3 w-4/6 rounded-lg" />
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <Skeleton className="h-8 w-1/2 rounded-lg" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-page)] flex flex-col items-center justify-center gap-4">
        <p className="text-sm font-bold text-slate-500">{t.common.noResults}</p>
        <Button
          onClick={() => router.push(`/${language}/tours`)}
          className="bg-accent text-white text-xs font-bold px-5 py-2.5 rounded-xl border-none cursor-pointer shadow-sm"
        >
          {t.tours.goBack}
        </Button>
      </div>
    );
  }

  const duration =
    tour.durationDays > 0
      ? `${tour.durationDays} ${t.tours.days}`
      : `${tour.durationNights} ${t.tours.days}`;

  const tourImageList = (tour.images || []).map((img) => ({
    id: img.id,
    url: resolveMediaUrl(img.filePath),
  }));

  // Fallback if images array is empty but thumbnail exists
  if (tourImageList.length === 0 && tour.thumbnail) {
    tourImageList.push({
      id: tour.thumbnail.id || 0,
      url: resolveMediaUrl(tour.thumbnail.filePath),
    });
  }

  // Combine or prioritize inclusions / exclusions
  const packageInclusions = selectedPackage?.inclusions || tour.inclusions || "";
  const packageExclusions = selectedPackage?.exclusions || tour.exclusions || "";
  const inclusionItems = parseBulletList(packageInclusions);
  const exclusionItems = parseBulletList(packageExclusions);

  const totalPrice = calculateTotal();
  const startingPrice = getStartingPrice();

  const localizedDesc = getLocalizedDesc();
  const localizedContent = getLocalizedContent();
  const displaySummary = localizedDesc || localizedContent;

  // Determine whether "Xem thêm" should be shown:
  // - If full content is present and is longer or different than description
  // - Or if summary itself is long (> 200 chars)
  const hasMoreContent = Boolean(
    (localizedContent && localizedContent.trim() !== localizedDesc.trim()) ||
      (localizedContent && localizedContent.length > 150) ||
      (localizedDesc && localizedDesc.length > 250)
  );
  const modalContent = localizedContent || localizedDesc;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-page)] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* 1. Breadcrumbs + Title + Badges Header Section */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5 pb-3 space-y-3">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-slate-400 font-medium overflow-hidden whitespace-nowrap"
        >
          <Link
            href={`/${language}`}
            className="hover:text-accent transition-colors"
          >
            {t.nav.home}
          </Link>
          <ChevronRight size={12} className="shrink-0 opacity-60" />
          <Link
            href={`/${language}/tours`}
            className="hover:text-accent transition-colors"
          >
            {t.nav.tour || t.tours.title}
          </Link>
          <ChevronRight size={12} className="shrink-0 opacity-60" />
          <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[240px] sm:max-w-xs md:max-w-md">
            {getLocalizedName()}
          </span>
        </nav>

        {/* Tour Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
          {getLocalizedName()}
        </h1>

        {/* Badges and Quick Highlights (Klook-style pill row) */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {tour.tourCategory && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent dark:bg-accent/20">
              {renderCategoryIcon(tour.tourCategory.icon)}
              <span>
                {resolveLocalizedName(
                  tour.tourCategory.translations,
                  language,
                  tour.tourCategory.title || tour.tourCategory.code
                )}
              </span>
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <Clock size={12} className="text-accent" />
            <span>
              {t.tours.duration}: {duration}
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <MapPin size={12} className="text-amber-500" />
            <span>{t.tours.pickupOnDemand}</span>
          </span>

          {tour.isDefault && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Sparkles size={12} />
              <span>{t.tours.bestSeller}</span>
            </span>
          )}
        </div>
      </section>

      {/* 2. Klook-style Image Gallery Grid */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6">
        <ImageGalleryGrid
          images={tourImageList}
          thumbnailId={tour.thumbnailId}
          galleryLabel={t.tours.viewGallery}
          noPhotosLabel={t.tours.noPhotos}
          modalTitleLabel={t.tours.officialPhotos}
          className="shadow-md"
        />
      </section>

      {/* 3. Main Detail Content Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Overview/Description, Options, Inclusions/Exclusions, Itinerary */}
        <div className="lg:col-span-7 space-y-6">
          {/* About this Tour / Overview Box */}
          <div className="bg-white dark:bg-[var(--bg-surface)] p-6 md:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-4 rounded-full bg-accent" />
                <span>{t.tours.aboutThisTour}</span>
              </h2>
            </div>

            {/* Formatted Content Summary */}
            <div className="relative">
              <FormattedDescription
                description={displaySummary}
                paragraphClassName="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium"
                bulletClassName="text-xs md:text-sm text-slate-700 dark:text-slate-200 font-semibold"
              />

              {/* "Xem thêm >" Action Button */}
              {hasMoreContent && (
                <button
                  type="button"
                  onClick={() => setContentModalOpen(true)}
                  className="mt-3.5 inline-flex items-center gap-1 text-xs font-extrabold text-accent hover:text-accent-hover cursor-pointer group transition-colors"
                >
                  <span>{t.tours.readMore}</span>
                  <ChevronRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              )}
            </div>

            {/* Tour Options Highlights (Colored Tags) */}
            {tour.options && tour.options.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {tour.options.map((opt) => {
                  const trans = resolveTranslation(opt.translations, language);
                  return (
                    <div
                      key={opt.id}
                      style={{
                        color: opt.colorText || "#2563eb",
                        backgroundColor: `${opt.colorText || "#2563eb"}12`,
                      }}
                      className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      {renderOptionIcon(opt.iconUrl)}
                      <span>{trans ? trans.content : ""}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inclusions & Exclusions */}
          {(inclusionItems.length > 0 || exclusionItems.length > 0) && (
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 md:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              {inclusionItems.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs md:text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>{t.tours.inclusions}</span>
                  </h3>
                  <ul className="space-y-2.5 pl-1">
                    {inclusionItems.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {inclusionItems.length > 0 && exclusionItems.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800" />
              )}

              {exclusionItems.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs md:text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <XCircle size={16} />
                    <span>{t.tours.exclusions}</span>
                  </h3>
                  <ul className="space-y-2.5 pl-1">
                    {exclusionItems.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Itinerary Timeline */}
          <div className="bg-white dark:bg-[var(--bg-surface)] p-6 md:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="w-2 h-4 rounded-full bg-accent" />
              <span>{t.tours.itinerary}</span>
            </h2>

            {tour.days && tour.days.length > 0 ? (
              <div className="space-y-6">
                {tour.days.map((day) => {
                  const dayTrans = resolveTranslation(
                    day.translations,
                    language
                  );
                  return (
                    <div key={day.id} className="space-y-4">
                      {/* Day Header */}
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-[var(--bg-card)] px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="bg-accent text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                          {day.dayNumber}
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">
                            {dayTrans
                              ? dayTrans.name
                              : `${t.tours.days} ${day.dayNumber}`}
                          </h4>
                          {dayTrans?.description && (
                            <span className="text-[11px] text-slate-400 font-semibold">
                              {dayTrans.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Activities Timeline */}
                      <div className="relative border-l-2 border-dashed border-slate-200 dark:border-slate-800 pl-6 ml-3.5 space-y-5">
                        {day.activities?.map((act) => {
                          const actTrans = resolveTranslation(
                            act.translations,
                            language
                          );
                          return (
                            <div key={act.id} className="relative space-y-1">
                              <div className="absolute -left-[31px] top-1 bg-white dark:bg-[var(--bg-surface)] w-3 h-3 rounded-full border-2 border-accent flex items-center justify-center" />

                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-accent uppercase tracking-wider">
                                <span className="bg-accent/10 dark:bg-accent/20 px-2.5 py-0.5 rounded-full">
                                  {formatTimeDisplay(act.startTime)} -{" "}
                                  {formatTimeDisplay(act.endTime)}
                                </span>
                                {act.location && (
                                  <>
                                    <span className="text-slate-300 dark:text-slate-600 font-normal">
                                      |
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold">
                                      <MapPin size={11} className="text-amber-500" />
                                      {act.location}
                                    </span>
                                  </>
                                )}
                              </div>
                              <h5 className="text-xs font-extrabold text-slate-900 dark:text-white mt-1">
                                {actTrans ? actTrans.name : ""}
                              </h5>
                              {actTrans?.description && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                  {actTrans.description}
                                </p>
                              )}
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

        {/* Right Column: Sticky Booking Widget & Tour Packages */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md space-y-5">
            {/* Price Header (Featured like Klook) */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-baseline justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {selectedPackage ? t.tours.totalEstimate : t.tours.fromPrice}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl md:text-3xl font-black text-amber-500 tracking-tight">
                    {selectedPackage && !selectedPackage.isContactOnly
                      ? formatPrice(totalPrice)
                      : startingPrice > 0
                      ? `${t.tours.fromPrice} ${formatPrice(startingPrice)}`
                      : t.tours.contactOnly}
                  </span>
                  {selectedPackage?.pricingType === "PER_PERSON" && !selectedPackage.isContactOnly && (
                    <span className="text-xs font-bold text-slate-400">
                      / {adultCount + childCount} {t.tours.guests.toLowerCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Instant Confirmation Badge */}
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full shrink-0">
                <Zap size={12} />
                <span>Xác nhận tức thời</span>
              </div>
            </div>

            {/* Package Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {t.tours.selectPackage}
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  {availablePackages.length} {t.tours.packages.toLowerCase()}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-0.5">
                {availablePackages.map((pkg) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  const pkgName = getLocalizedPackageName(pkg);
                  const pkgDesc = getLocalizedPackageDesc(pkg);

                  return (
                    <div
                      key={pkg.id || pkg.code}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`cursor-pointer rounded-2xl border p-3.5 transition-all duration-200 flex flex-col gap-1.5 ${
                        isSelected
                          ? "border-accent bg-accent/5 ring-2 ring-accent/20 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[var(--bg-surface)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-accent bg-accent text-white"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {pkgName}
                          </span>
                        </div>

                        {/* Price tag */}
                        <div className="shrink-0 text-right">
                          {pkg.isContactOnly ? (
                            <span className="text-xs font-black text-amber-500 uppercase">
                              {t.tours.contactOnly}
                            </span>
                          ) : pkg.pricingType === "PER_PERSON" ? (
                            <span className="text-xs font-black text-accent">
                              {formatPrice(pkg.adultPrice || 0)}
                              <span className="text-[10px] text-slate-400 font-medium">
                                /{t.tours.perPerson}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs font-black text-accent">
                              {formatPrice(pkg.fixedPrice || 0)}
                            </span>
                          )}
                        </div>
                      </div>

                      {pkgDesc && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6 leading-relaxed font-medium line-clamp-2">
                          {pkgDesc}
                        </p>
                      )}

                      {pkg.pricingType === "PER_PERSON" && !pkg.isContactOnly && (
                        <div className="pl-6 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-400 font-semibold">
                          {pkg.childPrice !== undefined && pkg.childPrice > 0 && (
                            <span>
                              {t.tours.children}:{" "}
                              <strong className="text-slate-700 dark:text-slate-200">
                                {formatPrice(pkg.childPrice)}
                              </strong>
                            </span>
                          )}
                          <span>
                            {t.tours.infants}:{" "}
                            <strong className="text-emerald-500">
                              {t.tours.free}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Passenger counters for PER_PERSON packages */}
            {selectedPackage &&
              selectedPackage.pricingType === "PER_PERSON" &&
              !selectedPackage.isContactOnly && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={13} className="text-accent" />
                    <span>{t.tours.numberOfGuestsLabel}</span>
                  </h4>

                  {/* Adults */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {t.tours.adults}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {t.tours.adultDesc} (
                        {formatPrice(selectedPackage.adultPrice || 0)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setAdultCount(Math.max(1, adultCount - 1))}
                        disabled={adultCount <= 1}
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] disabled:opacity-40 cursor-pointer bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-white transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-black w-4 text-center">
                        {adultCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAdultCount(adultCount + 1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] cursor-pointer bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-white transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {t.tours.children}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {t.tours.childDesc} (
                        {formatPrice(selectedPackage.childPrice || 0)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setChildCount(Math.max(0, childCount - 1))}
                        disabled={childCount <= 0}
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] disabled:opacity-40 cursor-pointer bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-white transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-black w-4 text-center">
                        {childCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setChildCount(childCount + 1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] cursor-pointer bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-white transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Infants */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {t.tours.infants}
                      </span>
                      <span className="text-[10px] text-emerald-500 font-semibold">
                        {t.tours.infantDesc}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setInfantCount(Math.max(0, infantCount - 1))}
                        disabled={infantCount <= 0}
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] disabled:opacity-40 cursor-pointer bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-white transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-black w-4 text-center">
                        {infantCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInfantCount(infantCount + 1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] cursor-pointer bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-white transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Booking CTA Button */}
            {selectedPackage && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                <Button
                  onClick={handleProceedBooking}
                  className="w-full h-12 bg-accent hover:bg-accent-hover text-white font-black text-xs uppercase tracking-wider rounded-2xl border-none cursor-pointer shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                >
                  <span>{`${t.tours.continue} →`}</span>
                </Button>

                {/* Assurance footer */}
                <div className="flex items-center justify-center gap-4 text-[10px] font-semibold text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Shield size={11} className="text-accent" />
                    <span>Bảo đảm chất lượng</span>
                  </span>
                  <span>•</span>
                  <span>Hỗ trợ 24/7</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 4. Reusable Content Preview Modal (Xem thêm) */}
      <ContentPreviewModal
        isOpen={contentModalOpen}
        onClose={() => setContentModalOpen(false)}
        title={getLocalizedName()}
        subtitle={t.tours.aboutThisTour}
        content={modalContent}
        closeLabel={t.booking?.closeBtn || "Đóng"}
      />
    </div>
  );
}
