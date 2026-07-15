"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Clock, ChevronDown, Check } from "lucide-react";

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
      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
        {label}
      </span>

      {/* Scroll drum */}
      <div className="relative w-full">
        {/* Top fade */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 z-10 bg-gradient-to-b from-white dark:from-slate-900 to-transparent" />
        {/* Selection highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[44px] z-10 bg-accent/10 dark:bg-accent/20 border-y border-accent/30 rounded-xl mx-1" />
        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 z-10 bg-gradient-to-t from-white dark:from-slate-900 to-transparent" />

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
              className={`flex items-center justify-center cursor-pointer select-none text-sm font-bold transition-all duration-150 ${
                selected === i
                  ? "text-accent scale-110"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
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
  language?: string;
  triggerClassName?: string;
}

const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));   // 01–12
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));        // 00–59
const PERIODS = ["AM", "PM"];

export function TimePicker({
  value,
  onChange,
  label,
  labelClassName = "text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-slate-400 mb-1.5 pl-1",
  popoverTitle,
  language = "vi",
  triggerClassName,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Derived display string
  const display = `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")} ${value.period}`;

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
    <div className="flex flex-col w-full relative" ref={popoverRef}>
      {/* Label */}
      {label && (
        <label className={labelClassName}>
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName ?? "flex items-center gap-2 h-10 w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 bg-white dark:bg-black text-left cursor-pointer hover:border-accent/50 transition-colors"}
      >
        <Clock size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex-1">
          {display}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="px-4 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              {headerTitle}
            </p>
          </div>

          {/* Drum-Roll Columns */}
          <div className="flex items-stretch px-3 py-2 gap-1">
            {/* Hours */}
            <ScrollColumn
              items={HOURS}
              selected={value.hour - 1}
              onSelect={(i) => onChange({ ...value, hour: i + 1 })}
              label={language === "vi" ? "Giờ" : "Hr"}
            />

            {/* Separator */}
            <div className="flex items-center pb-1 text-slate-300 dark:text-slate-600 font-black text-lg select-none">:</div>

            {/* Minutes */}
            <ScrollColumn
              items={MINUTES}
              selected={value.minute}
              onSelect={(i) => onChange({ ...value, minute: i })}
              label={language === "vi" ? "Phút" : "Min"}
            />

            {/* Divider */}
            <div className="w-px bg-slate-100 dark:bg-slate-800 mx-1 self-stretch" />

            {/* AM / PM */}
            <ScrollColumn
              items={PERIODS}
              selected={value.period === "AM" ? 0 : 1}
              onSelect={(i) => onChange({ ...value, period: i === 0 ? "AM" : "PM" })}
              label=""
            />
          </div>

          {/* Confirm Footer */}
          <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full h-10 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
