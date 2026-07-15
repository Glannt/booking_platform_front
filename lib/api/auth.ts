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
