"use client";

import React, { useRef, useState, useMemo } from "react";
import { useI18n } from "@/context/LanguageContext";
import { HomeSectionHeader } from "./HomeSectionHeader";
import { HomeActivityCard } from "./HomeActivityCard";
import type { SelfDriveVehicleItem } from "@/components/self-drive/SelfDriveVehicleCard";
import { useActiveDiscounts } from "@/lib/queries/useDiscounts";
import { isPromotionApplicable, buildDiscountTags } from "@/lib/discount-tags";

interface HomeSelfDriveSectionProps {
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
  vehicles?: SelfDriveVehicleItem[];
  limit?: number;
  className?: string;
}

export function HomeSelfDriveSection({
  title = "Thuê xe tự lái Nha Trang",
  subtitle = "Xe đời mới 4 - 7 chỗ sạch sẽ, bảo hiểm đầy đủ, giao nhận xe tận nơi tại sân bay hoặc khách sạn",
  viewAllLink = "/self-drive",
  viewAllText = "Xem tất cả xe",
  vehicles = [],
  limit = 8,
  className = "",
}: HomeSelfDriveSectionProps) {
  const { t, language } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Active promotions per scope (one request each), matched to each vehicle below.
  const { data: selfDrivePromotions = [] } = useActiveDiscounts("SELF_DRIVE");
  const { data: globalPromotions = [] } = useActiveDiscounts("GLOBAL");
  const allPromotions = useMemo(
    () => [...selfDrivePromotions, ...globalPromotions],
    [selfDrivePromotions, globalPromotions]
  );

  // If no vehicles from backend, do NOT display mock fallback data
  if (!vehicles || vehicles.length === 0) {
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
  const displayItems = vehicles.slice(0, limit);

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
          {displayItems.map((veh) => {
            const name = language === "vi" ? veh.nameVi : veh.nameEn;
            const features = language === "vi" ? veh.featuresVi : veh.featuresEn || veh.featuresVi;
            const category = veh.capacity
              ? `${veh.capacity} ${t.selfDrive.seats}`
              : t.homePage.quickNavSelfDrive;
            const price = veh.pricePerDay || 700000;
            const slug = veh.categorySlug || "xe-tu-lai";

            const discounts = buildDiscountTags(
              allPromotions.filter((p) => isPromotionApplicable(p, "SELF_DRIVE", veh.rentalId)),
              price,
              t.tours.savePercentTag || "TIẾT KIỆM {percent}%"
            );

            return (
              <div
                key={veh.id}
                className="w-[260px] sm:w-[280px] md:w-[300px] shrink-0 snap-start flex flex-col"
              >
                <HomeActivityCard
                  id={veh.id}
                  imageUrl={veh.imgUrl || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80"}
                  category={category}
                  location="Nha Trang"
                  title={name}
                  badges={features}
                  price={price}
                  originalPrice={discounts.originalPrice}
                  discountTags={discounts.tags}
                  href={`/${language}/self-drive/${slug}?id=${veh.vehicleCategoryId}`}
                  priceUnit={t.homePage.perDay}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HomeSelfDriveSection;
