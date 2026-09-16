"use client";

import React from "react";
import { Select, ListBox } from "@heroui/react";

export interface PageSizeSelectProps {
  value: number;
  onChange: (size: number) => void;
  options?: number[];
  className?: string;
  selectWidth?: string;
  label?: string;
}

export function PageSizeSelect({
  value,
  onChange,
  options = [10, 20, 50, 100],
  className = "flex items-center gap-2",
  selectWidth = "w-32",
  label = "Hiển thị",
}: PageSizeSelectProps) {
  // Ensure the current value exists in options so it displays properly
  const resolvedOptions = options.includes(value) ? options : [value, ...options].sort((a, b) => a - b);

  return (
    <div className={className}>
      {label && (
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {label}:
        </span>
      )}
      <Select
        selectedKey={String(value)}
        onSelectionChange={(key) => {
          if (key) {
            onChange(Number(key));
          }
        }}
        className={selectWidth}
        aria-label={label || "Số dòng hiển thị trên mỗi trang"}
      >
        <Select.Trigger className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between cursor-pointer focus:outline-none transition-colors">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl z-50 min-w-[120px]">
          <ListBox>
            {resolvedOptions.map((opt) => (
              <ListBox.Item
                key={opt}
                id={String(opt)}
                textValue={`${opt} / trang`}
                className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-200 transition-colors"
              >
                {opt} / trang
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}

export default PageSizeSelect;
