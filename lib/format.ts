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
