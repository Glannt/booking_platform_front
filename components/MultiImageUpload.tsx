"use client";

import React, { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { Upload, X, RefreshCw, Star, Plus } from "lucide-react";
import { getMediaDetails, uploadMedia } from "@/lib/api/media";
import { backendUrl } from "@/lib/api/client";

interface ImageItem {
  id: number;
  url: string;
}

interface MultiImageUploadProps {
  imageIds?: number[];
  thumbnailId?: number | null;
  onImageIdsChange: (ids: number[]) => void;
  onThumbnailChange: (id: number | null) => void;
  label?: string;
}

export default function MultiImageUpload({
  imageIds,
  thumbnailId,
  onImageIdsChange,
  onThumbnailChange,
  label,
}: MultiImageUploadProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolve image IDs to URLs on mount / when imageIds changes
  useEffect(() => {
    if (!imageIds || imageIds.length === 0) {
      setImages([]);
      return;
    }
    const ids = imageIds;

    // Only refetch if IDs changed
    const currentIds = images.map((i) => i.id).join(",");
    const newIds = ids.join(",");
    if (currentIds === newIds) return;

    let cancelled = false;
    (async () => {
      const resolved = await Promise.all(
        ids.map(async (id) => {
          try {
            const media = await getMediaDetails(id);
            const url = media.filePath.startsWith("http")
              ? media.filePath
              : `${backendUrl}${media.filePath}`;
            return { id, url };
          } catch {
            return null;
          }
        })
      );
      if (!cancelled) {
        setImages(resolved.filter(Boolean) as ImageItem[]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [imageIds]);

  const syncIds = (items: ImageItem[]) => {
    onImageIdsChange(items.map((i) => i.id));
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const result = await uploadMedia(file, label || "Gallery image");
      const mediaId = result.data?.media?.id || (result as any).media?.id;
      const filePath = result.data?.media?.filePath || (result as any).media?.filePath;

      if (mediaId && filePath) {
        const url = filePath.startsWith("http") ? filePath : `${backendUrl}${filePath}`;
        const next = [...images, { id: mediaId, url }];
        setImages(next);
        syncIds(next);
        // Auto-select as thumbnail if first image
        if (next.length === 1) {
          onThumbnailChange(mediaId);
        }
      }
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((f) => {
      if (f.type.startsWith("image/")) handleUpload(f);
    });
  };

  const handleRemove = (id: number) => {
    const next = images.filter((i) => i.id !== id);
    setImages(next);
    syncIds(next);
    if (thumbnailId === id) {
      onThumbnailChange(next.length > 0 ? next[0].id : null);
    }
  };

  const handleSetThumbnail = (id: number) => {
    onThumbnailChange(id);
  };

  return (
    <div className="w-full">
      {label && (
        <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          {label}
        </span>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {images.map((img) => (
          <div
            key={img.id}
            className={clsx(
              "relative group rounded-xl overflow-hidden aspect-square border-2 transition-all",
              thumbnailId === img.id
                ? "border-primary ring-2 ring-primary/30"
                : "border-transparent hover:border-default-300"
            )}
          >
            <img
              src={img.url}
              alt=""
              className="w-full h-full object-cover"
            />
            {/* Overlay controls */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleSetThumbnail(img.id)}
                className={clsx(
                  "p-1.5 rounded-full shadow-lg transition-transform hover:scale-110",
                  thumbnailId === img.id
                    ? "bg-primary text-white"
                    : "bg-white/90 text-slate-600 hover:text-primary"
                )}
                title="Đặt làm ảnh chính"
              >
                <Star size={14} fill={thumbnailId === img.id ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                title="Xóa ảnh"
              >
                <X size={14} />
              </button>
            </div>
            {/* Thumbnail badge */}
            {thumbnailId === img.id && (
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-primary text-white rounded-md">
                Ảnh chính
              </span>
            )}
          </div>
        ))}

        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className={clsx(
            "aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900/30"
          )}
        >
          {loading ? (
            <RefreshCw className="animate-spin text-primary" size={20} />
          ) : (
            <>
              <Plus className="text-slate-400" size={20} />
              <span className="text-[10px] text-slate-400 font-medium">Thêm ảnh</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}
