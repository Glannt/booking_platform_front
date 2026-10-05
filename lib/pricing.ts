/**
 * Shared km-based pricing math.
 * Mirrors the backend calculators (AirportTransferPriceCalculator,
 * IntercityPriceCalculator): results are rounded to the nearest 1000 VND.
 */

import { IntercityPricingType, type IntercityRoutePriceDto } from "@/lib/api/intercity";
import { IntercityPriceTypeCode } from "@/types/intercity";

export interface AirportPriceInput {
  baseKm: number;
  baseAmount: number;
  perKmAmount: number;
  zoneBufferKm?: number;
  fixedOvercharge?: boolean;
  feeOverchargeFixed?: number;
}

export interface IntercityPrivatePriceInput {
  distanceKm?: number;
  pricingType?: IntercityPricingType | string;
  perKmAmount?: number;
  fixedPriceOneWay?: number;
  fixedPriceRoundTrip?: number;
  roundTripPrice?: number;
  roundTripPerKmAmount?: number;
  basePrice?: number;
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

/** oneWay = distanceKm * perKmAmount; roundTrip = 2 * oneWay. */
export function calcIntercityPrice(distanceKm: number | undefined, perKmAmount: number | undefined, roundTrip: boolean): number {
  const dist = Number(distanceKm ?? 0);
  const perKm = Number(perKmAmount ?? 0);
  const oneWay = roundToThousand(dist * perKm);
  return roundTrip ? oneWay * 2 : oneWay;
}

/**
 * A price_list row is keyed by (route, vehicleCategoryId, priceTypeCode) and carries ONE
 * basePrice, which IS the final price for that trip type. `oneWayPrice`/`roundTripPrice` are
 * admin write-only helpers — toDto never populates them, so reading them back always yielded
 * undefined and every round trip fell through to the `oneWay * 2` fallback below.
 *
 * @deprecated Prefer pickPriceListRow / resolveInDayPrice — they read the price straight from
 * the row the admin configured. Kept only for the legacy intercity_route_prices shape.
 */
export function calcIntercityPrivatePrice(
  input: IntercityPrivatePriceInput,
  roundTrip: boolean
): number {
  const isFixed = input.pricingType === IntercityPricingType.FIXED ||
    input.pricingType === "FIXED" ||
    (!Number(input.perKmAmount ?? 0) && (Boolean(input.fixedPriceOneWay) || Boolean(input.basePrice)));

  if (isFixed) {
    const oneWay = Number(input.fixedPriceOneWay ?? input.basePrice ?? 0);
    if (roundTrip) {
      if (input.fixedPriceRoundTrip && Number(input.fixedPriceRoundTrip) > 0) {
        return Number(input.fixedPriceRoundTrip);
      }
      if (input.roundTripPrice && Number(input.roundTripPrice) > 0) {
        return Number(input.roundTripPrice);
      }
      return oneWay * 2;
    }
    return oneWay;
  }

  // Default: PER_KM
  const dist = Number(input.distanceKm ?? 0);
  const perKm = Number(input.perKmAmount ?? 0);
  const oneWay = roundToThousand(dist * perKm);

  if (roundTrip) {
    if (input.roundTripPrice && Number(input.roundTripPrice) > 0) {
      return Number(input.roundTripPrice);
    }
    if (input.roundTripPerKmAmount && Number(input.roundTripPerKmAmount) > 0) {
      return roundToThousand(dist * Number(input.roundTripPerKmAmount) * 2);
    }
    return oneWay * 2;
  }
  return oneWay;
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

/**
 * Calculates shared vehicle price per passenger,
 * supporting independent roundTrip pricing.
 */
export function calcSharedPrice(
  priceOneWay: number | undefined,
  priceRoundTrip: number | undefined,
  passengerCount: number,
  roundTrip: boolean
): number {
  const pax = Math.max(1, passengerCount || 1);
  const oneWay = Number(priceOneWay ?? 0);
  if (roundTrip) {
    const round = (priceRoundTrip && Number(priceRoundTrip) > 0)
      ? Number(priceRoundTrip)
      : oneWay * 2;
    return round * pax;
  }
  return oneWay * pax;
}

