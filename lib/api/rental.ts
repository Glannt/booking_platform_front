import { apiFetch, ApiResponse } from "./client";

export interface IntercityRouteTranslationDto {
  id?: number;
  routeId?: number;
  locale: string;
  name: string;
  description?: string;
}

export interface IntercityRoutePriceDto {
  id?: number;
  routeId?: number;
  vehicleCategoryId: number;
  oneWayAmount: number;
  roundTripAmount: number;
  currency: string;
  active: boolean;
}

export interface IntercityRouteDto {
  id: number;
  originCity: string;
  destinationCity: string;
  distanceKm?: number;
  estimatedHours?: number;
  active: boolean;
  translations: IntercityRouteTranslationDto[];
  prices: IntercityRoutePriceDto[];
}

export interface IntercitySeasonalSurchargeDto {
  id: number;
  routeId?: number;
  seasonName: string;
  startDate: string;
  endDate: string;
  surchargePercent: number;
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

export async function getIntercityRoutePrices(routeId: number): Promise<ApiResponse<IntercityRoutePriceDto[]>> {
  return apiFetch(`/api/v1/intercity-route-prices/by-route/${routeId}`, { skipTranslationFilter: true });
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

export async function getActiveSurcharges(routeId: number, date: string): Promise<ApiResponse<IntercitySeasonalSurchargeDto[]>> {
  return apiFetch(`/api/v1/intercity-surcharges/active?routeId=${routeId}&date=${date}`, { skipTranslationFilter: true });
}

export async function createIntercitySurcharge(dto: Partial<IntercitySeasonalSurchargeDto>): Promise<ApiResponse<IntercitySeasonalSurchargeDto>> {
  return apiFetch("/api/v1/intercity-surcharges", {
    method: "POST",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function updateIntercitySurcharge(id: number, dto: Partial<IntercitySeasonalSurchargeDto>): Promise<ApiResponse<IntercitySeasonalSurchargeDto>> {
  return apiFetch(`/api/v1/intercity-surcharges/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function deleteIntercitySurcharge(id: number): Promise<ApiResponse<void>> {
  return apiFetch(`/api/v1/intercity-surcharges/${id}`, {
    method: "DELETE",
    skipTranslationFilter: true,
  });
}

// === Rentals (self-drive) ===

export async function getRentalPricesByRental(rentalId: number): Promise<ApiResponse<RentalPriceDto[]>> {
  return apiFetch(`/api/rentals/${rentalId}/prices`);
}

export async function getActiveRentals(): Promise<ApiResponse<RentalDto[]>> {
  const res = await apiFetch<ApiResponse<{ content: RentalDto[]; totalElements: number }>>("/api/rentals?page=0&size=100");
  if (res && res.data) {
    const active = (res.data.content || []).filter((r: RentalDto) => r.active);
    return { data: active } as ApiResponse<RentalDto[]>;
  }
  return { data: [] } as ApiResponse<RentalDto[]>;
}

export async function getRentalTypes(): Promise<ApiResponse<RentalTypeDto[]>> {
  const res = await apiFetch<ApiResponse<{ content: RentalTypeDto[]; totalElements: number }>>("/api/rental-types?page=0&size=100");
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
