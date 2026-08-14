"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalHeader,
  ModalBody, ModalFooter, Button, Checkbox, Label, TextField, Input,
  Select, ListBox, SearchField, NumberField
} from "@heroui/react";
import { Save, RefreshCw, MapPin, Pencil, X } from "lucide-react";
import dynamic from "next/dynamic";

import { createAirportRoute, updateAirportRoute, AirportRouteDto, AirportDto } from "@/lib/api/fleet";
import { searchLocations, LocationSearchResult } from "@/lib/api/locations";

const RouteMap = dynamic(() => import("@/components/route-map"), { ssr: false });

interface AirportRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: AirportRouteDto | null;
  airports: AirportDto[];
  onSaveSuccess: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
  defaultEditMode?: boolean;
}

export default function AirportRouteModal({
  isOpen,
  onClose,
  route,
  airports,
  onSaveSuccess,
  showToast,
  defaultEditMode
}: AirportRouteModalProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "create">("create");
  const [code, setCode] = useState("");
  const [airportId, setAirportId] = useState<number | undefined>(undefined);
  const [active, setActive] = useState(true);

  const [name, setName] = useState("");

  const [originSearchQuery, setOriginSearchQuery] = useState("");
  const [destinationSearchQuery, setDestinationSearchQuery] = useState("");
  const [originResults, setOriginResults] = useState<LocationSearchResult[]>([]);
  const [destinationResults, setDestinationResults] = useState<LocationSearchResult[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);

  const [originLat, setOriginLat] = useState<number | null>(null);
  const [originLng, setOriginLng] = useState<number | null>(null);
  const [destinationLat, setDestinationLat] = useState<number | null>(null);
  const [destinationLng, setDestinationLng] = useState<number | null>(null);
  const [originLabel, setOriginLabel] = useState("");
  const [destinationLabel, setDestinationLabel] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [distanceManuallySet, setDistanceManuallySet] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (route) {
        setMode(defaultEditMode ? "edit" : "view");
        setCode(route.code || "");
        setName(route.name || "");
        setAirportId(route.airportId);
        setActive(route.active ?? true);
        setDistanceKm(route.distanceKm != null ? String(route.distanceKm) : "");
        setOriginLat(route.originLat ?? null);
        setOriginLng(route.originLng ?? null);
        setDestinationLat(route.destinationLat ?? null);
        setDestinationLng(route.destinationLng ?? null);
        setOriginLabel(route.originName || "");
        setDestinationLabel(route.destinationName || "");
        setOriginSearchQuery(route.originName || "");
        setDestinationSearchQuery(route.destinationName || "");
        setDistanceManuallySet(false);
      } else {
        setMode("create");
        setCode("");
        setName("");
        setAirportId(undefined);
        setActive(true);
        setDistanceKm("");
        setOriginLat(null);
        setOriginLng(null);
        setDestinationLat(null);
        setDestinationLng(null);
        setOriginLabel("");
        setDestinationLabel("");
        setOriginSearchQuery("");
        setDestinationSearchQuery("");
        setDistanceManuallySet(false);
      }
      setOriginResults([]);
      setDestinationResults([]);
      setShowOriginDropdown(false);
      setShowDestinationDropdown(false);
    }
  }, [isOpen, route, defaultEditMode]);

  // Auto-fill origin from the selected airport's stored coordinates
  useEffect(() => {
    const airport = airports.find(a => a.id === airportId);
    if (airport && airport.latitude != null && airport.longitude != null) {
      const addr = airport.name || airport.location || "";
      setOriginSearchQuery(addr);
      setOriginLabel(addr);
      setOriginLat(airport.latitude);
      setOriginLng(airport.longitude);
      setDistanceManuallySet(false);
    }
  }, [airportId, airports]);

  const handleSearchLocation = async (
    query: string,
    setResults: (r: LocationSearchResult[]) => void
  ) => {
    if (query.length < 2) { setResults([]); return; }
    try {
      const res = await searchLocations(query, "vi", 8);
      setResults(res?.data || []);
    } catch { setResults([]); }
  };

  const onRouteCalculated = useCallback((km: number | null) => {
    if (km && !distanceManuallySet) {
      setDistanceKm(String(km));
    }
  }, [distanceManuallySet]);

  const selectedAirport = airports.find(a => a.id === airportId);
  const airportHasCoords = selectedAirport?.latitude != null && selectedAirport?.longitude != null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!code.trim() || !airportId) {
      showToast("Vui lòng điền mã tuyến và chọn sân bay!", "error");
      return;
    }
    const payload: AirportRouteDto = {
      code: code.trim(),
      name: name.trim() || undefined,
      airportId,
      active,
      distanceKm: distanceKm ? Number(distanceKm) : undefined,
      originName: originLabel || undefined,
      destinationName: destinationLabel || undefined,
      originLat: originLat ?? undefined,
      originLng: originLng ?? undefined,
      destinationLat: destinationLat ?? undefined,
      destinationLng: destinationLng ?? undefined,
    };
    setLoading(true);
    try {
      if (route?.id) {
        await updateAirportRoute(route.id, payload);
        showToast("Cập nhật tuyến đường thành công!", "success");
      } else {
        await createAirportRoute(payload);
        showToast("Tạo tuyến đường mới thành công!", "success");
      }
      onSaveSuccess();
      onClose();
    } catch {
      showToast("Lưu thông tin thất bại!", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderSearchField = (
    label: string,
    query: string,
    setQuery: (v: string) => void,
    results: LocationSearchResult[],
    showDropdown: boolean,
    setShowDropdown: (v: boolean) => void,
    setResults: (r: LocationSearchResult[]) => void,
    onPick: (item: LocationSearchResult) => void,
    iconColor: string
  ) => (
    <div className="relative">
      <SearchField
        value={query}
        onChange={(v) => {
          setQuery(v);
          setShowDropdown(true);
          handleSearchLocation(v, setResults);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setShowDropdown(true);
            handleSearchLocation(query, setResults);
          }
        }}
      >
        <Label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">{label}</Label>
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Nhập và chọn địa điểm..." className="px-3 py-2 rounded-xl text-sm w-full" />
          <SearchField.ClearButton onClick={() => { setResults([]); setShowDropdown(false); }} />
        </SearchField.Group>
      </SearchField>
      {showDropdown && results.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {results.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onPick(item);
                  setResults([]);
                  setShowDropdown(false);
                }}
                className="p-2.5 hover:bg-blue-50/50 dark:hover:bg-[var(--bg-card)] cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2"
              >
                <MapPin size={12} className={`${iconColor} shrink-0`} />
                <div className="min-w-0">
                  <span className="block truncate font-semibold">{item.name}</span>
                  <span className="block truncate text-[10px] text-slate-400">{item.address}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const isView = mode === "view";

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="airport-route-title">
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm">
        <ModalContainer size="lg">
          <ModalDialog className="bg-white dark:bg-black rounded-3xl border border-divider shadow-2xl overflow-hidden animate-scale-up w-full max-w-3xl relative">
            <Button isIconOnly variant="ghost" onClick={onClose} className="absolute top-4 right-4 z-50 rounded-xl text-slate-400 hover:text-slate-750 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] transition-colors cursor-pointer border-none"><X size={18} /></Button>
            <ModalHeader className="px-6 py-4 border-b border-divider bg-slate-50 dark:bg-black/40">
              <h2 id="airport-route-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                {isView ? "Chi Tiết Tuyến Đường" : route ? "Chỉnh Sửa Tuyến Đường" : "Tạo Tuyến Đường Mới"}
              </h2>
            </ModalHeader>
            {isView ? (
              <>
                <ModalBody className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{"Mã Tuyến Đường"}</Label>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{code || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{"Tên Tuyến Đường"}</Label>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{name || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{"Sân Bay"}</Label>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{selectedAirport ? `${selectedAirport.name} (${selectedAirport.code})` : "—"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{"Khoảng cách"}</Label>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{distanceKm ? `${distanceKm} km` : "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{"Trạng Thái"}</Label>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{active ? "Hoạt động" : "Ngừng hoạt động"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{"Điểm đi (Origin)"}</Label>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{originLabel || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{"Điểm đến (Destination)"}</Label>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{destinationLabel || "—"}</p>
                    </div>
                  </div>
                  {(originLat && originLng && destinationLat && destinationLng) && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                      <Label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-2 uppercase tracking-wider">{"Bản đồ lộ trình"}</Label>
                      <RouteMap
                        originLat={originLat}
                        originLng={originLng}
                        originLabel={originLabel || selectedAirport?.name || "Điểm đi"}
                        destinationLat={destinationLat}
                        destinationLng={destinationLng}
                        destinationLabel={destinationLabel || "Điểm đến"}
                        onRouteCalculated={onRouteCalculated}
                      />
                    </div>
                  )}
                </ModalBody>
                <ModalFooter className="px-6 py-4 border-t border-divider bg-slate-50 dark:bg-black/40 flex items-center justify-end gap-3">
                  <Button variant="outline" className="rounded-xl font-bold bg-slate-200 hover:bg-slate-300 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 border-none" onClick={onClose}>
                    {"Đóng"}
                  </Button>
                  <Button className="rounded-xl font-bold bg-[#C9A227] hover:bg-[#B8911F] text-white shadow-md border-none" onPress={() => setMode("edit")}>
                    <Pencil size={16} className="mr-1.5" />
                    {"Chỉnh sửa"}
                  </Button>
                </ModalFooter>
              </>
            ) : (
              <form onSubmit={handleSave}>
                <ModalBody className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                  <TextField isRequired className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider">
                      {"Mã Tuyến Đường"}
                    </Label>
                    <Input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CXR-NT-CENTER" className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800" />
                  </TextField>
                  <TextField className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider">
                      {"Tên Tuyến Đường"}
                    </Label>
                    <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sân bay Cam Ranh ⇌ Nha Trang (Trung tâm)" className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800" />
                  </TextField>
                  <div>
                    <Label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">
                      {"Sân Bay *"}
                    </Label>
                    <Select
                      fullWidth
                      isRequired
                      selectedKey={airportId ? String(airportId) : undefined}
                      onSelectionChange={(key) => { if (key) setAirportId(Number(key)); }}
                    >
                      <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-black text-slate-805 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium cursor-pointer h-[40px]">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                        <ListBox>
                          {airports.map((a) => (
                            <ListBox.Item key={a.id} id={String(a.id)} textValue={`${a.name} (${a.code})`} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                              {a.name} ({a.code})
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {airportHasCoords ? (
                      <div className="p-3 bg-slate-50 dark:bg-[var(--bg-card)]/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{"Điểm đi (Origin)"}</p>
                        <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{originLabel}</p>
                        {originLat != null && originLng != null && (
                          <p className="mt-0.5 text-[10px] text-slate-400">{originLat.toFixed(5)}, {originLng.toFixed(5)}</p>
                        )}
                      </div>
                    ) : (
                      renderSearchField(
                        "Điểm đi (Origin)",
                        originSearchQuery,
                        setOriginSearchQuery,
                        originResults,
                        showOriginDropdown,
                        setShowOriginDropdown,
                        setOriginResults,
                        (item) => {
                          const addr = item.address || item.name;
                          setOriginSearchQuery(addr);
                          setOriginLabel(addr);
                          setOriginLat(item.latitude);
                          setOriginLng(item.longitude);
                          setDistanceManuallySet(false);
                        },
                        "text-blue-500"
                      )
                    )}
                    {renderSearchField(
                      "Điểm đến (Destination)",
                      destinationSearchQuery,
                      setDestinationSearchQuery,
                      destinationResults,
                      showDestinationDropdown,
                      setShowDestinationDropdown,
                      setDestinationResults,
                      (item) => {
                        const addr = item.address || item.name;
                        setDestinationSearchQuery(addr);
                        setDestinationLabel(addr);
                        setDestinationLat(item.latitude);
                        setDestinationLng(item.longitude);
                        setDistanceManuallySet(false);
                      },
                      "text-emerald-500"
                    )}
                  </div>

                  <NumberField value={distanceKm ? Number(distanceKm) : 0} onChange={val => { setDistanceKm(String(val || 0)); setDistanceManuallySet(true); }} minValue={0} className="w-full md:max-w-xs">
                    <Label className="block text-xs font-bold text-slate-550 dark:text-slate-400 mb-1">Khoảng cách (km)</Label>
                    <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[40px]">
                      <NumberField.Input placeholder="Tự động tính khi chọn 2 điểm" className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full font-semibold" />
                      <div className="flex h-full flex-col border-l border-slate-200 dark:border-slate-800">
                        <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs">▲</NumberField.IncrementButton>
                        <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs border-t border-slate-200 dark:border-slate-800">▼</NumberField.DecrementButton>
                      </div>
                    </NumberField.Group>
                  </NumberField>

                  {(originLat && originLng && destinationLat && destinationLng) && (
                    <RouteMap
                      originLat={originLat}
                      originLng={originLng}
                      originLabel={originLabel || selectedAirport?.name || "Điểm đi"}
                      destinationLat={destinationLat}
                      destinationLng={destinationLng}
                      destinationLabel={destinationLabel || "Điểm đến"}
                      onRouteCalculated={onRouteCalculated}
                    />
                  )}

                  <div className="flex items-center gap-3 py-2">
                    <Checkbox isSelected={active} onChange={(val: boolean) => setActive(val)}>
                      <Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control></Checkbox.Content>
                    </Checkbox>
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                      {"Kích hoạt"}
                    </Label>
                  </div>
                </ModalBody>
                <ModalFooter className="px-6 py-4 border-t border-divider bg-slate-50 dark:bg-black/40 flex items-center justify-end gap-3">
                  <Button variant="outline" className="rounded-xl font-bold bg-slate-200 hover:bg-slate-300 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 border-none" onClick={onClose} isDisabled={loading}>
                    {"Hủy"}
                  </Button>
                  <Button type="submit" isDisabled={loading} className="rounded-xl font-bold bg-[#C9A227] hover:bg-[#B8911F] text-white shadow-md border-none">
                    {loading ? <RefreshCw size={16} className="animate-spin mr-1.5" /> : <Save size={16} className="mr-1.5" />}
                    {"Lưu"}
                  </Button>
                </ModalFooter>
              </form>
            )}
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
