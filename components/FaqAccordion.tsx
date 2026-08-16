"use client";

import React from "react";
import { ChevronDown } from "@gravity-ui/icons";
import { Accordion } from "@heroui/react";

export interface FaqItem {
  title: string;
  content: string;
}

export interface FaqCategory {
  title: string;
  items: FaqItem[];
}

export interface FaqAccordionProps {
  categories: FaqCategory[];
  variant?: "default" | "surface";
  allowsMultipleExpanded?: boolean;
  className?: string;
}

export function FaqAccordion({
  categories,
  variant = "surface",
  allowsMultipleExpanded = true,
  className,
}: FaqAccordionProps) {
  return (
    <div className={`flex w-full flex-col gap-8 ${className ?? ""}`}>
      {categories.map((category) => (
        <div key={category.title} className="w-full flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            {category.title}
          </p>
          <Accordion
            className="w-full"
            variant={variant}
            allowsMultipleExpanded={allowsMultipleExpanded}
          >
            {category.items.map((item, index) => (
              <Accordion.Item key={index} className="w-full">
                <Accordion.Heading className="w-full m-0 p-0">
                  <Accordion.Trigger className="w-full text-left font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center justify-between py-4 px-5 cursor-pointer select-none">
                    <span className="flex-1 pr-4">{item.title}</span>
                    <Accordion.Indicator className="shrink-0 text-slate-400">
                      <ChevronDown />
                    </Accordion.Indicator>
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel className="w-full m-0 p-0">
                  <Accordion.Body className="w-full text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed px-5 pb-5 pt-0">
                    {item.content}
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
}
