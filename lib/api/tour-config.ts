import { apiFetch, ApiResponse } from "./client";

export interface TourConfigDto {
  id?: number;
  recommendedLimit: number;
  autoRecommendEnabled: boolean;
}

/**
 * Public API to fetch tour configuration
 */
export async function getPublicTourConfig(): Promise<ApiResponse<TourConfigDto>> {
  return apiFetch<ApiResponse<TourConfigDto>>("/api/v1/tours/config");
}

/**
 * Admin API to fetch tour configuration
 */
export async function getAdminTourConfig(): Promise<ApiResponse<TourConfigDto>> {
  return apiFetch<ApiResponse<TourConfigDto>>("/api/v1/admin/tours/config");
}

/**
 * Admin API to update tour configuration
 */
export async function updateAdminTourConfig(
  dto: Partial<TourConfigDto>
): Promise<ApiResponse<TourConfigDto>> {
  return apiFetch<ApiResponse<TourConfigDto>>("/api/v1/admin/tours/config", {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}
