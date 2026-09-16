"use client";

import React, { useState, useEffect } from "react";
import type { Key } from "@heroui/react";
import { Plus, Trash2, Clock, Edit3, DollarSign, Calendar, MapPin, Users, CheckSquare, XSquare, FileText, Columns2, RefreshCw, Save, Sparkles } from "lucide-react";
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
  Tooltip,
  toast
} from "@heroui/react";
import MultiImageUpload from "@/components/MultiImageUpload";
import AlertModal from "@/components/common/AlertModal";
import {
  type IntercityRouteDto,
  type IntercityRoutePriceDto,
  IntercityPricingType,
  updateIntercityRoutePriceStatus,
} from "@/lib/api/intercity";
import type { VehicleCategoryDto } from "@/lib/api/fleet";
import { searchLocations, type LocationSearchResult } from "@/lib/api/locations";
import { calcIntercityPrivatePrice } from "@/lib/pricing";
import {
  buildRouteComponents,
  parseRouteComponents,
  extractComponentContent,
  DEFAULT_ROUTE_INCLUSIONS,
  DEFAULT_ROUTE_EXCLUSIONS,
  DEFAULT_COMPARISON_DATA,
  type ComparisonComponentData,
} from "@/types/routeComponents";
import { ComparisonKeyValueEditor } from "@/components/admin/intercity/ComparisonKeyValueEditor";
import { slugify } from "@/lib/slug-helpers";

interface RouteCreateUpdateModalProps {
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
  onRefreshPrices?: () => Promise<void> | void;
}

export function RouteCreateUpdateModal({
  isOpen,
  onClose,
  editingRoute,
  onSave,
  categories,
  prices,
  onAddPrice,
  onEditPrice,
  onDeletePrice,
  onRefreshPrices,
}: RouteCreateUpdateModalProps) {
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
    slug: "",
    inclusionTitle: "Bao gồm theo chương trình",
    inclusionsText: DEFAULT_ROUTE_INCLUSIONS.join("\n"),
    exclusionTitle: "Chi phí tự túc nếu có nhu cầu",
    exclusionsText: DEFAULT_ROUTE_EXCLUSIONS.join("\n"),
    thumbnailId: null as number | null,
    imageIds: [] as number[],
    active: true,
    isContactOnly: false,
    comparisonData: DEFAULT_COMPARISON_DATA as ComparisonComponentData,
  });

  const [activeSubTab, setActiveSubTab] = useState<"general" | "services" | "prices">("general");
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
      const extracted = extractComponentContent(parseRouteComponents(editingRoute.components));
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
        slug: editingRoute.slug || "",
        inclusionTitle: extracted.inclusionsTitle || "Bao gồm theo chương trình",
        inclusionsText: extracted.inclusions.join("\n"),
        exclusionTitle: extracted.exclusionsTitle || "Chi phí tự túc nếu có nhu cầu",
        exclusionsText: extracted.exclusions.join("\n"),
        thumbnailId: editingRoute.thumbnailId || null,
        imageIds: editingRoute.imageIds || [],
        active: editingRoute.active ?? true,
        isContactOnly: editingRoute.isContactOnly ?? false,
        comparisonData: extracted.comparisonData ?? DEFAULT_COMPARISON_DATA,
      });
      setOriginSearchQuery(originName);
      setDestinationSearchQuery(destName);
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
        slug: "",
        inclusionTitle: "Bao gồm theo chương trình",
        inclusionsText: DEFAULT_ROUTE_INCLUSIONS.join("\n"),
        exclusionTitle: "Chi phí tự túc nếu có nhu cầu",
        exclusionsText: DEFAULT_ROUTE_EXCLUSIONS.join("\n"),
        thumbnailId: null,
        imageIds: [],
        active: true,
        isContactOnly: false,
        comparisonData: DEFAULT_COMPARISON_DATA as ComparisonComponentData,
      });
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

  const handleSave = async () => {
    if (!routeForm.originCity.trim() || !routeForm.destinationCity.trim()) {
      toast.danger("Vui lòng nhập đầy đủ thành phố đi và đến.");
      return;
    }

    const incArray = routeForm.inclusionsText.split("\n").map(s => s.trim()).filter(Boolean);
    const excArray = routeForm.exclusionsText.split("\n").map(s => s.trim()).filter(Boolean);
    const componentsObj = buildRouteComponents(
      routeForm.inclusionTitle.trim() || "Bao gồm theo chương trình",
      incArray,
      routeForm.exclusionTitle.trim() || "Chi phí tự túc nếu có nhu cầu",
      excArray,
      routeForm.comparisonData
    );

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
      slug: routeForm.slug.trim() || undefined,
      components: JSON.stringify(componentsObj),
      active: routeForm.active,
      isContactOnly: routeForm.isContactOnly,
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

  const [conflictAlertData, setConflictAlertData] = useState<{
    priceId: number;
    catName: string;
    typeLabel: string;
  } | null>(null);
  const [togglingPriceId, setTogglingPriceId] = useState<number | null>(null);

  const getCategoryName = (catId: number) => {
    const cat = categories.find(c => Number(c.id) === Number(catId));
    if (!cat) return `Dòng xe #${catId}`;
    const t = cat.translations?.find((t: any) => t.locale === "vi") || cat.translations?.[0];
    return t?.name || cat.code;
  };

  // Filter prices for this route
  const routePrices = editingRoute ? prices.filter(p => p.routeId === editingRoute.id) : [];

  const executeToggleStatus = async (priceId: number, active: boolean) => {
    setTogglingPriceId(priceId);
    try {
      await updateIntercityRoutePriceStatus(priceId, active);
      toast.success(active ? "Đã kích hoạt bảng giá!" : "Đã tạm dừng bảng giá!");
      if (onRefreshPrices) {
        await onRefreshPrices();
      }
    } catch {
      toast.danger("Không thể cập nhật trạng thái bảng giá.");
    } finally {
      setTogglingPriceId(null);
    }
  };

  const handleToggleActiveClick = (p: IntercityRoutePriceDto) => {
    const isCurrentlyActive = p.active ?? (p.status === "ACTIVE");
    const willActivate = !isCurrentlyActive;

    if (!willActivate) {
      executeToggleStatus(p.id!, false);
      return;
    }

    const isDaily = p.priceTypeCode === "DAILY_RATE" || p.priceTypeCategory === "DAILY_RATE";
    const isRoundTrip = p.priceTypeCode === "ROUND_TRIP_SAME_DAY";
    const currentCategory = isDaily ? "DAILY_RATE" : "IN_DAY";
    const currentCode = isDaily ? "DAILY_RATE" : isRoundTrip ? "ROUND_TRIP_SAME_DAY" : "ONE_WAY";

    // Find if another active price list matches the same vehicleCategoryId, priceTypeCategory, and priceTypeCode
    const conflictingPrice = routePrices.find((other) => {
      if (other.id === p.id) return false;
      const otherActive = other.active ?? (other.status === "ACTIVE");
      if (!otherActive) return false;

      const sameCat = Number(other.vehicleCategoryId) === Number(p.vehicleCategoryId);
      const otherIsDaily = other.priceTypeCode === "DAILY_RATE" || other.priceTypeCategory === "DAILY_RATE";
      const otherIsRoundTrip = other.priceTypeCode === "ROUND_TRIP_SAME_DAY";
      const otherCategory = otherIsDaily ? "DAILY_RATE" : "IN_DAY";
      const otherCode = otherIsDaily ? "DAILY_RATE" : otherIsRoundTrip ? "ROUND_TRIP_SAME_DAY" : "ONE_WAY";

      return sameCat && otherCategory === currentCategory && otherCode === currentCode;
    });

    if (conflictingPrice) {
      const catName = getCategoryName(p.vehicleCategoryId);
      const typeLabel = isDaily ? "Thuê theo ngày" : isRoundTrip ? "Khứ hồi trong ngày" : "Một chiều";
      setConflictAlertData({
        priceId: p.id!,
        catName,
        typeLabel,
      });
    } else {
      executeToggleStatus(p.id!, true);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <Typography type="h3" className="text-base font-bold text-slate-800 dark:text-slate-100">
                {editingRoute ? "Chỉnh sửa tuyến đường" : "Thêm tuyến đường mới"}
              </Typography>
            </ModalHeader>

            <ModalBody className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              {/* 3 sub-tabs: Info | Services & Compare | Pricing */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 gap-6">
                <Tabs
                  className="w-full"
                  selectedKey={activeSubTab}
                  onSelectionChange={(key) => setActiveSubTab(key as any)}
                >
                  <Tabs.List aria-label="Route form tabs" className="dark:bg-[var(--bg-elevated)]">
                    <Tabs.Tab id="general">Thông tin tuyến</Tabs.Tab>
                    <Tabs.Tab id="services">Dịch vụ & So sánh</Tabs.Tab>
                    <Tabs.Tab id="prices">Bảng giá xe{editingRoute ? ` (${routePrices.length})` : ""}</Tabs.Tab>
                  </Tabs.List>
                </Tabs>

              </div>

              {/* Tab 1: General Info Form */}
              {activeSubTab === "general" && (
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
                        <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">Tỉnh/Thành phố đi (Origin)</Label>
                        <SearchField.Group className="border-1 border-separator">
                          <SearchField.SearchIcon />
                          <SearchField.Input placeholder="Nhập và nhấn Enter để tìm..." className="px-3 py-2 rounded-xl text-sm w-full" />
                          <SearchField.ClearButton onClick={() => { setOriginResults([]); setShowOriginDropdown(false); }} />
                        </SearchField.Group>
                      </SearchField>
                      {showOriginDropdown && originResults.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowOriginDropdown(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[var(--bg-surface)] border border-border rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto divide-y divide-separator">
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
                        <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">Tỉnh/Thành phố đến (Destination)</Label>
                        <SearchField.Group className="border-1 border-separator">
                          <SearchField.SearchIcon />
                          <SearchField.Input placeholder="Nhập và nhấn Enter để tìm..." className="px-3 py-2 rounded-xl text-sm w-full" />
                          <SearchField.ClearButton onClick={() => { setDestinationResults([]); setShowDestinationDropdown(false); }} />
                        </SearchField.Group>
                      </SearchField>
                      {showDestinationDropdown && destinationResults.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowDestinationDropdown(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[var(--bg-surface)] border border-border rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto divide-y divide-separator">
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
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">Tên tuyến hiển thị (Tiếng Việt)</Label>
                      <Input placeholder="Ví dụ: Nha Trang ⇌ Đà Lạt" value={routeForm.name} onChange={e => {
                        const newName = e.target.value;
                        setRouteForm(f => ({
                          ...f,
                          name: newName,
                          ...(!editingRoute && !f.slug ? { slug: slugify(newName) } : {})
                        }));
                      }} className="px-3 py-2 border rounded-xl text-sm w-full" />
                    </TextField>

                    <div className="w-full md:col-span-2">
                      <TextField className="w-full">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs font-bold uppercase tracking-wider block">
                            Đường dẫn tĩnh (Slug URL)
                          </Label>
                          <button
                            type="button"
                            onClick={() => {
                              const base = routeForm.name || `${routeForm.originCity} ${routeForm.destinationCity}`;
                              if (base) setRouteForm(f => ({ ...f, slug: slugify(base) }));
                            }}
                            className="text-[11px] font-bold text-accent hover:underline cursor-pointer border-none bg-transparent"
                          >
                            Tự tạo từ tên tuyến
                          </button>
                        </div>
                        <Input
                          placeholder="Ví dụ: nha-trang-da-lat"
                          value={routeForm.slug}
                          onChange={e => setRouteForm(f => ({ ...f, slug: e.target.value }))}
                          className="px-3 py-2 border rounded-xl text-sm w-full font-mono text-xs"
                        />
                      </TextField>
                    </div>

                    <NumberField value={routeForm.distanceKm ? Number(routeForm.distanceKm) : 0} onChange={val => setRouteForm(f => ({ ...f, distanceKm: String(val || 0) }))} minValue={0} className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">Khoảng cách (km)</Label>
                      <NumberField.Group className="flex items-center w-full rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-surface)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[40px]">
                        <NumberField.Input placeholder="Ví dụ: 135" className="flex-1 px-3 py-2 text-sm outline-none border-none h-full" />
                        <div className="flex h-full flex-col border-l border-border">
                          <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs">▲</NumberField.IncrementButton>
                          <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs border-t border-border">▼</NumberField.DecrementButton>
                        </div>
                      </NumberField.Group>
                    </NumberField>

                    <NumberField value={routeForm.estimatedHours ? Number(routeForm.estimatedHours) : 0} onChange={val => setRouteForm(f => ({ ...f, estimatedHours: String(val || 0) }))} minValue={0} className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">Thời gian di chuyển dự kiến (giờ)</Label>
                      <NumberField.Group className="flex items-center w-full rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-surface)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[40px]">
                        <NumberField.Input placeholder="Ví dụ: 3.5" className="flex-1 bg-transparent px-3 py-2 text-sm outline-none border-none h-full" />
                        <div className="flex h-full flex-col border-l border-border">
                          <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs">▲</NumberField.IncrementButton>
                          <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer bg-transparent text-xs border-t border-border">▼</NumberField.DecrementButton>
                        </div>
                      </NumberField.Group>
                    </NumberField>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 my-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="route-active"
                        isSelected={routeForm.active}
                        onChange={(val: boolean) => setRouteForm(f => ({ ...f, active: val }))}
                        render={(props) => <div {...props} data-custom="bar" />}
                      >
                        <Checkbox.Content>
                          <Checkbox.Control className="border-1 border-border">
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox.Content>
                      </Checkbox>
                      <Label htmlFor="route-active" className="text-sm font-extrabold cursor-pointer select-none">
                        Hoạt động
                      </Label>
                    </div>

                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="route-contact-only"
                        isSelected={routeForm.isContactOnly}
                        onChange={(val: boolean) => setRouteForm(f => ({ ...f, isContactOnly: val }))}
                        render={(props) => <div {...props} data-custom="bar" />}
                      >
                        <Checkbox.Content>
                          <Checkbox.Control className="border-1 border-border">
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox.Content>
                      </Checkbox>
                      <Label htmlFor="route-contact-only" className="text-sm font-extrabold cursor-pointer select-none">
                        Liên hệ để được báo giá chính xác (Không bắt buộc set giá)
                      </Label>
                    </div>
                  </div>


                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">Hình ảnh / Banner tuyến đường</Label>
                    <MultiImageUpload
                      thumbnailId={routeForm.thumbnailId}
                      imageIds={routeForm.imageIds}
                      onThumbnailChange={(id: number | null) => setRouteForm(f => ({ ...f, thumbnailId: id }))}
                      onImageIdsChange={(ids: number[]) => setRouteForm(f => ({ ...f, imageIds: ids }))}
                      label="Banner tuyến đường"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Dịch vụ & So sánh */}
              {activeSubTab === "services" && (
                <div className="space-y-4">
                  {/* Cấu hình Bao gồm & Không bao gồm (Klook Architecture) */}
                  <div className="border border-separator rounded-2xl p-4 bg-slate-50/50 dark:bg-[var(--bg-card)] my-4 space-y-4">
                    <div className="flex items-center gap-2 border-b border-separator pb-2.5">
                      <FileText size={16} className="text-accent" />
                      <div>
                        <Typography type="h4" className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          Dịch vụ Bao gồm & Không bao gồm
                        </Typography>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Định dạng cấu trúc động theo chuẩn linh hoạt (mỗi mục xuống dòng một hàng)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Cột Bao gồm */}
                      <div className="space-y-2 p-3.5 bg-white dark:bg-[var(--bg-surface)] rounded-xl border border-emerald-100 dark:border-emerald-950/30 shadow-xs">
                        <div className="flex items-center gap-2">
                          <CheckSquare size={15} className="text-emerald-500" />
                          <Label className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                            Tiêu đề mục Bao gồm
                          </Label>
                        </div>
                        <Input
                          value={routeForm.inclusionTitle}
                          onChange={e => setRouteForm(f => ({ ...f, inclusionTitle: e.target.value }))}
                          placeholder="Ví dụ: Bao gồm theo chương trình"
                          className="px-3 py-2 border-1 border-separator rounded-xl text-xs font-bold w-full"
                        />
                        <Label className="text-[11px] font-semibold block pt-1">
                          Danh sách dịch vụ bao gồm (mỗi dòng 1 mục)
                        </Label>
                        <textarea
                          rows={6}
                          value={routeForm.inclusionsText}
                          onChange={e => setRouteForm(f => ({ ...f, inclusionsText: e.target.value }))}
                          placeholder="Nhập các quyền lợi bao gồm..."
                          className="w-full p-2.5 rounded-xl border-1 border-separator bg-slate-50/50 dark:bg-[var(--bg-card)] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent leading-relaxed resize-y"
                        />
                      </div>

                      {/* Cột Không bao gồm */}
                      <div className="space-y-2 p-3.5 bg-white dark:bg-[var(--bg-surface)] rounded-xl border border-amber-100 dark:border-amber-950/30 shadow-xs">
                        <div className="flex items-center gap-2">
                          <XSquare size={15} className="text-amber-500" />
                          <Label className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                            Tiêu đề mục Không bao gồm
                          </Label>
                        </div>
                        <Input
                          value={routeForm.exclusionTitle}
                          onChange={e => setRouteForm(f => ({ ...f, exclusionTitle: e.target.value }))}
                          placeholder="Ví dụ: Chi phí tự túc nếu có nhu cầu"
                          className="px-3 py-2 border-1 border-separator rounded-xl text-xs font-bold w-full"
                        />
                        <Label className="text-[11px] font-semibold block pt-1">
                          Danh sách chi phí tự túc (mỗi dòng 1 mục)
                        </Label>
                        <textarea
                          rows={6}
                          value={routeForm.exclusionsText}
                          onChange={e => setRouteForm(f => ({ ...f, exclusionsText: e.target.value }))}
                          placeholder="Nhập các chi phí không bao gồm..."
                          className="w-full p-2.5 rounded-xl border-1 border-separator bg-slate-50/50 dark:bg-[var(--bg-card)] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent leading-relaxed resize-y"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Comparison (PRIVATE vs SHARED) */}
                  <div className="pt-4 mt-4 border-t border-separator space-y-3">
                    <div className="flex items-center gap-2">
                      <Columns2 size={16} className="text-accent" />
                      <div>
                        <Typography type="h4" className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          So sánh hình thức di chuyển (Dynamic)
                        </Typography>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Cấu hình động 2 thẻ so sánh Xe riêng & Xe ghép, hiển thị trên trang chi tiết tuyến
                        </p>
                      </div>
                    </div>
                    <ComparisonKeyValueEditor
                      value={routeForm.comparisonData}
                      onChange={(data: ComparisonComponentData) =>
                        setRouteForm(f => ({ ...f, comparisonData: data }))
                      }
                    />
                  </div>

                </div>
              )}

              {/* Tab 3: Pricing Configuration */}
              {activeSubTab === "prices" && (
                <div className="space-y-4">
                  {routeForm.isContactOnly && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 mb-2">
                      <Sparkles size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold leading-relaxed">
                        Tuyến xe này đang bật chế độ <strong>Liên hệ để được báo giá chính xác</strong>. Khách hàng sẽ liên hệ tư vấn giá, bạn không bắt buộc phải cấu hình bảng giá xe bên dưới.
                      </span>
                    </div>
                  )}
                  {!editingRoute && (
                    <div className="text-center py-10 bg-slate-50 dark:bg-[var(--bg-card)] rounded-2xl border border-dashed border-border">
                      <p className="text-xs text-slate-400 italic">
                        Vui lòng lưu thông tin tuyến trước khi cấu hình bảng giá xe.
                      </p>
                    </div>
                  )}
                  {editingRoute && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Typography type="h4" className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          Danh sách giá xe cấu hình
                        </Typography>
                        <Button
                          size="sm"
                          onClick={() => onAddPrice(editingRoute.id!)}
                          className="rounded-xl font-bold text-xs h-9 px-3 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
                        >
                          <Plus size={14} /> Thêm giá mới
                        </Button>
                      </div>

                      {routePrices.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 dark:bg-[var(--bg-card)] rounded-2xl border border-dashed border-border">
                          <p className="text-xs text-slate-400 italic">Chưa cấu hình giá xe cho tuyến đường này.</p>
                        </div>
                      ) : (
                        <Table aria-label="Bảng giá xe theo tuyến" className="w-full text-xs">
                          <Table.ScrollContainer>
                            <Table.Content>
                              <Table.Header>
                                <Table.Column isRowHeader>DÒNG XE</Table.Column>
                                <Table.Column>HÌNH THỨC</Table.Column>
                                <Table.Column>GIÁ CẤU HÌNH</Table.Column>
                                <Table.Column>CHI TIẾT PHỤ THU</Table.Column>
                                <Table.Column className="text-center">KÍCH HOẠT</Table.Column>
                                <Table.Column>TRẠNG THÁI</Table.Column>
                                <Table.Column className="text-center">HÀNH ĐỘNG</Table.Column>
                              </Table.Header>
                              <Table.Body>
                                {routePrices.map((p) => {
                                  const isDaily = p.priceTypeCode === "DAILY_RATE" || p.priceTypeCategory === "DAILY_RATE";
                                  const isRoundTripType = p.priceTypeCode === "ROUND_TRIP_SAME_DAY";
                                  const priceVal = p.basePrice || (isDaily ? p.dailyRatePrice : isRoundTripType ? p.roundTripPrice : p.oneWayPrice) || 0;
                                  const isActive = p.active ?? (p.status === "ACTIVE");

                                  return (
                                    <Table.Row key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-[var(--bg-elevated)]">
                                      <Table.Cell className="font-bold text-slate-700 dark:text-slate-200">
                                        {getCategoryName(p.vehicleCategoryId)}
                                      </Table.Cell>
                                      <Table.Cell>
                                        {isDaily ? (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                            <Calendar size={11} /> Thuê theo ngày
                                          </span>
                                        ) : isRoundTripType ? (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                            <Clock size={11} /> Khứ hồi trong ngày
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            <Clock size={11} /> Một chiều
                                          </span>
                                        )}
                                      </Table.Cell>
                                      <Table.Cell className="font-extrabold text-amber-500">
                                        <div className="flex flex-col">
                                          <span>{priceVal > 0 ? `${priceVal.toLocaleString()} ${p.currency || "VND"}` : "—"}</span>
                                          {isDaily && (
                                            <span className="text-[10px] text-slate-400 font-normal">
                                              Tối thiểu {p.minDays || p.minimumDays || 1} ngày
                                            </span>
                                          )}
                                        </div>
                                      </Table.Cell>
                                      <Table.Cell>
                                        {isDaily ? (
                                          <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                                            {p.kmIncludedPerDay ? <div>Bao gồm: {p.kmIncludedPerDay} km/ngày</div> : null}
                                            {p.overagePricePerKm ? <div>Vượt km: {p.overagePricePerKm.toLocaleString()} đ/km</div> : null}
                                            {!p.kmIncludedPerDay && !p.overagePricePerKm && <span className="text-slate-400 italic">—</span>}
                                          </div>
                                        ) : (
                                          <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                                            {p.waitingFee && p.waitingFee > 0 ? (
                                              <div>Phí chờ: {p.waitingFee.toLocaleString()} đ/h</div>
                                            ) : null}
                                            {p.maxWaitingMin && p.maxWaitingMin > 0 ? (
                                              <div>Chờ miễn phí: {p.maxWaitingMin} phút</div>
                                            ) : null}
                                            {(!p.waitingFee || p.waitingFee <= 0) && (!p.maxWaitingMin || p.maxWaitingMin <= 0) && (
                                              <span className="text-slate-400 italic">Tiêu chuẩn</span>
                                            )}
                                          </div>
                                        )}
                                      </Table.Cell>
                                      <Table.Cell className="text-center">
                                        <div className="flex items-center justify-center">
                                          <Checkbox
                                            aria-label={`Kích hoạt bảng giá ${p.id}`}
                                            isSelected={isActive}
                                            isDisabled={togglingPriceId === p.id}
                                            onChange={() => handleToggleActiveClick(p)}
                                          >
                                            <Checkbox.Content>
                                              <Checkbox.Control className="cursor-pointer">
                                                <Checkbox.Indicator />
                                              </Checkbox.Control>
                                            </Checkbox.Content>
                                          </Checkbox>
                                        </div>
                                      </Table.Cell>
                                      <Table.Cell>
                                        <Chip size="sm" color={isActive ? "success" : "warning"} className="text-[10px] font-bold">
                                          {isActive ? "Hoạt động" : "Tạm ngưng"}
                                        </Chip>
                                      </Table.Cell>
                                      <Table.Cell>
                                        <div className="flex items-center justify-center gap-1.5">
                                          <Tooltip delay={300} closeDelay={100}>
                                            <Tooltip.Trigger>
                                              <Button
                                                isIconOnly
                                                size="sm"
                                                variant="secondary"
                                                aria-label="Chỉnh sửa"
                                                onPress={() => onEditPrice(p)}
                                              >
                                                <Edit3 size={14} />
                                              </Button>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content>
                                              <Tooltip.Arrow />
                                              Chỉnh sửa
                                            </Tooltip.Content>
                                          </Tooltip>
                                          <Tooltip delay={300} closeDelay={100}>
                                            <Tooltip.Trigger>
                                              <Button
                                                isIconOnly
                                                size="sm"
                                                variant="danger"
                                                aria-label="Xóa"
                                                onPress={() => onDeletePrice(p.id!)}
                                              >
                                                <Trash2 size={14} />
                                              </Button>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content className="text-rose-600 dark:text-rose-400">
                                              <Tooltip.Arrow />
                                              Xóa
                                            </Tooltip.Content>
                                          </Tooltip>
                                        </div>
                                      </Table.Cell>
                                    </Table.Row>
                                  );
                                })}
                              </Table.Body>
                            </Table.Content>
                          </Table.ScrollContainer>
                        </Table>
                      )}
                    </div>
                  )}
                </div>
              )}
            </ModalBody>
            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                isDisabled={savingRoute}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                isDisabled={savingRoute}
                className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
              >
                {savingRoute ? (
                  <RefreshCw size={15} className="animate-spin mr-1.5" />
                ) : (
                  <Save size={15} className="mr-1.5" />
                )}
                {editingRoute ? "Lưu" : "Tạo tuyến mới"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>

      {conflictAlertData && (
        <AlertModal
          isOpen={!!conflictAlertData}
          onClose={() => setConflictAlertData(null)}
          onConfirm={async () => {
            if (conflictAlertData) {
              const pid = conflictAlertData.priceId;
              setConflictAlertData(null);
              await executeToggleStatus(pid, true);
            }
          }}
          title="Kích hoạt bảng giá xe"
          confirmText="Kích hoạt & Dừng bảng giá cũ"
          cancelText="Hủy"
          variant="warning"
          description={
            <div className="space-y-2">
              <p>
                Dòng xe <strong className="text-slate-900 dark:text-white font-bold">{conflictAlertData.catName}</strong> hiện đã có một bảng giá <strong className="text-slate-900 dark:text-white font-bold">{conflictAlertData.typeLabel}</strong> đang hoạt động trên tuyến đường này.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Việc kích hoạt bảng giá mới sẽ tự động chuyển bảng giá hiện tại sang trạng thái <strong>Tạm ngưng</strong> để đảm bảo không trùng lặp cách tính giá cho cùng một dòng xe. Bạn có chắc chắn muốn kích hoạt bảng giá này không?
              </p>
            </div>
          }
        />
      )}
    </Modal>
  );
}
