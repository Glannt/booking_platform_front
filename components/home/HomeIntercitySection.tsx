"use client";

import React, { useRef, useState, useMemo } from "react";
import { useI18n } from "@/context/LanguageContext";
import { HomeSectionHeader } from "./HomeSectionHeader";
import { HomeActivityCard } from "./HomeActivityCard";
import type { IntercityRouteDto } from "@/lib/api/intercity";
import type { SharedRouteDto } from "@/lib/api/sharedRoute";
import { backendUrl } from "@/lib/api/client";
import { useIntercityRoutePrices, lowestPriceForRoute } from "@/lib/queries/useIntercityPrices";
import { useActiveDiscounts } from "@/lib/queries/useDiscounts";
import { isPromotionApplicable, buildDiscountTags } from "@/lib/discount-tags";

interface HomeIntercitySectionProps {
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
  routes?: IntercityRouteDto[];
  sharedRoutes?: SharedRouteDto[];
  limit?: number;
  className?: string;
}

export function HomeIntercitySection({
  title = "Tuyến xe liên tỉnh & Xe ghép giá rẻ",
  subtitle = "Di chuyển nhanh chóng, an toàn giữa Nha Trang và các tỉnh thành lân cận với tài xế giàu kinh nghiệm",
  viewAllLink = "/intercity",
  viewAllText = "Xem tất cả tuyến",
  routes = [],
  sharedRoutes = [],
  limit = 8,
  className = "",
}: HomeIntercitySectionProps) {
  const { t, language } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Active promotions per scope (one request each), matched to each route below.
  const { data: intercityPromotions = [] } = useActiveDiscounts("INTERCITY_ROUTE");
  const { data: sharedPromotions = [] } = useActiveDiscounts("SHARED_ROUTE");
  const { data: globalPromotions = [] } = useActiveDiscounts("GLOBAL");

  const { data: prices = [] } = useIntercityRoutePrices();
  const allPromotions = useMemo(
    () => [...intercityPromotions, ...sharedPromotions, ...globalPromotions],
    [intercityPromotions, sharedPromotions, globalPromotions]
  );

  // If no routes from backend, do NOT display mock fallback data
  if ((!routes || routes.length === 0) && (!sharedRoutes || sharedRoutes.length === 0)) {
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
  const displayItems = routes.slice(0, limit);

  return (
    <section className={`w-full py-8 ${className}`}>
      <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <HomeSectionHeader
          title={title}
          subtitle={subtitle}
          viewAllLink={resolvedViewAllLink}
          viewAllText={viewAllText}
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
          {displayItems.map((route) => {
            const trans = route.translations?.find((t) => t.locale === language) || route.translations?.[0];
            const routeName = trans?.name || `${route.originCity} ⇌ ${route.destinationCity}`;
            const rawImg = route.thumbnailUrl || "";
            const imgUrl = rawImg
              ? rawImg.startsWith("http")
                ? rawImg
                : `${backendUrl}${rawImg}`
              : "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80";

            // Lowest price comes from price_lists — the same source the detail page prices from.
            const listedPrice = lowestPriceForRoute(prices, route.id!);
            let price = 0;

            // Check if there is a shared route matched
            const matchedShared = sharedRoutes.find(
              (s) => s.linkedIntercityRouteId === route.id || s.id === route.linkedSharedRouteId
            );
            const sharedPrice = matchedShared?.directions?.[0]?.price;
            price = sharedPrice && sharedPrice > 0 ? sharedPrice : listedPrice ?? 0;

            const discounts = buildDiscountTags(
              allPromotions.filter(
                (p) =>
                  isPromotionApplicable(p, "INTERCITY_ROUTE", route.id) ||
                  (matchedShared ? isPromotionApplicable(p, "SHARED_ROUTE", matchedShared.id!) : false)
              ),
              price,
              t.tours.savePercentTag || "TIẾT KIỆM {percent}%"
            );

            const distText = route.distanceKm
              ? t.homePage.intercityDistance
                  .replace("{distance}", String(route.distanceKm))
                  .replace("{hours}", String(route.estimatedHours || 3))
              : t.homePage.intercityDoorstep;

            return (
              <div
                key={route.id}
                className="w-[260px] sm:w-[280px] md:w-[300px] shrink-0 snap-start flex flex-col"
              >
                <HomeActivityCard
                  id={route.id}
                  imageUrl={imgUrl}
                  category={t.homePage.intercityCategory}
                  location={distText}
                  title={routeName}
                  price={price}
                  originalPrice={discounts.originalPrice}
                  discountTags={discounts.tags}
                  comboTag={
                    matchedShared ? t.homePage.intercityComboShared : t.homePage.intercityComboPrivate
                  }
                  href={`/${language}/intercity?routeId=${route.id}`}
                  priceUnit={matchedShared ? t.homePage.perSeat : t.homePage.perTrip}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HomeIntercitySection;
