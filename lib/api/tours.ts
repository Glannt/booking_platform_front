import { apiFetch, ApiResponse } from "./client";
import { MediaDto } from "./media";

export interface TourTranslationDto {
  id?: number;
  locale: string;
  name: string;
  slug?: string;
  description: string;
  content: string;
}

export interface TourOptionTranslationDto {
  id?: number;
  locale: string;
  content: string;
}

export interface TourOptionDto {
  id?: number;
  iconUrl?: string;
  colorText?: string;
  colorIcon?: string;
  translations: TourOptionTranslationDto[];
}

export interface TourDayTranslationDto {
  id?: number;
  locale: string;
  name: string;
  description: string;
}

export interface TourDayActivityTranslationDto {
  id?: number;
  locale: string;
  name: string;
  description: string;
}

export interface TourDayActivityDto {
  id?: number;
  startTime: string;
  endTime: string;
  location: string;
  translations: TourDayActivityTranslationDto[];
}

export interface TourDayDto {
  id?: number;
  dayNumber: number;
  translations: TourDayTranslationDto[];
  activities: TourDayActivityDto[];
}

export interface TourPackageTranslationDto {
  id?: number;
  locale: string;
  name: string;
  description?: string;
  highlights?: string;
  inclusions?: string;
  exclusions?: string;
}

export interface TourPackageDto {
  id?: number;
  tourId?: number;
  code?: string;
  pricingType: "PER_PERSON" | "PRIVATE_CHARTER";
  adultPrice?: number;
  childPrice?: number;
  infantPrice?: number;
  childPolicyNote?: string;
  infantPolicyNote?: string;
  fixedPrice?: number;
  isContactOnly?: boolean;
  highlights?: string;
  inclusions?: string;
  exclusions?: string;
  active: boolean;
  sortOrder?: number;
  translations: TourPackageTranslationDto[];
}

export interface TourPriceDto {
  id?: number;
  vehicleCategoryId: number;
  currency: string;
  amount: number;
  active: boolean;
}

export interface TourDto {
  id: number;
  tourCategoryId?: number;
  tourCategory?: TourCategoryDto;
  inclusions?: string;
  exclusions?: string;
  durationDays: number;
  durationNights: number;
  minGuest?: number;
  maxGuest?: number;
  active: boolean;
  status?: "ACTIVE" | "DRAFT" | "INACTIVE" | string;
  thumbnailId?: number;
  thumbnail?: MediaDto;
  imageIds?: number[];
  images?: MediaDto[];
  isDefault?: boolean;
  translations: TourTranslationDto[];
  options: TourOptionDto[];
  days: TourDayDto[];
  prices: TourPriceDto[];
  packages?: TourPackageDto[];
}

export interface CreateTourRequest {
  tourCategoryId: number;
  inclusions?: string;
  exclusions?: string;
  durationDays: number;
  durationNights: number;
  minGuest?: number;
  maxGuest?: number;
  active: boolean;
  status?: "ACTIVE" | "DRAFT" | "INACTIVE" | string;
  isDefault?: boolean;
  thumbnailId?: number;
  imageIds?: number[];
  translations: TourTranslationDto[];
  options: TourOptionDto[];
  days: TourDayDto[];
  prices: TourPriceDto[];
  packages?: TourPackageDto[];
}

export interface PageResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface TourCategoryTranslationDto {
  id?: number;
  locale: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface TourCategoryDto {
  id: number;
  code?: string;
  icon?: string;
  sortOrder?: number;
  active?: boolean;
  isActive?: boolean;
  title?: string;
  description?: string;
  translations?: TourCategoryTranslationDto[];
}

export async function getTours(params?: {
  page?: number;
  size?: number;
  search?: string;
  tourCategoryId?: number;
}): Promise<ApiResponse<PageResponse<TourDto>>> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.append("page", params.page.toString());
  if (params?.size !== undefined) query.append("size", params.size.toString());
  if (params?.search !== undefined) query.append("search", params.search);
  if (params?.tourCategoryId !== undefined) query.append("tourCategoryId", params.tourCategoryId.toString());

  const queryString = query.toString();
  const path = `/api/v1/tours${queryString ? `?${queryString}` : ""}`;
  return apiFetch<ApiResponse<PageResponse<TourDto>>>(path);
}

export async function getTourCategories(): Promise<ApiResponse<PageResponse<TourCategoryDto>>> {
  return apiFetch<ApiResponse<PageResponse<TourCategoryDto>>>("/api/v1/public/tour-categories");
}

export async function getAdminTourCategories(): Promise<ApiResponse<PageResponse<TourCategoryDto>>> {
  return apiFetch<ApiResponse<PageResponse<TourCategoryDto>>>("/api/v1/tour-categories");
}

export async function createTourCategory(payload: Partial<TourCategoryDto>): Promise<ApiResponse<TourCategoryDto>> {
  return apiFetch<ApiResponse<TourCategoryDto>>("/api/v1/tour-categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTourCategory(id: number, payload: Partial<TourCategoryDto>): Promise<ApiResponse<TourCategoryDto>> {
  return apiFetch<ApiResponse<TourCategoryDto>>(`/api/v1/tour-categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTourCategory(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/tour-categories/${id}`, {
    method: "DELETE",
  });
}

export async function getTourById(id: number): Promise<ApiResponse<TourDto>> {
  return apiFetch<ApiResponse<TourDto>>(`/api/v1/tours/${id}`);
}

export async function getTourBySlug(slug: string): Promise<ApiResponse<TourDto>> {
  return apiFetch<ApiResponse<TourDto>>(`/api/v1/tours/slug/${encodeURIComponent(slug)}`);
}

export async function getTourByIdOrSlug(idOrSlug: string | number): Promise<ApiResponse<TourDto>> {
  if (typeof idOrSlug === "number" || (!isNaN(Number(idOrSlug)) && !String(idOrSlug).includes("-"))) {
    return getTourById(Number(idOrSlug));
  }
  return getTourBySlug(String(idOrSlug));
}

export async function createTour(payload: CreateTourRequest): Promise<ApiResponse<TourDto>> {
  return apiFetch<ApiResponse<TourDto>>("/api/v1/tours", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTour(id: number, payload: Partial<TourDto>): Promise<ApiResponse<TourDto>> {
  return apiFetch<ApiResponse<TourDto>>(`/api/v1/tours/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTour(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/tours/${id}`, {
    method: "DELETE",
  });
}
