import { apiFetch, ApiResponse } from "./client";

export interface TourPolicyTranslationDto {
  id?: number;
  policyId?: number;
  locale: string;
  name: string;
  description?: string;
}

export interface TourPolicyDto {
  id: number;
  code: string;
  icon?: string;
  sortOrder: number;
  active: boolean;
  translations: TourPolicyTranslationDto[];
}

export interface PaginatedTourPolicies {
  content: TourPolicyDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Public API to fetch active tour policies ordered by sortOrder
 */
export async function getPublicTourPolicies(): Promise<ApiResponse<TourPolicyDto[]>> {
  return apiFetch<ApiResponse<TourPolicyDto[]>>("/api/v1/tour-policies", {
    skipTranslationFilter: true,
  });
}

/**
 * Admin API: list all tour policies with pagination
 */
export async function getAdminTourPolicies(
  page = 0,
  size = 50
): Promise<ApiResponse<PaginatedTourPolicies>> {
  return apiFetch<ApiResponse<PaginatedTourPolicies>>(
    `/api/v1/admin/tour-policies?page=${page}&size=${size}`,
    { skipTranslationFilter: true }
  );
}

/**
 * Admin API: get policy by ID
 */
export async function getAdminTourPolicyById(
  id: number
): Promise<ApiResponse<TourPolicyDto>> {
  return apiFetch<ApiResponse<TourPolicyDto>>(`/api/v1/admin/tour-policies/${id}`, {
    skipTranslationFilter: true,
  });
}

/**
 * Admin API: create a new tour policy
 */
export async function createTourPolicy(
  dto: Partial<TourPolicyDto>
): Promise<ApiResponse<TourPolicyDto>> {
  return apiFetch<ApiResponse<TourPolicyDto>>("/api/v1/admin/tour-policies", {
    method: "POST",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

/**
 * Admin API: update an existing tour policy
 */
export async function updateTourPolicy(
  id: number,
  dto: Partial<TourPolicyDto>
): Promise<ApiResponse<TourPolicyDto>> {
  return apiFetch<ApiResponse<TourPolicyDto>>(`/api/v1/admin/tour-policies/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

/**
 * Admin API: toggle active status of a tour policy
 */
export async function toggleTourPolicy(
  id: number
): Promise<ApiResponse<TourPolicyDto>> {
  return apiFetch<ApiResponse<TourPolicyDto>>(`/api/v1/admin/tour-policies/${id}/toggle`, {
    method: "PATCH",
    skipTranslationFilter: true,
  });
}

/**
 * Admin API: delete a tour policy
 */
export async function deleteTourPolicy(id: number): Promise<ApiResponse<void>> {
  return apiFetch<ApiResponse<void>>(`/api/v1/admin/tour-policies/${id}`, {
    method: "DELETE",
    skipTranslationFilter: true,
  });
}
