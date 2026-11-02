"use client";

import React from "react";
import type { SectionDto } from "@/lib/api/sections";
import type { ComponentItem } from "@/types/routeComponents";
import { MarkdownComponent } from "../components/MarkdownComponent";
import { TextsComponent } from "../components/TextsComponent";
import { PoiComponent } from "../components/PoiComponent";
import { BookingProcessSection } from "../BookingProcessSection";
import { FaqSection } from "../FaqSection";
import { SlideReviewSection } from "../SlideReviewSection";

export interface DetailComponentItemRendererProps {
  component: ComponentItem;
  className?: string;
}

/**
 * Renders an individual product-level Component (markdown, texts, poi, etc.)
 */
export function DetailComponentItemRenderer({
  component,
  className = "",
}: DetailComponentItemRendererProps) {
  if (!component) return null;

  switch (component.type) {
    case "markdown":
      return <MarkdownComponent data={component.data} className={className} />;
    case "texts":
    case "text":
      return <TextsComponent data={component.data} className={className} />;
    case "poi":
      return <PoiComponent data={component.data} className={className} />;
    default:
      // Fallback for markdown data shape
      if (component.data?.render_obj) {
        return <MarkdownComponent data={component.data} className={className} />;
      }
      return null;
  }
}

export interface DetailComponentsListProps {
  components?: ComponentItem[];
  className?: string;
  itemClassName?: string;
}

/**
 * Renders a list of product-level components (e.g., package services, highlights, POIs)
 */
export function DetailComponentsList({
  components,
  className = "space-y-6",
  itemClassName = "",
}: DetailComponentsListProps) {
  if (!components || components.length === 0) return null;

  return (
    <div className={className}>
      {components.map((comp, idx) => (
        <DetailComponentItemRenderer
          key={idx}
          component={comp}
          className={itemClassName}
        />
      ))}
    </div>
  );
}

export interface DetailCMSSectionsProps {
  sections?: SectionDto[];
  locale?: string;
  allowedTypes?: string[];
  className?: string;
}

const DEFAULT_DETAIL_CMS_TYPES = [
  "BOOKING_PROCESS",
  "booking_process",
  "FAQ",
  "FAQS",
  "faq",
  "SLIDE_REVIEW",
  "reviews",
];

/**
 * Renders CMS sections for product detail pages (Booking Process, FAQs, Customer Reviews)
 */
export function DetailCMSSections({
  sections,
  locale = "vi",
  allowedTypes = DEFAULT_DETAIL_CMS_TYPES,
  className = "space-y-8 mt-10",
}: DetailCMSSectionsProps) {
  if (!sections || sections.length === 0) return null;

  const filteredSections = sections
    .filter((sec) => sec.active !== false && allowedTypes.includes(sec.sectionType))
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  if (filteredSections.length === 0) return null;

  return (
    <div className={className}>
      {filteredSections.map((sec) => {
        switch (sec.sectionType) {
          case "BOOKING_PROCESS":
          case "booking_process":
            return <BookingProcessSection key={sec.id} section={sec} locale={locale} />;
          case "FAQ":
          case "FAQS":
          case "faq":
            return <FaqSection key={sec.id} section={sec} locale={locale} />;
          case "SLIDE_REVIEW":
          case "reviews":
            return <SlideReviewSection key={sec.id} section={sec} locale={locale} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
