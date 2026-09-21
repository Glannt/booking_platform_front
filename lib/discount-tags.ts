import type { PromotionDto } from "@/lib/api/discount";

/**
 * Helpers for showing "save X%" tags on home cards.
 *
 * Promotions are fetched once per scope (see `useActiveDiscounts`) and then
 * matched to each card here — never fetch inside a render loop.
 */

/** True when the promotion is active and applies to the given scope target. */
export function isPromotionApplicable(
  promo: PromotionDto,
  scopeType: string,
  scopeRefId: string | number
): boolean {
  if (promo.active === false) return false;
  if (promo.status && promo.status !== "ACTIVE") return false;
  // No scopes = applies everywhere.
  if (!promo.scopes || promo.scopes.length === 0) return true;
  return promo.scopes.some((scope) => {
    if (scope.scopeType === "GLOBAL") return true;
    return (
      scope.scopeType === scopeType &&
      (!scope.scopeRefId || String(scope.scopeRefId) === String(scopeRefId))
    );
  });
}

/** Percentage saved by a promotion at the given price (0 when not computable). */
function promotionPercent(promo: PromotionDto, price: number): number {
  if (promo.discountType === "PERCENT") {
    return promo.discountValue > 0 ? promo.discountValue : 0;
  }
  if (promo.discountType === "FIXED_AMOUNT" && promo.discountValue > 0) {
    const original = price + promo.discountValue;
    return original > 0 ? Math.round((promo.discountValue / original) * 100) : 0;
  }
  return 0;
}

export interface DiscountTagsResult {
  /** Deduped "save X%" tags, one per applicable promotion. */
  tags: string[];
  /** Highest computed original price, for the struck-through price. */
  originalPrice?: number;
}

export function buildDiscountTags(
  promotions: PromotionDto[],
  price: number,
  savePercentTemplate: string
): DiscountTagsResult {
  if (price <= 0 || promotions.length === 0) return { tags: [] };

  const tags: string[] = [];
  let originalPrice: number | undefined;

  for (const promo of promotions) {
    const percent = promotionPercent(promo, price);
    if (percent <= 0) continue;
    tags.push(savePercentTemplate.replace("{percent}", String(percent)));
    const computedOriginal = Math.round((price / (1 - percent / 100)) / 10000) * 10000;
    if (computedOriginal > price && (originalPrice === undefined || computedOriginal > originalPrice)) {
      originalPrice = computedOriginal;
    }
  }

  return { tags: Array.from(new Set(tags)), originalPrice };
}
