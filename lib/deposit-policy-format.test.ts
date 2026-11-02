import { describe, it, expect } from "vitest";
import { formatDepositPolicy } from "./pricing/deposit";

/**
 * The null cases are the load-bearing ones. A price_lists row with no deposit is not the same as a
 * row with a 20% default, and this formatter is the single gate that keeps an unconfigured row from
 * rendering a number nobody set.
 */
describe("formatDepositPolicy", () => {
  it("returns null when the row has no deposit configured", () => {
    expect(formatDepositPolicy(undefined)).toBeNull();
    expect(formatDepositPolicy(null)).toBeNull();
    expect(formatDepositPolicy({})).toBeNull();
    expect(formatDepositPolicy({ depositType: null, depositRate: 30 })).toBeNull();
  });

  it("renders a percentage for PERCENT and its legacy RATE alias", () => {
    expect(formatDepositPolicy({ depositType: "PERCENT", depositRate: 30 })).toBe("30%");
    expect(formatDepositPolicy({ depositType: "RATE", depositRate: 20 })).toBe("20%");
    expect(formatDepositPolicy({ depositType: "percent", depositRate: 15 })).toBe("15%");
  });

  it("renders an amount for FIXED and PER_PERSON", () => {
    expect(formatDepositPolicy({ depositType: "FIXED", depositAmount: 500000 })).toBe("500,000 VND");
    expect(formatDepositPolicy({ depositType: "PER_PERSON", depositAmount: 250000 })).toBe("250,000 VND");
  });

  it("honours the row currency", () => {
    expect(formatDepositPolicy({ depositType: "FIXED", depositAmount: 500000 }, "KRW")).toBe("500,000 KRW");
  });

  it("refuses to render a rate or amount of zero", () => {
    // A stored 0 would be indistinguishable from "not configured" once it reaches the customer,
    // so it is treated as no deposit rather than shown as "0%".
    expect(formatDepositPolicy({ depositType: "PERCENT", depositRate: 0 })).toBeNull();
    expect(formatDepositPolicy({ depositType: "FIXED", depositAmount: 0 })).toBeNull();
    expect(formatDepositPolicy({ depositType: "PERCENT", depositRate: null })).toBeNull();
  });
});