import { apiFetch, ApiResponse, ApiOptions } from "./client";

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
  luggageWeight?: number;
}

export interface VehicleDto {
  id: number;
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  active: boolean;
  canRent: boolean;
  luggage: number;
  luggageUnit: string;
  luggageWeight?: number;
  thumbnailId?: number;
  thumbnailUrl?: string;
  imageIds?: number[];
  images?: { id: number; fileName: string; filePath: string; fileSize: number; mimeType: string; width?: number; height?: number; altText?: string }[];
  type: VehicleCategoryDto;
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
}): Promise<ApiResponse<PaginatedResponse<VehicleDto>>> {
  const query = new URLSearchParams();
  if (params?.keyword !== undefined) query.append("keyword", params.keyword);
  const queryString = query.toString();
  return apiFetch<ApiResponse<PaginatedResponse<VehicleDto>>>(`/api/v1/vehicles${queryString ? `?${queryString}` : ""}`);
}

export async function createVehicle(payload: {
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  active: boolean;
  canRent: boolean;
  luggage: number;
  luggageUnit: string;
  luggageWeight?: number;
  imageIds?: number[];
  thumbnailId?: number;
  typeId: number;
}): Promise<ApiResponse<VehicleDto>> {
  return apiFetch<ApiResponse<VehicleDto>>("/api/v1/vehicles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateVehicle(id: number, payload: {
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  active: boolean;
  canRent: boolean;
  luggage: number;
  luggageUnit: string;
  luggageWeight?: number;
  imageIds?: number[];
  thumbnailId?: number;
  typeId: number;
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
  distanceKm?: number;
  originName?: string;
  destinationName?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  active: boolean;
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
