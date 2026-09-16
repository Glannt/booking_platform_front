import { apiFetch, ApiResponse } from "./client";

export interface SelfDrivePolicyTranslationDto {
  id?: number;
  policyId?: number;
  locale: string;
  name: string;
  description?: string;
}

export interface SelfDrivePolicyDto {
  id: number;
  code: string;
  icon?: string;
  sortOrder: number;
  active: boolean;
  translations: SelfDrivePolicyTranslationDto[];
}

export interface PaginatedSelfDrivePolicies {
  content: SelfDrivePolicyDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Public API to fetch active self-drive policies ordered by sortOrder
 */
export async function getPublicSelfDrivePolicies(): Promise<ApiResponse<SelfDrivePolicyDto[]>> {
  return apiFetch<ApiResponse<SelfDrivePolicyDto[]>>("/api/v1/self-drive-policies", {
    skipTranslationFilter: true,
  });
}

/**
 * Admin API: list all self-drive policies with pagination
 */
export async function getAdminSelfDrivePolicies(
  page = 0,
  size = 50
): Promise<ApiResponse<PaginatedSelfDrivePolicies>> {
  return apiFetch<ApiResponse<PaginatedSelfDrivePolicies>>(
    `/api/v1/admin/self-drive-policies?page=${page}&size=${size}`,
    { skipTranslationFilter: true }
  );
}

/**
 * Admin API: get policy by ID
 */
export async function getAdminSelfDrivePolicyById(
  id: number
): Promise<ApiResponse<SelfDrivePolicyDto>> {
  return apiFetch<ApiResponse<SelfDrivePolicyDto>>(`/api/v1/admin/self-drive-policies/${id}`, {
    skipTranslationFilter: true,
  });
}

/**
 * Admin API: create a new self-drive policy
 */
export async function createSelfDrivePolicy(
  dto: Partial<SelfDrivePolicyDto>
): Promise<ApiResponse<SelfDrivePolicyDto>> {
  return apiFetch<ApiResponse<SelfDrivePolicyDto>>("/api/v1/admin/self-drive-policies", {
    method: "POST",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

/**
 * Admin API: update an existing self-drive policy
 */
export async function updateSelfDrivePolicy(
  id: number,
  dto: Partial<SelfDrivePolicyDto>
): Promise<ApiResponse<SelfDrivePolicyDto>> {
  return apiFetch<ApiResponse<SelfDrivePolicyDto>>(`/api/v1/admin/self-drive-policies/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

/**
 * Admin API: toggle active status of a self-drive policy
 */
export async function toggleSelfDrivePolicy(
  id: number
): Promise<ApiResponse<SelfDrivePolicyDto>> {
  return apiFetch<ApiResponse<SelfDrivePolicyDto>>(`/api/v1/admin/self-drive-policies/${id}/toggle`, {
    method: "PATCH",
    skipTranslationFilter: true,
  });
}

/**
 * Admin API: delete a self-drive policy
 */
export async function deleteSelfDrivePolicy(id: number): Promise<ApiResponse<void>> {
  return apiFetch<ApiResponse<void>>(`/api/v1/admin/self-drive-policies/${id}`, {
    method: "DELETE",
    skipTranslationFilter: true,
  });
}
