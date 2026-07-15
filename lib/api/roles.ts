import { serverApiFetch, apiFetch } from "./client";

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
  return serverApiFetch<RoleDto[]>("/admin/roles");
}

export async function getAllPermissions(): Promise<PermissionDto[]> {
  return serverApiFetch<PermissionDto[]>("/admin/roles/permissions");
}

export async function updateRolePermissions(
  role: string,
  permissions: string[]
): Promise<RoleDto> {
  return apiFetch<RoleDto>(`/admin/roles/${role}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permissions }),
  });
}
