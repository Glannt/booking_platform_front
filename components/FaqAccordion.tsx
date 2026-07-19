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
    <div className={`flex w-full flex-col gap-6 ${className ?? ""}`}>
      {categories.map((category) => (
        <div key={category.title}>
          <p className="text-md mb-2 font-medium text-muted">
            {category.title}
          </p>
          <Accordion
            className="w-full"
            variant={variant}
            allowsMultipleExpanded={allowsMultipleExpanded}
          >
            {category.items.map((item, index) => (
              <Accordion.Item key={index}>
                <Accordion.Heading>
                  <Accordion.Trigger>
                    {item.title}
                    <Accordion.Indicator>
                      <ChevronDown />
                    </Accordion.Indicator>
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body>{item.content}</Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
}
