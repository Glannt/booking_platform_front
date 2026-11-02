"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ImageOff, Sparkles } from "lucide-react";
import { SectionDto, SectionTranslationDto } from "@/lib/api/sections";
import { FormattedDescription } from "@/components/FormattedDescription";
import { SvgIconRenderer } from "@/components/common/SvgIconRenderer";

interface HeroBadge {
  text: string;
  textColor?: string;
  bgColor?: string;
  iconUrl?: string;
  icon?: string;
}

interface HeroBannerProps {
  sections: SectionDto[];
  locale: string;
  children?: React.ReactNode;
  className?: string;
  layout?: "split" | "stacked";
}

export function HeroBanner({
  sections,
  locale,
  children,
  className = "",
  layout = "split",
}: HeroBannerProps) {
  const heroSections = sections.filter((s) => s.sectionType === "HERO_BANNER");

  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [currentImage, setCurrentImage] = useState(0);

  const safeCurrent =
    heroSections.length > 0
      ? ((current % heroSections.length) + heroSections.length) % heroSections.length
      : 0;
  const section = heroSections[safeCurrent];

  const getTranslation = (s?: SectionDto): SectionTranslationDto | undefined => {
    if (!s) return undefined;
    return s.translations.find((t) => t.locale === locale) || s.translations[0];
  };

  const next = useCallback(() => {
    if (heroSections.length === 0) return;
    setCurrent((prev) => (prev + 1) % heroSections.length);
  }, [heroSections.length]);

  const prev = useCallback(() => {
    if (heroSections.length === 0) return;
    setCurrent((prev) => (prev - 1 + heroSections.length) % heroSections.length);
  }, [heroSections.length]);

  useEffect(() => {
    if (heroSections.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, heroSections.length]);

  const images = (section?.imageUrls || []).filter(
    (url) => url && !(imgErrors as Record<string, boolean>)[url]
  );
  const isCarousel = images.length > 1;
  const hasImages = images.length > 0;

  useEffect(() => {
    setCurrentImage(0);
  }, [safeCurrent]);

  useEffect(() => {
    if (!isCarousel) return;
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isCarousel, images.length]);

  const handleImgError = (url: string) => {
    setImgErrors((prev) => ({ ...prev, [url]: true }));
  };

  const getBadgeText = (textVal: any) => {
    if (!textVal) return "";
    if (typeof textVal === "string") return textVal;
    if (typeof textVal === "object") {
      return textVal[locale] || textVal["vi"] || textVal["en"] || Object.values(textVal)[0] || "";
    }
    return String(textVal);
  };

  // ponytail: badge icon is stored either as raw SVG (`icon`) or an image URL
  // (`iconUrl`). Legacy DB values like "Car"/"CheckCircle" are icon names, not
  // renderable assets — bypass them and show no icon rather than a fake one.
  const renderBadgeIcon = (badge: HeroBadge) => {
    const svg = typeof badge.icon === "string" && badge.icon.trim().toLowerCase().includes("<svg");
    if (svg) {
      return <SvgIconRenderer svgString={badge.icon} className="w-3.5 h-3.5" />;
    }
    if (badge.iconUrl) {
      return <img src={badge.iconUrl} alt="" className="w-3.5 h-3.5 object-contain" />;
    }
    return null;
  };

  if (heroSections.length === 0) {
    if (!children) return null;
    return (
      <section
        className={`relative w-full overflow-visible min-h-[380px] md:min-h-[420px] flex items-center bg-[#1a1a2e] text-white ${className}`}
      >
        <div
          className={`relative z-10 w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 ${
            layout === "stacked" ? "pt-12 md:pt-16 pb-0" : "py-16 md:py-24"
          }`}
        >
          {layout === "stacked" ? (
            <div className="flex flex-col items-center justify-center text-center gap-6 w-full">
              <div className="w-full relative z-30 max-w-5xl mx-auto -mb-20 sm:-mb-24 px-2 sm:px-4">
                {children}
              </div>
            </div>
          ) : (
            <div className="flex justify-end w-full">
              <div className="w-full max-w-xl shrink-0">{children}</div>
            </div>
          )}
        </div>
      </section>
    );
  }

  const trans = getTranslation(section);

  let badges: HeroBadge[] = [];
  try {
    const data = section.contentData ? JSON.parse(section.contentData) : null;
    if (data?.badges) badges = data.badges as HeroBadge[];
  } catch {}

  const hasControls = isCarousel || heroSections.length > 1;

  const maxDots = 5;
  const sectionDotIndices = (() => {
    if (heroSections.length <= maxDots) return heroSections.map((_, i) => i);
    const half = Math.floor(maxDots / 2);
    let start = current - half;
    if (start < 0) start = 0;
    if (start + maxDots > heroSections.length) start = heroSections.length - maxDots;
    return Array.from({ length: maxDots }, (_, i) => start + i);
  })();

  return (
    <section
      className={`relative w-full overflow-visible min-h-[380px] md:min-h-[420px] flex items-center ${className}`}
      style={{
        backgroundColor: section.bgColor || "#1a1a2e",
        color: section.textColor || "#ffffff",
      }}
    >
      {/* Background image carousel */}
      {hasImages && (
        <div className="absolute inset-0 overflow-hidden">
          {images.map((url, idx) => (
            <div
              key={url}
              className="absolute inset-0 transition-opacity duration-1000"
              style={{ opacity: idx === currentImage ? 1 : 0 }}
            >
              <img
                src={url}
                alt={trans?.title || section.sectionName}
                className="w-full h-full object-cover"
                onError={() => handleImgError(url)}
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-black/65 dark:bg-black/75 backdrop-blur-[1px]" />
        </div>
      )}

      {/* Fallback when no images */}
      {!hasImages && (
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <ImageOff size={120} />
        </div>
      )}

      {/* Content */}
      <div
        className={`relative z-10 w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 ${
          layout === "stacked" ? "pt-12 md:pt-16 pb-0" : "py-16 md:py-24"
        } ${hasControls ? "pb-20 md:pb-24" : ""}`}
      >
        {children ? (
          layout === "stacked" ? (
            <div className="flex flex-col items-center justify-center text-center gap-6 w-full">
              <div className="max-w-3xl space-y-4">
                {badges.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {badges.map((badge, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border border-white/20"
                        style={{
                          backgroundColor: badge.bgColor || "rgba(255,255,255,0.1)",
                          color: badge.textColor || "inherit",
                        }}
                      >
                        {renderBadgeIcon(badge)}
                        <span className="text-[10px] font-extrabold uppercase tracking-wider">
                          {getBadgeText(badge.text)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {badges.length === 0 && trans?.subtitle && (
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    <Sparkles size={14} className="text-accent" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/90">
                      {trans.subtitle}
                    </span>
                  </div>
                )}
                {trans?.title && (
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-md">
                    {trans.title}
                  </h1>
                )}
                {trans?.description && (
                  <FormattedDescription
                    description={trans.description}
                    className="text-sm md:text-base text-white/80 font-semibold max-w-2xl mx-auto drop-shadow-sm"
                  />
                )}
              </div>
              <div className="w-full relative z-30 max-w-5xl mx-auto -mb-20 sm:-mb-24 px-2 sm:px-4">
                {children}
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="max-w-xl text-center lg:text-left space-y-6 shrink-0">
                {badges.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                    {badges.map((badge, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border border-white/20"
                        style={{
                          backgroundColor: badge.bgColor || "rgba(255,255,255,0.1)",
                          color: badge.textColor || "inherit",
                        }}
                      >
                        {renderBadgeIcon(badge)}
                        <span className="text-[10px] font-extrabold uppercase tracking-wider">
                          {getBadgeText(badge.text)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {badges.length === 0 && trans?.subtitle && (
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    <Sparkles size={14} className="text-accent" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/90">
                      {trans.subtitle}
                    </span>
                  </div>
                )}
                {trans?.title && (
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                    {trans.title}
                  </h1>
                )}
                {trans?.description && (
                  <FormattedDescription
                    description={trans.description}
                    className="text-sm md:text-base text-white/80 font-medium"
                  />
                )}
                {!hasImages && !trans?.title && (
                  <p className="text-sm opacity-60 italic">
                    [Section: {section.sectionName} — Chưa có hình ảnh]
                  </p>
                )}
                {trans?.btnText && trans?.btnLink && (
                  <a
                    href={trans.btnLink}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-[#C9A227] text-white font-bold rounded-xl hover:bg-[#B8911F] transition-colors shadow-lg"
                  >
                    {trans.btnText}
                    <ChevronRight size={18} />
                  </a>
                )}
              </div>
              <div className="w-full max-w-xl shrink-0">
                {children}
              </div>
            </div>
          )
        ) : (
          <div className="max-w-4xl">
            {badges.map((badge, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border border-white/20 mb-4"
                style={{
                  backgroundColor: badge.bgColor || "rgba(255,255,255,0.1)",
                  color: badge.textColor || "inherit",
                }}
              >
                {renderBadgeIcon(badge)}
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  {getBadgeText(badge.text)}
                </span>
              </div>
            ))}
            {badges.length === 0 && trans?.subtitle && (
              <p className="text-sm md:text-base font-bold uppercase tracking-widest mb-3 opacity-80">
                {trans.subtitle}
              </p>
            )}
            {trans?.title && (
              <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
                {trans.title}
              </h1>
            )}
            {trans?.description && (
              <FormattedDescription
                description={trans.description}
                className="text-base md:text-lg opacity-90 max-w-xl mb-8 font-medium"
              />
            )}
            {!hasImages && !trans?.title && (
              <p className="text-sm opacity-60 italic">
                [Section: {section.sectionName} — Chưa có hình ảnh]
              </p>
            )}
            {trans?.btnText && trans?.btnLink && (
              <a
                href={trans.btnLink}
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#C9A227] text-white font-bold rounded-xl hover:bg-[#B8911F] transition-colors shadow-lg"
              >
                {trans.btnText}
                <ChevronRight size={18} />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Image dots (multi-image) */}
      {isCarousel && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImage(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentImage
                  ? "bg-white scale-110"
                  : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}

      {/* Section nav arrows + dots (multi-section) — cycle between hero sections */}
      {heroSections.length > 1 && (
        <div className={`absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 ${isCarousel ? "bottom-10" : "bottom-4"}`}>
          <button
            onClick={prev}
            className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors shrink-0"
          >
            <ChevronLeft size={14} className="text-white" />
          </button>
          <div className="flex items-center gap-1.5">
            {sectionDotIndices.map((idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === current
                    ? "bg-white scale-110"
                    : "bg-white/50"
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors shrink-0"
          >
            <ChevronRight size={14} className="text-white" />
          </button>
        </div>
      )}
    </section>
  );
}
