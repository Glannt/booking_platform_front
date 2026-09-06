import { apiFetch, type ApiResponse } from "../client";
import type { BookingDto } from "../bookings";

export interface CreateSelfDriveBookingDto {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
  contactChannel?: string;
  contactId?: string;
  zaloId?: string;
  kakaoTalkId?: string;

  vehicleCategoryId: number;
  startDate: string;
  endDate: string;
  rentalDays?: number;
  pickupLocation: string;
  dropoffLocation?: string;
  basePrice?: number;
  deposit?: number;
  totalPrice: number;
}

export async function createSelfDriveBooking(dto: CreateSelfDriveBookingDto): Promise<ApiResponse<BookingDto>> {
  return apiFetch<ApiResponse<BookingDto>>("/api/v1/self-drive/bookings", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export interface CategoryAvailabilityDto {
  vehicleCategoryId: number;
  categoryCode: string;
  categoryName: string;
  totalVehicles: number;     // Số lượng hiện có
  availableVehicles: number; // Số lượng có thể sử dụng
  bookedVehicles: number;    // Số lượng đã được đặt
  isAvailable: boolean;      // Còn xe hay không
}

export async function getSelfDriveAvailability(params: {
  startDate: string;
  endDate: string;
  categoryId?: number;
  locale?: string;
}): Promise<ApiResponse<CategoryAvailabilityDto[]>> {
  const q = new URLSearchParams();
  q.append("startDate", params.startDate);
  q.append("endDate", params.endDate);
  if (params.categoryId) q.append("categoryId", String(params.categoryId));
  if (params.locale) q.append("locale", params.locale);

  return apiFetch<ApiResponse<CategoryAvailabilityDto[]>>(`/api/v1/self-drive/availability?${q.toString()}`);
}
