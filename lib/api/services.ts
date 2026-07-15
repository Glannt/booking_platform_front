// ponytail: service module removed — all functions return empty data
// Re-enable when the service module is re-implemented.

import { apiFetch, ApiResponse } from "./client";

export interface ServiceTranslationDto {
  id?: number;
  locale: string;
  name: string;
  description: string;
  content: string;
}

export interface ServiceOptionTranslationDto {
  id?: number;
  locale: string;
  name: string;
  description: string;
}

export interface ServiceOptionDto {
  id?: number;
  price: number;
  vehicleType?: string;
  seatCapacity?: number;
  vehicleBrand?: string;
  maxLuggage?: number;
  thumbnailId?: number;
  translations: ServiceOptionTranslationDto[];
}

export interface ServiceItineraryTranslationDto {
  id?: number;
  locale: string;
  dayTitle: string;
  timeline: string;
}

export interface ServiceItineraryDto {
  id?: number;
  dayNumber: number;
  translations: ServiceItineraryTranslationDto[];
}

export interface ServiceFaqTranslationDto {
  id?: number;
  locale: string;
  question: string;
  answer: string;
}

export interface ServiceFaqDto {
  id?: number;
  orderIndex: number;
  translations: ServiceFaqTranslationDto[];
}

export interface ServiceDto {
  id: number;
  categoryId: number;
  serviceOptionTypeId?: number;
  thumbnailId?: number;
  basePrice?: number;
  status: string;
  applyVehiclePricing?: boolean;
  isDefault?: boolean;
  translations: ServiceTranslationDto[];
  options: ServiceOptionDto[];
  itineraries: ServiceItineraryDto[];
  faqs?: ServiceFaqDto[];
}

const EMPTY_LIST: ApiResponse<ServiceDto[]> = { data: [] };

export async function getServices(): Promise<ApiResponse<ServiceDto[]>> {
  return EMPTY_LIST;
}

export async function createService(payload: Omit<ServiceDto, "id">): Promise<ApiResponse<ServiceDto>> {
  throw new Error("Service module is not available");
}

export async function updateService(id: number, payload: Partial<ServiceDto>): Promise<ApiResponse<ServiceDto>> {
  throw new Error("Service module is not available");
}

export async function deleteService(id: number): Promise<void> {
  throw new Error("Service module is not available");
}

export async function getPublicServices(categoryId?: number): Promise<ApiResponse<ServiceDto[]>> {
  return EMPTY_LIST;
}

export async function getServiceById(id: number): Promise<ApiResponse<ServiceDto>> {
  throw new Error("Service module is not available");
}
