"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { searchLocations } from "@/lib/api/locations";
import { getSelectedLanguage } from "@/lib/api/client";

interface RoutingMapProps {
  nhaTrangAddress: string;
  direction: "to-nhatrang" | "to-airport";
  onRouteCalculated?: (durationMin: number, distanceKm: number) => void;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  airportLabel?: string;
}

// Coordinates
const CAM_RANH_AIRPORT: [number, number] = [12.0104, 109.2171]; // [lat, lng]
const NHA_TRANG_CENTER: [number, number] = [12.2388, 109.1967]; // [lat, lng]

export function RoutingMap({
  nhaTrangAddress,
  direction,
  onRouteCalculated,
  originLat,
  originLng,
  destinationLat,
  destinationLng,
  airportLabel
}: RoutingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const airportMarkerRef = useRef<L.Marker | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: number } | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 150);
    }
  }, [isMaximized]);

  // Listen for ESC key to exit full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMaximized(false);
      }
    };
    if (isMaximized) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMaximized]);

  // Debounced search coordinates
  const [targetCoords, setTargetCoords] = useState<[number, number]>(NHA_TRANG_CENTER);

  // Geocode address when it changes
  useEffect(() => {
    if (destinationLat && destinationLng) {
      setTargetCoords([destinationLat, destinationLng]);
      setIsLoading(false);
      return;
    }

    if (!nhaTrangAddress.trim()) {
      setTargetCoords(NHA_TRANG_CENTER);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const locale = getSelectedLanguage();
        const res = await searchLocations(nhaTrangAddress, locale, 1);
        const results = res?.data || [];
        if (results.length > 0) {
          setTargetCoords([results[0].latitude, results[0].longitude]);
        } else {
          // Fallback to Nha Trang center
          setTargetCoords(NHA_TRANG_CENTER);
        }
      } catch (err) {
        console.error("Geocoding error:", err);
        setTargetCoords(NHA_TRANG_CENTER);
      } finally {
        setIsLoading(false);
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [nhaTrangAddress, originLat, originLng, destinationLat, destinationLng]);

  // Initializing map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Google Maps Roadmap tiles URL
    const tileUrl = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

    const map = L.map(mapContainerRef.current, {
      center: [12.1186, 109.2081], // center between Nha Trang & Cam Ranh
      zoom: 11,
      scrollWheelZoom: true,
    });

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://maps.google.com/" target="_blank" rel="noopener noreferrer">Google Maps</a> | Route &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        // Clean up markers and layers safely if they exist
        if (routeLayerRef.current) {
          try { mapRef.current.removeLayer(routeLayerRef.current); } catch (e) {}
        }
        if (airportMarkerRef.current) {
          try { mapRef.current.removeLayer(airportMarkerRef.current); } catch (e) {}
        }
        if (targetMarkerRef.current) {
          try { mapRef.current.removeLayer(targetMarkerRef.current); } catch (e) {}
        }
        routeLayerRef.current = null;
        airportMarkerRef.current = null;
        targetMarkerRef.current = null;

        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Calculate route and update map markers
  useEffect(() => {
    let isMounted = true;
    const map = mapRef.current;
    if (!map) return;

    const fetchRoute = async () => {
      const airportCoords: [number, number] = originLat && originLng
        ? [originLat, originLng]
        : CAM_RANH_AIRPORT;

      // If going to Nha Trang: Start is Airport, End is Nha Trang.
      // If going to Cam Ranh: Start is Nha Trang, End is Airport.
      const start = direction === "to-nhatrang" ? airportCoords : targetCoords;
      const end = direction === "to-nhatrang" ? targetCoords : airportCoords;

      try {
        const servers = [
          "https://router.project-osrm.org",
          "https://routing.openstreetmap.de/routed-car",
        ];

        let data: any = null;
        for (const base of servers) {
          const url = `${base}/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&alternatives=true`;
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

        // Safety checks before updating the DOM or Leaflet internals
        if (!isMounted || !mapRef.current || mapRef.current !== map) return;
        const activeMap = mapRef.current;
        if (!(activeMap as any)._loaded || !(activeMap as any)._container) return;

        if (data && data.routes && data.routes.length > 0) {
          const route = [...data.routes].sort((a, b) => a.distance - b.distance)[0];
          const geometry = route.geometry;
          const durationSec = route.duration; // seconds
          const distanceMeters = route.distance; // meters

          const durationMin = Math.round(durationSec / 60);
          const distanceKm = parseFloat((distanceMeters / 1000).toFixed(1));

          setRouteInfo({
            distance: `${distanceKm} km`,
            duration: durationMin,
          });

          if (onRouteCalculated) {
            onRouteCalculated(durationMin, distanceKm);
          }

          // Clean up old layer
          if (routeLayerRef.current) {
            try {
              activeMap.removeLayer(routeLayerRef.current);
            } catch (e) {
              console.warn("Could not remove routeLayer:", e);
            }
          }

          // Draw polyline
          const latLns = geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
          const polyline = L.polyline(latLns, {
            color: "#3b82f6",
            weight: 5,
            opacity: 0.8,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(activeMap);

          routeLayerRef.current = polyline;

          // Custom pins using Leaflet divIcon: Blue for Start, Green for End
          const startIcon = L.divIcon({
            className: "custom-div-icon",
            html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const endIcon = L.divIcon({
            className: "custom-div-icon",
            html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"></path><path d="M3 21v-3l9-9"></path><path d="m15 6 3-3 3 3-3 3z"></path></svg></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          // Clean up old markers
          if (airportMarkerRef.current) {
            try {
              activeMap.removeLayer(airportMarkerRef.current);
            } catch (e) {}
          }
          if (targetMarkerRef.current) {
            try {
              activeMap.removeLayer(targetMarkerRef.current);
            } catch (e) {}
          }

          // Add markers with correct start/end labels depending on direction
          const airportLabelText = airportLabel || "Sân bay";
          const nhaTrangLabel = nhaTrangAddress || "Trung tâm Nha Trang";

          const startLabel = direction === "to-nhatrang" ? airportLabelText : nhaTrangLabel;
          const endLabel = direction === "to-nhatrang" ? nhaTrangLabel : airportLabelText;

          const startMarker = L.marker(start, { icon: startIcon })
            .addTo(activeMap)
            .bindPopup(`<b>Điểm đón (Start Point)</b><br/>${startLabel}`);

          const endMarker = L.marker(end, { icon: endIcon })
            .addTo(activeMap)
            .bindPopup(`<b>Điểm trả (End Point)</b><br/>${endLabel}`);

          airportMarkerRef.current = startMarker;
          targetMarkerRef.current = endMarker;

          // Fit bounds
          const bounds = L.latLngBounds([start, end]);
          activeMap.fitBounds(bounds, { padding: [40, 40] });
        }
      } catch (err) {
        console.error("OSRM Routing error:", err);
      }
    };

    fetchRoute();

    return () => {
      isMounted = false;
    };
  }, [targetCoords, direction, onRouteCalculated, nhaTrangAddress]);

  return (
    <div className={isMaximized
      ? "fixed inset-0 z-[9999] bg-white dark:bg-black flex flex-col p-6 md:p-10 space-y-4 overflow-hidden"
      : "bg-white dark:bg-black rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4"
    }>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping inline-block" />
          {direction === "to-nhatrang"
            ? "Bản đồ di chuyển: Sân bay ➔ Nha Trang"
            : "Bản đồ di chuyển: Nha Trang ➔ Sân bay"}
        </h4>
        <div className="flex items-center gap-2">
          {routeInfo && (
            <span className="text-[11px] font-extrabold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full">
              📍 {routeInfo.distance} ~ {routeInfo.duration} phút
            </span>
          )}
          {isMaximized && (
            <button
              type="button"
              onClick={() => setIsMaximized(false)}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-350 rounded-lg text-xs font-bold border-none cursor-pointer"
            >
              Đóng (ESC)
            </button>
          )}
        </div>
      </div>

      <div className={isMaximized
        ? "relative rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800/80 flex-grow z-10"
        : "relative rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800/80 h-56 sm:h-64 md:h-72 z-10"
      }>
        <div ref={mapContainerRef} className="w-full h-full" />
        <button
          type="button"
          onClick={() => setIsMaximized(!isMaximized)}
          className="absolute top-3 right-3 z-[1000] p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer text-slate-700 dark:text-slate-200 flex items-center justify-center"
          title={isMaximized ? "Thu nhỏ" : "Phóng to"}
        >
          {isMaximized ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          )}
        </button>
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-slate-500">Đang tìm địa điểm...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
