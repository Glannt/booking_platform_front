"use client";

import React, { useMemo } from "react";
import { RangeCalendar, Label } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { today, getLocalTimeZone } from "@internationalized/date";
import { CalendarDays, Calendar as CalendarIcon, Clock } from "lucide-react";
import { calculateRentalDays, formatToDisplayDate } from "@/lib/utils/rentalDate";
import { useI18n } from "@/context/LanguageContext";

export interface RentalDateRangePickerProps {
  value: { start: DateValue; end: DateValue } | null;
  onChange: (val: { start: DateValue; end: DateValue } | null) => void;
  minimumDays?: number;
  minValue?: DateValue;
  className?: string;
  showPresets?: boolean;
  label?: string;
  isInvalid?: boolean;
  errorMessage?: string;
}

export function RentalDateRangePicker({
  value,
  onChange,
  minimumDays = 1,
  minValue,
  className = "",
  showPresets = true,
  label,
  isInvalid = false,
  errorMessage,
}: RentalDateRangePickerProps) {
  const { language, t } = useI18n();
  const minAllowedDate = minValue || today(getLocalTimeZone());

  const rentalDays = useMemo(() => {
    if (!value?.start || !value?.end) return minimumDays;
    return calculateRentalDays(value.start, value.end, minimumDays);
  }, [value, minimumDays]);

  const displayRange = useMemo(() => {
    if (!value?.start || !value?.end) return null;
    return {
      start: formatToDisplayDate(value.start),
      end: formatToDisplayDate(value.end),
    };
  }, [value]);

  const handlePreset = (extraDays: number) => {
    const base = value?.start || minAllowedDate;
    const end = base.add({ days: extraDays });
    onChange({ start: base, end });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex flex-wrap items-center justify-between gap-1.5 min-w-0">
          <Label className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-foreground/80 truncate">
            {label}
          </Label>
          {rentalDays > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-accent/15 text-accent shrink-0 max-w-full truncate">
              <CalendarDays size={12} />
              <span>
                {rentalDays} {t.rentCar?.dayUnit || "ngày"}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Date Preview Strip */}
      {displayRange && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-background dark:bg-[var(--bg-card)] border border-border text-xs">
          <div className="flex items-center gap-2">
            <CalendarIcon size={14} className="text-accent" />
            <span className="font-bold text-foreground">
              {displayRange.start}
            </span>
          </div>
          <span className="text-foreground/40 font-bold">→</span>
          <div className="flex items-center gap-2">
            <CalendarIcon size={14} className="text-accent" />
            <span className="font-bold text-foreground">
              {displayRange.end}
            </span>
          </div>
        </div>
      )}

      {/* Quick Presets */}
      {showPresets && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handlePreset(1)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-border bg-white dark:bg-[var(--bg-surface)] text-foreground/80 hover:border-accent hover:text-accent cursor-pointer transition-colors"
          >
            +1 {t.rentCar?.dayUnit || "ngày"}
          </button>
          <button
            type="button"
            onClick={() => handlePreset(2)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-border bg-white dark:bg-[var(--bg-surface)] text-foreground/80 hover:border-accent hover:text-accent cursor-pointer transition-colors"
          >
            +2 {t.rentCar?.dayUnit || "ngày"}
          </button>
          <button
            type="button"
            onClick={() => handlePreset(3)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-border bg-white dark:bg-[var(--bg-surface)] text-foreground/80 hover:border-accent hover:text-accent cursor-pointer transition-colors"
          >
            +3 {t.rentCar?.dayUnit || "ngày"}
          </button>
          <button
            type="button"
            onClick={() => handlePreset(7)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-border bg-white dark:bg-[var(--bg-surface)] text-foreground/80 hover:border-accent hover:text-accent cursor-pointer transition-colors"
          >
            +7 {t.rentCar?.dayUnit || "ngày"}
          </button>
        </div>
      )}

      {/* HeroUI RangeCalendar */}
      <div
        className={`p-3 sm:p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border ${
          isInvalid
            ? "border-red-500"
            : "border-border"
        } flex justify-center shadow-xs`}
      >
        <RangeCalendar
          aria-label={label || t.rentCar?.selectDateRange || "Chọn khoảng ngày"}
          firstDayOfWeek="mon"
          minValue={minAllowedDate}
          value={value}
          onChange={(v) => {
            if (v) onChange(v);
          }}
          className="w-full max-w-sm mx-auto"
        >
          <RangeCalendar.Header className="flex items-center justify-between mb-3 px-1">
            <RangeCalendar.Heading className="text-xs font-black text-foreground" />
            <div className="flex items-center gap-1">
              <RangeCalendar.NavButton
                slot="previous"
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] cursor-pointer text-foreground/70 transition-colors"
              />
              <RangeCalendar.NavButton
                slot="next"
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-[var(--bg-elevated)] cursor-pointer text-foreground/70 transition-colors"
              />
            </div>
          </RangeCalendar.Header>
          <RangeCalendar.Grid className="w-full">
            <RangeCalendar.GridHeader className="text-foreground/40 text-[10px] font-bold">
              {(day) => (
                <RangeCalendar.HeaderCell className="w-full text-center py-1">
                  {day}
                </RangeCalendar.HeaderCell>
              )}
            </RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>
              {(date) => <RangeCalendar.Cell date={date} />}
            </RangeCalendar.GridBody>
          </RangeCalendar.Grid>
        </RangeCalendar>
      </div>

      {isInvalid && errorMessage && (
        <p className="text-[11px] font-semibold text-red-500 pl-1">{errorMessage}</p>
      )}
    </div>
  );
}
