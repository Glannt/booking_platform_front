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
