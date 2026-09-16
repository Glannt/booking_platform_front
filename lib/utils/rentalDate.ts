export interface SimpleDate {
  year: number;
  month: number;
  day: number;
}

/**
 * Calculates the exact number of rental days between two dates.
 * Uses Date.UTC to guarantee calendar-exact calculations across:
 * - Month boundaries (e.g. 30/09 -> 02/10 = 2 days)
 * - Leap years (e.g. 28/02/2024 -> 01/03/2024 = 2 days; 28/02/2025 -> 01/03/2025 = 1 day)
 * - Same-day rental (start == end) -> counted as 1 day
 * - Respects minimumDays constraint
 */
export function calculateRentalDays(
  start: SimpleDate | null | undefined,
  end: SimpleDate | null | undefined,
  minimumDays = 1
): number {
  if (!start) return Math.max(1, minimumDays);
  if (!end) return Math.max(1, minimumDays);

  // Month in JS Date.UTC is 0-indexed (0 = Jan, 11 = Dec)
  const startUtc = Date.UTC(start.year, start.month - 1, start.day);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);

  // Exact 24-hour day difference
  const diffDays = Math.round((endUtc - startUtc) / (24 * 60 * 60 * 1000));

  // Same day rental (diffDays === 0) or negative -> count as 1 day
  const rawDays = diffDays <= 0 ? 1 : diffDays;

  return Math.max(minimumDays, rawDays);
}

/**
 * Formats a SimpleDate to YYYY-MM-DD
 */
export function formatToIsoDate(date: SimpleDate): string {
  const y = date.year;
  const m = String(date.month).padStart(2, "0");
  const d = String(date.day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Formats a SimpleDate to DD/MM/YYYY for display
 */
export function formatToDisplayDate(date: SimpleDate): string {
  const m = String(date.month).padStart(2, "0");
  const d = String(date.day).padStart(2, "0");
  return `${d}/${m}/${date.year}`;
}
