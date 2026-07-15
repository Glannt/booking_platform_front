"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface PickupMapProps {
  lat: number;
  lng: number;
  label: string;
}

export function PickupMap({ lat, lng, label }: PickupMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Google Maps Roadmap tiles URL
    const tileUrl = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      scrollWheelZoom: true,
    });

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://maps.google.com/">Google Maps</a>',
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const marker = L.marker([lat, lng], { icon: pinIcon })
      .addTo(map)
      .bindPopup(`<b>${label}</b>`)
      .openPopup();

    markerRef.current = marker;
    mapRef.current = map;

    // Force map relayout to handle container rendering delays
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      if (mapRef.current) {
        if (markerRef.current) {
          try {
            mapRef.current.removeLayer(markerRef.current);
          } catch (e) {}
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map center and marker position when lat/lng changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setView([lat, lng], 15);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setPopupContent(`<b>${label}</b>`);
      markerRef.current.openPopup();
    }
  }, [lat, lng, label]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80 h-64 z-10 w-full mt-3">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
