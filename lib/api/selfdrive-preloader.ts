import { getActiveSectionsServer, type SectionDto } from "./sections";
import { getVehicleCategories, getRentableVehiclesByCategory, type VehicleCategoryDto } from "./fleet";
import { getActiveRentals, getRentalPricesByRental, type RentalDto, type RentalPriceDto } from "./selfDrive";
import { getCanonicalSlug } from "@/lib/slug-helpers";
import type { SelfDriveVehicleItem } from "@/components/self-drive/SelfDriveVehicleCard";
import { backendUrl } from "./client";

export interface SelfDriveInitialData {
  sections: SectionDto[];
  vehicles: SelfDriveVehicleItem[];
}

export async function fetchSelfDriveInitialData(locale: string = "vi"): Promise<SelfDriveInitialData> {
  const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]).catch(() => fallback);
  };

  try {
    const [sectionsResult, categoriesResult, rentalsResult] = await Promise.allSettled([
      withTimeout(getActiveSectionsServer("/self-drive", locale), 3500, []),
      withTimeout(getVehicleCategories({ active: true }, { skipTranslationFilter: true }), 3500, { data: { content: [] } } as any),
      withTimeout(getActiveRentals({ skipTranslationFilter: true }), 3500, { data: [] } as any),
    ]);

    const sections: SectionDto[] =
      sectionsResult.status === "fulfilled" && Array.isArray(sectionsResult.value)
        ? sectionsResult.value
        : [];

    const categories: VehicleCategoryDto[] =
      categoriesResult.status === "fulfilled" && categoriesResult.value?.data?.content
        ? categoriesResult.value.data.content
        : [];

    const rawRentals: RentalDto[] =
      rentalsResult.status === "fulfilled" && Array.isArray(rentalsResult.value?.data)
        ? rentalsResult.value.data
        : [];

    const rentals = rawRentals.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    if (rentals.length === 0 || categories.length === 0) {
      return { sections, vehicles: [] };
    }

    const catMap = new Map<number, VehicleCategoryDto>();
    categories.forEach((c) => catMap.set(c.id, c));

    const [priceResults, categoryThumbResults] = await Promise.all([
      Promise.all(
        rentals
          .filter((r) => !r.driverRequired)
          .map((r) =>
            withTimeout(
              getRentalPricesByRental(r.id)
                .then((res) => ({
                  rentalId: r.id,
                  prices: (res?.data || []) as RentalPriceDto[],
                }))
                .catch(() => ({ rentalId: r.id, prices: [] as RentalPriceDto[] })),
              2000,
              { rentalId: r.id, prices: [] as RentalPriceDto[] }
            )
          )
      ),
      Promise.all(
        categories.map(async (c) => {
          if (c.thumbnailUrl) {
            const url = c.thumbnailUrl.startsWith("http")
              ? c.thumbnailUrl
              : `${backendUrl}${c.thumbnailUrl}`;
            return { categoryId: c.id, thumbnailUrl: url };
          }
          try {
            const vehsRes = await withTimeout(getRentableVehiclesByCategory(c.id), 2000, null as any);
            const firstVehWithImg = (vehsRes?.data || []).find((v: any) => v.thumbnailUrl);
            if (firstVehWithImg?.thumbnailUrl) {
              const url = firstVehWithImg.thumbnailUrl.startsWith("http")
                ? firstVehWithImg.thumbnailUrl
                : `${backendUrl}${firstVehWithImg.thumbnailUrl}`;
              return { categoryId: c.id, thumbnailUrl: url };
            }
          } catch {
            // ignore
          }
          return { categoryId: c.id, thumbnailUrl: "" };
        })
      ),
    ]);

    const priceMap = new Map<number, RentalPriceDto[]>();
    priceResults.forEach((p) => priceMap.set(p.rentalId, p.prices));

    const catThumbMap = new Map<number, string>();
    categoryThumbResults.forEach((ct) => catThumbMap.set(ct.categoryId, ct.thumbnailUrl));

    const vehicles: SelfDriveVehicleItem[] = rentals
      .filter((r) => !r.driverRequired)
      .map((r) => {
        const cat = catMap.get(r.vehicleCategoryId);
        const nameVi = cat?.translations?.find((t) => t.locale === "vi")?.name || cat?.code || "Phân khúc xe";
        const nameEn = cat?.translations?.find((t) => t.locale === "en")?.name || nameVi;
        const descVi = cat?.translations?.find((t) => t.locale === "vi")?.description || "";
        const descEn = cat?.translations?.find((t) => t.locale === "en")?.description || descVi;

        let capacity = "5";
        let luggage = "2-3 vali";
        if (cat) {
          capacity = cat.minSeat === cat.maxSeat ? `${cat.minSeat}` : `${cat.minSeat}-${cat.maxSeat}`;
          luggage = cat.minLuggage === cat.maxLuggage ? `${cat.minLuggage} vali` : `${cat.minLuggage}-${cat.maxLuggage} vali`;
        }

        const rentalPrices = priceMap.get(r.id) || [];
        const activePrice = rentalPrices.find(
          (p) => p.active && p.vehicleCategoryId === r.vehicleCategoryId
        );
        const dailyRate = activePrice ? Number(activePrice.amount) : 0;
        const categorySlug = getCanonicalSlug(cat, locale, "xe-tu-lai");
        const imgUrl = catThumbMap.get(r.vehicleCategoryId) || "";

        const featuresVi = descVi
          .split(/[,\n;•✓]/)
          .map((f) => f.trim())
          .filter((f) => f.length > 2);

        const featuresEn = descEn
          .split(/[,\n;•✓]/)
          .map((f) => f.trim())
          .filter((f) => f.length > 2);

        return {
          id: `rental-${r.id}-${r.vehicleCategoryId}`,
          rentalId: r.id,
          vehicleCategoryId: r.vehicleCategoryId,
          categorySlug,
          nameVi,
          nameEn,
          descVi,
          descEn,
          pricePerDay: dailyRate,
          deposit: r.deposit || 0,
          minimumDays: r.minimumDays || 1,
          featuresVi: featuresVi.length > 0 ? featuresVi : ["Bảo hiểm thân vỏ", "Giao xe tận nơi"],
          featuresEn: featuresEn.length > 0 ? featuresEn : ["Comprehensive insurance", "Door-to-door delivery"],
          capacity,
          luggage,
          transmission: "Tự động",
          fuelType: "Xăng",
          imgUrl,
        };
      });

    return { sections, vehicles };
  } catch (err) {
    console.error("fetchSelfDriveInitialData error:", err);
    return { sections: [], vehicles: [] };
  }
}
