"use client";

import React, { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface LightboxProps {
  images: { id: number; url: string; alt?: string }[];
  initialIndex?: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex = 0, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);

  const prev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
    setScale(1);
  }, [images.length]);

  const next = useCallback(() => {
    setIndex((i) => (i < images.length - 1 ? i + 1 : 0));
    setScale(1);
  }, [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, prev, next]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!images.length) return null;

  const current = images[index];

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full z-10 transition-colors"
      >
        <X size={24} />
      </button>

      {/* Counter */}
      <span className="absolute top-4 left-4 text-white/70 text-sm font-medium z-10">
        {index + 1} / {images.length}
      </span>

      {/* Zoom controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setScale((s) => Math.max(0.5, s - 0.5));
          }}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
        >
          <ZoomOut size={18} />
        </button>
        <span className="self-center text-white/70 text-xs font-mono">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setScale((s) => Math.min(4, s + 0.5));
          }}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
        >
          <ZoomIn size={18} />
        </button>
      </div>

      {/* Nav arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full z-10 transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full z-10 transition-colors"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Image */}
      <div
        className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.url}
          alt={current.alt || ""}
          className="max-w-full max-h-[85vh] object-contain transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
        />
      </div>

      {/* Thumbnails strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
                setScale(1);
              }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                i === index
                  ? "border-white scale-110"
                  : "border-white/30 opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
