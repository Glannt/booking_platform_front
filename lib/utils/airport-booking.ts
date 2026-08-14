/**
 * Pure utility: builds the airport transfer booking payload.
 * Extracted from airport-transfer/page.tsx for testability.
 */

export interface TimeValue {
  hour: number;
  minute: number;
  period: "AM" | "PM";
}

export interface DateValue {
  toString(): string;
}

export interface VehicleOption {
  id: string;
  nameVi: string;
  nameEn: string;
  categoryId?: number;
  priceOneWay: number;
  priceReturn: number;
}

export interface BuildAirportPayloadInput {
  tripType: "one-way" | "return";
  direction: "to-nhatrang" | "to-airport";
  outboundStartsFrom: "airport" | "nhatrang";
  nhaTrangAddress: string;
  nhaTrangReturnAddress: string;
  dateValue: DateValue | null;
  timeValue: TimeValue;
  flightNumber: string;
  returnDateValue: DateValue | null;
  returnTimeValue: TimeValue;
  returnFlightNumber: string;
  selectedVehicle: VehicleOption;
  routeId?: number;
  actualKm?: number;
  fullName: string;
  phone: string;
  email: string;
  contactChannel: "zalo" | "kakaotalk";
  contactId: string;
  notes: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function buildAirportPayload(input: BuildAirportPayloadInput) {
  const activeAddress = input.nhaTrangAddress || "Trung tâm Nha Trang";
  const activeReturnAddress = input.nhaTrangReturnAddress || activeAddress;

  let outboundPickup = "";
  let outboundDropoff = "";
  let returnPickup = "";
  let returnDropoff = "";
  let outboundDirection = "FROM_AIRPORT";
  let returnDirection = "TO_AIRPORT";

  if (input.tripType === "one-way") {
    if (input.direction === "to-nhatrang") {
      outboundPickup = "Sân bay Cam Ranh (CXR)";
      outboundDropoff = activeAddress;
      outboundDirection = "FROM_AIRPORT";
    } else {
      outboundPickup = activeAddress;
      outboundDropoff = "Sân bay Cam Ranh (CXR)";
      outboundDirection = "TO_AIRPORT";
    }
  } else {
    if (input.outboundStartsFrom === "airport") {
      outboundPickup = "Sân bay Cam Ranh (CXR)";
      outboundDropoff = activeAddress;
      outboundDirection = "FROM_AIRPORT";
      returnPickup = activeReturnAddress;
      returnDropoff = "Sân bay Cam Ranh (CXR)";
      returnDirection = "TO_AIRPORT";
    } else {
      outboundPickup = activeAddress;
      outboundDropoff = "Sân bay Cam Ranh (CXR)";
      outboundDirection = "TO_AIRPORT";
      returnPickup = "Sân bay Cam Ranh (CXR)";
      returnDropoff = activeReturnAddress;
      returnDirection = "FROM_AIRPORT";
    }
  }

  const pickupLoc =
    input.tripType === "return"
      ? `${outboundPickup} ➔ ${outboundDropoff}`
      : outboundPickup;
  const dropoffLoc =
    input.tripType === "return"
      ? `${returnPickup} ➔ ${returnDropoff}`
      : outboundDropoff;

  const dateText = input.dateValue ? input.dateValue.toString() : "";
  let outboundHr = input.timeValue.hour;
  if (input.timeValue.period === "PM" && outboundHr < 12) outboundHr += 12;
  if (input.timeValue.period === "AM" && outboundHr === 12) outboundHr = 0;
  const startDateFormatted = dateText
    ? `${dateText}T${pad2(outboundHr)}:${pad2(input.timeValue.minute)}:00`
    : undefined;

  let endDateFormatted: string | undefined = undefined;
  if (input.tripType === "return" && input.returnDateValue) {
    let returnHr = input.returnTimeValue.hour;
    if (input.returnTimeValue.period === "PM" && returnHr < 12) returnHr += 12;
    if (input.returnTimeValue.period === "AM" && returnHr === 12) returnHr = 0;
    endDateFormatted = `${input.returnDateValue.toString()}T${pad2(returnHr)}:${pad2(input.returnTimeValue.minute)}:00`;
  }

  const outboundPrice = input.selectedVehicle.priceOneWay;
  const returnPrice =
    input.tripType === "return"
      ? input.selectedVehicle.priceReturn - input.selectedVehicle.priceOneWay
      : 0;
  const unitPrice =
    input.tripType === "one-way"
      ? input.selectedVehicle.priceOneWay
      : input.selectedVehicle.priceReturn;

  const airportDetails = {
    tripType: input.tripType === "return" ? "ROUND_TRIP" : "ONE_WAY",
    outboundDirection,
    outboundDate: dateText || null,
    outboundPickupTime: startDateFormatted || null,
    outboundFlightNumber: input.flightNumber || null,
    outboundPickupAddress: outboundPickup,
    outboundDropoffAddress: outboundDropoff,
    returnDirection: input.tripType === "return" ? returnDirection : null,
    returnDate:
      input.tripType === "return" && input.returnDateValue
        ? input.returnDateValue.toString()
        : null,
    returnPickupTime: endDateFormatted || null,
    returnFlightNumber:
      input.tripType === "return" ? input.returnFlightNumber || null : null,
    returnPickupAddress: input.tripType === "return" ? returnPickup : null,
    returnDropoffAddress:
      input.tripType === "return" ? returnDropoff : null,
    vehicleCategoryId: input.selectedVehicle.categoryId || null,
    routeId: input.routeId ?? null,
    actualKm: input.actualKm ?? null,
    basePrice: outboundPrice,
    totalPrice: unitPrice,
    currency: "VND" as const,
  };

  const payload = {
    customerName: input.fullName,
    customerEmail: input.email || `${input.phone}@traveler.com`,
    customerPhone: input.phone,
    totalAmount: unitPrice,
    contactChannel: input.contactChannel,
    contactId: input.contactId,
    customerNotes: `[Social: ${input.contactChannel.toUpperCase()} ID: ${input.contactId}] Notes: ${input.notes}`,
    items: [
      {
        serviceId: input.selectedVehicle.categoryId || 101,
        serviceOptionId: input.selectedVehicle.categoryId || 11,
        quantity: 1,
        unitPrice,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        pickupLocation: pickupLoc,
        dropoffLocation: dropoffLoc,
        flightNumber: input.flightNumber || undefined,
        dynamicDetails: JSON.stringify(airportDetails),
      },
    ],
  };

  return {
    payload,
    airportDetails,
    outboundPrice,
    returnPrice,
    unitPrice,
    outboundPickup,
    outboundDropoff,
    outboundDirection,
    returnPickup,
    returnDropoff,
    returnDirection,
  };
}
