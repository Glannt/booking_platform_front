import { apiFetch, ApiResponse, ApiOptions } from "./client";

export interface IntercityRouteTranslationDto {
  id?: number;
  routeId?: number;
  locale: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface IntercityRoutePriceDto {
  id?: number;
  routeId?: number;
  vehicleCategoryId: number;
  perKmAmount: number;
  currency: string;
  active: boolean;
}

export interface IntercityDepartureTimeDto {
  id?: number;
  routeId?: number;
  departureTime: string;
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
  active: boolean;
  hasDepartureTimes: boolean;
  thumbnailId?: number;
  thumbnailUrl?: string;
  imageIds?: number[];
  translations: IntercityRouteTranslationDto[];
  prices: IntercityRoutePriceDto[];
  departureTimes: IntercityDepartureTimeDto[];
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

export interface RentalPriceDto {
  id?: number;
  rentalId?: number;
  vehicleCategoryId?: number;
  currency: string;
  amount: number;
  active: boolean;
}

export interface RentalTypeTranslationDto {
  id?: number;
  locale: string;
  name: string;
  description?: string;
}

export interface RentalTypeDto {
  id: number;
  code: string;
  active: boolean;
  translations: RentalTypeTranslationDto[];
}

export interface RentalDto {
  id: number;
  rentalTypeId?: number;
  rentalType?: RentalTypeDto;
  vehicleCategoryId: number;
  driverRequired: boolean;
  deposit?: number;
  minimumDays?: number;
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

export async function deleteIntercityRoutePrice(id: number): Promise<ApiResponse<void>> {
  return apiFetch(`/api/v1/intercity-route-prices/${id}`, {
    method: "DELETE",
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

// Surcharge functions have been centralized to @/lib/api/surcharge

// === Intercity Departure Times ===

export async function getActiveDepartureTimes(routeId: number): Promise<ApiResponse<IntercityDepartureTimeDto[]>> {
  return apiFetch(`/api/v1/intercity-departure-times/active/by-route/${routeId}`, { skipTranslationFilter: true });
}

export async function getDepartureTimesByRoute(routeId: number): Promise<ApiResponse<IntercityDepartureTimeDto[]>> {
  return apiFetch(`/api/v1/intercity-departure-times/by-route/${routeId}`, { skipTranslationFilter: true });
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

// === Rentals (self-drive) ===

export async function getAdminRentals(page = 0, size = 100): Promise<ApiResponse<{ content: RentalDto[]; totalElements: number }>> {
  return apiFetch(`/api/v1/admin/rentals?page=${page}&size=${size}`, { skipTranslationFilter: true });
}

export async function createRental(dto: Partial<RentalDto>): Promise<ApiResponse<RentalDto>> {
  return apiFetch("/api/v1/admin/rentals", {
    method: "POST",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function updateRental(id: number, dto: Partial<RentalDto>): Promise<ApiResponse<RentalDto>> {
  return apiFetch(`/api/v1/admin/rentals/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function deleteRental(id: number): Promise<ApiResponse<void>> {
  return apiFetch(`/api/v1/admin/rentals/${id}`, {
    method: "DELETE",
    skipTranslationFilter: true,
  });
}

export async function getRentalPricesByRental(rentalId: number): Promise<ApiResponse<RentalPriceDto[]>> {
  return apiFetch(`/api/v1/rentals/${rentalId}/prices`);
}

export async function createRentalPrice(rentalId: number, dto: Partial<RentalPriceDto>): Promise<ApiResponse<RentalPriceDto>> {
  return apiFetch(`/api/v1/admin/rentals/${rentalId}/prices`, {
    method: "POST",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function updateRentalPrice(rentalId: number, priceId: number, dto: Partial<RentalPriceDto>): Promise<ApiResponse<RentalPriceDto>> {
  return apiFetch(`/api/v1/admin/rentals/${rentalId}/prices/${priceId}`, {
    method: "PUT",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function getActiveRentals(options?: ApiOptions): Promise<ApiResponse<RentalDto[]>> {
  const res = await apiFetch<ApiResponse<{ content: RentalDto[]; totalElements: number }>>("/api/v1/rentals?page=0&size=100", options);
  if (res && res.data) {
    const active = (res.data.content || []).filter((r: RentalDto) => r.active);
    return { data: active } as ApiResponse<RentalDto[]>;
  }
  return { data: [] } as ApiResponse<RentalDto[]>;
}

export async function getRentalTypes(): Promise<ApiResponse<RentalTypeDto[]>> {
  const res = await apiFetch<ApiResponse<{ content: RentalTypeDto[]; totalElements: number }>>("/api/v1/rental-types?page=0&size=100");
  return { data: res?.data?.content || [] } as ApiResponse<RentalTypeDto[]>;
}

// === Booking ===

export interface CreateBookingItemRequest {
  serviceId: number;
  serviceOptionId?: number;
  quantity?: number;
  unitPrice?: number;
  dynamicDetails?: string;
  flightNumber?: string;
  startDate?: string;
  endDate?: string;
  pickupLocation?: string;
}

export interface CreateBookingRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
  contactChannel?: string;
  contactId?: string;
  zaloId?: string;
  kakaoTalkId?: string;
  idempotencyKey?: string;
  items: CreateBookingItemRequest[];
}

export interface BookingDto {
  id: number;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  totalPrice: number;
  bookingStatus: string;
  customerNotes?: string;
  items?: any[];
}

export async function createBooking(request: CreateBookingRequest): Promise<ApiResponse<BookingDto>> {
  return apiFetch("/api/v1/bookings", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
