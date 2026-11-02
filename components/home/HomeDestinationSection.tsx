"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/context/LanguageContext";
import { useInView } from "@/hooks/useInView";
import { HomeSectionHeader } from "./HomeSectionHeader";
import type { DestinationItem } from "@/lib/api/section-templates";

export type { DestinationItem };

interface DestinationCardProps {
  dest: DestinationItem;
  index: number;
  href: string;
}

/**
 * Card điểm đến: trượt vào từ trái khi scroll tới (reveal một lần),
 * stagger `index * 140ms` — keyframes `reveal-left` trong globals.css.
 */
function DestinationCard({ dest, index, href }: DestinationCardProps) {
  const [ref, inView] = useInView<HTMLAnchorElement>();

  return (
    <Link
      ref={ref}
      href={href}
      style={{ animationDelay: `${index * 140}ms` }}
      className={`group relative flex-shrink-0 w-44 sm:w-52 md:w-56 h-64 sm:h-72 rounded-2xl md:rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 snap-start reveal-left ${
        inView ? "is-visible" : ""
      }`}
    >
      {/* Background Image */}
      <img
        src={dest.imageUrl}
        alt={dest.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLElement).style.display = "none";
        }}
      />

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent group-hover:from-black/90 transition-colors" />

      {/* Text content inside bottom */}
      <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 space-y-1 text-white">
        <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug drop-shadow-sm group-hover:text-accent transition-colors">
          {dest.name}
        </h3>
        {dest.activityCountText && (
          <p className="text-[11px] sm:text-xs font-semibold text-white/75 drop-shadow-xs">
            {dest.activityCountText}
          </p>
        )}
      </div>
    </Link>
  );
}

interface HomeDestinationSectionProps {
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
  destinations?: DestinationItem[];
  className?: string;
}

export function HomeDestinationSection({
  title = "Bạn muốn đi đâu chơi?",
  subtitle = "Khám phá các điểm đến du lịch tuyệt vời gần Nha Trang và Nam Trung Bộ",
  viewAllLink = "/tours",
  viewAllText = "Xem thêm",
  destinations = [],
  className = "",
}: HomeDestinationSectionProps) {
  const { language } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Filter only active destinations. If no active destinations, do not render mock data
  const activeDestinations = (destinations || []).filter((d) => d.active !== false);
  if (activeDestinations.length === 0) {
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
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const prefixUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const segments = url.split("/");
    if (segments.length > 1 && ["vi", "en", "ko", "ru"].includes(segments[1])) return url;
    return `/${language}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const resolvedViewAllLink = prefixUrl(viewAllLink);

  return (
    <section className={`w-full py-6 ${className}`}>
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

        {/* Horizontal Carousel */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth"
        >
          {activeDestinations.map((dest, index) => (
            <DestinationCard
              key={dest.id}
              dest={dest}
              index={index}
              href={prefixUrl(dest.href)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default HomeDestinationSection;
