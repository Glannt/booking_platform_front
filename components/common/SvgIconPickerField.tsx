"use client";

import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { SvgIconRenderer } from "./SvgIconRenderer";
import clsx from "clsx";

export interface SvgPreset {
  name: string;
  svg: string;
}

export const DEFAULT_TRAVEL_SVG_PRESETS: SvgPreset[] = [
  {
    name: "Tàu / Cano",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/><path d="M12 2v3"/></svg>`,
  },
  {
    name: "Xe ô tô",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`,
  },
  {
    name: "La bàn",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  },
  {
    name: "Ăn uống",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 2v16a2 2 0 0 1-2 2 2 2 0 0 1-2-2V2"/><path d="M4 2v6a4 4 0 0 0 4 4v8a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-8a4 4 0 0 0 4-4V2"/></svg>`,
  },
  {
    name: "Rượu vang",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/></svg>`,
  },
  {
    name: "Vương miện",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.735H5.81a1 1 0 0 1-.957-.735L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>`,
  },
  {
    name: "Âm nhạc",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  },
  {
    name: "Bãi biển / Dừa",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4"/><path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3"/><path d="M5.89 15.5c1.5-1 3.2-1.5 5.11-1.5 2.5 0 4.8 1.1 6.5 3"/><path d="M11 13c1.5-2 2-5 2-8"/><path d="M11 13c-1.5 2.5-3 5.5-3 9"/></svg>`,
  },
  {
    name: "Mặt trời",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  },
  {
    name: "Mỏ neo",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" x2="12" y1="22" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>`,
  },
  {
    name: "Máy ảnh",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
  },
  {
    name: "Bảo vệ",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,
  },
  {
    name: "Huy hiệu",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  },
  {
    name: "Địa điểm",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  },
  {
    name: "Ngôi sao / VIP",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  },
  {
    name: "Vé tham quan",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>`,
  },
  {
    name: "Wifi",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>`,
  },
  {
    name: "Hướng dẫn viên",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`,
  },
];

interface SvgIconPickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  compact?: boolean;
  presets?: SvgPreset[];
}

export const SvgIconPickerField: React.FC<SvgIconPickerFieldProps> = ({
  value,
  onChange,
  label = "Biểu tượng SVG (Raw SVG text)",
  placeholder = "Dán mã SVG (<svg ...>...</svg>) vào đây...",
  compact = false,
  presets = DEFAULT_TRAVEL_SVG_PRESETS,
}) => {
  const [showPresets, setShowPresets] = useState(true);

  return (
    <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold flex items-center gap-1.5">
          <Sparkles size={14} className="text-accent" />
          {label}
        </label>
        <span className="text-[10px] text-slate-400 font-medium">Live Preview trực tiếp</span>
      </div>

      <div className={clsx("grid gap-3 items-center", compact ? "grid-cols-1 sm:grid-cols-5" : "grid-cols-1 sm:grid-cols-4")}>
        <div className={clsx(compact ? "sm:col-span-4" : "sm:col-span-3", "space-y-1")}>
          <textarea
            rows={compact ? 2 : 3}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-2.5 text-[11px] font-mono rounded-xl border border-border bg-white dark:bg-[var(--bg-surface)] focus:border-accent outline-none resize-none leading-relaxed text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Live Preview Box */}
        <div className={clsx(compact ? "sm:col-span-1" : "sm:col-span-1", "flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-border bg-white dark:bg-[var(--bg-surface)]")}>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Preview
          </span>
          <div
            className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center p-2 shadow-sm"
          >
            <SvgIconRenderer svgString={value} className="w-full h-full text-current" />
          </div>
        </div>
      </div>

      {/* Quick SVG Presets */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Mẫu SVG có sẵn ({presets.length}):
          </span>
          <button
            type="button"
            onClick={() => setShowPresets((p) => !p)}
            className="text-[10px] font-semibold text-accent hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-none"
          >
            {showPresets ? (
              <>
                <span>Ẩn mẫu</span>
                <ChevronUp size={12} />
              </>
            ) : (
              <>
                <span>Hiện mẫu</span>
                <ChevronDown size={12} />
              </>
            )}
          </button>
        </div>

        {showPresets && (
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(p.svg)}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-border bg-white dark:bg-[var(--bg-surface)] hover:bg-accent/10 hover:text-accent hover:border-accent/40 cursor-pointer transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
