"use client";

import React, { useState, useEffect } from "react";
import type { Key } from "@heroui/react";
import { Plus, Trash2, Clock, Edit3, DollarSign, Calendar, MapPin } from "lucide-react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  Button,
  Input,
  Label,
  NumberField,
  Checkbox,
  SearchField,
  TextField,
  Typography,
  Tabs,
  Table,
  Chip,
  Select,
  ListBox,
  toast
} from "@heroui/react";
import MultiImageUpload from "@/components/MultiImageUpload";
import {
  getDepartureTimesByRoute,
  createDepartureTime,
  deleteDepartureTime,
  type IntercityRouteDto,
  type IntercityDepartureTimeDto,
  type IntercityRoutePriceDto,
} from "@/lib/api/rental";
import type { VehicleCategoryDto } from "@/lib/api/fleet";
import { searchLocations, type LocationSearchResult } from "@/lib/api/locations";
import { calcIntercityPrice } from "@/lib/pricing";

interface RouteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRoute: IntercityRouteDto | null;
  onSave: (payload: any) => Promise<void>;

  // Pricing props
  categories: VehicleCategoryDto[];
  prices: IntercityRoutePriceDto[];
  onAddPrice: (routeId: number) => void;
  onEditPrice: (price: IntercityRoutePriceDto) => void;
  onDeletePrice: (priceId: number) => void;
}

export function RouteFormModal({
  isOpen,
  onClose,
  editingRoute,
  onSave,
  categories,
  prices,
  onAddPrice,
  onEditPrice,
  onDeletePrice,
}: RouteFormModalProps) {
  const [routeForm, setRouteForm] = useState({
    originCity: "",
    destinationCity: "",
    distanceKm: "",
    estimatedHours: "",
    originLat: "",
    originLng: "",
    destinationLat: "",
    destinationLng: "",
    name: "",
    thumbnailId: null as number | null,
    imageIds: [] as number[],
    active: true,
    hasDepartureTimes: false
  });

  const [activeSubTab, setActiveSubTab] = useState<"general" | "prices">("general");
  const [departureTimes, setDepartureTimes] = useState<IntercityDepartureTimeDto[]>([]);
  const [timesLoading, setTimesLoading] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [savingTime, setSavingTime] = useState(false);
  const [savingRoute, setSavingRoute] = useState(false);
  const [surchargeToAssign, setSurchargeToAssign] = useState<Key | null>(null);

  // Location search states
  const [originSearchQuery, setOriginSearchQuery] = useState("");
  const [destinationSearchQuery, setDestinationSearchQuery] = useState("");
  const [originResults, setOriginResults] = useState<LocationSearchResult[]>([]);
  const [destinationResults, setDestinationResults] = useState<LocationSearchResult[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);

  // Sync form state when editingRoute changes
  useEffect(() => {
    if (editingRoute) {
      const t = editingRoute.translations?.find(tr => tr.locale === "vi") || editingRoute.translations?.[0];
      const originName = editingRoute.originCity || "";
      const destName = editingRoute.destinationCity || "";
      setRouteForm({
        originCity: originName,
        destinationCity: destName,
        distanceKm: String(editingRoute.distanceKm ?? ""),
        estimatedHours: String(editingRoute.estimatedHours ?? ""),
        originLat: editingRoute.originLat ? String(editingRoute.originLat) : "",
        originLng: editingRoute.originLng ? String(editingRoute.originLng) : "",
        destinationLat: editingRoute.destinationLat ? String(editingRoute.destinationLat) : "",
        destinationLng: editingRoute.destinationLng ? String(editingRoute.destinationLng) : "",
        name: t?.name || "",
        thumbnailId: editingRoute.thumbnailId || null,
        imageIds: editingRoute.imageIds || [],
        active: editingRoute.active ?? true,
        hasDepartureTimes: editingRoute.hasDepartureTimes ?? false
      });
      setOriginSearchQuery(originName);
      setDestinationSearchQuery(destName);
      fetchDepartureTimes(editingRoute.id!);
    } else {
      setRouteForm({
        originCity: "",
        destinationCity: "",
        distanceKm: "",
        estimatedHours: "",
        originLat: "",
        originLng: "",
        destinationLat: "",
        destinationLng: "",
        name: "",
        thumbnailId: null,
        imageIds: [],
        active: true,
        hasDepartureTimes: false
      });
      setDepartureTimes([]);
      setActiveSubTab("general");
      setSurchargeToAssign(null);
      setOriginSearchQuery("");
      setDestinationSearchQuery("");
      setOriginResults([]);
      setDestinationResults([]);
      setShowOriginDropdown(false);
      setShowDestinationDropdown(false);
    }
  }, [editingRoute, isOpen]);

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

  const fetchDepartureTimes = async (routeId: number) => {
    setTimesLoading(true);
    try {
      const res = await getDepartureTimesByRoute(routeId);
      if (res.data) {
        setDepartureTimes([...res.data].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
      }
    } catch {
      toast.danger("Không thể tải danh sách giờ khởi hành.");
    } finally {
      setTimesLoading(false);
    }
  };

  const handleAddDepartureTime = async () => {
    if (!newTime.match(/^\d{2}:\d{2}$/)) {
      toast.danger("Giờ không hợp lệ. Định dạng bắt buộc: HH:MM (ví dụ: 08:00)");
      return;
    }
    if (!editingRoute?.id) return;

    setSavingTime(true);
    try {
      await createDepartureTime({
        routeId: editingRoute.id,
        departureTime: newTime,
        orderIndex: departureTimes.length + 1,
        active: true,
      });
      setNewTime("");
      await fetchDepartureTimes(editingRoute.id);
      toast.success("Đã thêm giờ khởi hành.");
    } catch {
      toast.danger("Không thể thêm giờ khởi hành.");
    } finally {
      setSavingTime(false);
    }
  };

  const handleDeleteDepartureTime = async (id: number) => {
    if (!id || !editingRoute?.id) return;
    try {
      await deleteDepartureTime(id);
      await fetchDepartureTimes(editingRoute.id);
      toast.success("Đã xóa giờ khởi hành.");
    } catch {
      toast.danger("Không thể xóa giờ khởi hành.");
    }
  };

  const handleSave = async () => {
    if (!routeForm.originCity.trim() || !routeForm.destinationCity.trim()) {
      toast.danger("Vui lòng nhập đầy đủ thành phố đi và đến.");
      return;
    }

    const payload = {
      originCity: routeForm.originCity,
      destinationCity: routeForm.destinationCity,
      distanceKm: routeForm.distanceKm ? Number(routeForm.distanceKm) : undefined,
      estimatedHours: routeForm.estimatedHours ? Number(routeForm.estimatedHours) : undefined,
      originLat: routeForm.originLat ? Number(routeForm.originLat) : undefined,
      originLng: routeForm.originLng ? Number(routeForm.originLng) : undefined,
      destinationLat: routeForm.destinationLat ? Number(routeForm.destinationLat) : undefined,
      destinationLng: routeForm.destinationLng ? Number(routeForm.destinationLng) : undefined,
      translations: routeForm.name ? [{ locale: "vi", name: routeForm.name }] : undefined,
      active: routeForm.active,
      hasDepartureTimes: routeForm.hasDepartureTimes,
      thumbnailId: routeForm.thumbnailId || undefined,
      imageIds: routeForm.imageIds || [],
    };

    setSavingRoute(true);
    try {
      await onSave(payload);
    } finally {
      setSavingRoute(false);
    }
  };

  const getCategoryName = (catId: number) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return `ID: ${catId}`;
    const t = cat.translations?.find((t: any) => t.locale === "vi") || cat.translations?.[0];
    return t?.name || cat.code;
  };

  // Filter prices for this route
  const routePrices = editingRoute ? prices.filter(p => p.routeId === editingRoute.id) : [];

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-4xl bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl shadow-2xl">
            <ModalHeader className="flex items-center justify-between p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Typography type="h3" className="text-base font-bold text-slate-800 dark:text-slate-100">
                {editingRoute ? "Chỉnh sửa tuyến đường" : "Thêm tuyến đường mới"}
              </Typography>
            </ModalHeader>

            <ModalBody className="gap-4 max-h-[75vh] overflow-y-auto pr-2 mt-4">
              {/* Tab Navigation if Editing */}
              {editingRoute && (
                <div className="flex border-b border-slate-200 dark:border-black/10 gap-6 mb-4">
                  <Tabs
                    className="w-full"
                    selectedKey={activeSubTab}
                    onSelectionChange={(key) => setActiveSubTab(key as any)}
                  >
                    <Tabs.ListContainer>
                      <Tabs.List aria-label="Route edit tabs" className="dark:bg-black/10">
                        <Tabs.Tab id="general">Thông tin tuyến</Tabs.Tab>
                        <Tabs.Tab id="prices">Bảng giá xe ({routePrices.length})</Tabs.Tab>
                      </Tabs.List>
                    </Tabs.ListContainer>
                  </Tabs>
                </div>
              )}

              {/* Tab 1: General Info Form */}
              {(!editingRoute || activeSubTab === "general") && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="w-full relative">
                      <SearchField
                        value={originSearchQuery}
                        onChange={setOriginSearchQuery}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setShowOriginDropdown(true);
                            handleSearchLocation(originSearchQuery, setOriginResults);
                          }
                        }}
                      >
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Tỉnh/Thành phố đi (Origin)</Label>
                        <SearchField.Group>
                          <SearchField.SearchIcon />
                          <SearchField.Input placeholder="Nhập và nhấn Enter để tìm..." className="px-3 py-2 rounded-xl text-sm w-full" />
                          <SearchField.ClearButton onClick={() => { setOriginResults([]); setShowOriginDropdown(false); }} />
                        </SearchField.Group>
                      </SearchField>
                      {showOriginDropdown && originResults.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowOriginDropdown(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                            {originResults.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => {
                                  setOriginSearchQuery(item.name);
                                  setOriginResults([]);
                                  setShowOriginDropdown(false);
                                  setRouteForm(f => ({
                                    ...f,
                                    originCity: item.name,
                                    originLat: String(item.latitude),
                                    originLng: String(item.longitude),
                                  }));
                                }}
                                className="p-2.5 hover:bg-blue-50/50 dark:hover:bg-[var(--bg-card)] cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2"
                              >
                                <MapPin size={12} className="text-blue-500 shrink-0" />
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

                    <div className="w-full relative">
                      <SearchField
                        value={destinationSearchQuery}
                        onChange={setDestinationSearchQuery}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setShowDestinationDropdown(true);
                            handleSearchLocation(destinationSearchQuery, setDestinationResults);
                          }
                        }}
                      >
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Tỉnh/Thành phố đến (Destination)</Label>
                        <SearchField.Group>
                          <SearchField.SearchIcon />
                          <SearchField.Input placeholder="Nhập và nhấn Enter để tìm..." className="px-3 py-2 rounded-xl text-sm w-full" />
                          <SearchField.ClearButton onClick={() => { setDestinationResults([]); setShowDestinationDropdown(false); }} />
                        </SearchField.Group>
                      </SearchField>
                      {showDestinationDropdown && destinationResults.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowDestinationDropdown(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                            {destinationResults.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => {
                                  setDestinationSearchQuery(item.name);
                                  setDestinationResults([]);
                                  setShowDestinationDropdown(false);
                                  setRouteForm(f => ({
                                    ...f,
                                    destinationCity: item.name,
                                    destinationLat: String(item.latitude),
                                    destinationLng: String(item.longitude),
                                  }));
                                }}
                                className="p-2.5 hover:bg-blue-50/50 dark:hover:bg-[var(--bg-card)] cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2"
                              >
                                <MapPin size={12} className="text-emerald-500 shrink-0" />
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

                    <TextField className="w-full md:col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Tên tuyến hiển thị (Tiếng Việt)</Label>
                      <Input placeholder="Ví dụ: Nha Trang ⇌ Đà Lạt" value={routeForm.name} onChange={e => setRouteForm(f => ({ ...f, name: e.target.value }))} className="px-3 py-2 border rounded-xl text-sm w-full" />
                    </TextField>

                    <NumberField value={routeForm.distanceKm ? Number(routeForm.distanceKm) : 0} onChange={val => setRouteForm(f => ({ ...f, distanceKm: String(val || 0) }))} minValue={0} className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Khoảng cách (km)</Label>
                      <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[40px]">
                        <NumberField.Input placeholder="Ví dụ: 135" className="flex-1 px-3 py-2 text-sm outline-none border-none h-full" />
                        <div className="flex h-full flex-col border-l border-slate-200 dark:border-slate-800">
                          <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs">▲</NumberField.IncrementButton>
                          <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs border-t border-slate-200 dark:border-slate-800">▼</NumberField.DecrementButton>
                        </div>
                      </NumberField.Group>
                    </NumberField>

                    <NumberField value={routeForm.estimatedHours ? Number(routeForm.estimatedHours) : 0} onChange={val => setRouteForm(f => ({ ...f, estimatedHours: String(val || 0) }))} minValue={0} className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">Thời gian di chuyển dự kiến (giờ)</Label>
                      <NumberField.Group className="flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[40px]">
                        <NumberField.Input placeholder="Ví dụ: 3.5" className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full" />
                        <div className="flex h-full flex-col border-l border-slate-200 dark:border-slate-800">
                          <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs">▲</NumberField.IncrementButton>
                          <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs border-t border-slate-200 dark:border-slate-800">▼</NumberField.DecrementButton>
                        </div>
                      </NumberField.Group>
                    </NumberField>
                  </div>

                  <div className="flex items-center gap-6 my-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="route-active"
                        isSelected={routeForm.active}
                        onChange={(val: boolean) => setRouteForm(f => ({ ...f, active: val }))}
                        render={(props) => <div {...props} data-custom="bar" />}

                      >
                        <Checkbox.Content>
                          <Checkbox.Control className="border-1 border-zinc-800">
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox.Content>
                      </Checkbox>
                      <Label htmlFor="route-active" className="text-sm font-extrabold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        Hoạt động
                      </Label>
                    </div>

                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="route-has-departure-times"
                        isSelected={routeForm.hasDepartureTimes}
                        onChange={(val: boolean) => setRouteForm(f => ({ ...f, hasDepartureTimes: val }))}
                        render={(props) => <div {...props} data-custom="bar" />}
                      >
                        <Checkbox.Content>
                          <Checkbox.Control className="border-1 border-zinc-800">
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox.Content>
                      </Checkbox>
                      <Label htmlFor="route-has-departure-times" className="text-sm font-extrabold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        Có giờ khởi hành
                      </Label>
                    </div>
                  </div>

                  {/* Configure Departure Times Section */}
                  {routeForm.hasDepartureTimes && (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/50 my-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-accent" />
                        <Typography type="h4" className="text-sm font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wider">
                          Cấu hình giờ khởi hành cố định
                        </Typography>
                      </div>

                      {editingRoute?.id ? (
                        <div className="space-y-4">
                          <div className="flex items-end gap-3">
                            <TextField className="flex-1">
                              <Label className="text-xs font-bold text-slate-555 mb-1.5 block">Thêm giờ mới (HH:MM)</Label>
                              <Input
                                placeholder="Ví dụ: 08:30"
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                                className="px-3 py-2 border rounded-xl text-sm"
                              />
                            </TextField>
                            <Button
                              size="md"
                              onClick={handleAddDepartureTime}
                              isDisabled={savingTime}
                              className="bg-accent text-white h-[38px] px-4 rounded-xl cursor-pointer hover:bg-accent-hover flex items-center gap-1.5 font-bold text-xs"
                            >
                              <Plus size={14} /> Thêm
                            </Button>
                          </div>

                          {timesLoading ? (
                            <p className="text-xs text-slate-400">Đang tải...</p>
                          ) : departureTimes.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Chưa cấu hình khung giờ nào.</p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {departureTimes.map((dt) => (
                                <div key={dt.id} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-black border border-slate-100 dark:border-slate-800 rounded-xl">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{dt.departureTime}</span>
                                  <button
                                    onClick={() => handleDeleteDepartureTime(dt.id!)}
                                    className="text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer border-none bg-transparent"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-amber-500 font-semibold italic">
                          * Vui lòng lưu thông tin tuyến đường mới trước khi thêm danh sách giờ khởi hành cố định.
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Hình ảnh / Banner tuyến đường</Label>
                    <MultiImageUpload
                      thumbnailId={routeForm.thumbnailId}
                      imageIds={routeForm.imageIds}
                      onThumbnailChange={(id: number | null) => setRouteForm(f => ({ ...f, thumbnailId: id }))}
                      onImageIdsChange={(ids: number[]) => setRouteForm(f => ({ ...f, imageIds: ids }))}
                      label="Banner tuyến đường"
                    />
                  </div>

                  <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                    <Button size="sm" onClick={handleSave} isDisabled={savingRoute}>Lưu thông tin tuyến</Button>
                    <Button size="sm" variant="ghost" onClick={onClose} isDisabled={savingRoute}>Hủy</Button>
                  </div>
                </div>
              )}

              {/* Tab 2: Pricing Configuration */}
              {editingRoute && activeSubTab === "prices" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Typography type="h4" className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Danh sách giá xe cấu hình
                    </Typography>
                    <Button
                      size="sm"
                      onClick={() => onAddPrice(editingRoute.id!)}
                      className="bg-accent text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-accent-hover flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Thêm giá mới
                    </Button>
                  </div>

                  {routePrices.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-400 italic">Chưa cấu hình giá xe cho tuyến đường này.</p>
                    </div>
                  ) : (
                    <Table className="w-full text-xs">
                      <Table.ScrollContainer>
                        <Table.Content>
                          <Table.Header>
                            <Table.Column isRowHeader>DÒNG XE</Table.Column>
                            <Table.Column>GIÁ / KM</Table.Column>
                            <Table.Column>1 CHIỀU</Table.Column>
                            <Table.Column>KHỨ HỒI</Table.Column>
                            <Table.Column>TRẠNG THÁI</Table.Column>
                            <Table.Column className="text-center">HÀNH ĐỘNG</Table.Column>
                          </Table.Header>
                          <Table.Body>
                            {routePrices.map((p) => (
                              <Table.Row key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <Table.Cell className="font-bold text-slate-700 dark:text-slate-200">
                                  {getCategoryName(p.vehicleCategoryId)}
                                </Table.Cell>
                                <Table.Cell className="font-extrabold text-amber-500">
                                  {p.perKmAmount > 0 ? `${p.perKmAmount.toLocaleString()} ${p.currency}` : "—"}
                                </Table.Cell>
                                <Table.Cell className="font-extrabold text-amber-500">
                                  {editingRoute.distanceKm ? `${calcIntercityPrice(editingRoute.distanceKm, p.perKmAmount, false).toLocaleString()} ${p.currency}` : "—"}
                                </Table.Cell>
                                <Table.Cell className="font-extrabold text-amber-500">
                                  {editingRoute.distanceKm ? `${calcIntercityPrice(editingRoute.distanceKm, p.perKmAmount, true).toLocaleString()} ${p.currency}` : "—"}
                                </Table.Cell>
                                <Table.Cell>
                                  <Chip size="sm" color={p.active ? "success" : "warning"} className="text-[10px] font-bold">
                                    {p.active ? "Hoạt động" : "Tạm ẩn"}
                                  </Chip>
                                </Table.Cell>
                                <Table.Cell>
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => onEditPrice(p)}
                                      className="text-blue-500 hover:text-blue-750 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer border-none bg-transparent"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                    <button
                                      onClick={() => onDeletePrice(p.id!)}
                                      className="text-red-500 hover:text-red-750 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer border-none bg-transparent"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Content>
                      </Table.ScrollContainer>
                    </Table>
                  )}
                  <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                    <Button size="sm" variant="ghost" onClick={onClose}>Đóng</Button>
                  </div>
                </div>
              )}
            </ModalBody>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
