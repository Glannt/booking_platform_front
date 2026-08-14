/**
 * Shared km-based pricing math.
 * Mirrors the backend calculators (AirportTransferPriceCalculator,
 * IntercityPriceCalculator): results are rounded to the nearest 1000 VND.
 */

export interface AirportPriceInput {
  baseKm: number;
  baseAmount: number;
  perKmAmount: number;
  fixedOvercharge?: boolean;
  feeOverchargeFixed?: number;
}

export function roundToThousand(value: number): number {
  return Math.round(value / 1000) * 1000;
}

/** oneWay calculation supporting fixedOvercharge and per-km rate. roundTrip = 2 * oneWay. */
export function calcAirportPrice(price: AirportPriceInput | undefined, actualKm?: number): { oneWay: number; roundTrip: number } {
  const baseKm = Number(price?.baseKm ?? 0);
  const baseAmount = Number(price?.baseAmount ?? 0);
  const perKmAmount = Number(price?.perKmAmount ?? 0);
  const fixedOvercharge = Boolean(price?.fixedOvercharge ?? false);
  const feeOverchargeFixed = price?.feeOverchargeFixed !== undefined && price?.feeOverchargeFixed !== null
    ? Number(price.feeOverchargeFixed)
    : 100000; // mặc định 100k

  const km = actualKm !== undefined && actualKm !== null ? Number(actualKm) : baseKm;
  const overage = Math.max(0, km - baseKm);
  
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
