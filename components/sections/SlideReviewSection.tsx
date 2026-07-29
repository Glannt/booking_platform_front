"use client";

import React, { useRef, useEffect, useState } from "react";
import { SectionDto } from "@/lib/api/sections";
import { Star } from "lucide-react";
import { Separator } from "@heroui/react";

interface ReviewItem {
  title?: Record<string, string>;
  description?: Record<string, string>;
  rating?: number;
  author?: string;
  avatarText?: string;
  avatarBg?: string;
  route?: string;
}

interface SlideReviewData {
  ratingSummary?: string;
  reviews?: ReviewItem[];
}

function getLocalized(val?: Record<string, string>, locale?: string): string {
  if (!val) return "";
  return val[locale || ""] || val["vi"] || val["en"] || Object.values(val)[0] || "";
}

export function SlideReviewSection({ section, locale }: { section: SectionDto; locale: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pairs, setPairs] = useState<{ first: ReviewItem; second: ReviewItem }[]>([]);

  const trans =
    section.translations.find((t) => t.locale === locale) ||
    section.translations[0];

  let data: SlideReviewData = { reviews: [] };
  try {
    if (section.contentData) {
      data = JSON.parse(section.contentData);
    }
  } catch {}

  const reviews = data.reviews || [];

  useEffect(() => {
    const result: { first: ReviewItem; second: ReviewItem }[] = [];
    for (let i = 0; i < reviews.length; i += 2) {
      result.push({ first: reviews[i], second: reviews[i + 1] || reviews[0] });
    }
    setPairs(result);
  }, [section.contentData]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const interval = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const slide = el.querySelector<HTMLElement>("[data-review-slide]");
      if (!slide) return;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: slide.clientWidth, behavior: "smooth" });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [pairs]);

  if (pairs.length === 0) return null;

  return (
    <section className="w-full py-20 bg-slate-50/50 dark:bg-black/10 border-y border-slate-100 dark:border-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          {trans?.title && (
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">{trans.title}</h2>
          )}
          {trans?.subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{trans.subtitle}</p>
          )}
          {data.ratingSummary && (
            <div className="flex items-center justify-center gap-1 text-amber-500 pt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-2">{data.ratingSummary}</span>
            </div>
          )}
        </div>

        <div ref={scrollRef} className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-6 pb-4 w-full">
          {pairs.map((pair, index) => (
            <div
              key={index}
              data-review-slide
              className="review-pair-slide min-w-full w-full snap-start flex flex-col md:flex-row items-stretch justify-between gap-8 md:gap-12 px-4 md:px-16 py-4"
            >
              <ReviewCard review={pair.first} locale={locale} />
              <div className="hidden md:flex items-center">
                <Separator orientation="vertical" className="h-28 w-[1px] bg-slate-200 dark:bg-[var(--bg-card)]" />
              </div>
              <div className="flex md:hidden w-full">
                <Separator orientation="horizontal" className="w-full h-[1px] bg-slate-200 dark:bg-[var(--bg-card)]" />
              </div>
              <ReviewCard review={pair.second} locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review, locale }: { review: ReviewItem; locale: string }) {
  const title = getLocalized(review.title, locale);
  const desc = getLocalized(review.description, locale);
  const rating = review.rating || 5;

  return (
    <div className="flex-1 flex flex-col justify-between gap-5 text-left">
      <div className="space-y-3">
        <div className="flex text-amber-500 gap-0.5">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} size={14} fill="currentColor" />
          ))}
        </div>
        <h4 className="font-extrabold text-base md:text-lg text-slate-800 dark:text-slate-200">{title}</h4>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">&ldquo;{desc}&rdquo;</p>
      </div>
      <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/40">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${review.avatarBg || "bg-slate-100 text-slate-600"}`}>
          {review.avatarText || "?"}
        </div>
        <div>
          <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">{review.author}</span>
          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500">{review.route}</span>
        </div>
      </div>
    </div>
  );
}
