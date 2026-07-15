"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { SectionDto, SectionTranslationDto } from "@/lib/api/sections";

interface HeroBannerProps {
  sections: SectionDto[];
  locale: string;
}

export function HeroBanner({ sections, locale }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const getTranslation = (s: SectionDto): SectionTranslationDto | undefined =>
    s.translations.find((t) => t.locale === locale) || s.translations[0];

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % sections.length);
  }, [sections.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + sections.length) % sections.length);
  }, [sections.length]);

  useEffect(() => {
    if (sections.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, sections.length]);

  if (sections.length === 0) return null;

  const section = sections[current];
  const trans = getTranslation(section);
  const images = (section.imageUrls || []).filter(
    (url) => url && !(imgErrors as Record<string, boolean>)[url]
  );
  const isCarousel = images.length > 1;
  const hasImages = images.length > 0;

  const [currentImage, setCurrentImage] = useState(0);

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

  return (
    <section
      className="relative w-full overflow-hidden rounded-3xl min-h-[320px] md:min-h-[420px]"
      style={{
        backgroundColor: section.bgColor || "#1a1a2e",
        color: section.textColor || "#ffffff",
      }}
    >
      {/* Background image carousel */}
      {hasImages && (
        <div className="absolute inset-0">
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
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Fallback when no images */}
      {!hasImages && (
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <ImageOff size={120} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 px-8 py-20 md:px-16 md:py-28 max-w-4xl">
        {trans?.subtitle && (
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
          <p className="text-base md:text-lg opacity-90 max-w-xl mb-8 leading-relaxed">
            {trans.description}
          </p>
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

      {/* Carousel nav arrows (multi-image) */}
      {isCarousel && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImage(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentImage
                    ? "bg-white scale-110"
                    : "bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Section carousel dots (multi-section) */}
      {sections.length > 1 && !isCarousel && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {sections.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === current
                  ? "bg-white scale-110"
                  : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
