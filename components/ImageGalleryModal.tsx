"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/context/LanguageContext";

export interface GalleryModalImage {
  id: number;
  url: string;
  alt?: string;
}

interface ImageGalleryModalProps {
  isOpen: boolean;
  images: GalleryModalImage[];
  initialIndex?: number;
  onClose: () => void;
  titleLabel?: string;
}

/**
 * ImageGalleryModal - Klook-style modal image viewer:
 * - Center top pill button: "Ảnh chính thức (N)"
 * - Top right close button (X)
 * - Large main image with clamped navigation (no looping when reaching start or end)
 * - Chevrons appear only when there is a previous or next image
 * - Bottom thumbnail strip with auto-scrolling to active thumbnail
 * - Keyboard navigation (Esc, ArrowLeft, ArrowRight)
 * - Reusable across the application
 */
export function ImageGalleryModal({
  isOpen,
  images,
  initialIndex = 0,
  onClose,
  titleLabel,
}: ImageGalleryModalProps) {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);

  // Sync initialIndex when modal opens
  useEffect(() => {
    if (isOpen) {
      const safeIndex = Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1));
      setCurrentIndex(safeIndex);
    }
  }, [isOpen, initialIndex, images.length]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Scroll active thumbnail into view smoothly
  useEffect(() => {
    if (isOpen && activeThumbRef.current && thumbnailsContainerRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentIndex, isOpen]);

  // Keyboard navigation: no looping past boundaries
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;
  const label = titleLabel || t.tours?.officialPhotos || "Ảnh chính thức";

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* 1. Header Bar: Center "Ảnh chính thức (N)" Pill + Top-Right Close Button */}
      <div
        className="w-full flex items-center justify-between relative z-10 shrink-0 h-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Placeholder left to balance flex layout */}
        <div className="w-10 h-10" />

        {/* Center Pill Button: "Ảnh chính thức (N)" */}
        <div className="bg-white dark:bg-[var(--bg-card)] text-slate-900 dark:text-white font-black text-sm px-4 sm:px-5 py-2 rounded-full shadow-lg border border-slate-200/40 dark:border-slate-700/50 flex items-center gap-1.5 pointer-events-none">
          <span>{label}</span>
          <span className="text-slate-500 dark:text-slate-400 font-semibold">
            ({images.length})
          </span>
        </div>

        {/* Top-Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={26} />
        </button>
      </div>

      {/* 2. Main Central Image Area */}
      <div
        className="flex-1 flex items-center justify-center my-2 sm:my-4 relative min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
          {/* Main Image Container */}
          <div className="relative max-h-[60vh] sm:max-h-[68vh] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-black/40 border border-white/10 flex items-center justify-center">
            <img
              src={currentImage.url}
              alt=""
              className="max-h-[60vh] sm:max-h-[68vh] w-auto max-w-full object-contain pointer-events-none"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />

            {/* Bottom-Right Counter Badge: e.g. "1 / 9" */}
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/60 text-white text-sm font-bold px-3 py-1 rounded-full backdrop-blur-xs shadow-md border border-white/10">
              {currentIndex + 1} / {images.length}
            </div>
          </div>

          {/* Previous Chevron Button (Visible ONLY when hasPrev = true) */}
          {hasPrev && (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              aria-label="Previous image"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center shadow-lg backdrop-blur-xs border border-white/20 transition-all cursor-pointer hover:scale-105 active:scale-95 z-20"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Next Chevron Button (Visible ONLY when hasNext = true) */}
          {hasNext && (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(images.length - 1, prev + 1))}
              aria-label="Next image"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center shadow-lg backdrop-blur-xs border border-white/20 transition-all cursor-pointer hover:scale-105 active:scale-95 z-20"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Bottom Thumbnail Strip */}
      <div
        className="w-full shrink-0 relative z-10 pt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={thumbnailsContainerRef}
          className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto py-2 px-2 sm:px-4 max-w-3xl mx-auto scrollbar-none justify-start sm:justify-center"
        >
          {images.map((img, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={img.id || idx}
                ref={isActive ? activeThumbRef : null}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 cursor-pointer transition-all duration-200 border ${
                  isActive
                    ? "ring-2 ring-white border-white scale-105 opacity-100 shadow-lg"
                    : "border-transparent opacity-50 hover:opacity-90 hover:scale-100"
                }`}
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
