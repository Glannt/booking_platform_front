import { describe, it, expect } from "vitest";
import { isPromotionApplicable, buildDiscountTags } from "./discount-tags";
import type { PromotionDto } from "./api/discount";

const makePromo = (partial: Partial<PromotionDto>): PromotionDto => ({
  issuanceType: "PUBLIC",
  discountType: "PERCENT",
  discountValue: 0,
  active: true,
  ...partial,
});

describe("isPromotionApplicable", () => {
  it("applies everywhere when there are no scopes", () => {
    const promo = makePromo({});
    expect(isPromotionApplicable(promo, "TOUR", 1)).toBe(true);
    expect(isPromotionApplicable(promo, "SELF_DRIVE", 9)).toBe(true);
  });

  it("GLOBAL scope applies to any target", () => {
    const promo = makePromo({ scopes: [{ scopeType: "GLOBAL" }] });
    expect(isPromotionApplicable(promo, "INTERCITY_ROUTE", 5)).toBe(true);
  });

  it("matches scopeRefId only for the matching scope type", () => {
    const promo = makePromo({ scopes: [{ scopeType: "TOUR", scopeRefId: "7" }] });
    expect(isPromotionApplicable(promo, "TOUR", 7)).toBe(true);
    expect(isPromotionApplicable(promo, "TOUR", 8)).toBe(false);
    expect(isPromotionApplicable(promo, "SELF_DRIVE", 7)).toBe(false);
  });

  it("empty scopeRefId means the scope type applies to everything", () => {
    const promo = makePromo({ scopes: [{ scopeType: "SHARED_ROUTE" }] });
    expect(isPromotionApplicable(promo, "SHARED_ROUTE", 42)).toBe(true);
  });

  it("rejects inactive promotions", () => {
    const promo = makePromo({ active: false });
    expect(isPromotionApplicable(promo, "TOUR", 1)).toBe(false);
  });
});

describe("buildDiscountTags", () => {
  it("builds one tag per percent promotion and dedupes", () => {
    const result = buildDiscountTags(
      [
        makePromo({ discountType: "PERCENT", discountValue: 10 }),
        makePromo({ discountType: "PERCENT", discountValue: 10 }),
        makePromo({ discountType: "PERCENT", discountValue: 25 }),
      ],
      100000,
      "SAVE {percent}%"
    );
    expect(result.tags).toEqual(["SAVE 10%", "SAVE 25%"]);
    expect(result.originalPrice).toBeDefined();
    expect(result.originalPrice!).toBeGreaterThan(100000);
  });

  it("derives a percent tag from FIXED_AMOUNT", () => {
    const result = buildDiscountTags(
      [makePromo({ discountType: "FIXED_AMOUNT", discountValue: 25000 })],
      100000,
      "SAVE {percent}%"
    );
    expect(result.tags).toContain("SAVE 20%");
  });

  it("returns no tags for a zero or negative price", () => {
    expect(buildDiscountTags([makePromo({ discountValue: 10 })], 0, "SAVE {percent}%").tags).toEqual([]);
  });
});