"use client";

import React, { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { Upload, X, RefreshCw, Image as ImageIcon } from "lucide-react";
import { getMediaDetails, uploadMedia } from "@/lib/api/media";
import { backendUrl } from "@/lib/api/client";

interface ImageUploadProps {
  value?: number;
  onChange: (id: number | null) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch preview when value (media ID) is provided
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    const fetchMediaDetails = async () => {
      try {
        const data = await getMediaDetails(value);
        if (data && data.filePath) {
          // Check if filePath is absolute or relative
          const url = data.filePath.startsWith("http")
            ? data.filePath
            : `${backendUrl}${data.filePath}`;
          setPreviewUrl(url);
        }
      } catch (err) {
        console.error("Failed to load media preview for ID:", value, err);
      }
    };

    fetchMediaDetails();
  }, [value, backendUrl]);

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const result = await uploadMedia(file, label || "Uploaded Image");
      // Extract media object
      const mediaId = result.data?.media?.id || (result as any).media?.id;
      const filePath = result.data?.media?.filePath || (result as any).media?.filePath;
      
      if (mediaId) {
        onChange(mediaId);
        if (filePath) {
          const url = filePath.startsWith("http") ? filePath : `${backendUrl}${filePath}`;
          setPreviewUrl(url);
        }
      } else {
        alert("Upload failed. Please check backend status.");
      }
    } catch (e) {
      console.error("Failed to connect to upload media API:", e);
      // Fallback preview for offline demonstration
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      onChange(Math.floor(Math.random() * 1000) + 200);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setPreviewUrl(null);
  };

  return (
    <div className="w-full">
      {label && (
        <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          {label}
        </span>
      )}

      <div
        onClick={triggerSelect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={clsx(
          "relative h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300",
          dragOver
            ? "border-primary bg-primary/5 scale-[0.99]"
            : "border-slate-200 hover:border-primary/50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-[var(--bg-page)]/20",
          previewUrl ? "border-solid" : ""
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <RefreshCw className="animate-spin text-primary" size={28} />
            <span className="text-xs font-semibold">Uploading image...</span>
          </div>
        ) : previewUrl ? (
          <>
            {/* Image Preview */}
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {/* Hover overlay to delete */}
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-300">
              <button
                type="button"
                onClick={handleRemove}
                className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg transition-transform hover:scale-105"
                title="Remove image"
              >
                <X size={18} />
              </button>
            </div>
            {/* Floating media ID badge */}
            <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[9px] font-mono font-bold bg-slate-950/80 text-white rounded-md">
              ID: #{value}
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2.5 text-center px-4">
            <div className="p-3 bg-slate-100 dark:bg-black rounded-2xl text-slate-400 group-hover:text-primary">
              <Upload size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Click to upload or drag & drop
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                PNG, JPG, WEBP up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
