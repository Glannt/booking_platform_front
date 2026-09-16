"use client";

import React from "react";
import { MapPin, Tag } from "lucide-react";
import type { PoiComponentData } from "@/types/routeComponents";

interface PoiComponentProps {
  data: PoiComponentData;
  className?: string;
}

export function PoiComponent({ data, className = "" }: PoiComponentProps) {
  if (!data) return null;

  const items = data.items || [];
  if (items.length === 0) return null;

  return (
    <div className={`p-5 rounded-2xl border bg-white dark:bg-[var(--bg-card)] border-slate-200 dark:border-slate-800 space-y-4 ${className}`}>
      {data.title && (
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <MapPin size={18} className="text-accent shrink-0" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-wide">
            {data.title}
          </h3>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-[var(--bg-surface)] border border-slate-100 dark:border-slate-800"
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-32 object-cover rounded-lg"
                loading="lazy"
              />
            )}
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin size={13} className="text-accent shrink-0" />
                <span>{item.name}</span>
              </h4>
              {item.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1">
                  {item.description}
                </p>
              )}
            </div>
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-auto pt-1.5">
                {item.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent dark:bg-accent/20"
                  >
                    <Tag size={9} />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
