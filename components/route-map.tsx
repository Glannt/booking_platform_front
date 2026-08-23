"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useI18n } from "@/context/LanguageContext";

interface RouteMapProps {
  originLat: number | null;
  originLng: number | null;
  originLabel: string;
  destinationLat: number | null;
  destinationLng: number | null;
  destinationLabel: string;
  onRouteCalculated?: (distanceKm: number | null) => void;
}

const getCityCoords = (cityName: string): { lat: number; lng: number } => {
  const name = cityName?.toLowerCase().trim() || "";
  if (name.includes("nha trang")) return { lat: 12.2388, lng: 109.1967 };
  if (name.includes("đà lạt") || name.includes("da lat")) return { lat: 11.9404, lng: 108.4583 };
  if (name.includes("mũi né") || name.includes("mui ne") || name.includes("phan thiết") || name.includes("phan thiet")) return { lat: 10.9415, lng: 108.2869 };
  if (name.includes("phan rang")) return { lat: 11.5684, lng: 108.9886 };
  if (name.includes("buôn ma thuột") || name.includes("buon ma thuot")) return { lat: 12.6710, lng: 108.0382 };
  if (name.includes("hồ chí minh") || name.includes("sài gòn") || name.includes("sai gon")) return { lat: 10.8231, lng: 106.6297 };
  return { lat: 12.2388, lng: 109.1967 };
};

export default function RouteMap({
  originLat,
  originLng,
  originLabel,
  destinationLat,
  destinationLng,
  destinationLabel,
  onRouteCalculated,
}: RouteMapProps) {
  const { t } = useI18n();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resolvedOrigin = originLat && originLng ? { lat: originLat, lng: originLng } : getCityCoords(originLabel);
  const resolvedDestination = destinationLat && destinationLng ? { lat: destinationLat, lng: destinationLng } : getCityCoords(destinationLabel);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const tileUrl = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    const centerLat = (resolvedOrigin.lat + resolvedDestination.lat) / 2;
    const centerLng = (resolvedOrigin.lng + resolvedDestination.lng) / 2;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 10,
      scrollWheelZoom: true,
    });

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://maps.google.com/" target="_blank" rel="noopener noreferrer">Google Maps</a> | Route &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;

    const timer = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        if (originMarkerRef.current) mapRef.current.removeLayer(originMarkerRef.current);
        if (destinationMarkerRef.current) mapRef.current.removeLayer(destinationMarkerRef.current);
        if (polylineRef.current) mapRef.current.removeLayer(polylineRef.current);
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Fetch driving route from OSRM
  useEffect(() => {
    let isMounted = true;
    const map = mapRef.current;
    if (!map) return;

    const fetchRoute = async () => {
      setIsLoading(true);
      setRouteInfo(null);

      try {
        const servers = [
          "https://router.project-osrm.org",
          "https://routing.openstreetmap.de/routed-car",
        ];

        let data: any = null;
        for (const base of servers) {
          const url = `${base}/route/v1/driving/${resolvedOrigin.lng},${resolvedOrigin.lat};${resolvedDestination.lng},${resolvedDestination.lat}?overview=full&geometries=geojson&alternatives=true`;
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const json = await res.json();
            if (json.code === "Ok" && json.routes && json.routes.length > 0) {
              data = json;
              break;
            }
          } catch {
            // try next OSRM source
          }
        }

        if (!isMounted || !mapRef.current || mapRef.current !== map) return;
        const activeMap = mapRef.current;
        if (!(activeMap as any)._loaded || !(activeMap as any)._container) return;

        // Clean up old layers
        if (polylineRef.current) {
          try { activeMap.removeLayer(polylineRef.current); } catch (e) {}
          polylineRef.current = null;
        }
        if (originMarkerRef.current) {
          try { activeMap.removeLayer(originMarkerRef.current); } catch (e) {}
          originMarkerRef.current = null;
        }
        if (destinationMarkerRef.current) {
          try { activeMap.removeLayer(destinationMarkerRef.current); } catch (e) {}
          destinationMarkerRef.current = null;
        }

        const originPos: L.LatLngExpression = [resolvedOrigin.lat, resolvedOrigin.lng];
        const destPos: L.LatLngExpression = [resolvedDestination.lat, resolvedDestination.lng];

        if (data && data.routes && data.routes.length > 0) {
          const route = [...data.routes].sort((a, b) => a.distance - b.distance)[0];
          const geometry = route.geometry;
          const distanceKm = parseFloat((route.distance / 1000).toFixed(1));
          const hours = Math.floor(route.duration / 3600);
          const mins = Math.round((route.duration % 3600) / 60);
          const durationStr = hours > 0 ? `${hours}h ${mins}${t.rentCar.durationMinutes}` : `${mins} ${t.rentCar.durationMinutes}`;

          setRouteInfo({
            distance: `${distanceKm} km`,
            duration: durationStr,
          });
          onRouteCalculated?.(distanceKm);

          // Draw driving polyline
          const latLngs = geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          );
          polylineRef.current = L.polyline(latLngs, {
            color: "#2563eb",
            weight: 5,
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(activeMap);
        } else {
          // Fallback: straight line
          polylineRef.current = L.polyline([originPos, destPos], {
            color: "#2563eb",
            weight: 4,
            opacity: 0.7,
            dashArray: "8 6",
          }).addTo(activeMap);
        }

        // Markers
        const originIcon = L.divIcon({
          className: "custom-div-icon",
          html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white shadow-lg border-2 border-white font-bold text-[10px]">${originLabel.substring(0, 3)}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const destIcon = L.divIcon({
          className: "custom-div-icon",
          html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white shadow-lg border-2 border-white font-bold text-[10px]">${destinationLabel.substring(0, 3)}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        originMarkerRef.current = L.marker(originPos, { icon: originIcon })
          .addTo(activeMap)
          .bindPopup(`<b>${t.rentCar.routeMapOrigin} ${originLabel}</b>`)
          .openPopup();

        destinationMarkerRef.current = L.marker(destPos, { icon: destIcon })
          .addTo(activeMap)
          .bindPopup(`<b>${t.rentCar.routeMapDestination} ${destinationLabel}</b>`);

        // Fit bounds
        const bounds = L.latLngBounds([originPos, destPos]);
        activeMap.fitBounds(bounds, { padding: [55, 55] });
      } catch (err) {
        console.error("OSRM routing error:", err);
        onRouteCalculated?.(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRoute();

    return () => { isMounted = false; };
  }, [resolvedOrigin.lat, resolvedOrigin.lng, resolvedDestination.lat, resolvedDestination.lng, originLabel, destinationLabel]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm h-64 z-10 w-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {routeInfo && (
        <div className="absolute top-2 right-2 z-20 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-md border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
            {routeInfo.distance}
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            {routeInfo.duration}
          </span>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center z-20">
          <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
