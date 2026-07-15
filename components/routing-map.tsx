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
}

// Coordinates
const CAM_RANH_AIRPORT: [number, number] = [11.9984, 109.2195]; // [lat, lng]
const NHA_TRANG_CENTER: [number, number] = [12.2388, 109.1967]; // [lat, lng]

export function RoutingMap({ nhaTrangAddress, direction, onRouteCalculated }: RoutingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const airportMarkerRef = useRef<L.Marker | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: number } | null>(null);

  // Debounced search coordinates
  const [targetCoords, setTargetCoords] = useState<[number, number]>(NHA_TRANG_CENTER);

  // Geocode address when it changes
  useEffect(() => {
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
  }, [nhaTrangAddress]);

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
      attribution: '&copy; <a href="https://maps.google.com/">Google Maps</a>',
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
      // If going to Nha Trang: Start is Airport, End is Nha Trang.
      // If going to Cam Ranh: Start is Nha Trang, End is Airport.
      const start = direction === "to-nhatrang" ? CAM_RANH_AIRPORT : targetCoords;
      const end = direction === "to-nhatrang" ? targetCoords : CAM_RANH_AIRPORT;

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        // Safety checks before updating the DOM or Leaflet internals
        if (!isMounted || !mapRef.current || mapRef.current !== map) return;
        const activeMap = mapRef.current;
        if (!(activeMap as any)._loaded || !(activeMap as any)._container) return;

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
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
          const airportLabel = "Sân bay Cam Ranh (CXR)";
          const nhaTrangLabel = nhaTrangAddress || "Trung tâm Nha Trang";

          const startLabel = direction === "to-nhatrang" ? airportLabel : nhaTrangLabel;
          const endLabel = direction === "to-nhatrang" ? nhaTrangLabel : airportLabel;

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
    <div className="bg-white dark:bg-black rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping inline-block" />
          {direction === "to-nhatrang"
            ? "Bản đồ di chuyển: Sân bay ➔ Nha Trang"
            : "Bản đồ di chuyển: Nha Trang ➔ Sân bay"}
        </h4>
        {routeInfo && (
          <span className="text-[11px] font-extrabold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full">
            📍 {routeInfo.distance} ~ {routeInfo.duration} phút
          </span>
        )}
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800/80 h-72 z-10">
        <div ref={mapContainerRef} className="w-full h-full" />
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
