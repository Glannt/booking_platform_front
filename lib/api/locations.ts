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
