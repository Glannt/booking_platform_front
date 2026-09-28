/**
 * Shared enums for the Intercity / Rent-a-car booking flow.
 * Single source of truth — never inline these string literals in components.
 */

export enum IntercityServiceType {
  PRIVATE = "PRIVATE",
  SHARED = "SHARED",
}

export enum IntercityTripType {
  ONE_WAY = "one-way",
  ROUND_TRIP = "round-trip",
  RETURN = "return",
  DAILY_RATE = "DAILY_RATE",
}

export enum DurationMode {
  IN_DAY = "IN_DAY",
  DAILY_RATE = "DAILY_RATE",
}

export enum PickupType {
  OFFICE = "OFFICE",
  DOOR = "DOOR",
}

export enum IntercityPriceTypeCategory {
  IN_DAY = "IN_DAY",
  DAILY_RATE = "DAILY_RATE",
}

export enum IntercityPriceTypeCode {
  ONE_WAY = "ONE_WAY",
  ROUND_TRIP_SAME_DAY = "ROUND_TRIP_SAME_DAY",
  DAILY_RATE = "DAILY_RATE",
}