import { apiFetch, ApiResponse } from "./client";

export interface LocationSearchResult {
  id: number;
  latitude: number;
  longitude: number;
  category: string;
  name: string;
  address: string;
}

export async function searchLocations(
  query: string,
  locale: string,
  limit: number = 5
): Promise<ApiResponse<LocationSearchResult[]>> {
  return apiFetch<ApiResponse<LocationSearchResult[]>>(
    `/api/v1/locations/search?q=${encodeURIComponent(query)}&locale=${locale}&limit=${limit}`
  );
}

export async function reverseGeocode(lat: number, lng: number, locale: string = "vi"): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${locale}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}
