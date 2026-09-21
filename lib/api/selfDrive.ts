import { apiFetch, ApiResponse, ApiOptions } from "./client";

export interface SelfDriveRentalPriceDto {
  id?: number;
  rentalId?: number;
  vehicleCategoryId?: number;
  currency: string;
  amount: number;
  active: boolean;
}
export type RentalPriceDto = SelfDriveRentalPriceDto;

export interface SelfDriveTypeTranslationDto {
  id?: number;
  locale: string;
  name: string;
  description?: string;
}
export type RentalTypeTranslationDto = SelfDriveTypeTranslationDto;

export interface SelfDriveTypeDto {
  id: number;
  code: string;
  active: boolean;
  translations: SelfDriveTypeTranslationDto[];
}
export type RentalTypeDto = SelfDriveTypeDto;

export interface SelfDriveRentalDto {
  id: number;
  rentalTypeId?: number;
  rentalType?: SelfDriveTypeDto;
  vehicleCategoryId: number;
  driverRequired: boolean;
  deposit?: number;
  depositType?: "FIXED" | "PERCENT";
  depositRate?: number;
  minimumDays?: number;
  active: boolean;
  isContactOnly?: boolean;
  sortOrder?: number;
}
export type RentalDto = SelfDriveRentalDto;

// === Self Drive Rentals ===

export async function getAdminSelfDriveRentals(page = 0, size = 100): Promise<ApiResponse<{ content: SelfDriveRentalDto[]; totalElements: number }>> {
  return apiFetch(`/api/v1/admin/self-drive-rentals?page=${page}&size=${size}`, { skipTranslationFilter: true });
}
export const getAdminRentals = getAdminSelfDriveRentals;

export async function createSelfDriveRental(dto: Partial<SelfDriveRentalDto>): Promise<ApiResponse<SelfDriveRentalDto>> {
  return apiFetch("/api/v1/admin/self-drive-rentals", {
    method: "POST",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}
export const createRental = createSelfDriveRental;

export async function updateSelfDriveRental(id: number, dto: Partial<SelfDriveRentalDto>): Promise<ApiResponse<SelfDriveRentalDto>> {
  return apiFetch(`/api/v1/admin/self-drive-rentals/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}
export const updateRental = updateSelfDriveRental;

export async function deleteSelfDriveRental(id: number): Promise<ApiResponse<void>> {
  return apiFetch(`/api/v1/admin/self-drive-rentals/${id}`, {
    method: "DELETE",
    skipTranslationFilter: true,
  });
}
export const deleteRental = deleteSelfDriveRental;

export async function getSelfDriveRentalPrices(rentalId: number): Promise<ApiResponse<SelfDriveRentalPriceDto[]>> {
  return apiFetch(`/api/v1/self-drive-rentals/${rentalId}/prices`);
}
export const getRentalPricesByRental = getSelfDriveRentalPrices;

export async function createSelfDriveRentalPrice(rentalId: number, dto: Partial<SelfDriveRentalPriceDto>): Promise<ApiResponse<SelfDriveRentalPriceDto>> {
  return apiFetch(`/api/v1/admin/self-drive-rentals/${rentalId}/prices`, {
    method: "POST",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}
export const createRentalPrice = createSelfDriveRentalPrice;

export async function updateSelfDriveRentalPrice(rentalId: number, priceId: number, dto: Partial<SelfDriveRentalPriceDto>): Promise<ApiResponse<SelfDriveRentalPriceDto>> {
  return apiFetch(`/api/v1/admin/self-drive-rentals/${rentalId}/prices/${priceId}`, {
    method: "PUT",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}
export const updateRentalPrice = updateSelfDriveRentalPrice;

export async function getActiveSelfDriveRentals(options?: ApiOptions): Promise<ApiResponse<SelfDriveRentalDto[]>> {
  const res = await apiFetch<ApiResponse<{ content: SelfDriveRentalDto[]; totalElements: number }>>("/api/v1/self-drive-rentals?page=0&size=100", options);
  if (res && res.data) {
    const active = (res.data.content || []).filter((r: SelfDriveRentalDto) => r.active);
    return { data: active } as ApiResponse<SelfDriveRentalDto[]>;
  }
  return { data: [] } as ApiResponse<SelfDriveRentalDto[]>;
}
export const getActiveRentals = getActiveSelfDriveRentals;

export async function getSelfDriveTypes(): Promise<ApiResponse<SelfDriveTypeDto[]>> {
  const res = await apiFetch<ApiResponse<{ content: SelfDriveTypeDto[]; totalElements: number }>>("/api/v1/self-drive-types?page=0&size=100");
  return { data: res?.data?.content || [] } as ApiResponse<SelfDriveTypeDto[]>;
}
export const getRentalTypes = getSelfDriveTypes;
