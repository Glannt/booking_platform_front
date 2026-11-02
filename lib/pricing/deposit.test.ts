import { describe, expect, it } from "vitest";
import { calculateDeposit, resolveAirportDepositPolicy } from "./deposit";

const UNSET = { depositType: null, depositRate: null, depositAmount: null };
const TOTAL = 500_000;

/**
 * The airport confirm page quotes a deposit in two steps — transfer price row, then the route
 * it travels. The row and the route used to be indistinguishable, because both DTOs used to
 * substitute a 20% default for an unconfigured row, which made the route level dead code. Now
 * that an untouched row reads back as untouched, both levels are reachable and each has to land
 * on the same number the server will charge.
 */
describe("resolveAirportDepositPolicy", () => {
  it("quotes the transfer price row when that row has one", () => {
    const policy = resolveAirportDepositPolicy(
      { depositType: "PERCENT", depositRate: 15, depositAmount: null },
      { depositType: "FIXED", depositRate: null, depositAmount: 300_000 },
    );

    expect(policy.depositType).toBe("PERCENT");
    expect(policy.depositRate).toBe(15);
    expect(policy.depositAmount).toBeUndefined();
  });

  it("falls through to the route when the row was never configured", () => {
    const policy = resolveAirportDepositPolicy(
      UNSET,
      { depositType: "FIXED", depositRate: null, depositAmount: 300_000 },
    );

    expect(policy.depositType).toBe("FIXED");
    expect(policy.depositAmount).toBe(300_000);
  });

  /**
   * There is no module default to fall back to any more. Neither level configured means no
   * deposit at all — quoting a number here would put a figure on the screen the server will not
   * charge.
   */
  it("returns nothing when neither level is configured", () => {
    const policy = resolveAirportDepositPolicy(UNSET, UNSET);

    expect(policy.depositType).toBeUndefined();
    expect(policy.depositRate).toBeUndefined();
    expect(policy.depositAmount).toBeUndefined();

    const quote = calculateDeposit({ totalAmount: TOTAL, ...policy });
    expect(quote.depositType).toBeUndefined();
    expect(quote.depositRate).toBeUndefined();
    expect(quote.depositAmount).toBe(0);
    expect(quote.remainingAmount).toBe(TOTAL);
  });

  /**
   * The row-versus-route decision is made on the type alone, exactly as
   * `DepositPolicies.configured` does on the server. A rate with no type is an untouched row,
   * and quoting it would put a number on the screen that neither the row nor the route chose.
   */
  it("treats a rate with no type as unconfigured, the way the server does", () => {
    const policy = resolveAirportDepositPolicy(
      { depositType: null, depositRate: 45, depositAmount: null },
      null,
    );

    expect(policy.depositType).toBeUndefined();
    expect(policy.depositRate).toBeUndefined();
    expect(policy.depositAmount).toBeUndefined();
  });
});

describe("calculateDeposit", () => {
  it("has no default: an unconfigured policy is 0đ, not a made-up rate", () => {
    const quote = calculateDeposit({ totalAmount: TOTAL });

    expect(quote.depositType).toBeUndefined();
    expect(quote.depositRate).toBeUndefined();
    expect(quote.depositAmount).toBe(0);
    expect(quote.remainingAmount).toBe(TOTAL);
  });

  it("computes a percent deposit rounded to 1,000 VND", () => {
    const quote = calculateDeposit({ totalAmount: TOTAL, depositType: "PERCENT", depositRate: 10 });

    expect(quote.depositType).toBe("PERCENT");
    expect(quote.depositRate).toBe(10);
    expect(quote.depositAmount).toBe(50_000);
    expect(quote.remainingAmount).toBe(450_000);
  });

  it("caps a fixed deposit at the total", () => {
    const quote = calculateDeposit({ totalAmount: TOTAL, depositType: "FIXED", depositAmount: 900_000 });

    expect(quote.depositType).toBe("FIXED");
    expect(quote.depositAmount).toBe(TOTAL);
    expect(quote.remainingAmount).toBe(0);
  });

  it("ignores a rate that was never set (a percent row with no rate is unconfigured)", () => {
    const quote = calculateDeposit({ totalAmount: TOTAL, depositType: "PERCENT" });

    expect(quote.depositType).toBeUndefined();
    expect(quote.depositAmount).toBe(0);
  });
});
