"use client";

import React from "react";
import { FaqAccordion } from "./FaqAccordion";
import type { FaqCategory } from "./FaqAccordion";

export type { FaqCategory };

export interface FaqSectionProps {
  title?: string;
  description?: string;
  categories: FaqCategory[];
  className?: string;
}

export function FaqSection({
  title = "Frequently Asked Questions",
  description = "Everything you need to know about licensing and usage.",
  categories,
  className,
}: FaqSectionProps) {
  return (
    <div className={`flex w-full flex-col gap-6 ${className ?? ""}`}>
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mb-4 text-lg font-medium text-muted">{description}</p>
      </div>
      <FaqAccordion categories={categories} />
    </div>
  );
}
