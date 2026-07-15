"use client";

import React, { useState } from "react";
import { Maximize2 } from "lucide-react";
import { Lightbox } from "./Lightbox";

interface ImageGalleryProps {
  images: { id: number; url: string; alt?: string }[];
  thumbnailId?: number | null;
  className?: string;
}

/**
 * Hotel-style image gallery: main image + thumbnail strip.
 * Click main image to open lightbox.
 */
export function ImageGallery({ images, thumbnailId, className }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={`bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 ${className || "h-64"}`}>
        <span className="text-sm">Không có ảnh</span>
      </div>
    );
  }

  // Sort: thumbnail first, then rest
  const sorted = [...images].sort((a, b) => {
    if (thumbnailId && a.id === thumbnailId) return -1;
    if (thumbnailId && b.id === thumbnailId) return 1;
    return 0;
  });

  const mainImage = sorted[0];
  const thumbImages = sorted.slice(1, 5); // show up to 4 thumbnails

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className={`relative rounded-xl overflow-hidden ${className || ""}`}>
        {/* Main image */}
        <div
          className="relative cursor-pointer group"
          onClick={() => openLightbox(0)}
        >
          <img
            src={mainImage.url}
            alt={mainImage.alt || ""}
            className="w-full h-64 sm:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
          </div>
        </div>

        {/* Thumbnail strip */}
        {thumbImages.length > 0 && (
          <div className="grid grid-cols-4 gap-1">
            {thumbImages.map((img, i) => (
              <div
                key={img.id}
                className="relative cursor-pointer group aspect-square"
                onClick={() => openLightbox(i + 1)}
              >
                <img
                  src={img.url}
                  alt={img.alt || ""}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                {/* Show "+N more" on last thumb if there are more images */}
                {i === thumbImages.length - 1 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      +{images.length - 5}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          images={sorted}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

/**
 * Simple inline image grid with lightbox (for cards, etc.)
 */
export function ImageGrid({
  images,
  thumbnailId,
  maxVisible = 3,
  className,
}: {
  images: { id: number; url: string; alt?: string }[];
  thumbnailId?: number | null;
  maxVisible?: number;
  className?: string;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const sorted = [...images].sort((a, b) => {
    if (thumbnailId && a.id === thumbnailId) return -1;
    if (thumbnailId && b.id === thumbnailId) return 1;
    return 0;
  });

  const visible = sorted.slice(0, maxVisible);
  const remaining = sorted.length - maxVisible;

  return (
    <>
      <div className={`flex gap-1 rounded-lg overflow-hidden ${className || ""}`}>
        {visible.map((img, i) => (
          <div
            key={img.id}
            className="relative flex-1 cursor-pointer group aspect-square"
            onClick={() => {
              setLightboxIndex(i);
              setLightboxOpen(true);
            }}
          >
            <img
              src={img.url}
              alt={img.alt || ""}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            {i === visible.length - 1 && remaining > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  +{remaining}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {lightboxOpen && (
        <Lightbox
          images={sorted}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
