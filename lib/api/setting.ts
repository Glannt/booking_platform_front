import { apiFetch, ApiResponse } from "./client";

export interface ContactSettingDto {
  id?: number;
  phone: string;
  zalo: string;
  kakaotalk?: string;
  whatsapp?: string;
}

export async function getContactSettings(): Promise<ApiResponse<ContactSettingDto>> {
  return apiFetch<ApiResponse<ContactSettingDto>>("/api/v1/contact-settings");
}

export async function updateContactSettings(payload: ContactSettingDto): Promise<ApiResponse<ContactSettingDto>> {
  return apiFetch<ApiResponse<ContactSettingDto>>("/api/v1/contact-settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
