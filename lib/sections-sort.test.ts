import { describe, it, expect } from "vitest";
import { sortSectionsForDisplay, type SectionDto } from "./api/sections";

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