import { resolveLocalizedSlug } from "./i18n-helpers";
import type { Language } from "@/config/translations";

/**
 * Utility to convert Vietnamese text into URL-friendly slug.
 * - Converts accented Vietnamese letters to Latin equivalents
 * - Replaces 'đ' and 'Đ' with 'd'
 * - Lowercases and strips special characters
 * - Replaces spaces and underscores with '-'
 * - Cleans up duplicate, leading, and trailing hyphens
 */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface TranslatableEntityWithSlug {
  id?: number | string | null;
  slug?: string | null;
  code?: string | null;
  translations?: Array<{
    locale: string;
    slug?: string | null;
    name?: string | null;
  }> | null;
}

export function isNumeric(val: string | number | null | undefined): boolean {
  if (val == null) return false;
  const str = String(val).trim();
  return /^\d+$/.test(str);
}

/**
 * Returns a guaranteed canonical slug string for SEO-friendly URLs.
 * Priority:
 * 1. Current locale translation slug
 * 2. Root slug
 * 3. Any translation slug
 * 4. Code (e.g. vehicle category "sedan-4", "suv-7")
 * 5. Slugified translation name
 * 6. Fallback prefix with slugified identifier
 * 
 * NEVER returns a raw numeric ID (e.g. "1", "2").
 */
export function getCanonicalSlug(
  entity: TranslatableEntityWithSlug | null | undefined,
  language: string,
  fallbackPrefix: string = "item"
): string {
  if (!entity) return `${fallbackPrefix}-detail`;

  // 1. Current locale's translation slug
  const localizedSlug = resolveLocalizedSlug(entity.translations as any, language as Language);
  if (localizedSlug && !isNumeric(localizedSlug)) {
    return localizedSlug.trim();
  }

  // 2. Root entity slug
  if (entity.slug && !isNumeric(entity.slug)) {
    return entity.slug.trim();
  }

  // 3. Any translation with a valid non-numeric slug
  const anyTransSlug = entity.translations?.find((t) => t.slug && !isNumeric(t.slug))?.slug;
  if (anyTransSlug) {
    return anyTransSlug.trim();
  }

  // 4. Code (if string and non-numeric, like "sedan-4", "suv-7")
  if (entity.code && !isNumeric(entity.code)) {
    return slugify(entity.code);
  }

  // 5. Slugify the localized name or first translation name
  const localizedName =
    entity.translations?.find((t) => t.locale === language)?.name ||
    entity.translations?.[0]?.name;
  if (localizedName && localizedName.trim()) {
    const s = slugify(localizedName);
    if (s && !isNumeric(s)) return s;
  }

  return `${fallbackPrefix}-${entity.id || "item"}`;
}
