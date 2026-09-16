"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalCloseTrigger, ModalHeader,
  ModalBody, ModalFooter, Button, Checkbox, Label, TextField, Input,
  Select, ListBox, SearchField, NumberField, Spinner
} from "@heroui/react";
import { Save, RefreshCw, MapPin, Pencil, Edit3, Plus, Eye, Trash2, DollarSign } from "lucide-react";
import dynamic from "next/dynamic";

import {
  createAirportRoute,
  updateAirportRoute,
  AirportRouteDto,
  AirportDto,
  AirportTransferPrice,
  VehicleCategoryDto,
  getAirportTransferPricesByRoute,
  deleteAirportTransfer
} from "@/lib/api/fleet";
import { searchLocations, LocationSearchResult } from "@/lib/api/locations";
import { StatusChip } from "@/components/StatusChip";
import AirportTransferModal from "@/components/admin/vehicles/AirportTransferModal";

const RouteMap = dynamic(() => import("@/components/route-map"), { ssr: false });

interface AirportRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: AirportRouteDto | null;
  airports: AirportDto[];
  categories?: VehicleCategoryDto[];
  routes?: AirportRouteDto[];
  onSaveSuccess: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
  defaultEditMode?: boolean;
}

export default function AirportRouteModal({
  isOpen,
  onClose,
  route,
  airports,
  categories = [],
  routes = [],
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

  // Transfer prices of this route
  const [routePrices, setRoutePrices] = useState<AirportTransferPrice[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<AirportTransferPrice | null>(null);
  const [transferDefaultEditMode, setTransferDefaultEditMode] = useState(false);

  const loadRoutePrices = useCallback(async (routeId: number) => {
    setLoadingPrices(true);
    try {
      const res = await getAirportTransferPricesByRoute(routeId);
      if (res?.data) {
        setRoutePrices(res.data);
      }
    } catch {
      setRoutePrices([]);
    } finally {
      setLoadingPrices(false);
    }
  }, []);

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
        if (route.id) {
          loadRoutePrices(route.id);
        }
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
        setRoutePrices([]);
      }
      setOriginResults([]);
      setDestinationResults([]);
      setShowOriginDropdown(false);
      setShowDestinationDropdown(false);
    }
  }, [isOpen, route, defaultEditMode, loadRoutePrices]);

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

  const handleDeletePrice = async (priceId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mức giá này?")) return;
    try {
      await deleteAirportTransfer(priceId);
      showToast("Đã xóa bảng giá thành công!", "success");
      if (route?.id) {
        loadRoutePrices(route.id);
      }
      onSaveSuccess();
    } catch {
      showToast("Xóa bảng giá thất bại!", "error");
    }
  };

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
        <Label className="block text-xs font-bold mb-1">{label}</Label>
        <SearchField.Group className="border-1 border-separator">
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Nhập và chọn địa điểm..." className="px-3 py-2 rounded-xl text-sm w-full" />
          <SearchField.ClearButton onClick={() => { setResults([]); setShowDropdown(false); }} />
        </SearchField.Group>
      </SearchField>
      {showDropdown && results.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[var(--bg-surface)] border border-border rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto divide-y divide-separator">
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

  const renderPricesSection = () => {
    if (!route?.id) return null;

    return (
      <div className="border-t border-separator pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <DollarSign size={14} className="text-primary" />
              <span>Bảng Giá Tuyến Đường ({routePrices.length} mức giá)</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Quản lý giá vé và vùng đệm zone cho từng loại xe trên tuyến này
            </p>
          </div>
          <Button
            size="sm"
            className="rounded-xl font-bold text-xs h-9 px-3 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors flex items-center gap-1"
            onPress={() => {
              setSelectedTransfer(null);
              setTransferDefaultEditMode(true);
              setTransferModalOpen(true);
            }}
          >
            <Plus size={14} />
            <span>Thêm giá vé</span>
          </Button>
        </div>

        {loadingPrices ? (
          <div className="flex justify-center py-6">
            <Spinner size="sm" />
          </div>
        ) : routePrices.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-dashed border-border text-center">
            <p className="text-xs text-slate-500">Tuyến đường này chưa có cấu hình giá nào. Bấm &quot;Thêm giá vé&quot; để thiết lập.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {routePrices.map((p) => {
              const cat = categories.find(c => c.id === p.vehicleCategoryId);
              const trans = cat?.translations?.find(t => t.locale === "vi") || cat?.translations?.[0];
              const catName = trans?.name || cat?.code || `Loại xe #${p.vehicleCategoryId}`;
              const maxZoneKm = (p.baseKm ?? 0) + (p.zoneBufferKm ?? 2);

              return (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator hover:border-primary/50 transition-colors gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {cat?.maxSeat || 4}c
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{catName}</span>
                        <StatusChip status={String(p.active)} type="active" />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>Giá: <strong className="text-amber-500 font-bold">{p.baseAmount?.toLocaleString()} {p.currency}</strong> ({p.baseKm} km)</span>
                        <span>Zone: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">+{p.zoneBufferKm ?? 2} km</strong> (đến {maxZoneKm.toFixed(1)} km)</span>
                        <span>{p.fixedOvercharge ? `Phụ trội: ${p.feeOverchargeFixed?.toLocaleString()}đ` : `Thêm: ${p.perKmAmount?.toLocaleString()}đ/km`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 shrink-0">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label="Xem chi tiết giá"
                      className="cursor-pointer text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                      onPress={() => {
                        setSelectedTransfer(p);
                        setTransferDefaultEditMode(false);
                        setTransferModalOpen(true);
                      }}
                    >
                      <Eye size={15} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label="Chỉnh sửa giá"
                      className="cursor-pointer text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                      onPress={() => {
                        setSelectedTransfer(p);
                        setTransferDefaultEditMode(true);
                        setTransferModalOpen(true);
                      }}
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label="Xóa giá"
                      className="cursor-pointer text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onPress={() => handleDeletePrice(p.id!)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const isView = mode === "view";

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="airport-route-title">
        <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
          <ModalContainer>
            <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-border-secondary shadow-2xl overflow-hidden w-full max-w-3xl flex flex-col max-h-[90vh]">
              <ModalCloseTrigger />
              <ModalHeader className="px-6 py-4 border-b border-separator flex items-center justify-between shrink-0">
                <h2 id="airport-route-title" className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {isView ? "Chi Tiết Tuyến Đường" : route ? "Chỉnh Sửa Tuyến Đường" : "Tạo Tuyến Đường Mới"}
                </h2>
              </ModalHeader>

              {isView ? (
                <>
                  <ModalBody className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wider">{"Mã Tuyến Đường"}</Label>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{code || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wider">{"Tên Tuyến Đường"}</Label>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{name || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wider">{"Sân Bay"}</Label>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{selectedAirport ? `${selectedAirport.name} (${selectedAirport.code})` : "—"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wider">{"Khoảng cách"}</Label>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{distanceKm ? `${distanceKm} km` : "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wider">{"Trạng Thái"}</Label>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{active ? "Hoạt động" : "Ngừng hoạt động"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-separator pt-4">
                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wider">{"Điểm đi (Origin)"}</Label>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{originLabel || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-bold uppercase tracking-wider">{"Điểm đến (Destination)"}</Label>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{destinationLabel || "—"}</p>
                      </div>
                    </div>

                    {(originLat && originLng && destinationLat && destinationLng) && (
                      <div className="border-t border-separator pt-4">
                        <Label className="block text-xs font-bold mb-2 uppercase tracking-wider">{"Bản đồ lộ trình"}</Label>
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

                    {/* Integrated Price List Section with View, Edit, Add, Delete */}
                    {renderPricesSection()}
                  </ModalBody>

                  <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                    <Button
                      variant="outline"
                      className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      onClick={onClose}
                    >
                      {"Đóng"}
                    </Button>
                    <Button
                      type="button"
                      className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
                      onPress={() => setMode("edit")}
                    >
                      <Edit3 size={15} className="mr-1.5" />
                      {"Chỉnh sửa tuyến"}
                    </Button>
                  </ModalFooter>
                </>
              ) : (
                <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <ModalBody className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <TextField isRequired className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider">
                        {"Mã Tuyến Đường"}
                      </Label>
                      <Input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. CXR-NT-CENTER"
                        className="w-full p-2.5 rounded-xl text-sm font-semibold border-1 border-separator bg-slate-50 dark:bg-zinc-900"
                      />
                    </TextField>

                    <TextField className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider">
                        {"Tên Tuyến Đường"}
                      </Label>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sân bay Cam Ranh ⇌ Nha Trang (Trung tâm)"
                        className="w-full p-2.5 rounded-xl text-sm font-semibold border-1 border-separator bg-slate-50 dark:bg-zinc-900"
                      />
                    </TextField>

                    <div>
                      <Label className="block text-xs font-bold mb-1">
                        {"Sân Bay *"}
                      </Label>
                      <Select
                        fullWidth
                        isRequired
                        selectedKey={airportId ? String(airportId) : undefined}
                        onSelectionChange={(key) => { if (key) setAirportId(Number(key)); }}
                      >
                        <Select.Trigger className="w-full px-3 py-2 rounded-xl border-1 border-separator bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-border-secondary rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                          <ListBox>
                            {airports.map((a) => (
                              <ListBox.Item
                                key={a.id}
                                id={String(a.id)}
                                textValue={`${a.name} (${a.code})`}
                                className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 flex items-center justify-between"
                              >
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
                        <div className="p-3 bg-slate-50 dark:bg-[var(--bg-card)] rounded-xl border border-border text-xs">
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

                    <NumberField
                      value={distanceKm ? Number(distanceKm) : 0}
                      onChange={val => { setDistanceKm(String(val || 0)); setDistanceManuallySet(true); }}
                      minValue={0}
                      className="w-full md:max-w-xs"
                    >
                      <Label className="block text-xs font-bold mb-1">Khoảng cách (km)</Label>
                      <NumberField.Group className="flex items-center w-full rounded-xl border-1 border-separator bg-slate-50 dark:bg-zinc-900 overflow-hidden h-[40px]">
                        <NumberField.Input placeholder="Tự động tính khi chọn 2 điểm" className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full font-semibold" />
                        <div className="flex h-full flex-col border-l border-border">
                          <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs">▲</NumberField.IncrementButton>
                          <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs border-t border-border">▼</NumberField.DecrementButton>
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
                      <Label className="text-sm font-bold cursor-pointer select-none">
                        {"Kích hoạt"}
                      </Label>
                    </div>

                    {/* Integrated Price List Section with View, Edit, Add, Delete */}
                    {renderPricesSection()}
                  </ModalBody>

                  <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                    <Button
                      variant="outline"
                      className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      onClick={onClose}
                      isDisabled={loading}
                    >
                      {"Hủy"}
                    </Button>
                    <Button
                      type="submit"
                      isDisabled={loading}
                      className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                    >
                      {loading ? <RefreshCw size={15} className="animate-spin mr-1.5" /> : <Save size={15} className="mr-1.5" />}
                      {route ? "Lưu thay đổi" : "Tạo tuyến đường"}
                    </Button>
                  </ModalFooter>
                </form>
              )}
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>

      {/* Embedded AirportTransferModal for this route */}
      <AirportTransferModal
        isOpen={transferModalOpen}
        onClose={() => {
          setTransferModalOpen(false);
          setSelectedTransfer(null);
        }}
        transfer={selectedTransfer}
        routes={routes.length > 0 ? routes : (route ? [route] : [])}
        categories={categories}
        onSaveSuccess={() => {
          if (route?.id) {
            loadRoutePrices(route.id);
          }
          onSaveSuccess();
        }}
        showToast={showToast}
        defaultEditMode={transferDefaultEditMode}
      />
    </>
  );
}
