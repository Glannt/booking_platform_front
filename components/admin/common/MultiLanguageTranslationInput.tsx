"use client";

import React, { useState } from "react";
import { Label, Tabs, TextField, Input } from "@heroui/react";

export interface TranslationField {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
}

export interface MultiLanguageTranslationInputProps {
  translations: Record<string, Record<string, string>>;
  onChange: (locale: string, fieldKey: string, value: string) => void;
  fields?: TranslationField[];
  title?: string;
  isView?: boolean;
  locales?: readonly string[];
  localeLabels?: Record<string, string>;
  activeLocale?: string;
  onActiveLocaleChange?: (locale: string) => void;
  className?: string;
}

const DEFAULT_LOCALES = ["vi", "en", "ko", "ru"] as const;
const DEFAULT_LOCALE_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "English",
  ko: "한국어",
  ru: "Русский",
};

export const MultiLanguageTranslationInput: React.FC<MultiLanguageTranslationInputProps> = ({
  translations,
  onChange,
  fields = [{ key: "name", label: "Tên", placeholder: "Nhập tên...", required: false }],
  title = "BẢN DỊCH ĐA NGÔN NGỮ",
  isView = false,
  locales = DEFAULT_LOCALES,
  localeLabels = DEFAULT_LOCALE_LABELS,
  activeLocale: controlledLocale,
  onActiveLocaleChange,
  className = "",
}) => {
  const [internalLocale, setInternalLocale] = useState<string>(locales[0] || "vi");
  const activeLocale = controlledLocale || internalLocale;

  const handleLocaleChange = (key: React.Key) => {
    const loc = String(key);
    if (onActiveLocaleChange) {
      onActiveLocaleChange(loc);
    } else {
      setInternalLocale(loc);
    }
  };

  return (
    <div className={`border-t border-separator/60 pt-4 space-y-3 ${className}`}>
      {title && (
        <Label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {title}
        </Label>
      )}

      {/* Language Selection Tabs */}
      <Tabs
        aria-label="Chọn ngôn ngữ dịch thuật"
        selectedKey={activeLocale}
        onSelectionChange={handleLocaleChange}
        className="w-full"
      >
        <Tabs.List
          aria-label="Danh sách ngôn ngữ"
          className="w-full bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-xl p-1 flex"
        >
          {locales.map((loc) => (
            <Tabs.Tab
              key={loc}
              id={loc}
              className="flex-1 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-lg transition-all"
            >
              {localeLabels[loc] || loc.toUpperCase()}
              <Tabs.Indicator className="bg-[#ffcc00a4] rounded-lg shadow-sm" />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      {/* Form Fields for Active Locale */}
      <div className="space-y-3 pt-1">
        {fields.map((field) => {
          const val = translations[activeLocale]?.[field.key] || "";
          const fieldLabel = `${field.label.toUpperCase()} (${activeLocale.toUpperCase()})`;

          if (isView) {
            return (
              <div key={field.key}>
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {fieldLabel}
                </Label>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white whitespace-pre-wrap">
                  {val || "—"}
                </p>
              </div>
            );
          }

          if (field.multiline) {
            return (
              <div key={field.key}>
                <Label className="block text-xs font-bold mb-1 uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {fieldLabel}
                </Label>
                <textarea
                  rows={field.rows || 3}
                  className="w-full px-3 py-2 rounded-xl border border-separator/80 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ffcc00] text-sm font-medium resize-none transition-colors"
                  placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}...`}
                  value={val}
                  onChange={(e) => onChange(activeLocale, field.key, e.target.value)}
                />
              </div>
            );
          }

          return (
            <TextField key={field.key} isRequired={field.required} className="w-full">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {fieldLabel}
              </Label>
              <Input
                type="text"
                value={val}
                onChange={(e) => onChange(activeLocale, field.key, e.target.value)}
                placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}...`}
                className="w-full p-2.5 rounded-xl text-xs font-semibold border border-separator/80 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ffcc00] transition-colors"
              />
            </TextField>
          );
        })}
      </div>
    </div>
  );
};

export default MultiLanguageTranslationInput;
