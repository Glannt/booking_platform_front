import { apiFetch, type ApiResponse } from "../client";
import type { BookingDto } from "../bookings";

export interface CreateAirportTransferBookingDto {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
  contactChannel?: string;
  contactId?: string;
  zaloId?: string;
  kakaoTalkId?: string;
  whatsapp?: string;

  vehicleCategoryId: number;
  routeId?: number;
  actualKm?: number;
  tripType: string;
  outboundDirection: string;
  outboundDate: string;
  outboundPickupTime: string;
  outboundFlightNumber?: string;
  outboundPickupAddress: string;
  outboundDropoffAddress?: string;

  returnDirection?: string;
  returnDate?: string;
  returnPickupTime?: string;
  returnFlightNumber?: string;
  returnPickupAddress?: string;
  returnDropoffAddress?: string;

  basePrice?: number;
  totalPrice: number;

  passengerCount?: number;
  luggageWeight?: number;
}

export async function createAirportTransferBooking(dto: CreateAirportTransferBookingDto): Promise<ApiResponse<BookingDto>> {
  return apiFetch<ApiResponse<BookingDto>>("/api/v1/airport-transfer/bookings", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}
