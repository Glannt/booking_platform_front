/**
 * Airport transfer home-section package cards.
 *
 * Builds the card data displayed by `HomeAirportTransferSection` from two
 * sources:
 *  - vehicle categories + the lowest one-way API price per category
 *    (`AirportTransferPrice` computed with the same math as the backend), and
 *  - admin-configured package overrides (static texts / image stored in the
 *    section's `contentData.packages` JSON).
 *
 * Pure helpers so the price + merge logic stays unit-testable.
 */

import { calcAirportPrice } from "@/lib/pricing";
import type { AirportTransferPrice, VehicleCategoryDto } from "@/lib/api/fleet";

export const PACKAGE_LOCALES = ["vi", "en", "ko", "ru"] as const;
export type PackageLocale = (typeof PACKAGE_LOCALES)[number];

export type LocalizedText = Record<PackageLocale, string>;
export type LocalizedFeatures = Record<PackageLocale, string[]>;

const SEAT_UNITS: Record<PackageLocale, string> = {
  vi: "chỗ",
  en: "seats",
  ko: "인승",
  ru: "мест",
};
const BAG_UNITS: Record<PackageLocale, string> = {
  vi: "vali",
  en: "bags",
  ko: "개 수하물",
  ru: "багаж",
};

/** Package config as saved by admin into section `contentData.packages`. */
export interface AirportPackageConfig {
  id: string;
  /** Linked vehicle category => price is taken from its lowest API price. */
  vehicleCategoryId?: number;
  active?: boolean;
  imageUrl?: string;
  name: LocalizedText;
  tag?: Partial<LocalizedText>;
  categoryText?: Partial<LocalizedText>;
  capacityText: Partial<LocalizedText>;
  luggageText: Partial<LocalizedText>;
  features?: Partial<LocalizedFeatures>;
}

/** Fully resolved card the section renders (localized per locale). */
export interface AirportPackageCard {
  id: string;
  vehicleCategoryId?: number;
  categoryCode?: string;
  imageUrl: string;
  /** Lowest one-way price (VND) across the default airport's active routes. */
  minPrice?: number;
  name: LocalizedText;
  category?: LocalizedText;
  tag?: LocalizedText;
  capacityText?: LocalizedText;
  luggageText?: LocalizedText;
  features?: LocalizedFeatures;
}

/** Lowest one-way price per vehicle category across every route's price list. */
export function computeMinPricesByCategory(
  priceGroups: AirportTransferPrice[][]
): Map<number, number> {
  const min = new Map<number, number>();
  for (const prices of priceGroups) {
    for (const p of prices) {
      if (!p.active) continue;
      const oneWay = calcAirportPrice(p).oneWay;
      const prev = min.get(p.vehicleCategoryId);
      if (prev === undefined || oneWay < prev) min.set(p.vehicleCategoryId, oneWay);
    }
  }
  return min;
}

/** Base cards auto-generated from vehicle categories that have an API price. */
export function buildAirportSystemCards(opts: {
  categories: VehicleCategoryDto[];
  minPrices: Map<number, number>;
  resolveImageUrl: (url?: string) => string;
}): AirportPackageCard[] {
  const { categories, minPrices, resolveImageUrl } = opts;

  const nameOf = (cat: VehicleCategoryDto): LocalizedText => {
    const name = {} as LocalizedText;
    for (const loc of PACKAGE_LOCALES) {
      name[loc] =
        cat.translations?.find((tr) => tr.locale === loc)?.name ||
        cat.translations?.find((tr) => tr.locale === "en")?.name ||
        cat.code;
    }
    return name;
  };

  const range = (min: number, max: number) =>
    min === max ? `${min}` : `${min}-${max}`;

  const cards: AirportPackageCard[] = [];
  for (const cat of categories) {
    if (!cat.active) continue;
    const minPrice = minPrices.get(cat.id);
    if (minPrice === undefined) continue; // ponytail: category chưa có bảng giá thì không hiển thị card mặc định

    const capacityText = {} as LocalizedText;
    const luggageText = {} as LocalizedText;
    for (const loc of PACKAGE_LOCALES) {
      capacityText[loc] = `${range(cat.minSeat, cat.maxSeat)} ${SEAT_UNITS[loc]}`;
      luggageText[loc] = `${range(cat.minLuggage, cat.maxLuggage)} ${BAG_UNITS[loc]}`;
    }

    cards.push({
      id: `cat-${cat.id}`,
      vehicleCategoryId: cat.id,
      categoryCode: cat.code,
      imageUrl: resolveImageUrl(cat.thumbnailUrl),
      minPrice,
      name: nameOf(cat),
      capacityText,
      luggageText,
    });
  }

  return cards.sort((a, b) => {
    const sa = categories.find((c) => c.id === a.vehicleCategoryId)?.minSeat ?? 0;
    const sb = categories.find((c) => c.id === b.vehicleCategoryId)?.minSeat ?? 0;
    return sa - sb;
  });
}

/** Merges per-locale optional text with a base fallback; undefined when empty. */
function pickText(
  cfg?: Partial<LocalizedText>,
  base?: LocalizedText
): LocalizedText | undefined {
  const out = {} as LocalizedText;
  let has = false;
  for (const loc of PACKAGE_LOCALES) {
    const val = cfg?.[loc]?.trim() || base?.[loc] || "";
    if (val) has = true;
    out[loc] = val;
  }
  return has ? out : undefined;
}

function mergeFeatures(
  cfg?: Partial<LocalizedFeatures>,
  base?: LocalizedFeatures
): LocalizedFeatures | undefined {
  const out = {} as LocalizedFeatures;
  let has = false;
  for (const loc of PACKAGE_LOCALES) {
    const cleaned = (cfg?.[loc] || [])
      .map((s) => (s || "").trim())
      .filter(Boolean);
    const baseCleaned = (base?.[loc] || []).filter(Boolean);
    const arr = cleaned.length ? cleaned : baseCleaned;
    if (arr.length) has = true;
    out[loc] = arr;
  }
  return has ? out : undefined;
}

/**
 * Applies admin-configured packages on top of the system cards.
 * Keeps the API price of the linked category, preserves config order,
 * drops inactive packages. Empty config => system cards unchanged.
 */
export function applyAirportPackageConfig(
  systemCards: AirportPackageCard[],
  configPackages?: AirportPackageConfig[] | null
): AirportPackageCard[] {
  if (!configPackages || configPackages.length === 0) return systemCards;

  const byCategory = new Map<number, AirportPackageCard>();
  systemCards.forEach((c) => {
    if (c.vehicleCategoryId != null) byCategory.set(c.vehicleCategoryId, c);
  });

  const cards: AirportPackageCard[] = [];
  for (const cfg of configPackages) {
    if (cfg.active === false) continue;
    if (!cfg.id) continue;

    const base =
      cfg.vehicleCategoryId != null ? byCategory.get(cfg.vehicleCategoryId) : undefined;

    const name = {} as LocalizedText;
    for (const loc of PACKAGE_LOCALES) {
      name[loc] = cfg.name[loc]?.trim() || base?.name[loc] || "";
    }

    cards.push({
      id: cfg.id,
      vehicleCategoryId: cfg.vehicleCategoryId,
      categoryCode: base?.categoryCode,
      minPrice: base?.minPrice,
      imageUrl: cfg.imageUrl?.trim() || base?.imageUrl || "",
      name,
      category: pickText(cfg.categoryText, base?.category),
      tag: pickText(cfg.tag),
      capacityText: pickText(cfg.capacityText, base?.capacityText),
      luggageText: pickText(cfg.luggageText, base?.luggageText),
      features: mergeFeatures(cfg.features, base?.features),
    });
  }

  return cards;
}