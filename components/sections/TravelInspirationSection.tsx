"use client";

import React from "react";
import { SectionDto } from "@/lib/api/sections";
import { Camera } from "lucide-react";
import { useI18n } from "@/context/LanguageContext";

interface InspirationItem {
  imageUrl?: string;
  label?: Record<string, string>;
  linkUrl?: string;
}

interface InspirationData {
  items?: InspirationItem[];
  showInstagram?: boolean;
  instagramHandle?: string;
}

function getLocalized(val?: Record<string, string>, locale?: string): string {
  if (!val) return "";
  return val[locale || ""] || val["vi"] || val["en"] || Object.values(val)[0] || "";
}

export function TravelInspirationSection({ section, locale }: { section: SectionDto; locale: string }) {
  const { t } = useI18n();
  const trans =
    section.translations.find((tr) => tr.locale === locale) ||
    section.translations[0];

  let data: InspirationData = { items: [] };
  try {
    if (section.contentData) {
      data = JSON.parse(section.contentData);
    }
  } catch {}

  const items = data.items || [];

  if (items.length === 0 && !data.showInstagram) return null;

  return (
    <section className="w-full py-8">
      <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          {trans?.title && (
            <h2 className="text-2xl md:text-3xl font-black text-foreground">{trans.title}</h2>
          )}
          {trans?.subtitle && (
            <p className="text-sm text-foreground/70 font-medium">{trans.subtitle}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => (
            <div key={idx} className="h-64 rounded-3xl overflow-hidden relative group shadow-sm border border-separator/60">
              {item.imageUrl && (
                <img src={item.imageUrl} alt={getLocalized(item.label, locale)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-5">
                <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                  {getLocalized(item.label, locale)}
                </span>
              </div>
            </div>
          ))}

          {data.showInstagram && (
            <div className="h-64 rounded-3xl bg-slate-100 dark:bg-[var(--bg-card)] border border-separator/60 flex flex-col items-center justify-center text-center p-6 gap-4 group hover:bg-accent/5 dark:hover:bg-accent/10 transition-all duration-300">
              <div className="p-4 bg-accent/10 dark:bg-accent/20 text-accent rounded-full group-hover:scale-110 transition-transform">
                <Camera size={28} />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-extrabold text-foreground uppercase tracking-wider">
                  {t.common.followUs}
                </span>
                <span className="block text-sm font-black text-accent">{data.instagramHandle || "@minhkhoatravel_vn"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default TravelInspirationSection;