import { describe, expect, it } from "vitest";
import {
  DEFAULT_MODULE_DEPOSIT_RATES,
  calculateDeposit,
  resolveAirportDepositPolicy,
} from "./deposit";

const UNSET = { depositType: null, depositRate: null, depositAmount: null };
const TOTAL = 500_000;

/**
 * The airport confirm page quotes a deposit in three steps — transfer price row, then the route
 * it travels, then the module default. The first two used to be indistinguishable, because both
 * DTOs used to substitute a 20% default for an unconfigured row, which made the route level dead
 * code. Now that an untouched row reads back as untouched, all three are reachable and each has
 * to land on the same number the server will charge.
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

  it("returns nothing when neither level is configured, leaving the module default", () => {
    const policy = resolveAirportDepositPolicy(UNSET, UNSET);
    expect(policy.depositType).toBeUndefined();
    expect(policy.depositRate).toBeUndefined();

    const quote = calculateDeposit({
      totalAmount: TOTAL,
      ...policy,
      defaultRate: DEFAULT_MODULE_DEPOSIT_RATES.AIRPORT,
    });
    expect(quote.depositRate).toBe(DEFAULT_MODULE_DEPOSIT_RATES.AIRPORT);
    expect(quote.depositAmount).toBe(100_000);
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
