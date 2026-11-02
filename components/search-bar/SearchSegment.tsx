"use client";

import React from "react";
import { X, ChevronDown } from "lucide-react";

interface SearchSegmentProps {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  placeholder?: string;
  onClear?: (e: React.MouseEvent) => void;
  hasDropdown?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function SearchSegment({
  icon,
  label,
  value,
  placeholder,
  onClear,
  hasDropdown = false,
  isActive = false,
  onClick,
  className = "",
  children,
}: SearchSegmentProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`
        relative flex items-center gap-3 px-4 py-2.5 sm:py-3 transition-all rounded-xl sm:rounded-2xl
        ${onClick ? "cursor-pointer hover:bg-black/5 dark:hover:bg-[var(--bg-card)]" : ""}
        ${isActive ? "ring-2 ring-accent bg-accent/5 dark:bg-accent/10" : ""}
        ${className}
      `}
    >
      {icon && (
        <div className="shrink-0 text-accent flex items-center justify-center">
          {icon}
        </div>
      )}

      <div className="flex flex-col min-w-0 flex-1 text-left">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/60 select-none truncate">
          {label}
        </span>
        {children ? (
          children
        ) : (
          <span
            className={`text-xs sm:text-sm truncate ${
              value
                ? "text-foreground font-bold"
                : "text-foreground/50 font-normal"
            }`}
          >
            {value || placeholder || "—"}
          </span>
        )}
      </div>

      {onClear && value && (
        <button
          type="button"
          aria-label="Clear field"
          onClick={(e) => {
            e.stopPropagation();
            onClear(e);
          }}
          className="shrink-0 p-1 rounded-full text-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] transition-colors border-none cursor-pointer"
        >
          <X size={14} />
        </button>
      )}

      {hasDropdown && (
        <div className="shrink-0 text-foreground/50">
          <ChevronDown size={15} />
        </div>
      )}
    </div>
  );
}
