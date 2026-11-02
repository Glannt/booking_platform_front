import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { getPublicIntercityRoutePrices, type IntercityRoutePriceDto } from "@/lib/api/intercity";

/**
 * price_lists rows, fetched once and shared. The route DTO deliberately carries no prices,
 * so every surface that shows "from X đồng" must ask for them here instead of deriving a
 * number from distanceKm or doubling a one-way fare.
 */
export function useIntercityRoutePrices(routeId?: number) {
  return useQuery<IntercityRoutePriceDto[]>({
    queryKey: queryKeys.intercity.prices(routeId),
    queryFn: async () => (await getPublicIntercityRoutePrices(routeId)).data ?? [],
    staleTime: 60_000,
  });
}

/** Lowest configured price across all categories and trip types for a route, or null when unpriced. */
export function lowestPriceForRoute(
  prices: IntercityRoutePriceDto[] | undefined,
  routeId: number
): number | null {
  const amounts = (prices ?? [])
    .filter((p) => Number(p.scopeRefId) === Number(routeId) || Number(p.routeId) === Number(routeId))
    .map((p) => Number(p.basePrice ?? 0))
    .filter((a) => a > 0);
  return amounts.length > 0 ? Math.min(...amounts) : null;
}