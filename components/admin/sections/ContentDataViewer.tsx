"use client";

import React, { useMemo } from "react";
import { Label } from "@heroui/react";
import { Star, Image, Tag, MessageSquare, Sparkles } from "lucide-react";

interface ContentDataViewerProps {
  contentData: string;
  sectionType: string;
}

function getLocalized(val: unknown, locale: string = "vi"): string {
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null && !Array.isArray(val)) {
    const obj = val as Record<string, string>;
    return obj[locale] || obj["vi"] || obj["en"] || Object.values(obj)[0] || "";
  }
  return String(val || "");
}

function KeyValuePairView({ k, v }: { k: string; v: unknown }) {
  if (typeof v === "string") {
    return (
      <div className="flex items-start gap-2 py-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[80px] shrink-0 pt-0.5">{k}</span>
        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium break-words">{v}</span>
      </div>
    );
  }
  if (typeof v === "boolean") {
    return (
      <div className="flex items-start gap-2 py-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[80px] shrink-0 pt-0.5">{k}</span>
        <span className={`text-xs font-bold ${v ? "text-green-600" : "text-red-500"}`}>{v ? "Có" : "Không"}</span>
      </div>
    );
  }
  if (Array.isArray(v)) {
    return null; // handled by parent
  }
  if (typeof v === "object" && v !== null) {
    const entries = Object.entries(v as Record<string, unknown>);
    return (
      <div className="py-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{k}</span>
        <div className="pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-0.5">
          {entries.map(([subKey, subVal]) => (
            <KeyValuePairView key={subKey} k={subKey} v={subVal} />
          ))}
        </div>
      </div>
    );
  }
  return null;
}

function SlideCardViewer({ data }: { data: Record<string, unknown> }) {
  const cards = Array.isArray(data.cards) ? (data.cards as Array<Record<string, unknown>>) : [];
  const badgeTitle = data.badgeTitle;

  return (
    <div className="space-y-3">
      {badgeTitle != null && (
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-accent" />
          <span className="text-xs font-bold text-accent">{getLocalized(badgeTitle)}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2">
        {cards.map((card, idx) => (
          <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            {typeof card.imageUrl === "string" && card.imageUrl && (
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{getLocalized(card.title)}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{getLocalized(card.description)}</p>
              <div className="flex items-center gap-2">
                {card.badge != null && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                    <Tag size={8} />
                    {getLocalized(card.badge)}
                  </span>
                )}
                {card.price != null && (
                  <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">{getLocalized(card.price)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideReviewViewer({ data }: { data: Record<string, unknown> }) {
  const reviews = Array.isArray(data.reviews) ? (data.reviews as Array<Record<string, unknown>>) : [];
  const summary = data.ratingSummary;

  return (
    <div className="space-y-3">
      {summary != null && (
        <div className="flex items-center gap-1.5">
          <div className="flex text-amber-500 gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={10} fill="currentColor" />
            ))}
          </div>
          <span className="text-[10px] font-bold text-slate-500">{String(summary)}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2">
        {reviews.map((review, idx) => (
          <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex text-amber-500 gap-0.5">
                {Array.from({ length: typeof review.rating === "number" ? review.rating : 5 }).map((_, i) => (
                  <Star key={i} size={8} fill="currentColor" />
                ))}
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{String(review.author || "")}</span>
              {typeof review.route === "string" && review.route && (
                <span className="text-[9px] text-slate-400">{review.route}</span>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-800 dark:text-white">{getLocalized(review.title)}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">&ldquo;{getLocalized(review.description)}&rdquo;</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InspirationViewer({ data }: { data: Record<string, unknown> }) {
  const items = Array.isArray(data.items) ? (data.items as Array<Record<string, unknown>>) : [];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            {typeof item.imageUrl === "string" && item.imageUrl && (
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-800 dark:text-white truncate">{getLocalized(item.label)}</p>
              {typeof item.linkUrl === "string" && item.linkUrl && (
                <p className="text-[9px] text-blue-500 font-mono truncate">{item.linkUrl}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {data.showInstagram === true && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/5 border border-accent/20">
          <span className="text-[10px] font-bold text-accent">Instagram: {String(data.instagramHandle || "@minhkhoatravel_vn")}</span>
        </div>
      )}
    </div>
  );
}

function GenericViewer({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  return (
    <div className="space-y-0.5">
      {entries.map(([key, val]) => (
        <KeyValuePairView key={key} k={key} v={val} />
      ))}
    </div>
  );
}

export function ContentDataViewer({ contentData, sectionType }: ContentDataViewerProps) {
  const data = useMemo(() => {
    if (!contentData) return null;
    try {
      const parsed = JSON.parse(contentData);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch { }
    return null;
  }, [contentData]);

  if (!data) {
    return (
      <pre className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs font-mono overflow-x-auto max-h-40 text-slate-500">
        {contentData || "—"}
      </pre>
    );
  }

  switch (sectionType) {
    case "SLIDE_CARD":
      return <SlideCardViewer data={data} />;
    case "SLIDE_REVIEW":
      return <SlideReviewViewer data={data} />;
    case "INSPIRATION":
      return <InspirationViewer data={data} />;
    default:
      return <GenericViewer data={data} />;
  }
}
