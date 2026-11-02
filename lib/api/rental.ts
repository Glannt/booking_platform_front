import { apiFetch, ApiResponse } from "./client";

export * from "./intercity";
export * from "./selfDrive";
export * from "./discount";

// === Booking ===

export interface CreateBookingItemRequest {
  serviceId: number;
  serviceOptionId?: number;
  quantity?: number;
  unitPrice?: number;
  dynamicDetails?: string;
  flightNumber?: string;
  startDate?: string;
  endDate?: string;
  pickupLocation?: string;
}

export interface CreateBookingRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
  contactChannel?: string;
  contactId?: string;
  zaloId?: string;
  kakaoTalkId?: string;
  idempotencyKey?: string;
  items: CreateBookingItemRequest[];
}

export interface BookingDto {
  id: number;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  totalPrice: number;
  bookingStatus: string;
  customerNotes?: string;
  items?: any[];
}

export async function createBooking(request: CreateBookingRequest): Promise<ApiResponse<BookingDto>> {
  return apiFetch("/api/v1/bookings", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
