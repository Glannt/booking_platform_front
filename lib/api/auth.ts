import { apiFetch, type ApiResponse } from "./client";
import type { UserDto } from "@/lib/store/authStore";

export async function getWhoAmI(): Promise<UserDto | null> {
  try {
    const res = await apiFetch<ApiResponse<UserDto>>("/api/v1/auth/whoami");
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function updateProfile(data: { fullname?: string; phone?: string; kakaoTalkId?: string; zaloId?: string }): Promise<UserDto> {
  const res = await apiFetch<ApiResponse<UserDto>>("/api/v1/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.data) throw new Error("Failed to update profile");
  return res.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiFetch<ApiResponse<void>>("/api/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyResetCode(email: string, code: string): Promise<void> {
  await apiFetch<ApiResponse<void>>("/api/v1/auth/verify-reset-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  await apiFetch<ApiResponse<void>>("/api/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
  });
}

export async function changePassword(newPassword: string): Promise<void> {
  await apiFetch<ApiResponse<void>>("/api/v1/auth/change-password", {
    method: "PUT",
    body: JSON.stringify({ newPassword }),
  });
}
