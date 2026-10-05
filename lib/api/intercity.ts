import { apiFetch, ApiResponse, ApiOptions } from "./client";
import type { ComponentItem } from "@/types/routeComponents";
import type { DepositType } from "@/lib/pricing/deposit";

export interface IntercityRouteTranslationDto {
  id?: number;
  routeId?: number;
  locale: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface PriceListTranslationDto {
  id?: number;
  priceListId?: number;
  locale: string;
  name: string;
  description?: string;
}

/**
 * One row of price_lists. `basePrice` IS the final price for that priceTypeCode —
 * never derived, never summed with another row.
 */
export interface IntercityRoutePriceDto {
  id?: number;
  priceTypeId?: number;
  priceTypeCode?: string; // ONE_WAY, ROUND_TRIP_SAME_DAY, DAILY_RATE
  priceTypeCategory?: string; // IN_DAY, DAILY_RATE
  priceTypeName?: string;
  scopeType?: string;
  scopeRefId?: string;
  routeId?: number;
  vehicleCategoryId: number;
  currency: string;
  basePrice?: number;
  /**
   * Deposit for this price row. All three are null/undefined when the row has no deposit
   * configured — that means "no deposit", so hide the UI rather than substituting a rate.
   */
  depositType?: DepositType;
  depositRate?: number;
  depositAmount?: number;
  status?: string;
  active: boolean;
  inDayActive?: boolean;
  dailyRateActive?: boolean;
  translations?: PriceListTranslationDto[];
  // Route details (ONE_WAY, ROUND_TRIP_SAME_DAY)
  waitingFee?: number;
  maxWaitingMin?: number;
  // Daily rate details (DAILY_RATE)
  minDays?: number;
  maxDays?: number;
  kmIncludedPerDay?: number;
  overagePricePerKm?: number;
  /** Batch helpers: the admin modal writes all three codes in one request. */
  oneWayPrice?: number;
  roundTripPrice?: number;
  dailyRatePrice?: number;
}

export interface IntercityPriceCalculateRequest {
  routeId: number;
  vehicleCategoryId?: number;
  tripType: string;
  rentalDays?: number;
}

export interface IntercityPriceCalculateResponse {
  routeId: number;
  vehicleCategoryId?: number;
  tripType: string;
  rentalDays?: number;
  pricePerDay?: number;
  totalPrice: number;
  priceTypeName?: string;
}

export interface IntercityDepartureTimeDto {
  id?: number;
  routeId?: number;
  departureTime: string;
  direction?: "OUTBOUND" | "RETURN" | string;
  orderIndex: number;
  active: boolean;
}

export interface IntercityRouteDto {
  id: number;
  originCity: string;
  destinationCity: string;
  distanceKm?: number;
  estimatedHours?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  originName?: string;
  slug?: string;
  components?: ComponentItem[] | string;
  active: boolean;
  thumbnailId?: number;
  thumbnailUrl?: string;
  imageIds?: number[];
  translations: IntercityRouteTranslationDto[];
  departureTimes: IntercityDepartureTimeDto[];
  linkedSharedRouteId?: number | null;
  hasSharedRoute?: boolean;
  isContactOnly?: boolean;
}

export interface IntercitySeasonalSurchargeDto {
  id?: number;
  routeId?: number;
  routeIds?: number[];
  tourIds?: number[];
  airportTransferIds?: number[];
  seasonName: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  surchargeType: "PERCENT" | "FIXED";
  surchargeValue: number;
  currency?: string;
  priority?: number;
  active: boolean;
}

// === Intercity Routes ===

export async function getActiveIntercityRoutes(): Promise<ApiResponse<IntercityRouteDto[]>> {
  return apiFetch("/api/v1/intercity-routes/active", { skipTranslationFilter: true });
}

export async function getIntercityRoutes(page = 0, size = 50): Promise<ApiResponse<{ content: IntercityRouteDto[]; totalElements: number }>> {
  return apiFetch(`/api/v1/intercity-routes?page=${page}&size=${size}`, { skipTranslationFilter: true });
}

export async function getIntercityRouteById(id: number): Promise<ApiResponse<IntercityRouteDto>> {
  return apiFetch(`/api/v1/intercity-routes/${id}`, { skipTranslationFilter: true });
}

export async function getIntercityRouteBySlug(slug: string): Promise<ApiResponse<IntercityRouteDto>> {
  return apiFetch(`/api/v1/intercity-routes/slug/${encodeURIComponent(slug)}`, { skipTranslationFilter: true });
}

export async function getIntercityRouteByIdOrSlug(idOrSlug: string | number): Promise<ApiResponse<IntercityRouteDto>> {
  if (typeof idOrSlug === "number" || (!isNaN(Number(idOrSlug)) && !String(idOrSlug).includes("-"))) {
    return getIntercityRouteById(Number(idOrSlug));
  }
  return getIntercityRouteBySlug(String(idOrSlug));
}

export async function getIntercityRoutePrices(routeId: number): Promise<ApiResponse<IntercityRoutePriceDto[]>> {
  return apiFetch(`/api/v1/intercity-route-prices/by-route/${routeId}`, { skipTranslationFilter: true });
}

export async function getAllIntercityRoutePrices(): Promise<ApiResponse<IntercityRoutePriceDto[]>> {
  return apiFetch("/api/v1/intercity-route-prices", { skipTranslationFilter: true });
}

export async function getPublicIntercityRoutePrices(routeId?: number): Promise<ApiResponse<IntercityRoutePriceDto[]>> {
  const url = routeId != null
    ? `/api/v1/public/intercity-route-prices?routeId=${routeId}`
    : "/api/v1/public/intercity-route-prices";
  return apiFetch(url, { skipTranslationFilter: true });
}

export async function getPublicIntercityRoutePricesByRoute(routeId: number): Promise<ApiResponse<IntercityRoutePriceDto[]>> {
  return apiFetch(`/api/v1/public/intercity-route-prices/by-route/${routeId}`, { skipTranslationFilter: true });
}

export async function createIntercityRoute(dto: Partial<IntercityRouteDto>): Promise<ApiResponse<IntercityRouteDto>> {
  return apiFetch("/api/v1/intercity-routes", {
    method: "POST",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function updateIntercityRoute(id: number, dto: Partial<IntercityRouteDto>): Promise<ApiResponse<IntercityRouteDto>> {
  return apiFetch(`/api/v1/intercity-routes/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function deleteIntercityRoute(id: number): Promise<ApiResponse<void>> {
  return apiFetch(`/api/v1/intercity-routes/${id}`, {
    method: "DELETE",
    skipTranslationFilter: true,
  });
}

// === Intercity Route Prices ===

export async function createIntercityRoutePrice(dto: Partial<IntercityRoutePriceDto>): Promise<ApiResponse<IntercityRoutePriceDto>> {
  return apiFetch("/api/v1/intercity-route-prices", {
    method: "POST",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function updateIntercityRoutePrice(id: number, dto: Partial<IntercityRoutePriceDto>): Promise<ApiResponse<IntercityRoutePriceDto>> {
  return apiFetch(`/api/v1/intercity-route-prices/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function updateIntercityRoutePriceStatus(id: number, active: boolean): Promise<ApiResponse<IntercityRoutePriceDto>> {
  return apiFetch(`/api/v1/intercity-route-prices/${id}/status?active=${active}`, {
    method: "PATCH",
    skipTranslationFilter: true,
  });
}

export async function deleteIntercityRoutePrice(id: number): Promise<ApiResponse<void>> {
  return apiFetch(`/api/v1/intercity-route-prices/${id}`, {
    method: "DELETE",
    skipTranslationFilter: true,
  });
}

export async function initDefaultIntercityPrices(): Promise<ApiResponse<string>> {
  return apiFetch("/api/v1/intercity-route-prices/init-defaults", {
    method: "POST",
    skipTranslationFilter: true,
  });
}

// === Surcharges ===

export async function getIntercitySurcharges(page = 0, size = 50): Promise<ApiResponse<{ content: IntercitySeasonalSurchargeDto[]; totalElements: number }>> {
  return apiFetch(`/api/v1/intercity-surcharges?page=${page}&size=${size}`, { skipTranslationFilter: true });
}

export async function getPublicSurcharges(): Promise<ApiResponse<IntercitySeasonalSurchargeDto[]>> {
  return apiFetch("/api/v1/surcharges/public", { skipTranslationFilter: true });
}

export async function getActiveSurcharges(
  routeIdOrParams: number | { routeId?: number; tourId?: number; airportRouteId?: number; date: string; time?: string },
  date?: string,
  time?: string
): Promise<ApiResponse<IntercitySeasonalSurchargeDto[]>> {
  if (typeof routeIdOrParams === "object") {
    const q = new URLSearchParams();
    if (routeIdOrParams.routeId !== undefined) q.append("routeId", String(routeIdOrParams.routeId));
    if (routeIdOrParams.tourId !== undefined) q.append("tourId", String(routeIdOrParams.tourId));
    if (routeIdOrParams.airportRouteId !== undefined) q.append("airportRouteId", String(routeIdOrParams.airportRouteId));
    q.append("date", routeIdOrParams.date);
    if (routeIdOrParams.time) q.append("time", routeIdOrParams.time);
    return apiFetch(`/api/v1/surcharges/public/active?${q.toString()}`, { skipTranslationFilter: true });
  }

  const timeQuery = time ? `&time=${time}` : "";
  return apiFetch(`/api/v1/surcharges/public/active?routeId=${routeIdOrParams}&date=${date}${timeQuery}`, { skipTranslationFilter: true });
}

// === Intercity Departure Times ===

export async function getActiveDepartureTimes(routeId: number, direction?: string): Promise<ApiResponse<IntercityDepartureTimeDto[]>> {
  const query = direction ? `?direction=${direction}` : "";
  return apiFetch(`/api/v1/intercity-departure-times/active/by-route/${routeId}${query}`, { skipTranslationFilter: true });
}

export async function getDepartureTimesByRoute(routeId: number, direction?: string): Promise<ApiResponse<IntercityDepartureTimeDto[]>> {
  const query = direction ? `?direction=${direction}` : "";
  return apiFetch(`/api/v1/intercity-departure-times/by-route/${routeId}${query}`, { skipTranslationFilter: true });
}

export async function createDepartureTime(dto: Partial<IntercityDepartureTimeDto>): Promise<ApiResponse<IntercityDepartureTimeDto>> {
  return apiFetch("/api/v1/intercity-departure-times", {
    method: "POST",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function updateDepartureTime(id: number, dto: Partial<IntercityDepartureTimeDto>): Promise<ApiResponse<IntercityDepartureTimeDto>> {
  return apiFetch(`/api/v1/intercity-departure-times/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function deleteDepartureTime(id: number): Promise<ApiResponse<void>> {
  return apiFetch(`/api/v1/intercity-departure-times/${id}`, {
    method: "DELETE",
    skipTranslationFilter: true,
  });
}
