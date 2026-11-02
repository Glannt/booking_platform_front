import { describe, it, expect } from "vitest";
import { pickPriceListRow, resolveInDayPrice } from "./pricing";
import type { IntercityRoutePriceDto } from "./api/intercity";
import { IntercityPriceTypeCode } from "@/types/intercity";

/**
 * Shapes below are the real /api/v1/public/intercity-route-prices?routeId=1 payload for
 * route "xe-nha-trang-di-da-lat": ONE_WAY id 4 before ROUND_TRIP_SAME_DAY id 5, both
 * priceTypeCategory IN_DAY, and the write-only helper fields left null by toDto.
 */
const row = (
  id: number,
  vehicleCategoryId: number,
  priceTypeCode: string,
  basePrice: number
): IntercityRoutePriceDto =>
  ({
    id,
    priceTypeCode,
    priceTypeCategory: priceTypeCode === "DAILY_RATE" ? "DAILY_RATE" : "IN_DAY",
    vehicleCategoryId,
    basePrice,
    currency: "VND",
    status: "ACTIVE",
    active: true,
    oneWayPrice: null,
    roundTripPrice: null,
    dailyRatePrice: null,
  }) as unknown as IntercityRoutePriceDto;

const PRICES: IntercityRoutePriceDto[] = [
  row(1, 1, "ONE_WAY", 1_350_000),
  row(2, 1, "ROUND_TRIP_SAME_DAY", 2_430_000),
  row(3, 1, "DAILY_RATE", 1_200_000),
  row(4, 2, "ONE_WAY", 1_688_000),
  row(5, 2, "ROUND_TRIP_SAME_DAY", 3_038_000),
  row(6, 2, "DAILY_RATE", 1_500_000),
  row(7, 3, "ONE_WAY", 2_430_000),
  row(8, 3, "ROUND_TRIP_SAME_DAY", 4_374_000),
];

describe("pickPriceListRow", () => {
  it("selects the requested price type, not the first IN_DAY row", () => {
    const rt = pickPriceListRow(PRICES, 2, IntercityPriceTypeCode.ROUND_TRIP_SAME_DAY);
    expect(rt?.id).toBe(5);
    expect(pickPriceListRow(PRICES, 2, IntercityPriceTypeCode.ONE_WAY)?.id).toBe(4);
    expect(pickPriceListRow(PRICES, 2, IntercityPriceTypeCode.DAILY_RATE)?.id).toBe(6);
  });

  it("never falls back to a sibling price type", () => {
    // category 4 has no price row configured at all
    expect(pickPriceListRow(PRICES, 4, IntercityPriceTypeCode.ROUND_TRIP_SAME_DAY)).toBeUndefined();
  });

  it("ignores INACTIVE rows", () => {
    const inactive = [{ ...row(5, 2, "ROUND_TRIP_SAME_DAY", 3_038_000), active: false }];
    expect(pickPriceListRow(inactive, 2, IntercityPriceTypeCode.ROUND_TRIP_SAME_DAY)).toBeUndefined();
  });
});

describe("resolveInDayPrice", () => {
  it("returns the configured round-trip price, not 2x one-way", () => {
    expect(resolveInDayPrice(PRICES, 2, true)).toBe(3_038_000);
    // the regression: this used to be 1_688_000 * 2
    expect(resolveInDayPrice(PRICES, 2, true)).not.toBe(3_376_000);
  });

  it("returns the configured one-way price", () => {
    expect(resolveInDayPrice(PRICES, 2, false)).toBe(1_688_000);
    expect(resolveInDayPrice(PRICES, 1, false)).toBe(1_350_000);
    expect(resolveInDayPrice(PRICES, 3, true)).toBe(4_374_000);
  });

  it("returns 0 when the trip type has no configured row instead of deriving a price", () => {
    expect(resolveInDayPrice(PRICES, 4, true)).toBe(0);
    expect(resolveInDayPrice(undefined, 2, true)).toBe(0);
  });
});