"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Clock,
  MapPin,
  Shield,
  CheckCircle,
  XCircle,
  Users,
  Minus,
  Plus,
  Sparkles,
  Zap,
  Check,
} from "lucide-react";
import { Button, Skeleton } from "@heroui/react";
import { SvgIconRenderer } from "@/components/common/SvgIconRenderer";
import { HighlightBadge } from "@/components/common/HighlightBadge";

import { getTourById, getTourByIdOrSlug, TourDto, TourPackageDto, getPackagePrice, getPackagePriceItem, formatPassengerCondition } from "@/lib/api/tours";
import { getPublicTourPolicies, TourPolicyDto } from "@/lib/api/tour-policy";
import { useI18n } from "@/context/LanguageContext";
import { formatPriceSync as _formatPrice, formatTimeDisplay } from "@/lib/format";
import {
  resolveLocalizedName,
  resolveLocalizedDescription,
  resolveLocalizedContent,
  resolveLocalizedSlug,
  resolveTranslation,
} from "@/lib/i18n-helpers";
import { getCanonicalSlug } from "@/lib/slug-helpers";
import { parseBulletList } from "@/lib/utils/bullet-helper";
import { ImageGalleryGrid } from "@/components/ImageGalleryGrid";
import { ContentPreviewModal } from "@/components/ContentPreviewModal";
import { FormattedDescription } from "@/components/FormattedDescription";
import type { SectionDto } from "@/lib/api/sections";
import {
  DetailCMSSections,
  DetailComponentsList,
} from "@/components/sections/detail/DetailSectionRenderer";

interface TourDetailClientProps {
  sections: SectionDto[];
  tourIdentifier: string | number;
  initialTour?: TourDto | null;
}

export default function TourDetailClient({
  sections,
  tourIdentifier,
  initialTour,
}: TourDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useI18n();

  const defaultPkg = initialTour?.packages?.find((p) => p.active) || initialTour?.packages?.[0] || null;
  const [tour, setTour] = useState<TourDto | null>(initialTour || null);
  const [selectedPackage, setSelectedPackage] = useState<TourPackageDto | null>(defaultPkg);
  const [adultCount, setAdultCount] = useState<number>(2);
  const [childCount, setChildCount] = useState<number>(0);
  const [infantCount, setInfantCount] = useState<number>(0);
  const [loading, setLoading] = useState(!initialTour);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [policies, setPolicies] = useState<TourPolicyDto[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const isFirstRender = React.useRef(Boolean(initialTour));

  useEffect(() => {
    let isMounted = true;
    getPublicTourPolicies()
      .then((res) => {
        if (isMounted && res.data) {
          setPolicies(res.data);
        }
      })
      .catch((err) => console.error("Failed to load tour policies:", err))
      .finally(() => {
        if (isMounted) setPoliciesLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const queryId = searchParams.get("id") || searchParams.get("tourId");
        let tourRes;
        if (queryId && !isNaN(Number(queryId))) {
          tourRes = await getTourById(Number(queryId));
        } else {
          tourRes = await getTourByIdOrSlug(tourIdentifier);
        }

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
  }, [tourIdentifier, searchParams]);

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
      .map((p) => getPackagePrice(p, "ADULT"))
      .filter((price) => price > 0);
    return validPrices.length > 0 ? Math.min(...validPrices) : 0;
  };

  const calculateTotal = () => {
    if (!selectedPackage) return 0;
    if (selectedPackage.isContactOnly) return 0;
    const adultTotal = getPackagePrice(selectedPackage, "ADULT") * adultCount;
    const childTotal = getPackagePrice(selectedPackage, "CHILD") * childCount;
    const infantTotal = getPackagePrice(selectedPackage, "INFANT") * infantCount;
    return adultTotal + childTotal + infantTotal;
  };

  const renderCategoryIcon = (iconName?: string) => {
    return <SvgIconRenderer svgString={iconName} size={12} className="shrink-0" />;
  };

  const renderOptionIcon = (iconName?: string) => {
    return <SvgIconRenderer svgString={iconName} size={13} className="shrink-0" />;
  };

  const handleProceedBooking = () => {
    if (!selectedPackage || !tour) return;
    const tourSlug = getCanonicalSlug(tour, language, "tour");
    const params = new URLSearchParams();
    if (selectedPackage.id)
      params.set("packageId", selectedPackage.id.toString());
    params.set("adults", adultCount.toString());
    params.set("children", childCount.toString());
    params.set("infants", infantCount.toString());
    router.push(`/${language}/tours/${tourSlug}/confirm?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-page)] text-slate-800 dark:text-slate-100 flex flex-col font-sans">
        {/* Top Info Skeleton */}
        <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 pb-4 space-y-3">
          <Skeleton className="h-4 w-48 rounded-md" />
          <Skeleton className="h-8 w-3/4 md:w-1/2 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        </div>

        {/* Gallery Grid Skeleton */}
        <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10">
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
        <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-3 w-full rounded-lg" />
              <Skeleton className="h-3 w-5/6 rounded-lg" />
              <Skeleton className="h-3 w-4/6 rounded-lg" />
            </div>
          </div>
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
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
          className="bg-accent hover:bg-accent-hover text-accent-foreground text-sm font-bold px-5 py-2.5 rounded-xl border-none cursor-pointer shadow-sm transition-colors"
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
      <section className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-5 pb-3 space-y-3">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-slate-400 font-medium overflow-hidden whitespace-nowrap"
        >
          <Link
            href={`/${language}`}
            className="hover:text-accent transition-colors"
          >
            {t.nav.home}
          </Link>
          <ChevronRight size={14} className="shrink-0 opacity-60" />
          <Link
            href={`/${language}/tours`}
            className="hover:text-accent transition-colors"
          >
            {t.nav.tour || t.tours.title}
          </Link>
          <ChevronRight size={14} className="shrink-0 opacity-60" />
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
            <HighlightBadge
              icon={renderCategoryIcon(tour.tourCategory.icon)}
              value={resolveLocalizedName(
                tour.tourCategory.translations,
                language,
                tour.tourCategory.title || tour.tourCategory.code
              )}
              variant="default"
            />
          )}

          {duration && (
            <HighlightBadge
              icon={<Clock size={14} />}
              value={duration}
              variant="default"
            />
          )}

          {tour.isRecommended && (
            <HighlightBadge
              icon={<Sparkles size={14} />}
              value={t.tours.recommended || t.tours.bestSeller}
              variant="amber"
            />
          )}
        </div>
      </section>

      {/* 2. Klook-style Image Gallery Grid */}
      <section className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10">
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
      <main className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Overview/Description, Options, Inclusions/Exclusions, Itinerary */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
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
                paragraphClassName="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium"
                bulletClassName="text-sm md:text-base text-slate-700 dark:text-slate-200 font-semibold"
              />

              {/* "Xem thêm >" Action Button */}
              {hasMoreContent && (
                <button
                  type="button"
                  onClick={() => setContentModalOpen(true)}
                  className="mt-3.5 inline-flex items-center gap-1 text-sm font-extrabold text-accent hover:text-accent-hover cursor-pointer group transition-colors"
                >
                  <span>{t.tours.readMore}</span>
                  <ChevronRight
                    size={16}
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
                      className="px-3.5 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      {renderOptionIcon(opt.iconUrl)}
                      <span>{trans ? trans.content : ""}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inclusions & Exclusions / Dynamic Components */}
          {((selectedPackage?.inclusions || selectedPackage?.exclusions) && (inclusionItems.length > 0 || exclusionItems.length > 0)) ? (
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 md:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              {inclusionItems.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm md:text-base font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle size={18} />
                    <span>{t.tours.inclusions}</span>
                  </h3>
                  <ul className="space-y-2.5 pl-1">
                    {inclusionItems.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 font-semibold leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
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
                  <h3 className="text-sm md:text-base font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <XCircle size={18} />
                    <span>{t.tours.exclusions}</span>
                  </h3>
                  <ul className="space-y-2.5 pl-1">
                    {exclusionItems.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 font-semibold leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : tour.components && tour.components.length > 0 ? (
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 md:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <DetailComponentsList components={tour.components} />
            </div>
          ) : (inclusionItems.length > 0 || exclusionItems.length > 0) ? (
            <div className="bg-white dark:bg-[var(--bg-surface)] p-6 md:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              {inclusionItems.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm md:text-base font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle size={18} />
                    <span>{t.tours.inclusions}</span>
                  </h3>
                  <ul className="space-y-2.5 pl-1">
                    {inclusionItems.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 font-semibold leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
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
                  <h3 className="text-sm md:text-base font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <XCircle size={18} />
                    <span>{t.tours.exclusions}</span>
                  </h3>
                  <ul className="space-y-2.5 pl-1">
                    {exclusionItems.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 font-semibold leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

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
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-[var(--bg-card)] px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 shadow-xs">
                          {day.dayNumber}
                        </span>
                        <div>
                          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                            {dayTrans
                              ? dayTrans.name
                              : `${t.tours.days} ${day.dayNumber}`}
                          </h4>
                          {dayTrans?.description && (
                            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
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
                            <div key={act.id} className="relative space-y-1.5">
                              <div className="absolute -left-[31px] top-1 bg-white dark:bg-[var(--bg-surface)] w-3.5 h-3.5 rounded-full border-2 border-accent flex items-center justify-center" />

                              <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-accent uppercase tracking-wider">
                                <span className="bg-accent/10 dark:bg-accent/20 px-3 py-1 rounded-full">
                                  {formatTimeDisplay(act.startTime)} -{" "}
                                  {formatTimeDisplay(act.endTime)}
                                </span>
                                {act.location && (
                                  <>
                                    <span className="text-slate-300 dark:text-slate-600 font-normal">
                                      |
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1 font-semibold text-sm">
                                      <MapPin size={13} className="text-amber-500" />
                                      {act.location}
                                    </span>
                                  </>
                                )}
                              </div>
                              <h5 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                                {actTrans ? actTrans.name : ""}
                              </h5>
                              {actTrans?.description && (
                                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
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
              <div className="py-8 text-center text-slate-400 text-sm font-bold">
                {t.tours.itineraryPending}
              </div>
            )}
          </div>

          {/* Tour Policies Card */}
          <div className="bg-white dark:bg-[var(--bg-surface)] p-6 md:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="w-2 h-4 rounded-full bg-accent" />
              <span>{t.tours.policies || "Chính sách Tour"}</span>
            </h2>

            {policiesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)]">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-zinc-800 shrink-0" />
                    <div className="space-y-1.5 flex-1 pt-1">
                      <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
                      <div className="h-2.5 bg-slate-200 dark:bg-zinc-800 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : policies.length === 0 ? (
              <p className="text-sm text-slate-400 italic">
                Chưa có chính sách nào được cấu hình.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {policies.map((pol) => {
                  const trans =
                    pol.translations?.find((tr) => tr.locale === language) ||
                    pol.translations?.find((tr) => tr.locale === "vi") ||
                    pol.translations?.[0];
                  const title = trans?.name || pol.code;
                  const desc = trans?.description || "";

                  return (
                    <div key={pol.id} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800/80">
                      <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center p-2 shrink-0">
                        <SvgIconRenderer svgString={pol.icon} className="w-full h-full text-accent" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {title}
                        </h4>
                        {desc && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
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

        {/* Right Column: Sticky Booking Widget & Tour Packages */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md space-y-5">
            {/* Price Header (Featured like Klook) */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-baseline justify-between gap-2">
              <div>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
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
                    <span className="text-sm font-bold text-slate-400">
                      / {adultCount + childCount} {t.tours.guests.toLowerCase()}
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Package Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {t.tours.selectPackage}
                </h3>
                <span className="text-sm font-bold text-slate-400">
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
                      className={`cursor-pointer rounded-2xl border p-3.5 transition-all duration-200 flex flex-col gap-1.5 ${isSelected
                        ? "border-accent bg-accent/5 ring-2 ring-accent/20 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[var(--bg-surface)]"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-slate-300 dark:border-slate-600"
                              }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                          <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                            {pkgName}
                          </span>
                        </div>

                        {/* Price tag */}
                        <div className="shrink-0 text-right">
                          {pkg.isContactOnly ? (
                            <span className="text-sm font-black text-amber-500 uppercase">
                              {t.tours.contactOnly}
                            </span>
                          ) : (
                            <span className="text-sm sm:text-base font-black text-accent">
                              {formatPrice(getPackagePrice(pkg, "ADULT"))}
                              <span className="text-sm text-slate-400 font-medium">
                                /{t.tours.perPerson}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {pkgDesc && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 pl-6 leading-relaxed font-normal line-clamp-2">
                          {pkgDesc}
                        </p>
                      )}

                      {pkg.pricingType === "PER_PERSON" && !pkg.isContactOnly && (() => {
                        const childPriceVal = getPackagePrice(pkg, "CHILD");
                        const infantPriceVal = getPackagePrice(pkg, "INFANT");
                        return (
                          <div className="pl-6 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-slate-400 font-semibold">
                            {childPriceVal > 0 && (
                              <span>
                                {t.tours.children}:{" "}
                                <strong className="text-slate-700 dark:text-slate-200">
                                  {formatPrice(childPriceVal)}
                                </strong>
                              </span>
                            )}
                            <span>
                              {t.tours.infants}:{" "}
                              <strong className="text-emerald-500">
                                {infantPriceVal > 0 ? formatPrice(infantPriceVal) : t.tours.free}
                              </strong>
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Passenger counters for PER_PERSON packages */}
            {selectedPackage &&
              selectedPackage.pricingType === "PER_PERSON" &&
              !selectedPackage.isContactOnly && (() => {
                const adultItem = getPackagePriceItem(selectedPackage, "ADULT");
                const childItem = getPackagePriceItem(selectedPackage, "CHILD");
                const infantItem = getPackagePriceItem(selectedPackage, "INFANT");
                const adultCond = formatPassengerCondition(adultItem, language);
                const childCond = formatPassengerCondition(childItem, language);
                const infantCond = formatPassengerCondition(infantItem, language);
                const infantPriceVal = getPackagePrice(selectedPackage, "INFANT");

                return (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={15} className="text-accent" />
                      <span>{t.tours.numberOfGuestsLabel}</span>
                    </h4>

                    {/* Adults */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800/80">
                      <div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">
                          {t.tours.adults}
                        </span>
                        <span className="text-sm text-slate-400 font-semibold">
                          {adultCond || t.tours.adultDesc} (
                          {formatPrice(getPackagePrice(selectedPackage, "ADULT"))})
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setAdultCount(Math.max(1, adultCount - 1))}
                          disabled={adultCount <= 1}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] disabled:opacity-40 cursor-pointer bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-white transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm sm:text-base font-black w-5 text-center">
                          {adultCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAdultCount(adultCount + 1)}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] cursor-pointer bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-white transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800/80">
                      <div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">
                          {t.tours.children}
                        </span>
                        <span className="text-sm text-slate-400 font-semibold">
                          {childCond || t.tours.childDesc} (
                          {formatPrice(getPackagePrice(selectedPackage, "CHILD"))})
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setChildCount(Math.max(0, childCount - 1))}
                          disabled={childCount <= 0}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] disabled:opacity-40 cursor-pointer bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-white transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm sm:text-base font-black w-5 text-center">
                          {childCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setChildCount(childCount + 1)}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] cursor-pointer bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-white transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Infants */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-slate-100 dark:border-slate-800/80">
                      <div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">
                          {t.tours.infants}
                        </span>
                        <span className="text-sm text-emerald-500 font-semibold">
                          {infantCond || t.tours.infantDesc}
                          {infantPriceVal > 0 ? ` (${formatPrice(infantPriceVal)})` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setInfantCount(Math.max(0, infantCount - 1))}
                          disabled={infantCount <= 0}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] disabled:opacity-40 cursor-pointer bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-white transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm sm:text-base font-black w-5 text-center">
                          {infantCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setInfantCount(infantCount + 1)}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[var(--bg-elevated)] cursor-pointer bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-white transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Booking CTA Button */}
            {selectedPackage && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                <Button
                  onClick={handleProceedBooking}
                  className="w-full h-12 bg-accent hover:bg-accent-hover text-accent-foreground font-black text-sm uppercase tracking-wider rounded-2xl border-none cursor-pointer shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                >
                  <span>{`${t.tours.continue} →`}</span>
                </Button>

                {/* Assurance footer */}
                <div className="flex items-center justify-center gap-4 text-sm font-semibold text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Shield size={14} className="text-accent" />
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

      {/* CMS Sections (Booking Process, FAQs, Customer Reviews) */}
      {sections && sections.length > 0 && (
        <section className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 pb-12">
          <DetailCMSSections sections={sections} locale={language} />
        </section>
      )}

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
