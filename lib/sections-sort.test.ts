import { describe, it, expect } from "vitest";
import { sortSectionsForDisplay, dedupeSingletonSections, type SectionDto } from "./api/sections";

const makeSection = (partial: Partial<SectionDto>): SectionDto => ({
  id: 1,
  sectionName: "test",
  sectionType: "CTA",
  pagePath: "HOME",
  orderIndex: 0,
  active: true,
  imageUrls: [],
  translations: [],
  ...partial,
});

describe("sortSectionsForDisplay", () => {
  it("sorts by orderIndex ascending", () => {
    const sections = [
      makeSection({ id: 1, orderIndex: 5 }),
      makeSection({ id: 2, orderIndex: 1 }),
      makeSection({ id: 3, orderIndex: 3 }),
    ];
    expect(sortSectionsForDisplay(sections).map((s) => s.id)).toEqual([2, 3, 1]);
  });

  it("breaks ties in favor of SYSTEM_CATALOG", () => {
    const sections = [
      makeSection({ id: 1, sectionType: "CTA", orderIndex: 2 }),
      makeSection({ id: 2, sectionType: "SYSTEM_CATALOG", orderIndex: 2 }),
      makeSection({ id: 3, sectionType: "SYSTEM_CATALOG", orderIndex: 1 }),
      makeSection({ id: 4, sectionType: "FEATURES", orderIndex: 1 }),
    ];
    expect(sortSectionsForDisplay(sections).map((s) => s.id)).toEqual([3, 4, 2, 1]);
  });

  it("does not mutate the input array", () => {
    const sections = [
      makeSection({ id: 1, orderIndex: 2 }),
      makeSection({ id: 2, orderIndex: 1 }),
    ];
    const copy = [...sections];
    sortSectionsForDisplay(sections);
    expect(sections).toEqual(copy);
  });
});

describe("dedupeSingletonSections", () => {
  it("keeps only the richest copy of a duplicated singleton type", () => {
    // Trùng thực tế trong DB: row cũ có contentData đầy đủ, row template init rỗng "{}".
    const sections = [
      makeSection({ id: 9, sectionType: "COMPANY_LOCATION", orderIndex: 6, contentData: '{"address":"18 Thuy Xuong"}' }),
      makeSection({ id: 26, sectionType: "COMPANY_LOCATION", orderIndex: 8, contentData: "{}" }),
      makeSection({ id: 10, sectionType: "PARTNER_COOPERATION", orderIndex: 7, contentData: '{"benefits":[1,2,3]}' }),
      makeSection({ id: 27, sectionType: "PARTNER_COOPERATION", orderIndex: 9, contentData: "{}" }),
    ];
    const result = dedupeSingletonSections(sections);
    expect(result.filter((s) => s.sectionType === "COMPANY_LOCATION").map((s) => s.id)).toEqual([9]);
    expect(result.filter((s) => s.sectionType === "PARTNER_COOPERATION").map((s) => s.id)).toEqual([10]);
  });

  it("keeps a singleton section untouched", () => {
    const sections = [makeSection({ id: 12, sectionType: "INSPIRATION", contentData: '{"items":[]}' })];
    expect(dedupeSingletonSections(sections).map((s) => s.id)).toEqual([12]);
  });

  it("does not dedupe non-singleton types such as SYSTEM_CATALOG", () => {
    const sections = [
      makeSection({ id: 20, sectionType: "SYSTEM_CATALOG", orderIndex: 2 }),
      makeSection({ id: 21, sectionType: "SYSTEM_CATALOG", orderIndex: 3 }),
      makeSection({ id: 2, sectionType: "FEATURES", orderIndex: 1, contentData: '{"features":[1,2]}' }),
      makeSection({ id: 25, sectionType: "FEATURES", orderIndex: 7, contentData: '{"features":[3]}' }),
    ];
    const result = dedupeSingletonSections(sections);
    expect(result.filter((s) => s.sectionType === "SYSTEM_CATALOG")).toHaveLength(2);
    expect(result.filter((s) => s.sectionType === "FEATURES").map((s) => s.id)).toEqual([2]);
  });

  it("does not mutate the input array", () => {
    const sections = [
      makeSection({ id: 1, sectionType: "INSPIRATION" }),
      makeSection({ id: 2, sectionType: "INSPIRATION" }),
    ];
    const copy = [...sections];
    dedupeSingletonSections(sections);
    expect(sections).toEqual(copy);
  });
});