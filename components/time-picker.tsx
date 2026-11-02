"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Clock, ChevronDown, Check } from "lucide-react";
import { Label } from "@heroui/react";

/* ─────────────────────────────────────────────
   Drum-Roll Scroll Column
───────────────────────────────────────────── */
const ITEM_H = 44; // px height of each cell

interface ScrollColumnProps {
  items: string[];
  selected: number;
  onSelect: (index: number) => void;
  label: string;
}

function ScrollColumn({ items, selected, onSelect, label }: ScrollColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const isScrollingByCode = useRef(false);

  // Scroll to selected whenever it changes externally
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    isScrollingByCode.current = true;
    el.scrollTo({ top: selected * ITEM_H, behavior: "smooth" });
    const timer = setTimeout(() => { isScrollingByCode.current = false; }, 400);
    return () => clearTimeout(timer);
  }, [selected]);

  const handleScroll = useCallback(() => {
    if (isScrollingByCode.current) return;
    const el = listRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / ITEM_H);
    if (index !== selected && index >= 0 && index < items.length) {
      onSelect(index);
    }
  }, [selected, items.length, onSelect]);

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      {/* Column label */}
      <span className="text-[9px] font-extrabold uppercase tracking-widest text-foreground/50 mb-1">
        {label}
      </span>

      {/* Scroll drum */}
      <div className="relative w-full">
        {/* Top fade */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 z-10 bg-gradient-to-b from-white dark:from-[var(--bg-surface)] to-transparent" />
        {/* Selection highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[44px] z-10 bg-accent/10 dark:bg-accent/20 border-y border-accent/30 rounded-xl mx-1" />
        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 z-10 bg-gradient-to-t from-white dark:from-[var(--bg-surface)] to-transparent" />

        {/* Scrollable list */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="overflow-y-auto scrollbar-hide"
          style={{
            height: ITEM_H * 5,
            scrollSnapType: "y mandatory",
          }}
        >
          {/* Top padding phantom items */}
          <div style={{ height: ITEM_H * 2 }} />

          {items.map((item, i) => (
            <div
              key={item}
              onClick={() => onSelect(i)}
              style={{ height: ITEM_H, scrollSnapAlign: "center" }}
              className={`flex items-center justify-center cursor-pointer select-none text-sm font-bold transition-all duration-150 ${selected === i
                ? "text-accent scale-110 font-black"
                : "text-foreground/40 hover:text-foreground"
                }`}
            >
              {item}
            </div>
          ))}

          {/* Bottom padding phantom items */}
          <div style={{ height: ITEM_H * 2 }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TimePicker Component (exported)
───────────────────────────────────────────── */
export interface TimeValue {
  hour: number;   // 1–12
  minute: number; // 0–59
  period: "AM" | "PM";
}

interface TimePickerProps {
  value: TimeValue;
  onChange: (v: TimeValue) => void;
  /** Field label above the trigger button */
  label?: string;
  /** Tailwind classes applied to the field label – controls color, size, etc. */
  labelClassName?: string;
  /** Title shown inside the popover header */
  popoverTitle?: string;
  className?: string;
  popoverClassName?: string;
  language?: string;
  triggerClassName?: string;
  hideIcon?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));   // 01–12
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));        // 00–59
const PERIODS = ["AM", "PM"];

export function TimePicker({
  value,
  onChange,
  label,
  labelClassName = "text-[11px] font-extrabold uppercase tracking-wider text-foreground mb-1.5 pl-1 block",
  popoverTitle,
  className,
  popoverClassName,
  language = "vi",
  triggerClassName,
  hideIcon = false,
  isRequired,
  isInvalid,
  errorMessage,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Derived display string (24h format, maps to theme & API)
  const h24 = (value.hour % 12) + (value.period === "PM" ? 12 : 0);
  const display = `${String(h24).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;

  // Trigger class: if triggerClassName provides bg-/dark:bg-, skip default bg
  const overrideBg = triggerClassName && /\b(bg-|dark:bg-)/.test(triggerClassName);
  const isBorderless = triggerClassName && /\b(border-none|p-0|h-auto)\b/.test(triggerClassName);
  
  const triggerBase = isBorderless
    ? "flex items-center gap-1.5 w-full text-foreground font-bold text-left cursor-pointer outline-none transition-colors"
    : "flex items-center gap-2 h-10 w-full border border-border rounded-xl px-3 text-foreground text-sm font-bold text-left cursor-pointer hover:border-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  
  const triggerDefaultBg = (overrideBg || isBorderless) ? "" : " bg-background dark:bg-[var(--bg-surface)]";
  const triggerClasses = `${triggerBase}${triggerDefaultBg}${triggerClassName ? ` ${triggerClassName}` : ""}${isInvalid ? " border-red-500" : ""}`;

  // Default popover title falls back to i18n string
  const headerTitle = popoverTitle ?? (language === "vi" ? "Chọn giờ khởi hành" : "Select Departure Time");

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!popoverRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className={`flex flex-col w-full relative${className ? ` ${className}` : ""}`} ref={popoverRef}>
      {/* Label */}
      {label && (
        <Label isRequired={isRequired} className={labelClassName}>
          {label}
        </Label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClasses}
      >
        {!hideIcon && <Clock size={15} className="text-foreground/50 shrink-0" />}
        <span className="flex-1 truncate">
          {display}
        </span>
        <ChevronDown
          size={13}
          className={`text-foreground/40 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* FieldError */}
      {isInvalid && errorMessage && (
        <span className="text-[9px] text-red-500 mt-1 pl-1">{errorMessage}</span>
      )}

      {/* Popover */}
      {open && (
        <div className={`absolute top-full z-50 w-72 bg-white dark:bg-[var(--bg-surface)] border border-border-secondary rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up mt-2 ${popoverClassName || "left-0"}`}>
          {/* Header */}
          <div className="px-4 pt-3.5 pb-2 border-b border-separator">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/50">
              {headerTitle}
            </p>
          </div>

          {/* Drum-Roll Columns */}
          <div className="flex items-stretch px-3 py-2 gap-1 bg-white dark:bg-[var(--bg-surface)]">
            {/* Hours */}
            <ScrollColumn
              items={HOURS}
              selected={value.hour - 1}
              onSelect={(i) => onChange({ ...value, hour: i + 1 })}
              label={language === "vi" ? "Giờ" : "Hr"}
            />

            {/* Separator */}
            <div className="flex items-center pb-1 text-foreground/30 font-black text-lg select-none">:</div>

            {/* Minutes */}
            <ScrollColumn
              items={MINUTES}
              selected={value.minute}
              onSelect={(i) => onChange({ ...value, minute: i })}
              label={language === "vi" ? "Phút" : "Min"}
            />

            {/* Divider */}
            <div className="w-px bg-border dark:bg-[var(--bg-elevated)] mx-1 self-stretch" />

            {/* AM / PM */}
            <ScrollColumn
              items={PERIODS}
              selected={value.period === "AM" ? 0 : 1}
              onSelect={(i) => onChange({ ...value, period: i === 0 ? "AM" : "PM" })}
              label=""
            />
          </div>

          {/* Confirm Footer */}
          <div className="px-4 pb-4 pt-2 border-t border-separator">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full h-10 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Check size={14} />
              {language === "vi" ? `Xác nhận · ${display}` : `Confirm · ${display}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

