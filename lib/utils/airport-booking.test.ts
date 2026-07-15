import { describe, it, expect } from "vitest";
import {
  buildAirportPayload,
  type BuildAirportPayloadInput,
} from "./airport-booking";

function baseInput(overrides: Partial<BuildAirportPayloadInput> = {}): BuildAirportPayloadInput {
  return {
    tripType: "one-way",
    direction: "to-nhatrang",
    outboundStartsFrom: "airport",
    nhaTrangAddress: "123 Trần Phú",
    nhaTrangReturnAddress: "",
    dateValue: { toString: () => "2026-07-15" },
    timeValue: { hour: 14, minute: 30, period: "PM" },
    flightNumber: "VN123",
    returnDateValue: null,
    returnTimeValue: { hour: 10, minute: 0, period: "AM" },
    returnFlightNumber: "",
    selectedVehicle: {
      id: "7-seater",
      nameVi: "Xe 7 chỗ",
      nameEn: "7-Seater",
      categoryId: 102,
      priceOneWay: 450000,
      priceReturn: 832500,
    },
    fullName: "Nguyen Van A",
    phone: "0901234567",
    email: "",
    contactChannel: "zalo",
    contactId: "0901234567",
    notes: "Test",
    ...overrides,
  };
}

describe("buildAirportPayload", () => {
  describe("one-way: to-nhatrang (FROM_AIRPORT)", () => {
    it("sets correct direction and addresses", () => {
      const { outboundPickup, outboundDropoff, outboundDirection } =
        buildAirportPayload(baseInput());

      expect(outboundDirection).toBe("FROM_AIRPORT");
      expect(outboundPickup).toBe("Sân bay Cam Ranh (CXR)");
      expect(outboundDropoff).toBe("123 Trần Phú");
    });

    it("sets tripType ONE_WAY in airportDetails", () => {
      const { airportDetails } = buildAirportPayload(baseInput());
      expect(airportDetails.tripType).toBe("ONE_WAY");
    });

    it("return fields are null for one-way", () => {
      const { airportDetails } = buildAirportPayload(baseInput());
      expect(airportDetails.returnDirection).toBeNull();
      expect(airportDetails.returnDate).toBeNull();
      expect(airportDetails.returnPickupTime).toBeNull();
      expect(airportDetails.returnFlightNumber).toBeNull();
      expect(airportDetails.returnPickupAddress).toBeNull();
      expect(airportDetails.returnDropoffAddress).toBeNull();
    });

    it("formats dates correctly", () => {
      const { airportDetails } = buildAirportPayload(baseInput());
      expect(airportDetails.outboundDate).toBe("2026-07-15");
      expect(airportDetails.outboundPickupTime).toBe("2026-07-15T14:30:00");
    });

    it("unitPrice equals priceOneWay", () => {
      const { unitPrice } = buildAirportPayload(baseInput());
      expect(unitPrice).toBe(450000);
    });

    it("dynamicDetails is valid JSON matching airportDetails", () => {
      const { payload, airportDetails } = buildAirportPayload(baseInput());
      const parsed = JSON.parse(payload.items[0].dynamicDetails);
      expect(parsed).toEqual(airportDetails);
    });

    it("email fallback uses phone@traveler.com", () => {
      const { payload } = buildAirportPayload(baseInput());
      expect(payload.customerEmail).toBe("0901234567@traveler.com");
    });

    it("email provided is used", () => {
      const { payload } = buildAirportPayload(
        baseInput({ email: "test@example.com" })
      );
      expect(payload.customerEmail).toBe("test@example.com");
    });
  });

  describe("one-way: to-airport (TO_AIRPORT)", () => {
    it("sets correct direction and addresses", () => {
      const { outboundPickup, outboundDropoff, outboundDirection } =
        buildAirportPayload(baseInput({ direction: "to-airport" }));

      expect(outboundDirection).toBe("TO_AIRPORT");
      expect(outboundPickup).toBe("123 Trần Phú");
      expect(outboundDropoff).toBe("Sân bay Cam Ranh (CXR)");
    });
  });

  describe("round-trip: outbound from airport", () => {
    const rtInput = baseInput({
      tripType: "return",
      outboundStartsFrom: "airport",
      nhaTrangAddress: "456 Lê Hồng Phong",
      nhaTrangReturnAddress: "789 Nguyễn Thiện Thuật",
      returnDateValue: { toString: () => "2026-07-20" },
      returnTimeValue: { hour: 10, minute: 0, period: "AM" },
      returnFlightNumber: "VJ456",
    });

    it("sets ROUND_TRIP", () => {
      const { airportDetails } = buildAirportPayload(rtInput);
      expect(airportDetails.tripType).toBe("ROUND_TRIP");
    });

    it("outbound: FROM_AIRPORT with correct addresses", () => {
      const { airportDetails } = buildAirportPayload(rtInput);
      expect(airportDetails.outboundDirection).toBe("FROM_AIRPORT");
      expect(airportDetails.outboundPickupAddress).toBe(
        "Sân bay Cam Ranh (CXR)"
      );
      expect(airportDetails.outboundDropoffAddress).toBe("456 Lê Hồng Phong");
    });

    it("return: TO_AIRPORT with correct addresses", () => {
      const { airportDetails } = buildAirportPayload(rtInput);
      expect(airportDetails.returnDirection).toBe("TO_AIRPORT");
      expect(airportDetails.returnPickupAddress).toBe("789 Nguyễn Thiện Thuật");
      expect(airportDetails.returnDropoffAddress).toBe(
        "Sân bay Cam Ranh (CXR)"
      );
    });

    it("return dates formatted correctly", () => {
      const { airportDetails } = buildAirportPayload(rtInput);
      expect(airportDetails.returnDate).toBe("2026-07-20");
      expect(airportDetails.returnPickupTime).toBe("2026-07-20T10:00:00");
    });

    it("return flight number included", () => {
      const { airportDetails } = buildAirportPayload(rtInput);
      expect(airportDetails.returnFlightNumber).toBe("VJ456");
    });

    it("unitPrice equals priceReturn", () => {
      const { unitPrice } = buildAirportPayload(rtInput);
      expect(unitPrice).toBe(832500);
    });

    it("returnPrice is difference", () => {
      const { returnPrice } = buildAirportPayload(rtInput);
      expect(returnPrice).toBe(832500 - 450000);
    });

    it("vehicleCategoryId from selected vehicle", () => {
      const { airportDetails } = buildAirportPayload(rtInput);
      expect(airportDetails.vehicleCategoryId).toBe(102);
    });
  });

  describe("round-trip: outbound from nhatrang", () => {
    it("outbound: TO_AIRPORT, return: FROM_AIRPORT", () => {
      const { airportDetails } = buildAirportPayload(
        baseInput({
          tripType: "return",
          outboundStartsFrom: "nhatrang",
          nhaTrangAddress: "100 Pasteur",
          returnDateValue: { toString: () => "2026-08-01" },
        })
      );
      expect(airportDetails.outboundDirection).toBe("TO_AIRPORT");
      expect(airportDetails.outboundPickupAddress).toBe("100 Pasteur");
      expect(airportDetails.outboundDropoffAddress).toBe(
        "Sân bay Cam Ranh (CXR)"
      );
      expect(airportDetails.returnDirection).toBe("FROM_AIRPORT");
      expect(airportDetails.returnPickupAddress).toBe(
        "Sân bay Cam Ranh (CXR)"
      );
      expect(airportDetails.returnDropoffAddress).toBe("100 Pasteur");
    });
  });

  describe("edge cases", () => {
    it("empty address uses default", () => {
      const { outboundDropoff } = buildAirportPayload(
        baseInput({ nhaTrangAddress: "" })
      );
      expect(outboundDropoff).toBe("Trung tâm Nha Trang");
    });

    it("null returnAddress falls back to outbound address", () => {
      const { airportDetails } = buildAirportPayload(
        baseInput({
          tripType: "return",
          nhaTrangReturnAddress: "",
          nhaTrangAddress: "ABC Street",
          returnDateValue: { toString: () => "2026-07-20" },
        })
      );
      expect(airportDetails.returnPickupAddress).toBe("ABC Street");
    });

    it("no flight number -> null in airportDetails", () => {
      const { airportDetails } = buildAirportPayload(
        baseInput({ flightNumber: "" })
      );
      expect(airportDetails.outboundFlightNumber).toBeNull();
    });

    it("no vehicle categoryId -> null", () => {
      const { airportDetails } = buildAirportPayload(
        baseInput({
          selectedVehicle: {
            id: "test",
            nameVi: "Test",
            nameEn: "Test",
            priceOneWay: 100000,
            priceReturn: 200000,
          },
        })
      );
      expect(airportDetails.vehicleCategoryId).toBeNull();
    });

    it("currency is always VND", () => {
      const { airportDetails } = buildAirportPayload(baseInput());
      expect(airportDetails.currency).toBe("VND");
    });
  });
});
