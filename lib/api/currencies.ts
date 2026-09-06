import { apiFetch, serverApiFetch, type ApiResponse } from "./client";

export interface CurrencyTranslationDto {
  id?: number;
  locale: string;
  name: string;
}

export interface CurrencyDto {
  id: number;
  code: string;
  symbol: string;
  rateToVnd: number;
  active: boolean;
  translations: CurrencyTranslationDto[];
}

export interface CreateCurrencyRequest {
  code: string;
  symbol: string;
  rateToVnd: number;
  active: boolean;
  translations: CurrencyTranslationDto[];
}

export async function getCurrencies(): Promise<CurrencyDto[]> {
  const res = await apiFetch<ApiResponse<{ content: CurrencyDto[] }>>("/api/v1/currencies?size=100", {
    skipTranslationFilter: true,
  });
  return res?.data?.content || [];
}

export async function getActiveCurrencies(): Promise<CurrencyDto[]> {
  const res = await apiFetch<ApiResponse<CurrencyDto[]>>("/api/v1/public/currencies/active", {
    skipTranslationFilter: true,
  });
  return res?.data || [];
}

export async function getCurrency(id: number): Promise<CurrencyDto> {
  const res = await apiFetch<ApiResponse<CurrencyDto>>(`/api/v1/currencies/${id}`, {
    skipTranslationFilter: true,
  });
  return res?.data;
}

export async function createCurrency(data: CreateCurrencyRequest): Promise<CurrencyDto> {
  const res = await apiFetch<ApiResponse<CurrencyDto>>("/api/v1/currencies", {
    method: "POST",
    body: JSON.stringify(data),
    skipTranslationFilter: true,
  });
  return res?.data;
}

export async function updateCurrency(id: number, data: CurrencyDto): Promise<CurrencyDto> {
  const res = await apiFetch<ApiResponse<CurrencyDto>>(`/api/v1/currencies/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    skipTranslationFilter: true,
  });
  return res?.data;
}

export async function deleteCurrency(id: number): Promise<void> {
  await apiFetch<ApiResponse<void>>(`/api/v1/currencies/${id}`, {
    method: "DELETE",
    skipTranslationFilter: true,
  });
}

export async function syncCurrencyRates(): Promise<CurrencyDto[]> {
  const res = await apiFetch<ApiResponse<CurrencyDto[]>>("/api/v1/currencies/sync", {
    method: "POST",
    skipTranslationFilter: true,
  });
  return res?.data || [];
}
