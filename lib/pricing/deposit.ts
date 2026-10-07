export enum DepositType {
  FIXED = "FIXED",
  RATE = "RATE",
  PERCENT = "PERCENT",
}

export interface DepositCalculation {
  depositType?: DepositType;
  depositRate?: number;
  depositAmount: number;
  remainingAmount: number;
  paidAmount: number;
}

/**
 * Human-readable deposit for admin tables and detail modals.
 *
 * Returns **null** when the row has no usable policy — callers must then hide the cell. That null
 * is the whole point: a price row with no deposit is not the same as one with a 20% default, and
 * showing a number nobody configured is exactly the fabrication this codebase forbids.
 */
export function formatDepositPolicy(
  deposit?: {
    depositType?: DepositType | string | null;
    depositRate?: number | null;
    depositAmount?: number | null;
  } | null,
  currency = "VND",
): string | null {
  const type = (deposit?.depositType || "").toUpperCase();
  if (!type) return null;

  if (type === "PERCENT" || type === "RATE") {
    const rate = Number(deposit?.depositRate);
    return Number.isFinite(rate) && rate > 0 ? `${rate}%` : null;
  }

  const amount = Number(deposit?.depositAmount);
  return Number.isFinite(amount) && amount > 0 ? `${amount.toLocaleString()} ${currency}` : null;
}

interface DepositFields {
  depositType?: DepositType | string | null;
  depositRate?: number | null;
  depositAmount?: number | null;
}

/**
 * Which deposit the airport flow quotes: the transfer price row that priced the trip, then the
 * route it travels.
 *
 * Exactly the two levels the server applies in `AirportFacade.resolveDepositPolicy`, and it has to
 * stay that way: the booking no longer sends a deposit, so this figure is only ever a quote, and a
 * quote that disagrees with what the server charges is a dispute. `depositType` alone is the
 * discriminator, as on the server — a rate with no type is an unconfigured row, not a rate.
 *
 * @returns an empty object when neither level is configured, never a defaulted figure
 */
export function resolveAirportDepositPolicy(
  row?: DepositFields | null,
  route?: DepositFields | null,
): { depositType?: DepositType | string; depositRate?: number; depositAmount?: number } {
  const source = row?.depositType ? row : route;
  if (!source?.depositType) return {};
  return {
    depositType: source.depositType,
    depositRate: source.depositRate ?? undefined,
    depositAmount: source.depositAmount ?? undefined,
  };
}

/**
 * Calculates the deposit the server will charge, from the policy configured on the item being
 * booked. Display only — the booking itself sends no deposit.
 *
 * There is no default. An unconfigured policy (blank type, or a rate/amount nobody set) yields
 * 0đ and no type, so callers hide the deposit row rather than inventing a rate. This mirrors
 * `DepositPolicies.configured` on the server: a null/blank type means "no deposit".
 *
 * - PERCENT / RATE: `(totalAmount * rate) / 100`, rounded to 1,000 VND, capped by the total.
 * - FIXED: the configured amount, capped by the total.
 */
export function calculateDeposit({
  totalAmount,
  depositType,
  depositRate,
  depositAmount,
  receivedAmount = 0,
}: {
  totalAmount: number;
  depositType?: DepositType | string | null;
  depositRate?: number | null;
  depositAmount?: number | null;
  receivedAmount?: number;
}): DepositCalculation {
  const total = Math.max(0, Math.round(totalAmount || 0));
  const received = Math.max(0, Math.round(receivedAmount || 0));
  const type = (depositType || "").toUpperCase();

  let normalizedType: DepositType | undefined;
  let finalRate: number | undefined;
  let finalDeposit = 0;

  if (type === DepositType.FIXED) {
    normalizedType = DepositType.FIXED;
    finalDeposit = Math.min(total, Math.max(0, Math.round(depositAmount ?? 0)));
    finalRate = total > 0 ? Number(((finalDeposit / total) * 100).toFixed(1)) : 0;
  } else if (
    (type === DepositType.PERCENT || type === DepositType.RATE) &&
    depositRate != null &&
    depositRate > 0
  ) {
    normalizedType = DepositType.PERCENT;
    finalRate = depositRate;
    const rawDeposit = Math.round((total * depositRate) / 100);
    finalDeposit = Math.min(total, Math.round(rawDeposit / 1000) * 1000);
  }

  const paidAmount = finalDeposit + received;
  const remainingAmount = Math.max(0, total - paidAmount);

  return {
    depositType: normalizedType,
    depositRate: finalRate,
    depositAmount: finalDeposit,
    remainingAmount,
    paidAmount,
  };
}
