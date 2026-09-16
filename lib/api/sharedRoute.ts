import { apiFetch, ApiResponse } from "./client";

export interface SharedOfficeDto {
  id?: number;
  name: string;
  address: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  active?: boolean;
}

export interface SharedRouteScheduleDto {
  id?: number;
  directionId?: number;
  departureTime: string; // "HH:mm:ss" or "HH:mm"
  daysOfWeek?: string;
  operatingDays?: string[];
  active?: boolean;
  note?: string;
}

export type DirectionType = "OUTBOUND" | "RETURN";
export type PickupType = "DOOR" | "OFFICE";

export const DAYS_OF_WEEK = [
  { key: "MONDAY", labelVi: "Thứ 2", labelEn: "Mon", shortVi: "T2", dayNumber: 1 },
  { key: "TUESDAY", labelVi: "Thứ 3", labelEn: "Tue", shortVi: "T3", dayNumber: 2 },
  { key: "WEDNESDAY", labelVi: "Thứ 4", labelEn: "Wed", shortVi: "T4", dayNumber: 3 },
  { key: "THURSDAY", labelVi: "Thứ 5", labelEn: "Thu", shortVi: "T5", dayNumber: 4 },
  { key: "FRIDAY", labelVi: "Thứ 6", labelEn: "Fri", shortVi: "T6", dayNumber: 5 },
  { key: "SATURDAY", labelVi: "Thứ 7", labelEn: "Sat", shortVi: "T7", dayNumber: 6 },
  { key: "SUNDAY", labelVi: "Chủ nhật", labelEn: "Sun", shortVi: "CN", dayNumber: 0 }
] as const;

export function getDayOfWeekFromDate(dateStr: string): string {
  const d = new Date(dateStr);
  const jsDay = d.getDay();
  const mapping: Record<number, string> = {
    0: "SUNDAY",
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY"
  };
  return mapping[jsDay] || "MONDAY";
}

export interface SharedRouteDirectionDto {
  id?: number;
  routeId?: number;
  directionType: DirectionType;
  originCity: string;
  destinationCity: string;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  price: number;
  distanceKm?: number | null;
  estimatedHours?: number | null;
  active?: boolean;
  originOffices?: SharedOfficeDto[];
  destinationOffices?: SharedOfficeDto[];
  originOfficeIds?: number[];
  destinationOfficeIds?: number[];
  schedules?: SharedRouteScheduleDto[];
}

export interface SharedRouteDto {
  id?: number;
  name: string;
  vehicleName?: string;
  active?: boolean;
  slug?: string;
  linkedIntercityRouteId?: number | null;
  linkedIntercityRouteName?: string | null;
  directions?: SharedRouteDirectionDto[];
}

export interface SharedRouteBookingRequest {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  note?: string;

  directionId: number;
  scheduleId: number;
  tripDate: string; // YYYY-MM-DD
  pickupType: PickupType;
  pickupOfficeId?: number | null;
  pickupAddress?: string | null;
  dropoffType: PickupType;
  dropoffOfficeId?: number | null;
  dropoffAddress?: string | null;
  passengerCount: number;

  isRoundTrip?: boolean;
  returnDirectionId?: number | null;
  returnScheduleId?: number | null;
  returnTripDate?: string | null;
  returnPickupType?: PickupType;
  returnPickupOfficeId?: number | null;
  returnPickupAddress?: string | null;
  returnDropoffType?: PickupType;
  returnDropoffOfficeId?: number | null;
  returnDropoffAddress?: string | null;
}

export interface SharedRouteBookingItemDto {
  id: number;
  directionId: number;
  directionType: string;
  originCity: string;
  destinationCity: string;
  scheduleId: number;
  departureTime: string;
  tripDate: string;
  pickupType: PickupType;
  pickupOfficeId?: number | null;
  pickupOfficeName?: string | null;
  pickupAddress?: string | null;
  dropoffType: PickupType;
  dropoffOfficeId?: number | null;
  dropoffOfficeName?: string | null;
  dropoffAddress?: string | null;
  passengerCount: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
}

export interface SharedRouteBookingResponse {
  bookingGroupId: number;
  totalAmount: number;
  status: string;
  customerName?: string;
  customerPhone?: string;
  bookings: SharedRouteBookingItemDto[];
}

// =================== Office APIs ===================
export async function getSharedOffices(activeOnly = false, city?: string): Promise<SharedOfficeDto[]> {
  const query = new URLSearchParams();
  if (activeOnly) query.set("activeOnly", "true");
  if (city) query.set("city", city);
  const qStr = query.toString() ? `?${query.toString()}` : "";
  const res = await apiFetch<any>(`/api/v1/shared-offices${qStr}`);
  return Array.isArray(res) ? res : (res?.data || []);
}

export async function getSharedOffice(id: number): Promise<SharedOfficeDto> {
  const res = await apiFetch<any>(`/api/v1/shared-offices/${id}`);
  return res?.data || res;
}

export async function createSharedOffice(data: Partial<SharedOfficeDto>): Promise<SharedOfficeDto> {
  const res = await apiFetch<any>("/api/v1/shared-offices", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function updateSharedOffice(id: number, data: Partial<SharedOfficeDto>): Promise<SharedOfficeDto> {
  const res = await apiFetch<any>(`/api/v1/shared-offices/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function deleteSharedOffice(id: number): Promise<void> {
  await apiFetch(`/api/v1/shared-offices/${id}`, { method: "DELETE" });
}

// =================== Shared Route APIs ===================
export async function getSharedRoutes(activeOnly = false): Promise<SharedRouteDto[]> {
  const qStr = activeOnly ? "?activeOnly=true" : "";
  const res = await apiFetch<any>(`/api/v1/shared-routes${qStr}`);
  return Array.isArray(res) ? res : (res?.data || []);
}

export async function getSharedRoute(id: number): Promise<SharedRouteDto> {
  const res = await apiFetch<any>(`/api/v1/shared-routes/${id}`);
  return (res?.data && !res.directions) ? res.data : res;
}

export async function getSharedRouteBySlug(slug: string): Promise<SharedRouteDto> {
  const res = await apiFetch<any>(`/api/v1/shared-routes/slug/${encodeURIComponent(slug)}`);
  return (res?.data && !res.directions) ? res.data : res;
}

export async function createSharedRoute(data: Partial<SharedRouteDto>): Promise<SharedRouteDto> {
  const res = await apiFetch<any>("/api/v1/shared-routes", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function updateSharedRoute(id: number, data: Partial<SharedRouteDto>): Promise<SharedRouteDto> {
  const res = await apiFetch<any>(`/api/v1/shared-routes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function deleteSharedRoute(id: number): Promise<void> {
  await apiFetch(`/api/v1/shared-routes/${id}`, { method: "DELETE" });
}

export async function updateSharedDirection(
  directionId: number,
  data: Partial<SharedRouteDirectionDto>
): Promise<SharedRouteDirectionDto> {
  const res = await apiFetch<ApiResponse<SharedRouteDirectionDto>>(`/api/v1/shared-routes/directions/${directionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function addSharedSchedule(
  directionId: number,
  data: Partial<SharedRouteScheduleDto>
): Promise<SharedRouteScheduleDto> {
  const res = await apiFetch<ApiResponse<SharedRouteScheduleDto>>(
    `/api/v1/shared-routes/directions/${directionId}/schedules`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  return res.data;
}

export async function deleteSharedSchedule(scheduleId: number): Promise<void> {
  await apiFetch(`/api/v1/shared-routes/schedules/${scheduleId}`, { method: "DELETE" });
}

// =================== Booking APIs ===================
export async function createSharedBooking(request: SharedRouteBookingRequest): Promise<SharedRouteBookingResponse> {
  const res = await apiFetch<ApiResponse<SharedRouteBookingResponse>>("/api/v1/shared-bookings", {
    method: "POST",
    body: JSON.stringify(request),
  });
  return res.data;
}

export async function getSharedBookingByGroup(groupId: number): Promise<SharedRouteBookingResponse> {
  const res = await apiFetch<ApiResponse<SharedRouteBookingResponse>>(`/api/v1/shared-bookings/group/${groupId}`);
  return res.data;
}
