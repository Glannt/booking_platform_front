import { apiFetch, ApiResponse } from "./client";

export type IssuanceType = "PUBLIC" | "PRIVATE_TARGETED" | "AUTO_REWARD";
export type DiscountType = "PERCENT" | "FIXED_AMOUNT";
export type ScopeType = "GLOBAL" | "INTERCITY_ROUTE" | "SHARED_ROUTE" | "SELF_DRIVE" | "TOUR" | "AIRPORT_TRANSFER";

export interface PromotionScopeDto {
  id?: number;
  scopeType: ScopeType | string;
  scopeRefId?: string;
}

export interface PromotionConditionDto {
  id?: number;
  conditionType: string;
  operator: string;
  conditionValue: string;
}

export interface PromotionGrantDto {
  id: number;
  promotionId: number;
  promotionName?: string;
  promotionCode?: string;
  discountType?: "PERCENT" | "FIXED_AMOUNT" | string;
  discountValue?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  description?: string;
  customerId: number;
  customerEmail?: string;
  customerName?: string;
  uniqueCode?: string;
  grantedReason: string;
  grantedAt: string;
  expiresAt?: string;
  used: boolean;
  usedAt?: string;
  usedOrderId?: number;
}

export interface PromotionRedemptionDto {
  id: number;
  promotionId: number;
  promotionCode?: string;
  grantId?: number;
  customerId: number;
  orderId: number;
  discountAmount: number;
  status: string;
  redeemedAt: string;
  reversedAt?: string;
}

export interface PromotionDto {
  id?: number;
  name?: string;
  description?: string;
  code?: string;
  issuanceType: IssuanceType;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minDays?: number;
  minOrderAmount?: number;
  customerSegment?: string;
  stackable?: boolean;
  priority?: number;
  maxUsageTotal?: number;
  maxUsagePerUser?: number;
  usageCount?: number;
  validFrom?: string;
  validTo?: string;
  active?: boolean;
  status?: string;
  scopes?: PromotionScopeDto[];
  conditions?: PromotionConditionDto[];
  createdAt?: string;
  updatedAt?: string;

  // For compatibility with legacy and single-scope view
  scopeType?: string;
  scopeRefId?: string;
  maxUsage?: number;
}

/** Legacy alias for PriceDiscountDto */
export interface PriceDiscountDto extends PromotionDto {
  priceListId?: number;
  priceTypeId?: number;
  startDate?: string;
  endDate?: string;
}

export interface ValidateDiscountRequest {
  code?: string;
  customerId?: number;
  scopeType?: string;
  scopeRefId?: string;
  days?: number;
  orderAmount: number;
  customerSegment?: string;
  cartItems?: Array<{
    module: string;
    productId?: string;
    quantity?: number;
    itemPrice?: number;
  }>;
}

export interface DiscountResultDto {
  valid?: boolean;
  promotionId?: number;
  grantId?: number;
  discountCode?: string;
  discountType?: "PERCENT" | "FIXED_AMOUNT";
  discountValue?: number;
  discountAmount?: number;
  finalAmount?: number;
  message?: string;
  reason?: string;
  finalPrice?: number;
}

// === Promotion / Discount Client Endpoints ===

export async function validateDiscount(req: ValidateDiscountRequest): Promise<ApiResponse<DiscountResultDto>> {
  // Call /api/v1/promotions/validate first, fallback to /api/v1/discounts/validate if needed
  try {
    const res = await apiFetch<ApiResponse<DiscountResultDto>>("/api/v1/promotions/validate", {
      method: "POST",
      body: JSON.stringify(req),
      skipTranslationFilter: true,
    });
    if (res?.data) return res;
  } catch (e) {
    // fallback
  }

  return apiFetch<ApiResponse<DiscountResultDto>>("/api/v1/discounts/validate", {
    method: "POST",
    body: JSON.stringify(req),
    skipTranslationFilter: true,
  });
}

export async function getActiveDiscounts(
  scopeType?: string,
  scopeRefId?: string
): Promise<ApiResponse<PromotionDto[]>> {
  try {
    let url = `/api/v1/promotions/active`;
    const params: string[] = [];
    if (scopeType) params.push(`scopeType=${encodeURIComponent(scopeType)}`);
    if (scopeRefId) params.push(`scopeRefId=${encodeURIComponent(scopeRefId)}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    const res = await apiFetch<ApiResponse<PromotionDto[]>>(url, { skipTranslationFilter: true });
    if (res?.data) return res;
  } catch (e) {
    // fallback
  }

  let url = `/api/v1/discounts/active`;
  const params: string[] = [];
  if (scopeType) params.push(`scopeType=${encodeURIComponent(scopeType)}`);
  if (scopeRefId) params.push(`scopeRefId=${encodeURIComponent(scopeRefId)}`);
  if (params.length > 0) url += `?${params.join("&")}`;
  return apiFetch<ApiResponse<PromotionDto[]>>(url, { skipTranslationFilter: true });
}

export async function getMyVouchers(): Promise<ApiResponse<PromotionGrantDto[]>> {
  return apiFetch("/api/v1/promotions/my-vouchers", { skipTranslationFilter: true });
}

// === Admin Promotion Endpoints ===

export async function getAdminDiscounts(
  page = 0,
  size = 50,
  scopeType?: string,
  scopeRefId?: string,
  issuanceType?: string
): Promise<ApiResponse<{ content: PromotionDto[]; totalElements: number }>> {
  let url = `/api/v1/admin/promotions?page=${page}&size=${size}`;
  if (scopeType) url += `&scopeType=${encodeURIComponent(scopeType)}`;
  if (scopeRefId) url += `&scopeRefId=${encodeURIComponent(scopeRefId)}`;
  if (issuanceType) url += `&issuanceType=${encodeURIComponent(issuanceType)}`;
  return apiFetch(url, { skipTranslationFilter: true });
}

export async function getAdminPromotion(id: number): Promise<ApiResponse<PromotionDto>> {
  return apiFetch(`/api/v1/admin/promotions/${id}`, { skipTranslationFilter: true });
}

export async function createDiscount(dto: Partial<PromotionDto>): Promise<ApiResponse<PromotionDto>> {
  return apiFetch("/api/v1/admin/promotions", {
    method: "POST",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function updateDiscount(id: number, dto: Partial<PromotionDto>): Promise<ApiResponse<PromotionDto>> {
  return apiFetch(`/api/v1/admin/promotions/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
    skipTranslationFilter: true,
  });
}

export async function deleteDiscount(id: number): Promise<ApiResponse<void>> {
  return apiFetch(`/api/v1/admin/promotions/${id}`, {
    method: "DELETE",
    skipTranslationFilter: true,
  });
}

export async function grantPromotionToCustomer(
  promotionId: number,
  payload: { customerId: number; reason?: string; expireDays?: number; customCode?: string }
): Promise<ApiResponse<PromotionGrantDto>> {
  return apiFetch(`/api/v1/admin/promotions/${promotionId}/grants`, {
    method: "POST",
    body: JSON.stringify(payload),
    skipTranslationFilter: true,
  });
}

export async function getPromotionGrants(promotionId: number): Promise<ApiResponse<PromotionGrantDto[]>> {
  return apiFetch(`/api/v1/admin/promotions/${promotionId}/grants`, { skipTranslationFilter: true });
}

export async function getPromotionRedemptions(promotionId: number): Promise<ApiResponse<PromotionRedemptionDto[]>> {
  return apiFetch(`/api/v1/admin/promotions/${promotionId}/redemptions`, { skipTranslationFilter: true });
}
