import { describe, it, expect } from "vitest";
import {
  buildAirportSystemCards,
  computeMinPricesByCategory,
  applyAirportPackageConfig,
  type AirportPackageCard,
  type AirportPackageConfig,
} from "./airport-packages";
import type { AirportTransferPrice, VehicleCategoryDto } from "@/lib/api/fleet";

const makePrice = (partial: Partial<AirportTransferPrice> = {}): AirportTransferPrice => ({
  airportRouteId: 1,
  vehicleCategoryId: 1,
  baseKm: 35,
  baseAmount: 250000,
  perKmAmount: 8000,
  fixedOvercharge: false,
  currency: "VND",
  active: true,
  ...partial,
});

const makeCategory = (partial: Partial<VehicleCategoryDto> = {}): VehicleCategoryDto => ({
  id: 1,
  code: "4-seater",
  minSeat: 4,
  maxSeat: 5,
  minLuggage: 2,
  maxLuggage: 4,
  unitLuggage: "kiện",
  active: true,
  default: false,
  translations: [
    { locale: "vi", name: "Xe 4 chỗ", slug: "xe-4-cho", description: "" },
    { locale: "en", name: "4-Seater Sedan", slug: "4-seater-sedan", description: "" },
  ],
  ...partial,
});

const systemCards = (): AirportPackageCard[] =>
  buildAirportSystemCards({
    categories: [makeCategory()],
    minPrices: new Map([[1, 250000]]),
    resolveImageUrl: (u?: string) => u || "img",
  });

describe("computeMinPricesByCategory", () => {
  it("lấy giá một chiều thấp nhất theo category qua nhiều tuyến", () => {
    const min = computeMinPricesByCategory([
      [makePrice({ vehicleCategoryId: 1, baseAmount: 300000 })],
      [makePrice({ vehicleCategoryId: 1, baseAmount: 250000 })],
    ]);
    expect(min.get(1)).toBe(250000);
  });

  it("bỏ qua price không active", () => {
    const min = computeMinPricesByCategory([
      [makePrice({ vehicleCategoryId: 1, baseAmount: 220000, active: false })],
      [makePrice({ vehicleCategoryId: 1, baseAmount: 260000 })],
    ]);
    expect(min.get(1)).toBe(260000);
  });
});

describe("buildAirportSystemCards", () => {
  it("bỏ category không có giá và localize tên sang 4 ngôn ngữ (fallback vi cho ko/ru)", () => {
    const cards = buildAirportSystemCards({
      categories: [
        makeCategory(),
        makeCategory({ id: 2, code: "7-seater", minSeat: 7, maxSeat: 7 }),
      ],
      minPrices: new Map([[1, 250000]]),
      resolveImageUrl: (u?: string) => u || "img",
    });

    expect(cards).toHaveLength(1);
    expect(cards[0].minPrice).toBe(250000);
    expect(cards[0].name.vi).toBe("Xe 4 chỗ");
    expect(cards[0].name.en).toBe("4-Seater Sedan");
    expect(cards[0].name.ko).toBe("4-Seater Sedan"); // chưa seed ko/ru -> fallback en
    expect(cards[0].capacityText?.vi).toBe("4-5 chỗ");
    expect(cards[0].luggageText?.en).toBe("2-4 bags");
  });

  it("sắp xếp card theo số chỗ tăng dần", () => {
    const cards = buildAirportSystemCards({
      categories: [
        makeCategory({ id: 2, code: "16-seater", minSeat: 16, maxSeat: 16 }),
        makeCategory({ id: 1, code: "4-seater" }),
      ],
      minPrices: new Map([
        [1, 250000],
        [2, 550000],
      ]),
      resolveImageUrl: (u?: string) => u || "img",
    });
    expect(cards.map((c) => c.vehicleCategoryId)).toEqual([1, 2]);
  });
});

describe("applyAirportPackageConfig", () => {
  it("config rỗng => giữ nguyên card hệ thống", () => {
    expect(applyAirportPackageConfig(systemCards(), undefined)).toEqual(systemCards());
    expect(applyAirportPackageConfig(systemCards(), [])).toEqual(systemCards());
  });

  it("override nội dung theo config, giữ giá API và lọc package inactive", () => {
    const cfg: AirportPackageConfig[] = [
      {
        id: "pkg-4",
        vehicleCategoryId: 1,
        active: true,
        name: { vi: "Sedan Tiết Kiệm", en: "Economy Sedan", ko: "", ru: "" },
        capacityText: { vi: "Tối đa 3 khách", en: "Up to 3 guests", ko: "", ru: "" },
        luggageText: { vi: "2 vali cỡ vừa", en: "2 medium bags", ko: "", ru: "" },
        tag: { vi: "TIẾT KIỆM NHẤT", en: "BEST VALUE", ko: "", ru: "" },
      },
      {
        id: "pkg-off",
        vehicleCategoryId: 1,
        active: false,
        name: { vi: "", en: "", ko: "", ru: "" },
        capacityText: { vi: "", en: "", ko: "", ru: "" },
        luggageText: { vi: "", en: "", ko: "", ru: "" },
      },
    ];

    const cards = applyAirportPackageConfig(systemCards(), cfg);

    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe("pkg-4");
    expect(cards[0].minPrice).toBe(250000); // giá vẫn lấy từ API
    expect(cards[0].name.vi).toBe("Sedan Tiết Kiệm");
    expect(cards[0].name.ko).toBe("4-Seater Sedan"); // config rỗng -> fallback en
    expect(cards[0].tag?.vi).toBe("TIẾT KIỆM NHẤT");
    expect(cards[0].capacityText?.vi).toBe("Tối đa 3 khách");
  });

  it("bỏ features rỗng => card không render dòng trống", () => {
    const cfg: AirportPackageConfig[] = [
      {
        id: "pkg-feat",
        vehicleCategoryId: 1,
        name: { vi: "Xe 4 chỗ", en: "4-Seater", ko: "", ru: "" },
        capacityText: { vi: "", en: "", ko: "", ru: "" },
        luggageText: { vi: "", en: "", ko: "", ru: "" },
        features: {
          vi: ["Bao trọn phí cầu đường", "", "  "],
          en: ["", "", ""],
        },
      },
    ];
    const cards = applyAirportPackageConfig(systemCards(), cfg);
    expect(cards[0].features?.vi).toEqual(["Bao trọn phí cầu đường"]);
    expect(cards[0].features?.en).toEqual([]);
  });

  it("package chưa liên kết category hoặc category chưa có giá vẫn hiển thị (không price)", () => {
    const cfg: AirportPackageConfig[] = [
      {
        id: "pkg-no-cat",
        name: { vi: "Limousine VIP", en: "VIP Limousine", ko: "", ru: "" },
        capacityText: { vi: "Tối đa 9 khách", en: "Up to 9 guests", ko: "", ru: "" },
        luggageText: { vi: "6-8 vali", en: "6-8 bags", ko: "", ru: "" },
      },
    ];
    const cards = applyAirportPackageConfig(systemCards(), cfg);
    expect(cards[0].id).toBe("pkg-no-cat");
    expect(cards[0].minPrice).toBeUndefined();
    expect(cards[0].imageUrl).toBe(""); // không còn ảnh fallback
  });
});