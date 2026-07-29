import { apiFetch, type ApiResponse } from "./client";

export interface DashboardStatsDto {
  bookingsToday: number;
  bookingsThisWeek: number;
  bookingsThisMonth: number;
  totalBookings: number;
  totalRevenue: number;
  totalVehicleCategories: number;
  totalVehicles: number;
  totalUsers: number;
  totalTours: number;
}

export async function getDashboardStats(): Promise<ApiResponse<DashboardStatsDto>> {
  return apiFetch<ApiResponse<DashboardStatsDto>>("/api/v1/admin/dashboard/stats");
}
