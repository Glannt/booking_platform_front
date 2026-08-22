import type { Language } from "@/config/translations";

const LOCALE_FALLBACK: Language[] = ["en", "vi"];

interface Translatable {
  locale: string;
  [key: string]: any;
}

/**
 * Resolve a translation from an array with fallback chain: current locale → en → vi → first available.
 */
export function resolveTranslation<T extends Translatable>(
  translations: T[] | undefined,
  language: Language,
): T | undefined {
  if (!translations?.length) return undefined;

  const current = translations.find((tr) => tr.locale === language);
  if (current) return current;

  for (const fallback of LOCALE_FALLBACK) {
    const match = translations.find((tr) => tr.locale === fallback);
    if (match) return match;
  }

  return translations[0];
}

/**
 * Resolve a localized name from a translations array.
 */
export function resolveLocalizedName(
  translations: Array<{ locale: string; name: string }> | undefined,
  language: Language,
  fallbackName: string = "",
): string {
  const t = resolveTranslation(translations, language);
  return t?.name || fallbackName;
}

/**
 * Resolve a localized description from a translations array.
 */
export function resolveLocalizedDescription(
  translations: Array<{ locale: string; description: string }> | undefined,
  language: Language,
  fallbackDesc: string = "",
): string {
  const t = resolveTranslation(translations, language);
  return t?.description || fallbackDesc;
}

/**
 * Resolve localized content from a translations array.
 */
export function resolveLocalizedContent(
  translations: Array<{ locale: string; content: string }> | undefined,
  language: Language,
  fallbackContent: string = "",
): string {
  const t = resolveTranslation(translations, language);
  return t?.content || fallbackContent;
}

/**
 * Resolve a localized slug from a translations array.
 */
export function resolveLocalizedSlug(
  translations: Array<{ locale: string; slug?: string }> | undefined,
  language: Language,
  fallbackSlug: string = "",
): string {
  const t = resolveTranslation(translations, language);
  return t?.slug || fallbackSlug;
}

/**
 * Generic localized text getter — picks the field matching the key name.
 * Useful for resolving any string field (e.g., "description", "title", "name") from translations.
 */
export function resolveLocalizedField<K extends string>(
  translations: Array<Record<K, string> & { locale: string }> | undefined,
  language: Language,
  field: K,
  fallback: string = "",
): string {
  const t = resolveTranslation(translations, language);
  return (t?.[field] as string) || fallback;
}
