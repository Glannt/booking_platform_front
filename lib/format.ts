import type { Language } from "@/config/translations";

// ponytail: amounts stored in VND. Rates are rough approximations for display only — not for billing.
const CURRENCY_CONFIG: Record<Language, { locale: string; currency: string; rate: number }> = {
  vi: { locale: "vi-VN", currency: "VND", rate: 1 },
  en: { locale: "en-US", currency: "USD", rate: 1 / 25000 },
  ko: { locale: "ko-KR", currency: "KRW", rate: 1 / 18 },
  ru: { locale: "ru-RU", currency: "RUB", rate: 1 / 270 },
};

/**
 * Format a VND amount into the locale-appropriate currency string.
 * Pass the current language from useI18n().
 */
export function formatPrice(amountVND: number, language: Language = "vi"): string {
  const cfg = CURRENCY_CONFIG[language] ?? CURRENCY_CONFIG.vi;
  return new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency: cfg.currency,
    maximumFractionDigits: 0,
  }).format(amountVND * cfg.rate);
}

import { Time } from "@internationalized/date";

export function formatTimeDisplay(timeStr?: string): string {
  if (!timeStr) return "";
  
  const formatSingleTime = (t: string): string => {
    let rawTime = t.trim();
    if (rawTime.includes("T")) {
      const parts = rawTime.split("T");
      if (parts.length > 1) {
        rawTime = parts[1];
      }
    }
    rawTime = rawTime.replace(/[Z]/g, "").split("+")[0].split("-")[0];
    if (rawTime.includes(":")) {
      const segments = rawTime.split(":");
      if (segments.length >= 2) {
        const hour = segments[0].trim().padStart(2, "0");
        const minute = segments[1].trim().substring(0, 2).padStart(2, "0");
        return `${hour}:${minute}`;
      }
    }
    return t;
  };

  if (timeStr.includes(" - ")) {
    return timeStr.split(" - ").map(formatSingleTime).join(" - ");
  }
  if (timeStr.includes("-") && !timeStr.includes("T")) {
    return timeStr.split("-").map(formatSingleTime).join(" - ");
  }
  
  return formatSingleTime(timeStr);
}

export function parseTimeString(timeStr?: string): Time | null {
  if (!timeStr) return null;
  let cleanTime = timeStr.trim();
  if (cleanTime.includes("T")) {
    const parts = cleanTime.split("T");
    if (parts.length > 1) {
      cleanTime = parts[1];
    }
  }
  cleanTime = cleanTime.replace(/[Z]/g, "").split("+")[0].split("-")[0];
  const segments = cleanTime.split(":");
  if (segments.length >= 2) {
    const hour = parseInt(segments[0], 10);
    const minute = parseInt(segments[1], 10);
    const second = segments[2] ? parseInt(segments[2], 10) : 0;
    if (!isNaN(hour) && !isNaN(minute)) {
      return new Time(hour, minute, isNaN(second) ? 0 : second);
    }
  }
  return null;
}

export function formatTimeToString(timeVal?: Time | null): string {
  if (!timeVal) return "";
  const hour = String(timeVal.hour).padStart(2, "0");
  const minute = String(timeVal.minute).padStart(2, "0");
  return `${hour}:${minute}`;
}

export function parseTimelineTime(timeStr?: string): { start: Time | null; end: Time | null } {
  if (!timeStr) return { start: null, end: null };
  let startStr = "";
  let endStr = "";
  if (timeStr.includes(" - ")) {
    const parts = timeStr.split(" - ");
    startStr = parts[0] || "";
    endStr = parts[1] || "";
  } else if (timeStr.includes("-") && !timeStr.includes("T")) {
    const parts = timeStr.split("-");
    startStr = parts[0] || "";
    endStr = parts[1] || "";
  } else {
    startStr = timeStr;
  }
  return {
    start: parseTimeString(startStr),
    end: parseTimeString(endStr)
  };
}

export function formatTimelineTime(start?: Time | null, end?: Time | null): string {
  const startStr = formatTimeToString(start);
  const endStr = formatTimeToString(end);
  if (startStr && endStr) {
    return `${startStr} - ${endStr}`;
  }
  return startStr || endStr || "";
}

