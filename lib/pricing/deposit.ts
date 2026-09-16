export enum DepositType {
  FIXED = "FIXED",
  RATE = "RATE",
  PERCENT = "PERCENT",
  PER_PERSON = "PER_PERSON",
  CUSTOM = "CUSTOM",
}

export interface DepositCalculation {
  depositType: DepositType;
  depositRate?: number;
  depositAmount: number;
  remainingAmount: number;
  paidAmount: number;
  description?: string;
}

export const DEFAULT_MODULE_DEPOSIT_RATES = {
  TOUR: 30,
  INTERCITY: 20,
  AIRPORT: 20,
  SELF_DRIVE: 30,
} as const;

/**
 * Calculates deposit, paid, and remaining amounts based on depositType (PERCENT, FIXED, PER_PERSON).
 * - Cọc percent hoặc fixed đều tính từ tổng giá.
 * - PER_PERSON: adultCount * depositPerAdult + childCount * depositPerChild (capped by totalAmount).
 * - FIXED: fixedDepositAmount (capped by totalAmount).
 * - PERCENT / RATE: (totalAmount * rate) / 100 rounded to 1,000 VND (capped by totalAmount).
 */
export function calculateDeposit({
  totalAmount,
  depositType = DepositType.PERCENT,
  depositRate,
  depositAmount,
  adultCount = 0,
  childCount = 0,
  depositPerAdult = 0,
  depositPerChild = 0,
  receivedAmount = 0,
  defaultRate = 20,
}: {
  totalAmount: number;
  depositType?: DepositType | string;
  depositRate?: number;
  depositAmount?: number;
  adultCount?: number;
  childCount?: number;
  depositPerAdult?: number;
  depositPerChild?: number;
  receivedAmount?: number;
  defaultRate?: number;
}): DepositCalculation {
  const total = Math.max(0, Math.round(totalAmount || 0));
  const received = Math.max(0, Math.round(receivedAmount || 0));

  let normalizedType = (depositType || DepositType.PERCENT).toUpperCase();
  if (normalizedType === "RATE") normalizedType = DepositType.PERCENT;

  let finalDeposit = 0;
  let finalRate = depositRate;
  let description = "";

  if (normalizedType === DepositType.PER_PERSON) {
    const adults = Math.max(0, Math.round(adultCount || 0));
    const children = Math.max(0, Math.round(childCount || 0));
    const adDep = Math.max(0, Math.round(depositPerAdult || 0));
    const chDep = Math.max(0, Math.round(depositPerChild || 0));
    const perPersonTotal = adults * adDep + children * chDep;

    if (perPersonTotal > 0) {
      finalDeposit = Math.min(total, perPersonTotal);
      finalRate = total > 0 ? Number(((finalDeposit / total) * 100).toFixed(1)) : 0;
      description = `Cọc vé: ${adults} vé người lớn, ${children} vé trẻ em`;
    } else {
      normalizedType = DepositType.PERCENT;
      const rate = depositRate !== undefined && depositRate > 0 ? depositRate : defaultRate;
      finalRate = rate;
      const rawDeposit = Math.round((total * rate) / 100);
      finalDeposit = Math.min(total, Math.round(rawDeposit / 1000) * 1000);
      description = `Đặt cọc ${rate}%`;
    }
  } else if (normalizedType === DepositType.FIXED) {
    finalDeposit = Math.min(total, Math.max(0, Math.round(depositAmount ?? 0)));
    finalRate = total > 0 ? Number(((finalDeposit / total) * 100).toFixed(1)) : 0;
    description = `Tiền cọc cố định`;
  } else {
    // PERCENT mode
    normalizedType = DepositType.PERCENT;
    const rate = depositRate !== undefined && depositRate > 0 ? depositRate : defaultRate;
    finalRate = rate;
    const rawDeposit = Math.round((total * rate) / 100);
    finalDeposit = Math.min(total, Math.round(rawDeposit / 1000) * 1000);
    description = `Đặt cọc ${rate}%`;
  }

  const paidAmount = finalDeposit + received;
  const remainingAmount = Math.max(0, total - paidAmount);

  return {
    depositType: normalizedType as DepositType,
    depositRate: finalRate,
    depositAmount: finalDeposit,
    remainingAmount,
    paidAmount,
    description,
  };
}
