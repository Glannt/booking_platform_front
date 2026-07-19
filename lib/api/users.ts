import { apiFetch, type ApiResponse } from "./client";

export interface AdminUserDto {
  id: number;
  email: string;
  phone?: string;
  fullname?: string;
  role: string;
  status: string;
  kakaoTalkId?: string;
  zaloId?: string;
}

export interface AdminCreateUserRequest {
  email: string;
  password: string;
  fullname: string;
  phone?: string;
  role: string;
}

export interface AdminUpdateUserRequest {
  fullname?: string;
  phone?: string;
  role?: string;
  status?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export async function getUsers(params?: {
  search?: string;
  page?: number;
  size?: number;
}): Promise<ApiResponse<PageResponse<AdminUserDto>>> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.page !== undefined) query.append("page", params.page.toString());
  if (params?.size !== undefined) query.append("size", params.size.toString());
  const qs = query.toString();
  return apiFetch(`/api/v1/admin/users${qs ? `?${qs}` : ""}`);
}

export async function getUserById(id: number): Promise<ApiResponse<AdminUserDto>> {
  return apiFetch(`/api/v1/admin/users/${id}`);
}

export async function createUser(data: AdminCreateUserRequest): Promise<ApiResponse<AdminUserDto>> {
  return apiFetch("/api/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: number, data: AdminUpdateUserRequest): Promise<ApiResponse<AdminUserDto>> {
  return apiFetch(`/api/v1/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: number): Promise<ApiResponse<void>> {
  return apiFetch(`/api/v1/admin/users/${id}`, {
    method: "DELETE",
  });
}
