import { apiFetch, ApiResponse, ApiOptions } from "./client";
import type { DepositType } from "@/types/deposit";

export interface VehicleCategoryTranslationDto {
  id?: number;
  locale: string;
  name: string;
  slug: string;
  description: string;
}

export interface VehicleCategoryDto {
  id: number;
  code: string;
  minSeat: number;
  maxSeat: number;
  minLuggage: number;
  maxLuggage: number;
  unitLuggage: string;
  active: boolean;
  translations: VehicleCategoryTranslationDto[];
  default: boolean;
  thumbnailId?: number;
  thumbnailUrl?: string;
  totalVehicles?: number;
  availableVehicles?: number;
}

export interface AddOnTranslationDto {
  id?: number;
  locale: string;
  name: string;
  description?: string;
}

export interface AddOnDto {
  id: number;
  categoryId?: number;
  categoryCode?: string;
  categoryName?: string;
  categoryTranslations?: AddOnCategoryTranslationDto[];
  code: string;
  value?: string;
  icon?: string;
  displayOrder: number;
  active: boolean;
  translations?: AddOnTranslationDto[];
}

export interface AddOnCategoryTranslationDto {
  id?: number;
  locale: string;
  name: string;
  description?: string;
}

export interface AddOnCategoryDto {
  id: number;
  code: string;
  icon?: string;
  displayOrder: number;
  active: boolean;
  isFilterable: boolean;
  translations?: AddOnCategoryTranslationDto[];
  addOns?: AddOnDto[];
}

export interface AmenityTranslationDto {
  id?: number;
  locale: string;
  name: string;
  description?: string;
}

export interface AmenityDto {
  id: number;
  categoryId?: number;
  categoryCode?: string;
  categoryName?: string;
  categoryTranslations?: AmenityCategoryTranslationDto[];
  code: string;
  icon?: string;
  displayOrder: number;
  active: boolean;
  translations?: AmenityTranslationDto[];
}

export interface AmenityCategoryTranslationDto {
  id?: number;
  locale: string;
  name: string;
  description?: string;
}

export interface AmenityCategoryDto {
  id: number;
  code: string;
  icon?: string;
  displayOrder: number;
  active: boolean;
  translations?: AmenityCategoryTranslationDto[];
  amenities?: AmenityDto[];
}

// Public DTOs (sanitized, localized, without internal fields)
export interface PublicAddOnDto {
  id: number;
  categoryCode: string;
  code: string;
  name: string;
  description?: string;
  value?: string;
  icon?: string;
  displayOrder: number;
}

export interface PublicAddOnCategoryDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isFilterable: boolean;
  addOns: PublicAddOnDto[];
}

export interface PublicAmenityDto {
  id: number;
  categoryCode: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  displayOrder: number;
}

export interface PublicAmenityCategoryDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  amenities: PublicAmenityDto[];
}

export interface VehicleDto {
  id: number;
  brand: string;
  model: string;
  licensePlate?: string;
  year: number;
  fuelType: string;
  active: boolean;
  canRent: boolean;
  luggage: number;
  luggageUnit: string;
  thumbnailId?: number;
  thumbnailUrl?: string;
  imageIds?: number[];
  images?: { id: number; fileName: string; filePath: string; fileSize: number; mimeType: string; width?: number; height?: number; altText?: string }[];
  type: VehicleCategoryDto;
  addOns?: AddOnDto[];
  amenities?: AmenityDto[];
}

export interface PaginatedResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export async function getVehicleCategories(params?: {
  search?: string;
  active?: boolean;
  page?: number;
  size?: number;
}, options?: ApiOptions): Promise<ApiResponse<PaginatedResponse<VehicleCategoryDto>>> {
  const query = new URLSearchParams();
  if (params?.search !== undefined) query.append("search", params.search);
  if (params?.active !== undefined) query.append("active", params.active.toString());
  if (params?.page !== undefined) query.append("page", params.page.toString());
  if (params?.size !== undefined) query.append("size", params.size.toString());
  const queryString = query.toString();
  return apiFetch<ApiResponse<PaginatedResponse<VehicleCategoryDto>>>(
    `/api/v1/vehicle-categories${queryString ? `?${queryString}` : ""}`,
    options
  );
}

export async function getVehicleCategoryById(id: number, options?: ApiOptions): Promise<ApiResponse<VehicleCategoryDto>> {
  return apiFetch<ApiResponse<VehicleCategoryDto>>(`/api/v1/vehicle-categories/${id}`, options);
}

export async function getVehicleCategoryBySlug(slug: string, options?: ApiOptions): Promise<ApiResponse<VehicleCategoryDto>> {
  return apiFetch<ApiResponse<VehicleCategoryDto>>(`/api/v1/vehicle-categories/slug/${encodeURIComponent(slug)}`, options);
}

export async function getVehicleCategoryByIdOrSlug(idOrSlug: string | number, options?: ApiOptions): Promise<ApiResponse<VehicleCategoryDto>> {
  if (typeof idOrSlug === "number" || (!isNaN(Number(idOrSlug)) && !String(idOrSlug).includes("-"))) {
    return getVehicleCategoryById(Number(idOrSlug), options);
  }
  return getVehicleCategoryBySlug(String(idOrSlug), options);
}

export async function createVehicleCategory(payload: Omit<VehicleCategoryDto, "id">): Promise<ApiResponse<VehicleCategoryDto>> {
  return apiFetch<ApiResponse<VehicleCategoryDto>>("/api/v1/vehicle-categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateVehicleCategory(id: number, payload: Partial<VehicleCategoryDto>): Promise<ApiResponse<VehicleCategoryDto>> {
  return apiFetch<ApiResponse<VehicleCategoryDto>>(`/api/v1/vehicle-categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteVehicleCategory(id: number): Promise<void> {
  return apiFetch<void>(`/api/vehicle-categories/${id}`, {
    method: "DELETE",
  });
}

export async function getVehicles(params?: {
  keyword?: string;
  page?: number;
  size?: number;
}): Promise<ApiResponse<PaginatedResponse<VehicleDto>>> {
  const query = new URLSearchParams();
  if (params?.keyword !== undefined) query.append("keyword", params.keyword);
  if (params?.page !== undefined) query.append("page", params.page.toString());
  if (params?.size !== undefined) query.append("size", params.size.toString());
  const queryString = query.toString();
  return apiFetch<ApiResponse<PaginatedResponse<VehicleDto>>>(`/api/v1/vehicles${queryString ? `?${queryString}` : ""}`);
}

export async function createVehicle(payload: {
  brand: string;
  model: string;
  licensePlate?: string;
  year: number;
  fuelType: string;
  active: boolean;
  canRent: boolean;
  luggage: number;
  luggageUnit: string;
  imageIds?: number[];
  thumbnailId?: number;
  typeId?: number;
  vehicleCategoryId?: number;
  addOnIds?: number[];
  amenityIds?: number[];
}): Promise<ApiResponse<VehicleDto>> {
  return apiFetch<ApiResponse<VehicleDto>>("/api/v1/vehicles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateVehicle(id: number, payload: {
  brand: string;
  model: string;
  licensePlate?: string;
  year: number;
  fuelType: string;
  active: boolean;
  canRent: boolean;
  luggage: number;
  luggageUnit: string;
  imageIds?: number[];
  thumbnailId?: number;
  typeId?: number;
  vehicleCategoryId?: number;
  addOnIds?: number[];
  amenityIds?: number[];
}): Promise<ApiResponse<VehicleDto>> {
  return apiFetch<ApiResponse<VehicleDto>>(`/api/v1/vehicles/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteVehicle(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/vehicles/${id}`, {
    method: "DELETE",
  });
}

export async function getRentableVehiclesByCategory(categoryId: number): Promise<ApiResponse<VehicleDto[]>> {
  if (!categoryId || isNaN(Number(categoryId)) || Number(categoryId) <= 0) {
    return { data: [], status: "200", message: "Invalid category ID" };
  }
  return apiFetch<ApiResponse<VehicleDto[]>>(`/api/v1/vehicles/by-category/${categoryId}/rentable`);
}

export async function getCategoryImages(categoryId: number): Promise<ApiResponse<{ id: number; filePath: string; altText?: string }[]>> {
  if (!categoryId || isNaN(Number(categoryId)) || Number(categoryId) <= 0) {
    return { data: [], status: "200", message: "Invalid category ID" };
  }
  return apiFetch<ApiResponse<{ id: number; filePath: string; altText?: string }[]>>(`/api/v1/vehicles/by-category/${categoryId}/images`);
}

// Strategy Pattern Vehicle Matching for Booking Assignment
export async function matchVehicles(params: {
  categoryId: number;
  seatAddOnId?: number;
  fuelAddOnId?: number;
  addOnIds?: number[];
}): Promise<ApiResponse<VehicleDto[]>> {
  const query = new URLSearchParams();
  query.append("categoryId", params.categoryId.toString());
  if (params.seatAddOnId) query.append("seatAddOnId", params.seatAddOnId.toString());
  if (params.fuelAddOnId) query.append("fuelAddOnId", params.fuelAddOnId.toString());
  if (params.addOnIds && params.addOnIds.length > 0) {
    query.append("addOnIds", params.addOnIds.join(","));
  }
  return apiFetch<ApiResponse<VehicleDto[]>>(`/api/v1/vehicles/match?${query.toString()}`);
}

// Public API for Customer/Guest (Localized & Sanitized)
export async function getPublicAddOnCategories(params?: {
  locale?: string;
  filterableOnly?: boolean;
}): Promise<ApiResponse<PublicAddOnCategoryDto[]>> {
  const query = new URLSearchParams();
  if (params?.locale) query.append("locale", params.locale);
  if (params?.filterableOnly !== undefined) query.append("filterableOnly", params.filterableOnly.toString());
  const queryString = query.toString();
  return apiFetch<ApiResponse<PublicAddOnCategoryDto[]>>(`/api/v1/public/addon-categories${queryString ? `?${queryString}` : ""}`);
}

export async function getPublicAddOnsByCategory(params: {
  categoryCode: string;
  locale?: string;
}): Promise<ApiResponse<PublicAddOnDto[]>> {
  const query = new URLSearchParams();
  query.append("categoryCode", params.categoryCode);
  if (params.locale) query.append("locale", params.locale);
  return apiFetch<ApiResponse<PublicAddOnDto[]>>(`/api/v1/public/addons?${query.toString()}`);
}

export async function getPublicAmenityCategories(params?: {
  locale?: string;
}): Promise<ApiResponse<PublicAmenityCategoryDto[]>> {
  const query = new URLSearchParams();
  if (params?.locale) query.append("locale", params.locale);
  const queryString = query.toString();
  return apiFetch<ApiResponse<PublicAmenityCategoryDto[]>>(`/api/v1/public/amenity-categories${queryString ? `?${queryString}` : ""}`);
}

export async function getPublicAmenitiesByCategory(params: {
  categoryCode: string;
  locale?: string;
}): Promise<ApiResponse<PublicAmenityDto[]>> {
  const query = new URLSearchParams();
  query.append("categoryCode", params.categoryCode);
  if (params.locale) query.append("locale", params.locale);
  return apiFetch<ApiResponse<PublicAmenityDto[]>>(`/api/v1/public/amenities?${query.toString()}`);
}

// Portal / Admin API for Add-on Categories & Add-ons
export async function getAddOnCategories(activeOnly?: boolean): Promise<ApiResponse<AddOnCategoryDto[]>> {
  const query = activeOnly ? "?activeOnly=true" : "";
  return apiFetch<ApiResponse<AddOnCategoryDto[]>>(`/api/v1/addon-categories${query}`);
}

export async function createAddOnCategory(payload: any): Promise<ApiResponse<AddOnCategoryDto>> {
  return apiFetch<ApiResponse<AddOnCategoryDto>>("/api/v1/addon-categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAddOnCategory(id: number, payload: any): Promise<ApiResponse<AddOnCategoryDto>> {
  return apiFetch<ApiResponse<AddOnCategoryDto>>(`/api/v1/addon-categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAddOnCategory(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/addon-categories/${id}`, { method: "DELETE" });
}

export async function getAddOnsByCategoryId(categoryId: number): Promise<ApiResponse<AddOnDto[]>> {
  return apiFetch<ApiResponse<AddOnDto[]>>(`/api/v1/addons/by-category-id/${categoryId}`);
}

export async function createAddOn(payload: any): Promise<ApiResponse<AddOnDto>> {
  return apiFetch<ApiResponse<AddOnDto>>("/api/v1/addons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAddOn(id: number, payload: any): Promise<ApiResponse<AddOnDto>> {
  return apiFetch<ApiResponse<AddOnDto>>(`/api/v1/addons/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAddOn(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/addons/${id}`, { method: "DELETE" });
}

// Portal / Admin API for Amenity Categories & Amenities
export async function getAmenityCategories(activeOnly?: boolean): Promise<ApiResponse<AmenityCategoryDto[]>> {
  const query = activeOnly ? "?activeOnly=true" : "";
  return apiFetch<ApiResponse<AmenityCategoryDto[]>>(`/api/v1/amenity-categories${query}`);
}

export async function createAmenityCategory(payload: any): Promise<ApiResponse<AmenityCategoryDto>> {
  return apiFetch<ApiResponse<AmenityCategoryDto>>("/api/v1/amenity-categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAmenityCategory(id: number, payload: any): Promise<ApiResponse<AmenityCategoryDto>> {
  return apiFetch<ApiResponse<AmenityCategoryDto>>(`/api/v1/amenity-categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAmenityCategory(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/amenity-categories/${id}`, { method: "DELETE" });
}

export async function getAmenitiesByCategoryId(categoryId: number): Promise<ApiResponse<AmenityDto[]>> {
  return apiFetch<ApiResponse<AmenityDto[]>>(`/api/v1/amenities/by-category-id/${categoryId}`);
}

export async function createAmenity(payload: any): Promise<ApiResponse<AmenityDto>> {
  return apiFetch<ApiResponse<AmenityDto>>("/api/v1/amenities", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAmenity(id: number, payload: any): Promise<ApiResponse<AmenityDto>> {
  return apiFetch<ApiResponse<AmenityDto>>(`/api/v1/amenities/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAmenity(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/amenities/${id}`, { method: "DELETE" });
}


// Airports
export interface AirportTranslationDto {
  id?: number;
  locale: string;
  name: string;
  description?: string;
}

export interface AirportDto {
  id?: number;
  code: string;
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  active: boolean;
  isDefault?: boolean;
  translations?: AirportTranslationDto[];
}

export async function getAirports(): Promise<ApiResponse<PaginatedResponse<AirportDto>>> {
  return apiFetch<ApiResponse<PaginatedResponse<AirportDto>>>("/api/v1/airports");
}

export async function getActiveAirports(): Promise<ApiResponse<AirportDto[]>> {
  return apiFetch<ApiResponse<AirportDto[]>>("/api/v1/airports/active");
}

export async function createAirport(payload: Omit<AirportDto, "id">): Promise<ApiResponse<AirportDto>> {
  return apiFetch<ApiResponse<AirportDto>>("/api/v1/airports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAirport(id: number, payload: Partial<AirportDto>): Promise<ApiResponse<AirportDto>> {
  return apiFetch<ApiResponse<AirportDto>>(`/api/v1/airports/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAirport(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/airports/${id}`, {
    method: "DELETE",
  });
}

// Airport Routes
export interface AirportRouteDto {
  id?: number;
  code: string;
  airportId?: number;
  name?: string;
  airportName?: string;
  airportCode?: string;
  distanceKm?: number;
  originName?: string;
  destinationName?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  active: boolean;
  depositType?: DepositType;
  depositRate?: number;
  depositAmount?: number;
}

export async function getAirportRoutes(): Promise<ApiResponse<PaginatedResponse<AirportRouteDto>>> {
  return apiFetch<ApiResponse<PaginatedResponse<AirportRouteDto>>>("/api/v1/airport-routes");
}

export async function getActiveAirportRoutes(airportId: number): Promise<ApiResponse<AirportRouteDto[]>> {
  return apiFetch<ApiResponse<AirportRouteDto[]>>(`/api/v1/airport-routes/active?airportId=${airportId}`);
}

export async function createAirportRoute(payload: AirportRouteDto): Promise<ApiResponse<AirportRouteDto>> {
  return apiFetch<ApiResponse<AirportRouteDto>>("/api/v1/airport-routes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAirportRoute(id: number, payload: AirportRouteDto): Promise<ApiResponse<AirportRouteDto>> {
  return apiFetch<ApiResponse<AirportRouteDto>>(`/api/v1/airport-routes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAirportRoute(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/airport-routes/${id}`, {
    method: "DELETE",
  });
}

// Airport Transfers (now directly AirportTransferPrice records)
export interface AirportTransferPrice {
  id?: number;
  airportRouteId: number;
  vehicleCategoryId: number;
  baseKm: number;
  baseAmount: number;
  perKmAmount: number;
  zoneBufferKm?: number;
  fixedOvercharge: boolean;
  feeOverchargeFixed?: number;
  currency: string;
  active: boolean;
  depositType?: DepositType | null;
  depositRate?: number | null;
  depositAmount?: number | null;
}

export interface SurchargeRule {
  id?: number;
  code: string;
  description?: string;
  country: string;
  startTime: string;
  endTime: string;
  amount: number;
  currency: string;
  active: boolean;
}

export interface SurchargeRuleVehicle {
  id?: number;
  surchargeRuleId: number;
  vehicleCategoryId: number;
}

export async function getSurchargeRules(): Promise<ApiResponse<PaginatedResponse<SurchargeRule>>> {
  return apiFetch<ApiResponse<PaginatedResponse<SurchargeRule>>>("/api/v1/surcharge-rules");
}

export async function createSurchargeRule(payload: Omit<SurchargeRule, "id">): Promise<ApiResponse<SurchargeRule>> {
  return apiFetch<ApiResponse<SurchargeRule>>("/api/v1/surcharge-rules", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSurchargeRule(id: number, payload: Partial<SurchargeRule>): Promise<ApiResponse<SurchargeRule>> {
  return apiFetch<ApiResponse<SurchargeRule>>(`/api/v1/surcharge-rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteSurchargeRule(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/surcharge-rules/${id}`, {
    method: "DELETE",
  });
}

export async function getAirportTransfers(): Promise<ApiResponse<PaginatedResponse<AirportTransferPrice>>> {
  return apiFetch<ApiResponse<PaginatedResponse<AirportTransferPrice>>>("/api/v1/airport-transfers");
}

export async function getAirportTransfer(id: number): Promise<ApiResponse<AirportTransferPrice>> {
  return apiFetch<ApiResponse<AirportTransferPrice>>(`/api/v1/airport-transfers/${id}`);
}

export async function createAirportTransfer(payload: AirportTransferPrice): Promise<ApiResponse<AirportTransferPrice>> {
  return apiFetch<ApiResponse<AirportTransferPrice>>("/api/v1/airport-transfers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAirportTransfer(id: number, payload: AirportTransferPrice): Promise<ApiResponse<AirportTransferPrice>> {
  return apiFetch<ApiResponse<AirportTransferPrice>>(`/api/v1/airport-transfers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAirportTransfer(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/airport-transfers/${id}`, {
    method: "DELETE",
  });
}

export async function getAirportTransferPricesByRoute(routeId: number): Promise<ApiResponse<AirportTransferPrice[]>> {
  return apiFetch<ApiResponse<AirportTransferPrice[]>>(`/api/v1/airport-transfers/by-route/${routeId}`);
}
