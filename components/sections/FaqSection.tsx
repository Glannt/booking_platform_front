"use client";

import React from "react";
import { SectionDto } from "@/lib/api/sections";
import { FaqAccordion, type FaqCategory } from "@/components/FaqAccordion";

interface FaqItemJson {
  title?: string | Record<string, string>;
  content?: string | Record<string, string>;
}

interface FaqCategoryJson {
  title?: string | Record<string, string>;
  items?: FaqItemJson[];
}

interface FaqContentData {
  categories?: FaqCategoryJson[];
  items?: FaqItemJson[];
}

function getLocalized(val?: string | Record<string, string>, locale?: string): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[locale || ""] || val["vi"] || val["en"] || Object.values(val)[0] || "";
}

export function FaqSection({ section, locale }: { section: SectionDto; locale: string }) {
  const trans =
    section.translations.find((t) => t.locale === locale) ||
    section.translations[0];

  let data: FaqContentData = {};
  try {
    if (section.contentData) {
      data = JSON.parse(section.contentData);
    }
  } catch {}

  // Convert localized JSON into standard FaqCategory[]
  const categories: FaqCategory[] = [];

  if (data.categories && Array.isArray(data.categories)) {
    data.categories.forEach((cat) => {
      const catTitle = getLocalized(cat.title, locale);
      const items = (cat.items || [])
        .map((item) => ({
          title: getLocalized(item.title, locale),
          content: getLocalized(item.content, locale),
        }))
        .filter((i) => i.title && i.content);

      if (items.length > 0) {
        categories.push({
          title: catTitle || (locale === "vi" ? "Chung" : "General"),
          items,
        });
      }
    });
  } else if (data.items && Array.isArray(data.items)) {
    const items = data.items
      .map((item) => ({
        title: getLocalized(item.title, locale),
        content: getLocalized(item.content, locale),
      }))
      .filter((i) => i.title && i.content);

    if (items.length > 0) {
      categories.push({
        title: trans?.subtitle || (locale === "vi" ? "Thông tin chung" : "General Information"),
        items,
      });
    }
  }

  if (categories.length === 0) return null;

  return (
    <section className="w-full py-16 bg-slate-50/50 dark:bg-[var(--bg-surface)]/20 border-y border-slate-100 dark:border-slate-800/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          {trans?.title && (
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">
              {trans.title}
            </h2>
          )}
          {trans?.subtitle && (
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
              {trans.subtitle}
            </p>
          )}
        </div>

        <div className="w-full">
          <FaqAccordion categories={categories} />
        </div>
      </div>
    </section>
  );
}
