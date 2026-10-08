import { getActiveSectionsServer, type SectionDto } from "./sections";
import { getTours, type TourDto } from "./tours";
import { getActiveIntercityRoutes, type IntercityRouteDto } from "./intercity";
import { getSharedRoutes, type SharedRouteDto } from "./sharedRoute";
import {
  getVehicleCategories,
  getActiveAirports,
  getActiveAirportRoutes,
  getAirportTransferPricesByRoute,
  type AirportDto,
  type AirportRouteDto,
  type VehicleCategoryDto,
} from "./fleet";
import { getActiveRentals, getRentalPricesByRental, type RentalDto, type RentalPriceDto } from "./selfDrive";
import type { SelfDriveVehicleItem } from "@/components/self-drive/SelfDriveVehicleCard";
import {
  buildAirportSystemCards,
  computeMinPricesByCategory,
  DEFAULT_AIRPORT_IMAGE,
  type AirportPackageCard,
} from "@/lib/airport-packages";
import { backendUrl } from "./client";

export interface HomeInitialData {
  sections: SectionDto[];
  tours: TourDto[];
  intercityRoutes: IntercityRouteDto[];
  sharedRoutes: SharedRouteDto[];
  vehicles: SelfDriveVehicleItem[];
  airports: AirportDto[];
  airportTransfers: AirportPackageCard[];
  feedbacks: any[];
}

export async function fetchHomeInitialData(locale: string = "vi"): Promise<HomeInitialData> {
  // Prefer the internal Docker URL (no Cloudflare hairpin); fall back to the public API.
  const serverUrl =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API ||
    "http://localhost:8080";

  // Helper with timeout to guarantee zero hang
  const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]).catch(() => fallback);
  };

  const [
    sectionsResult,
    toursResult,
    routesResult,
    sharedRoutesResult,
    categoriesResult,
    rentalsResult,
    airportsResult,
    feedbacksResult,
  ] = await Promise.allSettled([
    withTimeout(getActiveSectionsServer("/", locale), 3500, []),
    withTimeout(getTours({ size: 10 }), 3500, { data: { content: [] } } as any),
    withTimeout(getActiveIntercityRoutes(), 3500, { data: [] } as any),
    withTimeout(getSharedRoutes(), 3500, { data: [] } as any),
    withTimeout(getVehicleCategories({ active: true }, { skipTranslationFilter: true }), 3500, { data: { content: [] } } as any),
    withTimeout(getActiveRentals({ skipTranslationFilter: true }), 3500, { data: [] } as any),
    withTimeout(getActiveAirports(), 3500, { data: [] } as any),
    withTimeout(
      fetch(`${serverUrl}/api/v1/feedbacks`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((j) => j.data || [])
        .catch(() => []),
      3500,
      []
    ),
  ]);

  const sections: SectionDto[] =
    sectionsResult.status === "fulfilled" && Array.isArray(sectionsResult.value)
      ? sectionsResult.value
      : [];

  const tours: TourDto[] =
    toursResult.status === "fulfilled" && toursResult.value?.data?.content
      ? toursResult.value.data.content
      : [];

  const intercityRoutes: IntercityRouteDto[] =
    routesResult.status === "fulfilled" && Array.isArray(routesResult.value?.data)
      ? routesResult.value.data
      : [];

  const sharedRoutes: SharedRouteDto[] =
    sharedRoutesResult.status === "fulfilled" && Array.isArray(sharedRoutesResult.value?.data)
      ? sharedRoutesResult.value.data
      : [];

  const categories: VehicleCategoryDto[] =
    categoriesResult.status === "fulfilled" && categoriesResult.value?.data?.content
      ? categoriesResult.value.data.content
      : [];

  const rentals: RentalDto[] =
    rentalsResult.status === "fulfilled" && Array.isArray(rentalsResult.value?.data)
      ? rentalsResult.value.data
      : [];

  const airports: AirportDto[] =
    airportsResult.status === "fulfilled" && Array.isArray(airportsResult.value?.data)
      ? airportsResult.value.data
      : [];

  const feedbacks: any[] =
    feedbacksResult.status === "fulfilled" && Array.isArray(feedbacksResult.value)
      ? feedbacksResult.value
      : [];

  // Build SelfDriveVehicleItems
  const catMap = new Map<number, VehicleCategoryDto>();
  categories.forEach((c) => catMap.set(c.id, c));

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

      const rawImg = cat?.thumbnailUrl || "";
      const imgUrl = rawImg
        ? rawImg.startsWith("http")
          ? rawImg
          : `${backendUrl}${rawImg}`
        : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80";

      return {
        id: `rental-${r.id}`,
        rentalId: r.id,
        vehicleCategoryId: r.vehicleCategoryId,
        categorySlug: cat?.code?.toLowerCase() || "xe-tu-lai",
        nameVi,
        nameEn,
        descVi,
        descEn,
        pricePerDay: r.deposit || 700000,
        deposit: r.deposit || 0,
        minimumDays: r.minimumDays || 1,
        featuresVi: ["Giao xe tận nơi", "Bảo hiểm thân vỏ"],
        featuresEn: ["Doorstep delivery", "Comprehensive insurance"],
        capacity,
        luggage,
        imgUrl,
      };
    });

  // Build airport transfer cards: giá thấp nhất mỗi loại xe trên sân bay mặc định
  const defaultAirport = airports.find((a) => a.isDefault) || airports[0];
  let airportTransfers: AirportPackageCard[] = [];
  if (defaultAirport?.id != null && categories.length > 0) {
    const routesResult = await withTimeout(getActiveAirportRoutes(defaultAirport.id), 3500, {
      data: [],
    } as any);
    const routes: AirportRouteDto[] =
      routesResult?.data && Array.isArray(routesResult.data) ? routesResult.data : [];

    const routePrices = await Promise.all(
      routes.map((r: AirportRouteDto) =>
        withTimeout(getAirportTransferPricesByRoute(r.id!), 3500, { data: [] } as any).then(
          (res) => (res?.data && Array.isArray(res.data) ? res.data : [])
        )
      )
    );

    airportTransfers = buildAirportSystemCards({
      categories,
      minPrices: computeMinPricesByCategory(routePrices),
      resolveImageUrl: (url?: string) =>
        url
          ? url.startsWith("http")
            ? url
            : `${serverUrl}${url}`
          : DEFAULT_AIRPORT_IMAGE,
    });
  }

  return {
    sections,
    tours,
    intercityRoutes,
    sharedRoutes,
    vehicles,
    airports,
    airportTransfers,
    feedbacks,
  };
}
