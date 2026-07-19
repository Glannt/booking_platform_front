import { apiFetch, serverApiFetch, type ApiResponse } from "./client";

export interface SectionTranslationDto {
  id?: number;
  locale: string;
  title?: string;
  subtitle?: string;
  description?: string;
  btnText?: string;
  btnLink?: string;
}

export interface SectionDto {
  id?: number;
  sectionName: string;
  sectionType: string;
  pagePath: string;
  orderIndex: number;
  active: boolean;
  iconUrl?: string;
  imageUrls: string[];
  linkUrl?: string;
  textColor?: string;
  bgColor?: string;
  cssClass?: string;
  contentData?: string;
  startDate?: string;
  endDate?: string;
  translations: SectionTranslationDto[];
}

export interface CreateSectionRequest {
  sectionName: string;
  sectionType: string;
  pagePath: string;
  orderIndex: number;
  active: boolean;
  iconUrl?: string;
  imageIds?: number[];
  linkUrl?: string;
  textColor?: string;
  bgColor?: string;
  cssClass?: string;
  contentData?: string;
  startDate?: string;
  endDate?: string;
  translations: SectionTranslationDto[];
}

export async function getActiveSections(
  pagePath: string,
  locale: string
): Promise<SectionDto[]> {
  const res = await apiFetch<ApiResponse<SectionDto[]>>(
    `/api/v1/sections/active?pagePath=${encodeURIComponent(pagePath)}&locale=${locale}`
  );
  return res.data ?? [];
}

export async function getActiveSectionsServer(
  pagePath: string,
  locale: string
): Promise<SectionDto[]> {
  const res = await serverApiFetch<ApiResponse<SectionDto[]>>(
    `/api/v1/sections/active?pagePath=${encodeURIComponent(pagePath)}&locale=${locale}`,
    locale
  );
  return res.data ?? [];
}

export async function getSectionsByPagePath(
  pagePath: string
): Promise<SectionDto[]> {
  const res = await apiFetch<ApiResponse<SectionDto[]>>(
    `/api/v1/sections/page?pagePath=${encodeURIComponent(pagePath)}`
  );
  return res.data ?? [];
}

export async function getSectionById(id: number): Promise<SectionDto> {
  const res = await apiFetch<ApiResponse<SectionDto>>(`/api/v1/sections/${id}`);
  return res.data;
}

export async function createSection(
  data: CreateSectionRequest
): Promise<SectionDto> {
  const res = await apiFetch<ApiResponse<SectionDto>>("/api/v1/sections", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateSection(
  id: number,
  data: CreateSectionRequest
): Promise<SectionDto> {
  const res = await apiFetch<ApiResponse<SectionDto>>(`/api/v1/sections/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteSection(id: number): Promise<void> {
  await apiFetch<void>(`/api/v1/sections/${id}`, { method: "DELETE" });
}
