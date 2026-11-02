import { describe, it, expect } from "vitest";
import {
  buildRouteComponents,
  parseRouteComponents,
  extractComponentContent,
} from "./routeComponents";

const customComparison = {
  title: "So sánh tùy chỉnh",
  subtitle: "Loại hình",
  privateCard: [
    { type: "title" as const, value: "Xe riêng test" },
    { type: "tick" as const, value: "Điểm A" },
  ],
  sharedCard: [
    { type: "title" as const, value: "Xe ghép test" },
    { type: "tick" as const, value: "Điểm B" },
  ],
};

describe("routeComponents comparison support", () => {
  it("appends a comparison component when data is provided", () => {
    const withCmp = buildRouteComponents(
      "Bao gồm test",
      ["Dịch vụ 1"],
      "Không bao gồm test",
      ["Chi phí 1"],
      customComparison
    );
    expect(withCmp.length).toBe(3);
    expect(withCmp[2].type).toBe("comparison");
  });

  it("round-trips inclusions/exclusions/comparison through JSON parse", () => {
    const withCmp = buildRouteComponents(
      "Bao gồm test",
      ["Dịch vụ 1"],
      "Không bao gồm test",
      ["Chi phí 1"],
      customComparison
    );
    const extracted = extractComponentContent(parseRouteComponents(JSON.stringify(withCmp)));
    expect(extracted.inclusionsTitle).toBe("Bao gồm test");
    expect(extracted.inclusions).toEqual(["Dịch vụ 1"]);
    expect(extracted.comparisonData?.title).toBe("So sánh tùy chỉnh");
    expect(extracted.comparisonData?.privateCard[1].value).toBe("Điểm A");
  });

  it("keeps 2 components and null comparison when no comparison data", () => {
    const withoutCmp = buildRouteComponents();
    expect(withoutCmp.length).toBe(2);
    expect(extractComponentContent(withoutCmp).comparisonData).toBeNull();
  });

  it("falls back to defaults on empty input", () => {
    const fallback = extractComponentContent(null);
    expect(fallback.comparisonData).toBeNull();
    expect(fallback.inclusions.length).toBeGreaterThan(0);
    expect(fallback.exclusions.length).toBeGreaterThan(0);
  });
});