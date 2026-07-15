import { apiFetch, ApiResponse } from "./client";

export interface ServiceCategoryTranslationDto {
  id?: number;
  locale: string;
  name: string;
  slug: string;
  description: string;
}

export interface ServiceCategoryDto {
  id: number;
  iconImageId?: number;
  status: string;
  translations: ServiceCategoryTranslationDto[];
}

export async function getCategories(): Promise<ApiResponse<ServiceCategoryDto[]>> {
  return apiFetch<ApiResponse<ServiceCategoryDto[]>>("/api/v1/admin/services/categories");
}

export async function createCategory(payload: {
  iconImageId?: number;
  status?: string;
  translations: Omit<ServiceCategoryTranslationDto, "id">[];
}): Promise<ApiResponse<ServiceCategoryDto>> {
  return apiFetch<ApiResponse<ServiceCategoryDto>>("/api/v1/admin/services/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(
  id: number,
  payload: {
    iconImageId?: number;
    status?: string;
    translations: Omit<ServiceCategoryTranslationDto, "id">[];
  }
): Promise<ApiResponse<ServiceCategoryDto>> {
  return apiFetch<ApiResponse<ServiceCategoryDto>>(`/api/v1/admin/services/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/admin/services/categories/${id}`, {
    method: "DELETE",
  });
}
