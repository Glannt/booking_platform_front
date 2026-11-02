/**
 * Shared km-based pricing math.
 * Mirrors the backend calculators (AirportTransferPriceCalculator,
 * IntercityPriceCalculator): results are rounded to the nearest 1000 VND.
 */

import { type IntercityRoutePriceDto } from "@/lib/api/intercity";
import { IntercityPriceTypeCode } from "@/types/intercity";

export interface AirportPriceInput {
  baseKm: number;
  baseAmount: number;
  perKmAmount: number;
  zoneBufferKm?: number;
  fixedOvercharge?: boolean;
  feeOverchargeFixed?: number;
}

export function roundToThousand(value: number): number {
  return Math.round(value / 1000) * 1000;
}

/** oneWay calculation supporting zoneBufferKm, fixedOvercharge and per-km rate. roundTrip = 2 * oneWay. */
export function calcAirportPrice(price: AirportPriceInput | undefined, actualKm?: number): { oneWay: number; roundTrip: number } {
  const baseKm = Number(price?.baseKm ?? 0);
  const zoneBufferKm = Number(price?.zoneBufferKm ?? 0);
  const effectiveBaseKm = baseKm + zoneBufferKm;
  const baseAmount = Number(price?.baseAmount ?? 0);
  const perKmAmount = Number(price?.perKmAmount ?? 0);
  const fixedOvercharge = Boolean(price?.fixedOvercharge ?? false);
  const feeOverchargeFixed = price?.feeOverchargeFixed !== undefined && price?.feeOverchargeFixed !== null
    ? Number(price.feeOverchargeFixed)
    : 100000; // mặc định 100k

  const km = actualKm !== undefined && actualKm !== null ? Number(actualKm) : baseKm;
  const overage = Math.max(0, km - effectiveBaseKm);
  
  let oneWay = baseAmount;
  if (overage > 0) {
    if (fixedOvercharge) {
      oneWay += feeOverchargeFixed;
    } else {
      oneWay += overage * perKmAmount;
    }
  }

  oneWay = roundToThousand(oneWay);
  return { oneWay, roundTrip: oneWay * 2 };
}

/**
 * Picks the ACTIVE price_list row for exactly one price type. Never falls back to a sibling
 * type: ROUND_TRIP_SAME_DAY and ONE_WAY are distinct products with distinct prices.
 */
export function pickPriceListRow(
  prices: IntercityRoutePriceDto[] | undefined,
  vehicleCategoryId: number,
  priceTypeCode: IntercityPriceTypeCode | string
): IntercityRoutePriceDto | undefined {
  return prices?.find(
    (p) =>
      Number(p.vehicleCategoryId) === Number(vehicleCategoryId) &&
      p.priceTypeCode === priceTypeCode &&
      (p.active ?? (p.status !== "INACTIVE"))
  );
}

/**
 * Final in-day price straight from price_list. Returns 0 when the trip type has no configured
 * row — a missing price must surface as missing, never as a derived 2x one-way fare.
 */
export function resolveInDayPrice(
  prices: IntercityRoutePriceDto[] | undefined,
  vehicleCategoryId: number,
  roundTrip: boolean
): number {
  const row = pickPriceListRow(
    prices,
    vehicleCategoryId,
    roundTrip ? IntercityPriceTypeCode.ROUND_TRIP_SAME_DAY : IntercityPriceTypeCode.ONE_WAY
  );
  return Number(row?.basePrice ?? 0);
}

/**
 * Calculates intercity daily rate price: dailyRate * rentalDays
 */
export function calcIntercityDailyRatePrice(
  dailyRate: number | undefined,
  rentalDays: number | undefined,
  minimumDays: number = 1
): number {
  const rate = Number(dailyRate ?? 0);
  const days = Math.max(minimumDays, Number(rentalDays ?? 1));
  return roundToThousand(rate * days);
}

