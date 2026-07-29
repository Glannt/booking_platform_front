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
  zaloId?: string;
  kakaoTalkId?: string;
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

export interface FlightTracking {
  id: number;
  flightNumber: string;
  airlineName: string;
  departureAirport: string;
  arrivalAirport: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  actualDeparture: string | null;
  actualArrival: string | null;
  status: string;
  lastCheckedAt: string;
}

export interface OpenSkyFlightState {
  icao24: string;
  callsign: string;
  originCountry: string;
  timePosition: number | null;
  lastContact: number;
  longitude: number | null;
  latitude: number | null;
  barometricAltitude: number | null;
  onGround: boolean;
  velocity: number | null;
  trueTrack: number | null;
  verticalRate: number | null;
}

export async function trackFlight(flightNumber: string): Promise<FlightTracking> {
  const res = await apiFetch<ApiResponse<FlightTracking>>(`/api/v1/flights/track/${flightNumber}`);
  if (!res || !res.data) throw new Error(res?.message || "Không tìm thấy thông tin chuyến bay");
  return res.data;
}

export async function trackFlightOpenSky(callsign: string): Promise<OpenSkyFlightState[]> {
  const res = await apiFetch<ApiResponse<OpenSkyFlightState[]>>(`/api/v1/flights/opensky/track?callsign=${encodeURIComponent(callsign)}`);
  if (!res || !res.data) throw new Error(res?.message || "Không tìm thấy chuyến bay");
  return res.data;
}

export async function getFlightTrackingHistory(): Promise<FlightTracking[]> {
  const res = await apiFetch<ApiResponse<FlightTracking[]>>("/api/v1/flights/history");
  return res.data ?? [];
}

export async function getMyBookings(): Promise<BookingDto[]> {
  const res = await apiFetch<ApiResponse<BookingDto[]>>("/api/v1/bookings/my-bookings");
  return res.data ?? [];
}
