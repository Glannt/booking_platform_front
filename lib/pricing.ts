/**
 * Shared km-based pricing math.
 * Mirrors the backend calculators (AirportTransferPriceCalculator,
 * IntercityPriceCalculator): results are rounded to the nearest 1000 VND.
 */

import { IntercityPricingType } from "@/lib/api/intercity";

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
 * Calculates private car trip price with FIXED or PER_KM pricing,
 * respecting roundTripPrice or fixedPriceRoundTrip overrides.
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

