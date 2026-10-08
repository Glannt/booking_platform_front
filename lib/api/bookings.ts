import { apiFetch, ApiResponse } from "./client";
import { DepositType } from "../pricing/deposit";

export { DepositType };

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "cancellation_requested";

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
  zaloId?: string;
  kakaoTalkId?: string;
  whatsapp?: string;
  internalNotes?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  depositType?: DepositType;
  depositRate?: number;
  paidAmount?: number;
  depositAmount?: number;
  receivedAmount?: number;
  remainingAmount?: number;
  deletionReason?: string;
  assignedDriver?: string;
  assignedVehicle?: string;
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
  depositType?: DepositType;
  depositRate?: number;
  depositAmount?: number;
  customerNotes?: string;
  idempotencyKey?: string;
  contactChannel?: string;
  contactId?: string;
  zaloId?: string;
  kakaoTalkId?: string;
  whatsapp?: string;
  paymentMethod?: string;
  items: CreateBookingItemRequest[];
}

export interface UpdateBookingRequest {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  totalAmount?: number;
  bookingStatus?: BookingStatus;
  customerNotes?: string;
  contactChannel?: string;
  contactId?: string;
  zaloId?: string;
  kakaoTalkId?: string;
  whatsapp?: string;
  internalNotes?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  depositType?: DepositType;
  depositRate?: number;
  paidAmount?: number;
  depositAmount?: number;
  receivedAmount?: number;
  deletionReason?: string;
  assignedDriver?: string;
  assignedVehicle?: string;
}

export interface BookingTimelineDto {
  id: number;
  bookingId: number;
  actorId?: number;
  actorName: string;
  eventType: string; // CREATED, STATUS_CHANGE, PAYMENT_UPDATE, DISPATCH_UPDATE, NOTE_UPDATE, DELETED
  title: string;
  description?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export async function getBookings(): Promise<ApiResponse<BookingDto[]>> {
  return apiFetch<ApiResponse<BookingDto[]>>("/api/v1/admin/bookings");
}

export async function getBooking(id: number): Promise<ApiResponse<BookingDto>> {
  return apiFetch<ApiResponse<BookingDto>>(`/api/v1/admin/bookings/${id}`);
}

export async function getBookingTimeline(id: number): Promise<ApiResponse<BookingTimelineDto[]>> {
  return apiFetch<ApiResponse<BookingTimelineDto[]>>(`/api/v1/admin/bookings/${id}/timeline`);
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

export async function deleteBooking(id: number, reason?: string): Promise<void> {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  return apiFetch<void>(`/api/v1/admin/bookings/${id}${query}`, {
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
  const res = await apiFetch<ApiResponse<OpenSkyFlightState[]> | OpenSkyFlightState[]>(
    `/api/v1/flights/opensky/track?callsign=${encodeURIComponent(callsign)}`
  );
  if (!res) return [];
  if (Array.isArray(res)) return res;
  return res.data ?? [];
}

export async function getFlightTrackingHistory(): Promise<FlightTracking[]> {
  const res = await apiFetch<ApiResponse<FlightTracking[]>>("/api/v1/flights/history");
  return res.data ?? [];
}

export async function getMyBookings(): Promise<BookingDto[]> {
  const res = await apiFetch<ApiResponse<BookingDto[]>>("/api/v1/bookings/my-bookings");
  return res.data ?? [];
}

export async function requestBookingCancellation(id: number): Promise<BookingDto> {
  const res = await apiFetch<ApiResponse<BookingDto>>(`/api/v1/bookings/${id}/cancel-request`, {
    method: "POST",
  });
  return res.data as BookingDto;
}

export async function acceptBookingCancellation(id: number): Promise<BookingDto> {
  const res = await apiFetch<ApiResponse<BookingDto>>(`/api/v1/admin/bookings/${id}/accept-cancel`, {
    method: "POST",
  });
  return res.data as BookingDto;
}

export async function rejectBookingCancellation(id: number): Promise<BookingDto> {
  const res = await apiFetch<ApiResponse<BookingDto>>(`/api/v1/admin/bookings/${id}/reject-cancel`, {
    method: "POST",
  });
  return res.data as BookingDto;
}
