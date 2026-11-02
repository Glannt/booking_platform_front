"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalCloseTrigger,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  Label,
  TextField,
  Input,
  Select,
  ListBox,
  SearchField,
  NumberField,
} from "@heroui/react";
import {
  Save,
  RefreshCw,
  MapPin,
  Route as RouteIcon,
  ShieldCheck,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { DepositType } from "@/types/deposit";
import {
  createAirportRoute,
  updateAirportRoute,
  type AirportRouteDto,
  type AirportDto,
} from "@/lib/api/fleet";
import { searchLocations, type LocationSearchResult } from "@/lib/api/locations";

const RouteMap = dynamic(() => import("@/components/route-map"), { ssr: false });

interface AirportRouteCreateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  route?: AirportRouteDto | null;
  airports: AirportDto[];
  onSaveSuccess: () => void | Promise<void>;
  showToast: (msg: string, type: "success" | "error") => void;
}

export function AirportRouteCreateUpdateModal({
  isOpen,
  onClose,
  route,
  airports,
  onSaveSuccess,
  showToast,
}: AirportRouteCreateUpdateModalProps) {
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [airportId, setAirportId] = useState<number | undefined>(undefined);
  const [active, setActive] = useState(true);

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

  // Route default deposit policy
  const [depositType, setDepositType] = useState<DepositType>("PERCENT");
  const [depositRate, setDepositRate] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (route) {
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
        setDepositType(route.depositType || "PERCENT");
        setDepositRate(route.depositRate != null ? Number(route.depositRate) : 0);
        setDepositAmount(route.depositAmount != null ? String(route.depositAmount) : "");
        setDistanceManuallySet(false);
      } else {
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
        setDepositType("PERCENT");
        setDepositRate(0);
        setDepositAmount("");
        setDistanceManuallySet(false);
      }
      setOriginResults([]);
      setDestinationResults([]);
      setShowOriginDropdown(false);
      setShowDestinationDropdown(false);
    }
  }, [isOpen, route]);

  // Auto-fill origin from the selected airport's stored coordinates
  useEffect(() => {
    const airport = airports.find((a) => a.id === airportId);
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
    if (query.length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await searchLocations(query, "vi", 8);
      setResults(res?.data || []);
    } catch {
      setResults([]);
    }
  };

  const onRouteCalculated = useCallback(
    (km: number | null) => {
      if (km && !distanceManuallySet) {
        setDistanceKm(String(km));
      }
    },
    [distanceManuallySet]
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!code.trim()) {
      showToast("Vui lòng nhập mã tuyến đường!", "error");
      return;
    }
    if (!airportId) {
      showToast("Vui lòng chọn sân bay!", "error");
      return;
    }

    const payload: AirportRouteDto = {
      code: code.trim(),
      name: name.trim() || undefined,
      airportId,
      active,
      originName: originLabel || originSearchQuery || undefined,
      originLat: originLat ?? undefined,
      originLng: originLng ?? undefined,
      destinationName: destinationLabel || destinationSearchQuery || undefined,
      destinationLat: destinationLat ?? undefined,
      destinationLng: destinationLng ?? undefined,
      distanceKm: distanceKm ? Number(distanceKm) : undefined,
      depositType,
      depositRate: depositType === "PERCENT" ? Number(depositRate) : undefined,
      depositAmount: depositType === "FIXED" && depositAmount ? Number(depositAmount) : undefined,
    };

    setLoading(true);
    try {
      if (route?.id) {
        await updateAirportRoute(route.id, payload);
      } else {
        await createAirportRoute(payload);
      }

      showToast("Lưu tuyến đường thành công!", "success");
      await onSaveSuccess?.();
      onClose();
    } catch {
      showToast("Lưu tuyến đường thất bại!", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedAirport = airports.find((a) => a.id === airportId);
  const airportHasCoords = selectedAirport && selectedAirport.latitude != null && selectedAirport.longitude != null;

  const renderSearchField = (
    label: string,
    query: string,
    setQuery: (val: string) => void,
    results: LocationSearchResult[],
    isOpenDropdown: boolean,
    setIsOpenDropdown: (val: boolean) => void,
    setResults: (r: LocationSearchResult[]) => void,
    onSelect: (item: LocationSearchResult) => void,
    iconColor: string
  ) => (
    <div className="relative">
      <Label className="block text-xs font-bold mb-1 text-foreground">{label}</Label>
      <SearchField
        value={query}
        onChange={(val) => {
          setQuery(val);
          handleSearchLocation(val, setResults);
          setIsOpenDropdown(true);
        }}
        onFocus={() => {
          if (query.length >= 2) {
            handleSearchLocation(query, setResults);
            setIsOpenDropdown(true);
          }
        }}
      >
        <SearchField.Group className="flex items-center w-full rounded-xl border border-separator bg-slate-50 dark:bg-[var(--bg-surface)] px-2.5 py-1 text-sm font-semibold h-[40px]">
          <SearchField.SearchIcon className={`mr-1.5 ${iconColor}`} />
          <SearchField.Input
            placeholder="Tìm kiếm địa điểm..."
            className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-foreground/50 text-xs"
          />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      {isOpenDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[var(--bg-surface)] border border-separator rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
          {results.map((item, idx) => (
            <div
              key={idx}
              className="px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer flex items-center gap-2 border-b border-separator/40 last:border-0"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
                setIsOpenDropdown(false);
              }}
            >
              <MapPin size={14} className="text-accent shrink-0" />
              <div className="flex flex-col">
                <span className="font-bold text-foreground">{item.name}</span>
                {item.address && <span className="text-[10px] text-foreground/60">{item.address}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-border-secondary shadow-2xl overflow-hidden w-full max-w-3xl flex flex-col max-h-[90vh]">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-separator flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <RouteIcon size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                    {route?.id ? "Chỉnh Sửa Tuyến Đường Sân Bay" : "Thêm Tuyến Đường Sân Bay Mới"}
                  </h3>
                  <p className="text-xs text-foreground/60">
                    Cấu hình mã tuyến, sân bay phục vụ, điểm đón/trả và cọc mặc định
                  </p>
                </div>
              </div>
            </ModalHeader>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <TextField isRequired className="w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Mã Tuyến Đường
                  </Label>
                  <Input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. CXR-NT-CENTER"
                    className="w-full p-2.5 rounded-xl text-sm font-semibold border border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-foreground"
                  />
                </TextField>

                <TextField className="w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Tên Tuyến Đường
                  </Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sân bay Cam Ranh ⇌ Nha Trang (Trung tâm)"
                    className="w-full p-2.5 rounded-xl text-sm font-semibold border border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-foreground"
                  />
                </TextField>

                <div>
                  <Label className="block text-xs font-bold mb-1 text-foreground">
                    Sân Bay *
                  </Label>
                  <Select
                    className="w-full"
                    isRequired
                    value={airportId ? String(airportId) : undefined}
                    onChange={(key) => {
                      if (key) setAirportId(Number(key));
                    }}
                  >
                    <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-foreground text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
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
                            className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-foreground flex items-center justify-between"
                          >
                            <span>{a.name} ({a.code})</span>
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
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/50">
                        Điểm đi (Origin)
                      </p>
                      <p className="mt-1 font-semibold text-foreground">{originLabel}</p>
                      {originLat != null && originLng != null && (
                        <p className="mt-0.5 text-[10px] text-foreground/50">
                          {originLat.toFixed(5)}, {originLng.toFixed(5)}
                        </p>
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
                  onChange={(val) => {
                    setDistanceKm(String(val || 0));
                    setDistanceManuallySet(true);
                  }}
                  minValue={0}
                  className="w-full md:max-w-xs"
                >
                  <Label className="block text-xs font-bold mb-1 text-foreground">Khoảng cách (km)</Label>
                  <NumberField.Group className="flex items-center w-full rounded-xl border border-separator bg-slate-50 dark:bg-[var(--bg-surface)] overflow-hidden h-[40px]">
                    <NumberField.Input
                      placeholder="Tự động tính khi chọn 2 điểm"
                      className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full font-semibold text-foreground"
                    />
                  </NumberField.Group>
                </NumberField>

                {originLat && originLng && destinationLat && destinationLng && (
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

                <div className="flex items-center gap-3 py-1">
                  <Checkbox isSelected={active} onChange={(val: boolean) => setActive(val)}>
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                  <Label className="text-sm font-bold cursor-pointer select-none text-foreground">
                    Kích hoạt tuyến xe này
                  </Label>
                </div>

                {/* Default Route Deposit Policy Configuration */}
                <div className="p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-[var(--bg-card)] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <ShieldCheck size={15} className="text-amber-500 shrink-0" />
                        <span>Chính Sách Đặt Cọc Mặc Định Tuyến</span>
                      </Label>
                      <p className="text-[11px] text-foreground/60 mt-0.5">
                        Áp dụng chung cho tất cả các mức giá xe trên tuyến này nếu không tùy chỉnh riêng.
                      </p>
                    </div>
                    {/* Type Toggle */}
                    <div className="flex rounded-lg border border-border bg-slate-100 dark:bg-[var(--bg-surface)] p-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDepositType("PERCENT")}
                        className={`text-[11px] font-bold px-3 py-1 rounded-md transition-colors cursor-pointer ${
                          depositType === "PERCENT"
                            ? "bg-accent text-accent-foreground shadow-xs"
                            : "text-foreground/60 hover:text-foreground"
                        }`}
                      >
                        Theo %
                      </button>
                      <button
                        type="button"
                        onClick={() => setDepositType("FIXED")}
                        className={`text-[11px] font-bold px-3 py-1 rounded-md transition-colors cursor-pointer ${
                          depositType === "FIXED"
                            ? "bg-accent text-accent-foreground shadow-xs"
                            : "text-foreground/60 hover:text-foreground"
                        }`}
                      >
                        Cố định (VNĐ)
                      </button>
                    </div>
                  </div>

                  {depositType === "PERCENT" ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-32">
                          <NumberField
                            value={depositRate}
                            onChange={(v) => setDepositRate(v || 0)}
                            minValue={0}
                            maxValue={100}
                            className="w-full"
                          >
                            <NumberField.Group className="w-full">
                              <NumberField.Input className="w-full px-3 py-1.5 rounded-xl border border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground text-sm font-bold h-[36px]" />
                            </NumberField.Group>
                          </NumberField>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {[10, 20, 30, 50, 100].map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => setDepositRate(rate)}
                              className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                                depositRate === rate
                                  ? "bg-accent/15 text-accent border-accent/40"
                                  : "border-border hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-foreground/70"
                              }`}
                            >
                              {rate}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="Số tiền cọc cố định (VNĐ)..."
                        className="w-full sm:max-w-xs px-3 py-2 rounded-xl border border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground text-sm font-semibold h-[36px] outline-none"
                      />
                    </div>
                  )}
                </div>
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground/80 transition-colors cursor-pointer"
                  onClick={onClose}
                  isDisabled={loading}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isDisabled={loading}
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                >
                  {loading ? (
                    <RefreshCw size={15} className="animate-spin mr-1.5" />
                  ) : (
                    <Save size={15} className="mr-1.5" />
                  )}
                  {route?.id ? "Lưu thay đổi" : "Tạo tuyến đường"}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}

export { AirportRouteCreateUpdateModal as AirportRouteModal };
export default AirportRouteCreateUpdateModal;
