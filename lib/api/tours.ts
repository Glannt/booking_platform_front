import { apiFetch, ApiResponse } from "./client";
import { MediaDto } from "./media";
import type { ComponentItem } from "@/types/routeComponents";
import type { DepositType } from "@/types/deposit";

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

export interface PriceListPerPersonDto {
  id?: number;
  passengerType: "ADULT" | "CHILD" | "INFANT" | string;
  pricePerPerson: number;
  minPax?: number;
  maxPax?: number;
  active?: boolean;
  applyAgeCondition?: boolean;
  minAge?: number | null;
  maxAge?: number | null;
  applyHeightCondition?: boolean;
  minHeight?: number | null;
  maxHeight?: number | null;
}

export interface TourPackageDto {
  id?: number;
  tourId?: number;
  code?: string;
  name?: string;
  prices?: PriceListPerPersonDto[];
  pricingType?: "PER_PERSON" | "PRIVATE_CHARTER";
  adultPrice?: number;
  childPrice?: number;
  infantPrice?: number;
  childPolicyNote?: string;
  infantPolicyNote?: string;
  fixedPrice?: number;
  isContactOnly?: boolean;
  contactOnly?: boolean;
  /** Fixed / percent deposit configured on the package; `""` / null means no deposit. */
  depositType?: DepositType | "" | null;
  depositRate?: number | null;
  depositAmount?: number | null;
  minGuests?: number;
  maxGuests?: number;
  highlights?: string;
  inclusions?: string;
  exclusions?: string;
  active: boolean;
  sortOrder?: number;
  translations: TourPackageTranslationDto[];
}

export function getPackagePrice(pkg?: TourPackageDto, type: "ADULT" | "CHILD" | "INFANT" = "ADULT"): number {
  if (!pkg) return 0;
  if (pkg.prices && pkg.prices.length > 0) {
    const found = pkg.prices.find((p) => p.passengerType === type);
    if (found && typeof found.pricePerPerson === "number") return found.pricePerPerson;
  }
  if (type === "ADULT") return pkg.adultPrice || 0;
  if (type === "CHILD") return pkg.childPrice || 0;
  if (type === "INFANT") return pkg.infantPrice || 0;
  return 0;
}

export function getPackagePriceItem(pkg?: TourPackageDto, type: "ADULT" | "CHILD" | "INFANT" = "ADULT"): PriceListPerPersonDto | undefined {
  if (!pkg || !pkg.prices) return undefined;
  return pkg.prices.find((p) => p.passengerType === type);
}

/**
 * Front-end mirror of `TourPackage.isPublishable()` on the server: a package may only be sold
 * active when it has an active ADULT price above zero, or is flagged as contact-only (a quote
 * request). The API rejects the save either way — this runs first so the modal can name the
 * offending package instead of surfacing a bare 400.
 *
 * A missing `active` counts as active, because that is the server's own default.
 */
export function isPackagePublishable(pkg: TourPackageDto): boolean {
  if (pkg.active === false || pkg.isContactOnly || pkg.contactOnly) return true;
  return (pkg.prices ?? []).some(
    (p) =>
      p.passengerType === "ADULT" &&
      p.active !== false &&
      typeof p.pricePerPerson === "number" &&
      p.pricePerPerson > 0
  );
}

export function formatPassengerCondition(
  item?: PriceListPerPersonDto | null,
  language: string = "vi"
): string {
  if (!item) return "";
  const hasAge = Boolean(item.applyAgeCondition);
  const hasHeight = Boolean(item.applyHeightCondition);
  const isVi = language === "vi";

  let ageStr = "";
  if (hasAge) {
    const minAge = item.minAge;
    const maxAge = item.maxAge;
    if (minAge != null && minAge > 0 && maxAge != null && maxAge > 0) {
      ageStr = isVi ? `${minAge} - ${maxAge} tuổi` : `${minAge} - ${maxAge} yrs`;
    } else if (minAge != null && minAge > 0) {
      ageStr = isVi ? `Từ ${minAge} tuổi trở lên` : `From ${minAge}+ yrs`;
    } else if (maxAge != null && maxAge > 0) {
      ageStr = isVi ? `Dưới ${maxAge + 1} tuổi` : `Under ${maxAge + 1} yrs`;
    }
  }

  let heightStr = "";
  if (hasHeight) {
    const minHeight = item.minHeight;
    const maxHeight = item.maxHeight;
    if (minHeight != null && minHeight > 0 && maxHeight != null && maxHeight > 0) {
      heightStr = isVi ? `Cao ${minHeight} - ${maxHeight}cm` : `Height ${minHeight} - ${maxHeight}cm`;
    } else if (minHeight != null && minHeight > 0) {
      heightStr = isVi ? `Cao từ ${minHeight}cm trở lên` : `Height ≥ ${minHeight}cm`;
    } else if (maxHeight != null && maxHeight > 0) {
      heightStr = isVi ? `Cao dưới ${maxHeight + 1}cm` : `Height < ${maxHeight + 1}cm`;
    }
  }

  if (hasAge && hasHeight && ageStr && heightStr) {
    return isVi ? `${ageStr} hoặc ${heightStr.toLowerCase()}` : `${ageStr} or ${heightStr.toLowerCase()}`;
  }
  if (hasAge && ageStr) return ageStr;
  if (hasHeight && heightStr) return heightStr;
  return "";
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
  slug?: string;
  tourCategoryId?: number;
  tourCategory?: TourCategoryDto;
  inclusions?: string;
  exclusions?: string;
  components?: ComponentItem[];
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
  isRecommended?: boolean;
  successfulBookingsCount?: number;
  totalRevenue?: number;
  translations: TourTranslationDto[];
  options: TourOptionDto[];
  days: TourDayDto[];
  prices: TourPriceDto[];
  packages?: TourPackageDto[];
}

export interface CreateTourRequest {
  tourCategoryId: number;
  slug?: string;
  inclusions?: string;
  exclusions?: string;
  components?: ComponentItem[];
  durationDays: number;
  durationNights: number;
  minGuest?: number;
  maxGuest?: number;
  active: boolean;
  status?: "ACTIVE" | "DRAFT" | "INACTIVE" | string;
  isDefault?: boolean;
  isRecommended?: boolean;
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
  isActive?: boolean;
  active?: boolean;
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
