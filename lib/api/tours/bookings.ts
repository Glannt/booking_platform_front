import { apiFetch, type ApiResponse } from "../client";
import type { BookingDto } from "../bookings";

export interface CreateTourBookingDto {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
  zaloId?: string;
  kakaoTalkId?: string;
  contactChannel?: string;
  contactId?: string;

  tourId: number;
  tourPackageId?: number;
  packageName?: string;
  pricingType?: string;
  guestCount: number;
  adultCount?: number;
  childCount?: number;
  infantCount?: number;
  vehicleCategoryId?: number;
  pickupLocation?: string;
  note?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  totalPrice: number;
}

export async function createTourBooking(dto: CreateTourBookingDto): Promise<ApiResponse<BookingDto>> {
  return apiFetch<ApiResponse<BookingDto>>("/api/v1/tours/bookings", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}
