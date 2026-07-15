// ponytail: service module removed — all functions return empty data
// Re-enable when the service module is re-implemented.

import { apiFetch, ApiResponse } from "./client";

export interface ServiceOptionTypeTranslationDto {
  id?: number;
  locale: string;
  name: string;
  description?: string;
}

export interface ServiceOptionTypeDto {
  id: number;
  code: string;
  systemType: string;
  status: string;
  translations: ServiceOptionTypeTranslationDto[];
}

export interface CreateServiceOptionTypeRequest {
  code: string;
  systemType: string;
  status: string;
  translations: {
    locale: string;
    name: string;
    description?: string;
  }[];
}

const EMPTY_LIST: ApiResponse<ServiceOptionTypeDto[]> = { data: [] };

export async function getServiceOptionTypes(): Promise<ApiResponse<ServiceOptionTypeDto[]>> {
  return EMPTY_LIST;
}

export async function createServiceOptionType(payload: CreateServiceOptionTypeRequest): Promise<ApiResponse<ServiceOptionTypeDto>> {
  throw new Error("Service module is not available");
}

export async function updateServiceOptionType(id: number, payload: CreateServiceOptionTypeRequest): Promise<ApiResponse<ServiceOptionTypeDto>> {
  throw new Error("Service module is not available");
}

export async function deleteServiceOptionType(id: number): Promise<void> {
  throw new Error("Service module is not available");
}
