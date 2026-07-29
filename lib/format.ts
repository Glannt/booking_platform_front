import type { Language } from "@/config/translations";

// ponytail: amounts stored in VND. Fallback rates used only when API is unreachable.
const FALLBACK_RATES: Record<Language, { locale: string; currency: string; rate: number }> = {
  vi: { locale: "vi-VN", currency: "VND", rate: 1 },
  en: { locale: "en-US", currency: "USD", rate: 1 / 25000 },
  ko: { locale: "ko-KR", currency: "KRW", rate: 1 / 18 },
  ru: { locale: "ru-RU", currency: "RUB", rate: 1 / 270 },
};

const LOCALE_MAP: Record<Language, string> = {
  vi: "vi-VN",
  en: "en-US",
  ko: "ko-KR",
  ru: "ru-RU",
};

const CURRENCY_BY_LANGUAGE: Record<Language, string> = {
  vi: "VND",
  en: "USD",
  ko: "KRW",
  ru: "RUB",
};

// In-memory cache for rates fetched from API
let cachedRates: Record<string, { rateToVnd: number; symbol: string }> | null = null;
let fetchPromise: Promise<void> | null = null;

function fetchRatesIfNeeded(): Promise<void> {
  if (cachedRates) return Promise.resolve();
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const backendUrl = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:8080");
      const res = await fetch(`${backendUrl}/api/v1/currencies/active`, {
        headers: { "Accept": "application/json" },
      });
      if (res.ok) {
        const data: Array<{ code: string; symbol: string; rateToVnd: number }> = await res.json();
        const map: Record<string, { rateToVnd: number; symbol: string }> = {};
        for (const c of data) {
          map[c.code] = { rateToVnd: c.rateToVnd, symbol: c.symbol };
        }
        if (Object.keys(map).length > 0) {
          cachedRates = map;
        }
      }
    } catch {
      // API unreachable — will use fallback rates
    }
  })();

  return fetchPromise;
}

// Eagerly kick off the fetch on module load (browser only)
if (typeof window !== "undefined") {
  fetchRatesIfNeeded();
}

/**
 * Format a VND amount into the locale-appropriate currency string.
 * Fetches exchange rates from the backend API, falls back to hardcoded rates if unavailable.
 */
export async function formatPrice(amountVND: number, language: Language = "vi"): Promise<string> {
  await fetchRatesIfNeeded();

  const currencyCode = CURRENCY_BY_LANGUAGE[language];
  const apiRate = cachedRates?.[currencyCode];

  if (apiRate) {
    const converted = amountVND / apiRate.rateToVnd;
    return new Intl.NumberFormat(LOCALE_MAP[language], {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(converted);
  }

  // Fallback to hardcoded rates
  const fallback = FALLBACK_RATES[language] ?? FALLBACK_RATES.vi;
  return new Intl.NumberFormat(fallback.locale, {
    style: "currency",
    currency: fallback.currency,
    maximumFractionDigits: 0,
  }).format(amountVND * fallback.rate);
}

/**
 * Synchronous version for admin/non-critical UI.
 * Uses cached rates if available, otherwise falls back to hardcoded rates.
 * Will show stale rates until the async fetch completes.
 */
export function formatPriceSync(amountVND: number, language: Language = "vi"): string {
  const currencyCode = CURRENCY_BY_LANGUAGE[language];
  const apiRate = cachedRates?.[currencyCode];

  if (apiRate) {
    const converted = amountVND / apiRate.rateToVnd;
    return new Intl.NumberFormat(LOCALE_MAP[language], {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(converted);
  }

  const fallback = FALLBACK_RATES[language] ?? FALLBACK_RATES.vi;
  return new Intl.NumberFormat(fallback.locale, {
    style: "currency",
    currency: fallback.currency,
    maximumFractionDigits: 0,
  }).format(amountVND * fallback.rate);
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
