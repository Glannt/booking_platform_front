"use client";

import React, { useState } from "react";
import { Images, Maximize2 } from "lucide-react";
import { ImageGalleryModal } from "./ImageGalleryModal";

export interface GalleryImage {
  id: number;
  url: string;
  alt?: string;
}

interface ImageGalleryGridProps {
  images: GalleryImage[];
  thumbnailId?: number | null;
  className?: string;
  galleryLabel?: string;
  noPhotosLabel?: string;
  modalTitleLabel?: string;
}

/**
 * Klook-style Image Gallery Grid:
 * - 1 large featured image on the left (~60% width)
 * - 4-thumbnail 2x2 grid on the right
 * - Floating "View Gallery / Thư viện ảnh" action button in bottom right
 * - Click any image to open full-screen Lightbox at that index
 * - Fully responsive with touch-friendly mobile layout
 */
export function ImageGalleryGrid({
  images,
  thumbnailId,
  className = "",
  galleryLabel = "Thư viện ảnh",
  noPhotosLabel = "Không có ảnh",
  modalTitleLabel,
}: ImageGalleryGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div
        className={`bg-slate-100 dark:bg-[var(--bg-card)] rounded-2xl md:rounded-3xl flex items-center justify-center text-slate-400 min-h-[260px] md:min-h-[380px] ${className}`}
      >
        <div className="flex flex-col items-center gap-2">
          <Images size={32} className="opacity-40" />
          <span className="text-xs font-semibold">{noPhotosLabel}</span>
        </div>
      </div>
    );
  }

  // Sort thumbnail first if specified
  const sortedImages = [...images].sort((a, b) => {
    if (thumbnailId && a.id === thumbnailId) return -1;
    if (thumbnailId && b.id === thumbnailId) return 1;
    return 0;
  });

  const mainImage = sortedImages[0];
  const rightImages = sortedImages.slice(1, 5);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className={`relative rounded-2xl md:rounded-3xl overflow-hidden select-none ${className}`}>
        {/* Desktop / Tablet Grid (md+) */}
        <div className="hidden md:grid md:grid-cols-12 gap-2 h-[380px] lg:h-[440px]">
          {/* Main Large Image (Left - 7 cols) */}
          <div
            onClick={() => openLightbox(0)}
            className={`relative overflow-hidden cursor-pointer group bg-slate-100 dark:bg-[var(--bg-card)] ${
              rightImages.length > 0 ? "md:col-span-7" : "md:col-span-12"
            }`}
          >
            <img
              src={mainImage.url}
              alt={mainImage.alt || ""}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="eager"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 backdrop-blur-xs">
                <Maximize2 size={18} />
              </div>
            </div>
          </div>

          {/* Right 2x2 Grid (5 cols) */}
          {rightImages.length > 0 && (
            <div className="md:col-span-5 grid grid-cols-2 grid-rows-2 gap-2 h-full">
              {rightImages.map((img, idx) => {
                const globalIndex = idx + 1;
                const isLastVisible = idx === rightImages.length - 1;

                return (
                  <div
                    key={img.id || idx}
                    onClick={() => openLightbox(globalIndex)}
                    className="relative overflow-hidden cursor-pointer group bg-slate-100 dark:bg-[var(--bg-card)]"
                  >
                    <img
                      src={img.url}
                      alt={img.alt || ""}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 backdrop-blur-xs">
                        <Maximize2 size={14} />
                      </div>
                    </div>

                    {/* If there are more than 5 total images and this is the 4th thumbnail, show count hint on hover */}
                    {isLastVisible && sortedImages.length > 5 && (
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors flex items-center justify-center pointer-events-none">
                        <span className="text-white font-extrabold text-sm md:text-base tracking-wide drop-shadow-sm">
                          +{sortedImages.length - 5}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pad empty slots if between 2 and 4 images */}
              {rightImages.length < 4 &&
                Array.from({ length: 4 - rightImages.length }).map((_, padIdx) => (
                  <div
                    key={`pad-${padIdx}`}
                    className="bg-slate-100 dark:bg-[var(--bg-card)]/50 flex items-center justify-center"
                  >
                    <Images size={20} className="text-slate-300 dark:text-slate-600" />
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Mobile Layout (< md) */}
        <div className="block md:hidden space-y-1.5">
          {/* Main Mobile Image */}
          <div
            onClick={() => openLightbox(0)}
            className="relative w-full h-[260px] sm:h-[320px] overflow-hidden rounded-2xl cursor-pointer group bg-slate-100 dark:bg-[var(--bg-card)]"
          >
            <img
              src={mainImage.url}
              alt={mainImage.alt || ""}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Mobile Thumbnail Strip */}
          {rightImages.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5 h-16 sm:h-20">
              {rightImages.map((img, idx) => {
                const globalIndex = idx + 1;
                const isLast = idx === rightImages.length - 1 && sortedImages.length > 5;
                return (
                  <div
                    key={img.id || idx}
                    onClick={() => openLightbox(globalIndex)}
                    className="relative rounded-xl overflow-hidden cursor-pointer bg-slate-100 dark:bg-[var(--bg-card)]"
                  >
                    <img
                      src={img.url}
                      alt={img.alt || ""}
                      className="w-full h-full object-cover"
                    />
                    {isLast && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-xs font-black">
                          +{sortedImages.length - 5}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating "View Gallery" Button (Bottom Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openLightbox(0);
          }}
          className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-10 bg-white/95 hover:bg-white dark:bg-[var(--bg-surface)]/95 dark:hover:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Images size={14} className="text-accent" />
          <span>{galleryLabel}</span>
          {sortedImages.length > 1 && (
            <span className="text-[10px] font-semibold text-slate-400 ml-0.5">
              ({sortedImages.length})
            </span>
          )}
        </button>
      </div>

      {/* Klook-style Image Gallery Modal */}
      {lightboxOpen && (
        <ImageGalleryModal
          isOpen={lightboxOpen}
          images={sortedImages}
          initialIndex={lightboxIndex}
          titleLabel={modalTitleLabel}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
