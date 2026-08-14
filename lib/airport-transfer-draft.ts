import type { AirportDto, AirportRouteDto } from "@/lib/api/fleet";
import type { SummaryItem } from "@/components/BookingConfirmationModal";
import type { TimeValue } from "@/components/time-picker";
import type { CreateAirportTransferBookingDto } from "@/lib/api/airport-transfer/bookings";

export const AT_BOOKING_DRAFT_KEY = "at_booking_draft";

export type BookingPayloadBase = Omit<
  CreateAirportTransferBookingDto,
  "customerName" | "customerEmail" | "customerPhone" | "customerNotes" | "contactChannel" | "contactId" | "zaloId" | "kakaoTalkId"
>;

export interface BookingSnapshot {
  selectedAirport: AirportDto | null;
  selectedRoute: AirportRouteDto | null;
  direction: "to-nhatrang" | "to-airport";
  tripType: "one-way" | "return";
  outboundStartsFrom: "airport" | "nhatrang";
  nhaTrangAddress: string;
  nhaTrangReturnAddress: string;
  isReturnAddressCustom: boolean;
  isCustomAddress: boolean;
  searchPickLat: number | null;
  searchPickLng: number | null;
  dateValue: string | null;
  timeValue: TimeValue;
  flightNumber: string;
  returnDateValue: string | null;
  returnTimeValue: TimeValue;
  returnFlightNumber: string;
  selectedVehicleId: string;
  estimatedDistance: number | null;
  estimatedDuration: number | null;
  passengerCount?: number;
  baggageCount?: number;
  luggageWeight?: number;
}

export interface BookingContact {
  fullName: string;
  phone: string;
  email: string;
  zaloId: string;
  kakaoTalkId: string;
  whatsapp: string;
  notes: string;
}

export interface BookingDraft {
  booking: BookingSnapshot;
  summaryItems: SummaryItem[];
  totalAmount: number;
  payload: BookingPayloadBase;
  contact: BookingContact;
}

export function saveBookingDraft(draft: BookingDraft): void {
  sessionStorage.setItem(AT_BOOKING_DRAFT_KEY, JSON.stringify(draft));
}

export function loadBookingDraft(): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(AT_BOOKING_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BookingDraft;
  } catch {
    return null;
  }
}

export function clearBookingDraft(): void {
  sessionStorage.removeItem(AT_BOOKING_DRAFT_KEY);
}
