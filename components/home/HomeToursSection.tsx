"use client";

import React, { useRef, useState, useMemo } from "react";
import { useI18n } from "@/context/LanguageContext";
import { Reveal } from "@/components/Reveal";
import { HomeSectionHeader } from "./HomeSectionHeader";
import { HomeActivityCard } from "./HomeActivityCard";
import type { TourDto } from "@/lib/api/tours";
import { getCanonicalSlug } from "@/lib/slug-helpers";
import { backendUrl } from "@/lib/api/client";
import { useActiveDiscounts } from "@/lib/queries/useDiscounts";
import type { PromotionDto } from "@/lib/api/discount";
import { isPromotionApplicable, buildDiscountTags, type DiscountTagsResult } from "@/lib/discount-tags";

interface HomeToursSectionProps {
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
  tours?: TourDto[];
  limit?: number;
  className?: string;
}

function getTourLowestPrice(tour: TourDto): number {
  if (tour.packages && tour.packages.length > 0) {
    const pkgPrices = tour.packages
      .map((pkg) => {
        if (pkg.prices && pkg.prices.length > 0) {
          const adult = pkg.prices.find((p) => p.passengerType === "ADULT");
          if (adult && adult.pricePerPerson > 0) return adult.pricePerPerson;
        }
        if (pkg.adultPrice && pkg.adultPrice > 0) return pkg.adultPrice;
        if (pkg.fixedPrice && pkg.fixedPrice > 0) return pkg.fixedPrice;
        return 0;
      })
      .filter((p) => p > 0);
    if (pkgPrices.length > 0) return Math.min(...pkgPrices);
  }
  if (tour.prices && tour.prices.length > 0) {
    const amounts = tour.prices.map((p) => p.amount).filter((a) => a > 0);
    if (amounts.length > 0) return Math.min(...amounts);
  }
  return 0;
}

function resolveTourDiscounts(
  tour: TourDto,
  price: number,
  promotions: PromotionDto[],
  savePercentTemplate: string
): DiscountTagsResult {
  const result = buildDiscountTags(
    promotions.filter((p) => isPromotionApplicable(p, "TOUR", tour.id)),
    price,
    savePercentTemplate
  );

  // Legacy per-tour discount fields (not declared on TourDto).
  const anyTour = tour as any;
  const extraTags: string[] = [];
  let originalPrice = result.originalPrice;
  if (typeof anyTour.discountPercent === "number" && anyTour.discountPercent > 0) {
    extraTags.push(savePercentTemplate.replace("{percent}", String(anyTour.discountPercent)));
  } else if (typeof anyTour.originalPrice === "number" && anyTour.originalPrice > price) {
    const percent = Math.round(((anyTour.originalPrice - price) / anyTour.originalPrice) * 100);
    extraTags.push(savePercentTemplate.replace("{percent}", String(percent)));
    if (originalPrice === undefined || anyTour.originalPrice > originalPrice) {
      originalPrice = anyTour.originalPrice;
    }
  }

  return { tags: Array.from(new Set([...extraTags, ...result.tags])), originalPrice };
}

export function HomeToursSection({
  title = "Các hoạt động & Tour nổi bật",
  subtitle = "Tour đảo, lặn biển ngắm san hô, du thuyền hoàng hôn và trải nghiệm giải trí đặc sắc tại Nha Trang",
  viewAllLink = "/tours",
  viewAllText,
  tours = [],
  limit = 8,
  className = "",
}: HomeToursSectionProps) {
  const { t, language } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Fetch active promotions for tours and global
  const { data: tourPromotions = [] } = useActiveDiscounts("TOUR");
  const { data: globalPromotions = [] } = useActiveDiscounts("GLOBAL");
  const allPromotions = useMemo(
    () => [...tourPromotions, ...globalPromotions],
    [tourPromotions, globalPromotions]
  );

  // If no tours from backend, do NOT display mock fallback data
  if (!tours || tours.length === 0) {
    return null;
  }

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 340;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const resolvedViewAllLink = viewAllLink.startsWith("/") ? `/${language}${viewAllLink}` : viewAllLink;
  const displayItems = tours.slice(0, limit);

  return (
    <section className={`w-full py-8 ${className}`}>
      <Reveal className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <HomeSectionHeader
          title={title}
          subtitle={subtitle}
          viewAllLink={resolvedViewAllLink}
          viewAllText={viewAllText || t.common.viewAll}
          onPrev={() => handleScroll("left")}
          onNext={() => handleScroll("right")}
          canScrollPrev={canScrollLeft}
          canScrollNext={canScrollRight}
        />

        {/* Carousel */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
        >
          {displayItems.map((tour, idx) => {
            const trans = tour.translations?.find((t) => t.locale === language) || tour.translations?.[0];
            const tourName = trans?.name || "Tour Nha Trang";
            const catTrans = tour.tourCategory?.translations?.find((t) => t.locale === language);
            const categoryName = catTrans?.name || tour.tourCategory?.title || "Tour Nha Trang";
            const rawImg = tour.thumbnail?.filePath || tour.images?.[0]?.filePath || "";
            const imgUrl = rawImg
              ? rawImg.startsWith("http")
                ? rawImg
                : `${backendUrl}${rawImg}`
              : "";

            const price = getTourLowestPrice(tour);
            const discountInfo = resolveTourDiscounts(
              tour,
              price,
              allPromotions,
              t.tours.savePercentTag || "TIẾT KIỆM {percent}%"
            );
            const slug = getCanonicalSlug(tour, language, "tour");

            // Badges come from the tour's "Tiện ích & Tùy chọn" (tour.options).
            const badges = (tour.options || [])
              .map(
                (opt) =>
                  opt.translations?.find((tr) => tr.locale === language)?.content ||
                  opt.translations?.[0]?.content ||
                  ""
              )
              .filter(Boolean);

            return (
              <Reveal
                key={tour.id}
                delay={Math.min(idx, 8) * 60}
                className="w-[260px] sm:w-[280px] md:w-[300px] shrink-0 snap-start flex flex-col"
              >
                <HomeActivityCard
                  id={tour.id}
                  imageUrl={imgUrl}
                  category={categoryName}
                  location="Nha Trang"
                  title={tourName}
                  badges={badges}
                  bookingCount={tour.successfulBookingsCount ? `${tour.successfulBookingsCount}+` : ""}
                  price={price}
                  originalPrice={discountInfo.originalPrice}
                  discountTags={discountInfo.tags}
                  comboTag={tour.isRecommended ? t.tours.bestSellerTag : undefined}
                  href={`/${language}/tours/${slug}`}
                  priceUnit={`/${t.tours.perPerson}`}
                />
              </Reveal>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}

export default HomeToursSection;
