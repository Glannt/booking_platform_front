"use client";

import React, { useRef } from "react";
import { SectionDto } from "@/lib/api/sections";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/context/LanguageContext";
import { Reveal } from "@/components/Reveal";

interface CardItem {
  title?: Record<string, string>;
  description?: Record<string, string>;
  badge?: Record<string, string>;
  price?: Record<string, string>;
  imageUrl?: string;
  linkUrl?: string;
}

interface SlideCardData {
  badgeTitle?: Record<string, string>;
  cards?: CardItem[];
}

function getLocalized(val?: Record<string, string>, locale?: string): string {
  if (!val) return "";
  return val[locale || ""] || val["vi"] || val["en"] || Object.values(val)[0] || "";
}

export function SlideCardSection({ section, locale }: { section: SectionDto; locale: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  const trans =
    section.translations.find((tr) => tr.locale === locale) ||
    section.translations[0];

  let data: SlideCardData = { cards: [] };
  try {
    if (section.contentData) {
      data = JSON.parse(section.contentData);
    }
  } catch {}

  const badgeTitle = getLocalized(data.badgeTitle, locale);
  const cards = data.cards || [];

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector<HTMLElement>("[data-card]");
    if (!card) return;
    const w = card.offsetWidth + 24;
    scrollRef.current.scrollBy({ left: dir === "left" ? -w : w, behavior: "smooth" });
  };

  if (cards.length === 0) return null;

  return (
    <section className="w-full py-8">
      <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-row items-end justify-between mb-10">
          <div className="space-y-2">
            {badgeTitle && (
              <Reveal
                as="span"
                variant="fade"
                className="inline-flex items-center gap-1 text-xs font-extrabold text-accent uppercase tracking-widest bg-accent/10 dark:bg-accent/20 px-3 py-1 rounded-full"
              >
                <Sparkles size={12} className="animate-pulse" />
                {badgeTitle}
              </Reveal>
            )}
            {trans?.title && (
              <Reveal as="h2" delay={100} className="text-2xl md:text-3xl font-black text-foreground">
                {trans.title}
              </Reveal>
            )}
            {trans?.subtitle && (
              <Reveal as="p" delay={200} className="text-sm text-foreground/70 font-medium">
                {trans.subtitle}
              </Reveal>
            )}
          </div>
          <Reveal variant="right" delay={300} className="flex items-center gap-2">
            <button onClick={() => scroll("left")} className="p-3 rounded-full border border-separator hover:bg-slate-50 dark:hover:bg-[var(--bg-surface)] text-foreground/80 cursor-pointer transition-all" aria-label="Previous">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => scroll("right")} className="p-3 rounded-full border border-separator hover:bg-slate-50 dark:hover:bg-[var(--bg-surface)] text-foreground/80 cursor-pointer transition-all" aria-label="Next">
              <ChevronRight size={20} />
            </button>
          </Reveal>
        </div>

        <div ref={scrollRef} className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-6 pb-4">
          {cards.map((card, idx) => (
            <Reveal
              key={idx}
              data-card
              delay={idx * 120}
              className="min-w-[85vw] sm:min-w-[45vw] lg:min-w-[calc(33.333%-16px)] snap-start bg-white dark:bg-[var(--bg-card)] rounded-3xl border border-separator/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300"
            >
              <div className="relative h-56 overflow-hidden">
                {card.imageUrl && (
                  <img
                    src={card.imageUrl}
                    alt={getLocalized(card.title, locale)}
                    style={{ animationDelay: `${idx * 120 + 200}ms` }}
                    className="settle-zoom w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                )}
                {card.badge && (
                  <span className="absolute top-4 left-4 bg-white/90 dark:bg-[var(--bg-card)] backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-accent shadow-sm border border-separator/40">
                    {getLocalized(card.badge, locale)}
                  </span>
                )}
              </div>
              <div className="p-6 flex flex-col flex-grow justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-base text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                    {getLocalized(card.title, locale)}
                  </h3>
                  <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed font-medium">
                    {getLocalized(card.description, locale)}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-separator/40 pt-4">
                  {card.price && (
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider font-extrabold text-foreground/50">
                        {t.homePage.priceFrom}
                      </span>
                      <span className="text-base font-black text-foreground">
                        {getLocalized(card.price, locale)}
                      </span>
                    </div>
                  )}
                  {card.linkUrl && (
                    <Link href={card.linkUrl} className="flex items-center gap-1 text-xs font-extrabold text-accent hover:text-accent/80 transition-colors no-underline">
                      {t.common.bookNow}
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SlideCardSection;