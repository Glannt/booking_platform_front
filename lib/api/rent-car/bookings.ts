import { apiFetch, type ApiResponse } from "../client";
import type { BookingDto } from "../bookings";

export interface CreateRentCarBookingDto {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
  contactChannel?: string;
  contactId?: string;
  zaloId?: string;
  kakaoTalkId?: string;

  routeId: number;
  vehicleCategoryId: number;
  tripType: string;
  departureDate: string;
  departureTime: string;
  returnDate?: string;
  returnTime?: string;
  pickupAddress: string;
  dropoffAddress: string;
  basePrice?: number;
  totalPrice: number;
}

export async function createRentCarBooking(dto: CreateRentCarBookingDto): Promise<ApiResponse<BookingDto>> {
  return apiFetch<ApiResponse<BookingDto>>("/api/v1/rent-car/bookings", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}
