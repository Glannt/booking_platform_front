"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@heroui/react";

interface HomeSectionHeaderProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
  onPrev?: () => void;
  onNext?: () => void;
  canScrollPrev?: boolean;
  canScrollNext?: boolean;
  showArrows?: boolean;
  className?: string;
}

export function HomeSectionHeader({
  title,
  subtitle,
  viewAllLink,
  viewAllText = "Xem thêm",
  onPrev,
  onNext,
  canScrollPrev = false,
  canScrollNext = true,
  showArrows = true,
  className = "",
}: HomeSectionHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 ${className}`}>
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
          <span>{title}</span>
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-foreground/60 font-medium leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="group text-xs sm:text-sm font-bold text-foreground/80 hover:text-accent transition-colors flex items-center gap-1"
          >
            <span>{viewAllText}</span>
            <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {showArrows && (onPrev || onNext) && (
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <Button
              isIconOnly
              size="sm"
              variant="outline"
              aria-label="Cuộn sang trái"
              isDisabled={!canScrollPrev}
              onClick={onPrev}
              className="w-8 h-8 rounded-full border border-separator bg-surface text-foreground shadow-xs hover:bg-muted disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="outline"
              aria-label="Cuộn sang phải"
              isDisabled={!canScrollNext}
              onClick={onNext}
              className="w-8 h-8 rounded-full border border-separator bg-surface text-foreground shadow-xs hover:bg-muted disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeSectionHeader;
