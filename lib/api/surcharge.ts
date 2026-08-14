import { apiFetch, ApiResponse } from "./client";

export interface SurchargeRuleDto {
  id?: number;
  code: string;
  name: string;
  description?: string;
  calculationType: "FIXED" | "PERCENT";
  calculationBase: "BASE_PRICE" | "RUNNING_TOTAL";
  value: number;
  currency?: string;
  condition?: any;
  priority?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModuleDescriptorDto {
  moduleCode: string;
  moduleName: string;
}

export interface ModuleSurchargeMappingDto {
  id?: number;
  moduleCode: string;
  surchargeRuleId: number;
  surchargeRule?: SurchargeRuleDto;
  applyOrder?: number;
  isOptional?: boolean;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SurchargeLineItemDto {
  ruleId?: number;
  code: string;
  name: string;
  amount: number;
  calculationType: string;
  rate?: number;
}

export interface SurchargeResultDto {
  lineItems: SurchargeLineItemDto[];
  totalSurcharge: number;
  finalAmount: number;
}

export interface CalculateSurchargeRequestDto {
  moduleCode: string;
  basePrice: number;
  serviceTime?: string;
  zoneCode?: string;
  vehicleCategoryId?: number;
  routeId?: number;
  passengerCount?: number;
  tripType?: string;
  customAttributes?: Record<string, any>;
}

// ── Admin Rules API ──

export async function getSurchargeRules(
  page = 0,
  size = 50,
  code?: string,
  active?: boolean
): Promise<ApiResponse<{ content: SurchargeRuleDto[]; totalElements: number; totalPages: number }>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (code) q.append("code", code);
  if (active !== undefined) q.append("active", String(active));
  return apiFetch(`/api/v1/admin/surcharge/rules?${q.toString()}`, { skipTranslationFilter: true });
}

export async function getSurchargeRuleById(id: number): Promise<ApiResponse<SurchargeRuleDto>> {
  return apiFetch(`/api/v1/admin/surcharge/rules/${id}`, { skipTranslationFilter: true });
}

export async function createSurchargeRule(dto: Partial<SurchargeRuleDto>): Promise<ApiResponse<SurchargeRuleDto>> {
  return apiFetch("/api/v1/admin/surcharge/rules", {
    method: "POST",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function updateSurchargeRule(id: number, dto: Partial<SurchargeRuleDto>): Promise<ApiResponse<SurchargeRuleDto>> {
  return apiFetch(`/api/v1/admin/surcharge/rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function deleteSurchargeRule(id: number): Promise<ApiResponse<void>> {
  return apiFetch(`/api/v1/admin/surcharge/rules/${id}`, {
    method: "DELETE",
    skipTranslationFilter: true,
  });
}

// ── Admin Modules & Mappings API ──

export async function getRegisteredModules(): Promise<ApiResponse<ModuleDescriptorDto[]>> {
  return apiFetch("/api/v1/admin/surcharge/modules", { skipTranslationFilter: true });
}

export async function getModuleSurchargeMappings(moduleCode?: string): Promise<ApiResponse<ModuleSurchargeMappingDto[]>> {
  const q = moduleCode ? `?moduleCode=${encodeURIComponent(moduleCode)}` : "";
  return apiFetch(`/api/v1/admin/surcharge/mappings${q}`, { skipTranslationFilter: true });
}

export async function createOrUpdateModuleSurchargeMapping(
  dto: Partial<ModuleSurchargeMappingDto>
): Promise<ApiResponse<ModuleSurchargeMappingDto>> {
  return apiFetch("/api/v1/admin/surcharge/mappings", {
    method: "POST",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function deleteModuleSurchargeMapping(id: number): Promise<ApiResponse<void>> {
  return apiFetch(`/api/v1/admin/surcharge/mappings/${id}`, {
    method: "DELETE",
    skipTranslationFilter: true,
  });
}

// ── Public Calculation API ──

export async function getPublicModuleSurchargeRules(
  moduleCode: string
): Promise<ApiResponse<SurchargeRuleDto[]>> {
  return apiFetch(`/api/v1/surcharge/public/rules?moduleCode=${encodeURIComponent(moduleCode)}`, {
    skipTranslationFilter: true,
  });
}

export async function calculatePublicSurcharge(
  request: CalculateSurchargeRequestDto
): Promise<ApiResponse<SurchargeResultDto>> {
  return apiFetch("/api/v1/surcharge/public/calculate", {
    method: "POST",
    body: JSON.stringify(request),
    skipTranslationFilter: true,
  });
}

export async function previewPublicSurcharge(params: {
  moduleCode: string;
  basePrice: number;
  date?: string;
  time?: string;
  vehicleCategoryId?: number;
  routeId?: number;
  tripType?: string;
  zoneCode?: string;
}): Promise<ApiResponse<SurchargeResultDto>> {
  const q = new URLSearchParams();
  q.append("moduleCode", params.moduleCode);
  q.append("basePrice", String(params.basePrice));
  if (params.date) q.append("date", params.date);
  if (params.time) q.append("time", params.time);
  if (params.vehicleCategoryId) q.append("vehicleCategoryId", String(params.vehicleCategoryId));
  if (params.routeId) q.append("routeId", String(params.routeId));
  if (params.tripType) q.append("tripType", params.tripType);
  if (params.zoneCode) q.append("zoneCode", params.zoneCode);
  return apiFetch(`/api/v1/surcharge/public/preview?${q.toString()}`, { skipTranslationFilter: true });
}
