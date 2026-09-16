import { calculateRentalDays, formatToIsoDate, formatToDisplayDate } from "./rentalDate";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// 1. Same-day rental (Start == End) -> 1 day
assert(
  calculateRentalDays({ year: 2026, month: 9, day: 10 }, { year: 2026, month: 9, day: 10 }) === 1,
  "Same day rental should be 1 day"
);

// 2. Normal range within same month (10/09 to 13/09 -> 3 days)
assert(
  calculateRentalDays({ year: 2026, month: 9, day: 10 }, { year: 2026, month: 9, day: 13 }) === 3,
  "10/09 to 13/09 should be 3 days"
);

// 3. User's specific case: Month boundary (30/09 to 02/10 -> 2 days)
assert(
  calculateRentalDays({ year: 2026, month: 9, day: 30 }, { year: 2026, month: 10, day: 2 }) === 2,
  "30/09 to 02/10 should be 2 days"
);

// 4. Leap year 2024 (February has 29 days)
// 28/02/2024 to 01/03/2024 -> 2 days (28 -> 29 -> 1)
assert(
  calculateRentalDays({ year: 2024, month: 2, day: 28 }, { year: 2024, month: 3, day: 1 }) === 2,
  "Leap year 28/02/2024 to 01/03/2024 should be 2 days"
);

// 5. Non-leap year 2025 (February has 28 days)
// 28/02/2025 to 01/03/2025 -> 1 day
assert(
  calculateRentalDays({ year: 2025, month: 2, day: 28 }, { year: 2025, month: 3, day: 1 }) === 1,
  "Non-leap year 28/02/2025 to 01/03/2025 should be 1 day"
);

// 6. Year boundary: 31/12/2026 to 03/01/2027 -> 3 days
assert(
  calculateRentalDays({ year: 2026, month: 12, day: 31 }, { year: 2027, month: 1, day: 3 }) === 3,
  "31/12/2026 to 03/01/2027 should be 3 days"
);

// 7. Respects minimumDays constraint
assert(
  calculateRentalDays({ year: 2026, month: 9, day: 10 }, { year: 2026, month: 9, day: 10 }, 3) === 3,
  "Same day rental with minimumDays 3 should be 3 days"
);

// 8. Formatting helpers
assert(
  formatToIsoDate({ year: 2026, month: 9, day: 8 }) === "2026-09-08",
  "formatToIsoDate should output YYYY-MM-DD"
);
assert(
  formatToDisplayDate({ year: 2026, month: 9, day: 8 }) === "08/09/2026",
  "formatToDisplayDate should output DD/MM/YYYY"
);

console.log("All rentalDate tests passed successfully!");
