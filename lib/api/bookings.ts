import { apiFetch, ApiResponse } from "./client";

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface BookingItemDto {
  id?: number;
  serviceId: number;
  serviceOptionId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  startDate?: string;
  endDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  dynamicDetails?: string;
  flightNumber?: string;
  serviceName?: { [locale: string]: string };
  serviceOptionName?: { [locale: string]: string };
  intercityBookingDetailId?: number;
  selfDriveBookingDetailId?: number;
}

export interface BookingDto {
  id: number;
  bookingCode: string;
  userId?: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  bookingStatus: BookingStatus;
  customerNotes?: string;
  idempotencyKey?: string;
  contactChannel?: string;
  contactId?: string;
  items: BookingItemDto[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBookingItemRequest {
  serviceId: number;
  serviceOptionId: number;
  quantity: number;
  unitPrice?: number;
  startDate?: string;
  endDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  dynamicDetails?: string;
  flightNumber?: string;
}

export interface CreateBookingRequest {
  userId?: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount?: number;
  customerNotes?: string;
  idempotencyKey?: string;
  contactChannel?: string;
  contactId?: string;
  items: CreateBookingItemRequest[];
}

export interface UpdateBookingRequest {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  totalAmount?: number;
  bookingStatus?: BookingStatus;
  customerNotes?: string;
}

export async function getBookings(): Promise<ApiResponse<BookingDto[]>> {
  return apiFetch<ApiResponse<BookingDto[]>>("/api/v1/admin/bookings");
}

export async function getBooking(id: number): Promise<ApiResponse<BookingDto>> {
  return apiFetch<ApiResponse<BookingDto>>(`/api/v1/admin/bookings/${id}`);
}

export async function createBooking(payload: CreateBookingRequest): Promise<ApiResponse<BookingDto>> {
  return apiFetch<ApiResponse<BookingDto>>("/api/v1/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBooking(id: number, payload: UpdateBookingRequest): Promise<ApiResponse<BookingDto>> {
  return apiFetch<ApiResponse<BookingDto>>(`/api/v1/admin/bookings/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteBooking(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/admin/bookings/${id}`, {
    method: "DELETE",
  });
}

export async function getBookingByCode(code: string): Promise<ApiResponse<BookingDto>> {
  return apiFetch<ApiResponse<BookingDto>>(`/api/v1/bookings/code/${code}`);
}

export async function trackFlight(flightNumber: string): Promise<ApiResponse<any>> {
  return apiFetch<ApiResponse<any>>(`/api/v1/flights/track/${flightNumber}`);
}
