import { describe, it, expect } from "vitest";
import { isPackagePublishable, type TourPackageDto } from "./api/tours";

/**
 * Mirror of `TourPackage.isPublishable()` on the backend. If the two drift apart the admin either
 * gets a 400 they cannot act on, or a package that looks saved but is quietly unpublishable.
 */
const pkg = (over: Partial<TourPackageDto> = {}): TourPackageDto =>
  ({
    name: "Cano ghép",
    active: true,
    translations: [],
    ...over,
  }) as TourPackageDto;

const adultPrice = (pricePerPerson: number | null, active = true) => ({
  passengerType: "ADULT",
  pricePerPerson: pricePerPerson as number,
  active,
});

describe("isPackagePublishable", () => {
  it("accepts an active package with a price above zero", () => {
    expect(isPackagePublishable(pkg({ prices: [adultPrice(650000)] }))).toBe(true);
  });

  it("accepts a contact-only package with no price at all", () => {
    expect(isPackagePublishable(pkg({ isContactOnly: true, prices: [] }))).toBe(true);
  });

  it("accepts the legacy `contactOnly` spelling the API also emits", () => {
    expect(isPackagePublishable(pkg({ contactOnly: true, prices: [] }))).toBe(true);
  });

  it("rejects an active package with no price and no flag — the case the API would 400 on", () => {
    expect(isPackagePublishable(pkg({ prices: [] }))).toBe(false);
  });

  it("rejects a zero price, which is what an empty price box stores", () => {
    expect(isPackagePublishable(pkg({ prices: [adultPrice(0)] }))).toBe(false);
  });

  it("rejects a deactivated price, the way an admin takes one out of service", () => {
    expect(isPackagePublishable(pkg({ prices: [adultPrice(650000, false)] }))).toBe(false);
  });

  it("rejects a free infant standing in for a missing adult price", () => {
    expect(
      isPackagePublishable(
        pkg({
          prices: [
            { passengerType: "INFANT", pricePerPerson: 0, active: true },
            { passengerType: "CHILD", pricePerPerson: 0, active: true },
          ],
        })
      )
    ).toBe(false);
  });

  it("does not police a package that is switched off", () => {
    expect(isPackagePublishable(pkg({ active: false, prices: [] }))).toBe(true);
  });

  it("treats a missing `active` as active, matching the server default", () => {
    expect(
      isPackagePublishable({ prices: [], translations: [] } as unknown as TourPackageDto)
    ).toBe(false);
  });
});
