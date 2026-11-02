import { apiFetch, type ApiResponse } from "./client";

export interface PermissionDto {
  code: string;
  name: string;
  description: string;
}

export interface RoleDto {
  name: string;
  permissions: string[];
}

export async function getRoles(): Promise<RoleDto[]> {
  const res = await apiFetch<RoleDto[] | ApiResponse<RoleDto[]>>("/api/v1/admin/roles");
  if (Array.isArray(res)) return res;
  if (res && "data" in res && Array.isArray((res as any).data)) return (res as any).data;
  return [];
}

export async function getAllPermissions(): Promise<PermissionDto[]> {
  const res = await apiFetch<PermissionDto[] | ApiResponse<PermissionDto[]>>("/api/v1/admin/roles/permissions");
  if (Array.isArray(res)) return res;
  if (res && "data" in res && Array.isArray((res as any).data)) return (res as any).data;
  return [];
}

export async function updateRolePermissions(
  role: string,
  permissions: string[]
): Promise<RoleDto> {
  const res = await apiFetch<RoleDto | ApiResponse<RoleDto>>(`/api/v1/admin/roles/${role}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permissions }),
  });
  if (res && typeof res === "object" && "data" in res) return (res as any).data;
  return res as RoleDto;
}

export interface PermissionPayload {
  code: string;
  name: string;
  description: string;
}

export async function createPermission(payload: PermissionPayload): Promise<PermissionDto> {
  const res = await apiFetch<PermissionDto | ApiResponse<PermissionDto>>("/api/v1/admin/roles/permissions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (res && typeof res === "object" && "data" in res) return (res as any).data;
  return res as PermissionDto;
}

export async function updatePermission(
  code: string,
  payload: Pick<PermissionPayload, "name" | "description">
): Promise<PermissionDto> {
  const res = await apiFetch<PermissionDto | ApiResponse<PermissionDto>>(
    `/api/v1/admin/roles/permissions/${encodeURIComponent(code)}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
  if (res && typeof res === "object" && "data" in res) return (res as any).data;
  return res as PermissionDto;
}
