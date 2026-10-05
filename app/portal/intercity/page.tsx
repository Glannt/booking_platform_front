"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  RefreshCw,
  Route,
  DollarSign,
  Calendar,
  Clock,
  Bus,
  Building2,
  Filter,
  X,
} from "lucide-react";
import {
  RouteCreateUpdateModal,
  RouteDetailModal,
  PriceCreateUpdateModal,
  PriceDetailModal,
  SharedRouteCreateUpdateModal,
  SharedRouteDetailModal,
  SharedOfficeModal,
  SharedRouteModal,
} from "@/components/admin/intercity";
import type { SortDescriptor } from "@heroui/react";
import { Button, Checkbox, Chip, Input, Label, ListBox, Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalHeader, ModalBody, NumberField, Pagination, SearchField, Select, Spinner, Switch, Table, Tabs, TextField, toast, Typography, Popover } from "@heroui/react";
import clsx from "clsx";
import { useI18n } from "@/context/LanguageContext";
import { AppStatusChip, RowActionButtons } from "@/components/common";

import {
  getIntercityRoutes,
  createIntercityRoute,
  updateIntercityRoute,
  deleteIntercityRoute,
  getIntercityRoutePrices,
  getAllIntercityRoutePrices,
  createIntercityRoutePrice,
  updateIntercityRoutePrice,
  deleteIntercityRoutePrice,
  IntercityRouteDto,
  IntercityRoutePriceDto,
} from "@/lib/api/intercity";
import { formatDepositPolicy } from "@/lib/pricing/deposit";

import {
  getSharedRoutes,
  deleteSharedRoute,
  type SharedRouteDto,
  getSharedOffices,
  deleteSharedOffice,
  type SharedOfficeDto,
} from "@/lib/api/sharedRoute";

import { getVehicleCategories, VehicleCategoryDto } from "@/lib/api/fleet";

import MultiImageUpload from "@/components/MultiImageUpload";
import { backendUrl } from "@/lib/api/client";
import { IntercityDepartureTimeModal } from "@/components/admin/vehicles";

import { ColumnInterface } from "@/lib/interface/column.interface";
import { headerColumns } from "@/config/headerColumns";
import { PageSizeSelect } from "@/components/common";

type TabKey = "routes" | "prices" | "shared_routes" | "offices";

export default function IntercityManagementPage() {
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>("routes");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);

  // Route Filters
  const [selectedRouteStatuses, setSelectedRouteStatuses] = useState<string[]>([]);
  const [selectedRouteTypes, setSelectedRouteTypes] = useState<string[]>([]);
  const [selectedDistanceRanges, setSelectedDistanceRanges] = useState<string[]>([]);

  const toggleRouteStatus = (status: string) => {
    setSelectedRouteStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleRouteType = (type: string) => {
    setSelectedRouteTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleDistanceRange = (range: string) => {
    setSelectedDistanceRanges(prev =>
      prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]
    );
  };

  const resetRouteFilters = () => {
    setSelectedRouteStatuses([]);
    setSelectedRouteTypes([]);
    setSelectedDistanceRanges([]);
  };

  const activeRouteFilterCount =
    selectedRouteStatuses.length +
    selectedRouteTypes.length +
    selectedDistanceRanges.length;

  const [routes, setRoutes] = useState<IntercityRouteDto[]>([]);
  const [totalRoutes, setTotalRoutes] = useState(0);
  const [allPrices, setAllPrices] = useState<IntercityRoutePriceDto[]>([]);
  const [categories, setCategories] = useState<VehicleCategoryDto[]>([]);

  // Route form modal state
  const [routeFormOpen, setRouteFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<IntercityRouteDto | null>(null);

  // Route detail modal state
  const [detailRoute, setDetailRoute] = useState<IntercityRouteDto | null>(null);
  const [detailRouteOpen, setDetailRouteOpen] = useState(false);

  // Price form modal state
  const [priceFormOpen, setPriceFormOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<IntercityRoutePriceDto | null>(null);
  const [priceRouteId, setPriceRouteId] = useState<number | null>(null);

  // Price detail modal state
  const [detailPrice, setDetailPrice] = useState<IntercityRoutePriceDto | null>(null);
  const [detailPriceOpen, setDetailPriceOpen] = useState(false);

  // Departure time modal state
  const [departureTimeModalOpen, setDepartureTimeModalOpen] = useState(false);
  const [departureTimeRouteId, setDepartureTimeRouteId] = useState<number | null>(null);
  const [departureTimeRouteName, setDepartureTimeRouteName] = useState("");

  // Prices tab route selector
  const [selectedPriceRouteId, setSelectedPriceRouteId] = useState<number | null>(null);

  // Shared routes state
  const [sharedRoutes, setSharedRoutes] = useState<SharedRouteDto[]>([]);
  const [sharedRouteModalOpen, setSharedRouteModalOpen] = useState(false);
  const [editingSharedRoute, setEditingSharedRoute] = useState<SharedRouteDto | null>(null);
  const [selectedSharedRouteForDetail, setSelectedSharedRouteForDetail] = useState<SharedRouteDto | null>(null);
  const [sharedRouteDetailOpen, setSharedRouteDetailOpen] = useState(false);

  // Shared offices state
  const [sharedOffices, setSharedOffices] = useState<SharedOfficeDto[]>([]);
  const [sharedOfficeModalOpen, setSharedOfficeModalOpen] = useState(false);
  const [editingSharedOffice, setEditingSharedOffice] = useState<SharedOfficeDto | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    if (type === "success") toast.success(message);
    else toast.danger(message);
  };

  const fetchCategories = async () => {
    try {
      const res = await getVehicleCategories();
      if (res.data?.content) setCategories(res.data.content);
    } catch { /* ignore */ }
  };

  const fetchRoutes = async (page = 0) => {
    setLoading(true);
    try {
      const res = await getIntercityRoutes(page, 200);
      if (res.data?.content) {
        setRoutes(res.data.content);
        setTotalRoutes(res.data.totalElements || res.data.content.length);
      }
    } catch {
      showToast("Không thể tải tuyến đường.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPricesForRoute = async (routeId: number | null) => {
    setLoading(true);
    try {
      const res = routeId != null
        ? await getIntercityRoutePrices(routeId)
        : await getAllIntercityRoutePrices();
      if (res.data) setAllPrices(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast("Không thể tải bảng giá.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedRoutes = async () => {
    try {
      const data = await getSharedRoutes();
      setSharedRoutes(data);
    } catch {
      showToast("Không thể tải tuyến xe ghép.", "error");
    }
  };

  const fetchSharedOffices = async () => {
    try {
      const data = await getSharedOffices();
      setSharedOffices(data);
    } catch {
      showToast("Không thể tải danh sách văn phòng.", "error");
    }
  };

  const handleDeleteSharedRoute = async (id: number) => {
    if (!window.confirm("Xóa tuyến xe ghép này?")) return;
    try {
      await deleteSharedRoute(id);
      showToast("Đã xóa tuyến xe ghép!", "success");
      fetchSharedRoutes();
    } catch {
      showToast("Xóa thất bại.", "error");
    }
  };

  const handleDeleteSharedOffice = async (id: number) => {
    if (!window.confirm("Xóa văn phòng này?")) return;
    try {
      await deleteSharedOffice(id);
      showToast("Đã xóa văn phòng!", "success");
      fetchSharedOffices();
    } catch {
      showToast("Xóa thất bại.", "error");
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        fetchRoutes(),
        fetchCategories(),
        fetchPricesForRoute(null),
        fetchSharedRoutes(),
        fetchSharedOffices(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);
  useEffect(() => { setRoutePage(1); }, [searchTerm, activeTab]);
  useEffect(() => {
    if (activeTab === "prices") {
      fetchPricesForRoute(selectedPriceRouteId);
    }
  }, [activeTab, selectedPriceRouteId]);

  // ── Routes CRUD ──
  const handleAddRoute = () => {
    setEditingRoute(null);
    setRouteFormOpen(true);
  };

  const handleEditRoute = (r: IntercityRouteDto) => {
    setEditingRoute(r);
    setRouteFormOpen(true);
  };

  const handleSaveRoute = async (payload: any) => {
    try {
      if (editingRoute?.id) {
        await updateIntercityRoute(editingRoute.id, payload);
        showToast("Đã cập nhật tuyến đường!", "success");
      } else {
        await createIntercityRoute(payload);
        showToast("Đã thêm tuyến đường!", "success");
      }
      setRouteFormOpen(false);
      fetchRoutes();
    } catch {
      showToast("Thao tác thất bại.", "error");
    }
  };

  const handleDeleteRoute = async (id: number) => {
    if (!window.confirm("Xóa tuyến đường này?")) return;
    try {
      await deleteIntercityRoute(id);
      showToast("Đã xóa!", "success");
      setRoutes(prev => prev.filter(r => r.id !== id));
      if (detailRoute?.id === id) {
        setDetailRouteOpen(false);
        setDetailRoute(null);
      }
    } catch {
      showToast("Xóa thất bại.", "error");
    }
  };

  const handleOpenRouteDetail = async (r: IntercityRouteDto) => {
    setDetailRoute(r);
    setDetailRouteOpen(true);
    await fetchPricesForRoute(r.id!);
  };

  // ── Prices CRUD ──
  const handleAddPrice = (routeId?: number) => {
    setEditingPrice(null);
    setPriceRouteId(routeId ?? selectedPriceRouteId ?? null);
    setPriceFormOpen(true);
  };

  const handleEditPrice = (p: IntercityRoutePriceDto) => {
    setEditingPrice(p);
    setPriceRouteId(p.routeId ?? null);
    setPriceFormOpen(true);
  };

  const handleOpenPriceDetail = (p: IntercityRoutePriceDto) => {
    setDetailPrice(p);
    setDetailPriceOpen(true);
  };

  const handleSavePrice = async (payload: any) => {
    try {
      if (editingPrice?.id) {
        await updateIntercityRoutePrice(editingPrice.id, payload);
        showToast("Đã cập nhật giá!", "success");
      } else {
        await createIntercityRoutePrice(payload);
        showToast("Đã thêm giá!", "success");
      }
      setPriceFormOpen(false);
      const activeRouteId = editingRoute?.id || detailRoute?.id || selectedPriceRouteId;
      await fetchPricesForRoute(activeRouteId);
    } catch {
      showToast("Thao tác thất bại.", "error");
    }
  };

  const handleDeletePrice = async (id: number) => {
    if (!window.confirm("Xóa giá này?")) return;
    try {
      await deleteIntercityRoutePrice(id);
      showToast("Đã xóa!", "success");
      setAllPrices(prev => prev.filter(p => p.id !== id));
    } catch {
      showToast("Xóa thất bại.", "error");
    }
  };

  const handleAdd = () => {
    if (activeTab === "routes") handleAddRoute();
    else if (activeTab === "prices") handleAddPrice();
    else if (activeTab === "shared_routes") {
      setEditingSharedRoute(null);
      setSharedRouteModalOpen(true);
    } else if (activeTab === "offices") {
      setEditingSharedOffice(null);
      setSharedOfficeModalOpen(true);
    }
  };

  // ── Helpers ──
  const getRouteName = (r: IntercityRouteDto | undefined) => {
    if (!r) return "N/A";
    const t = r.translations?.find(t => t.locale === "vi") || r.translations?.[0];
    return t?.name || `${r.originCity} ⇌ ${r.destinationCity}`;
  };

  const getCategoryName = (vc: VehicleCategoryDto | undefined) => {
    if (!vc) return "N/A";
    const t = vc.translations?.find(t => t.locale === "vi") || vc.translations?.[0];
    return t?.name || vc.code;
  };

  const getAddLabel = () => {
    if (activeTab === "routes") return "Thêm Tuyến Đường Riêng";
    if (activeTab === "prices") return "Thêm Bảng Giá Xe Riêng";
    if (activeTab === "shared_routes") return "Thêm Tuyến Xe Ghép";
    if (activeTab === "offices") return "Thêm Văn Phòng";
    return "Thêm";
  };



  // ── Routes tab: pagination + sort ──
  const [routeSort, setRouteSort] = useState<SortDescriptor>({ column: "id", direction: "ascending" });
  const [routePage, setRoutePage] = useState(1);

  const routeColumns = headerColumns.intercityRoutes(t);

  const filteredRoutes = useMemo(() => {
    const kw = searchTerm.toLowerCase();
    return routes.filter(r => {
      const name = getRouteName(r).toLowerCase();
      const matchSearch =
        name.includes(kw) ||
        r.originCity.toLowerCase().includes(kw) ||
        r.destinationCity.toLowerCase().includes(kw);

      const matchStatus =
        selectedRouteStatuses.length === 0 ||
        (selectedRouteStatuses.includes("active") && r.active) ||
        (selectedRouteStatuses.includes("inactive") && !r.active);

      const hasShared = r.linkedSharedRouteId != null;
      const matchType =
        selectedRouteTypes.length === 0 ||
        (selectedRouteTypes.includes("shared") && hasShared) ||
        (selectedRouteTypes.includes("private_only") && !hasShared);

      const dist = r.distanceKm ?? 0;
      const matchDistance =
        selectedDistanceRanges.length === 0 ||
        selectedDistanceRanges.some(range => {
          if (range === "<50") return dist < 50;
          if (range === "50-150") return dist >= 50 && dist <= 150;
          if (range === ">150") return dist > 150;
          return false;
        });

      return matchSearch && matchStatus && matchType && matchDistance;
    });
  }, [routes, searchTerm, selectedRouteStatuses, selectedRouteTypes, selectedDistanceRanges, language]);

  const sortedRoutes = useMemo(() => {
    const { column, direction } = routeSort;
    const dir = direction === "descending" ? -1 : 1;
    return [...filteredRoutes].sort((a, b) => {
      let cmp = 0;
      switch (column) {
        case "id": cmp = (a.id ?? 0) - (b.id ?? 0); break;
        case "name": cmp = getRouteName(a).localeCompare(getRouteName(b)); break;
        case "distance": cmp = (a.distanceKm ?? 0) - (b.distanceKm ?? 0); break;
        case "hours": cmp = (a.estimatedHours ?? 0) - (b.estimatedHours ?? 0); break;
        case "active": cmp = Number(a.active) - Number(b.active); break;
        default: cmp = 0;
      }
      return cmp * dir;
    });
  }, [filteredRoutes, routeSort]);

  const routePageCount = Math.max(1, Math.ceil(sortedRoutes.length / pageSize));
  const paginatedRoutes = useMemo(() => sortedRoutes.slice((routePage - 1) * pageSize, routePage * pageSize), [sortedRoutes, routePage, pageSize]);
  const routePages = Array.from({ length: routePageCount }, (_, i) => i + 1);
  const routeStart = sortedRoutes.length === 0 ? 0 : (routePage - 1) * pageSize + 1;
  const routeEnd = Math.min(routePage * pageSize, sortedRoutes.length);
  useEffect(() => { if (routePage > routePageCount) setRoutePage(routePageCount); }, [routePage, routePageCount]);

  // ── Prices tab: sort + local pagination ──
  const [priceSort, setPriceSort] = useState<SortDescriptor>({ column: "id", direction: "ascending" });
  const [pricePage, setPricePage] = useState(1);

  const priceColumns = headerColumns.intercityPrices(t);

  const filteredPrices = useMemo(() => {
    const kw = searchTerm.toLowerCase();
    return allPrices.filter(p => {
      const cat = categories.find(c => c.id === p.vehicleCategoryId);
      const matchesSearch = getCategoryName(cat).toLowerCase().includes(kw);
      if (selectedPriceRouteId != null) {
        return (p.routeId === selectedPriceRouteId || Number(p.scopeRefId) === selectedPriceRouteId) && matchesSearch;
      }
      return matchesSearch;
    });
  }, [allPrices, selectedPriceRouteId, searchTerm, categories]);

  const sortedPrices = useMemo(() => {
    const { column, direction } = priceSort;
    const dir = direction === "descending" ? -1 : 1;
    return [...filteredPrices].sort((a, b) => {
      let cmp = 0;
      switch (column) {
        case "id": cmp = (a.id ?? 0) - (b.id ?? 0); break;
        case "active": cmp = Number(a.active) - Number(b.active); break;
        default: cmp = 0;
      }
      return cmp * dir;
    });
  }, [filteredPrices, priceSort]);

  const pricePageCount = Math.max(1, Math.ceil(sortedPrices.length / pageSize));
  const paginatedPrices = useMemo(() => sortedPrices.slice((pricePage - 1) * pageSize, pricePage * pageSize), [sortedPrices, pricePage, pageSize]);
  const pricePages = Array.from({ length: pricePageCount }, (_, i) => i + 1);
  const priceStart = sortedPrices.length === 0 ? 0 : (pricePage - 1) * pageSize + 1;
  const priceEnd = Math.min(pricePage * pageSize, sortedPrices.length);
  useEffect(() => { if (pricePage > pricePageCount) setPricePage(pricePageCount); }, [pricePage, pricePageCount]);

  // Surcharges removed

  const renderTableFooter = (pages: number[], page: number, setPage: (v: number) => void, pageCount: number, start: number, end: number, total: number) => (
    <Table.Footer>
      <Pagination size="sm">
        <Pagination.Summary>{start} - {end} trên {total} kết quả</Pagination.Summary>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous isDisabled={page <= 1} onPress={() => setPage(Math.max(1, page - 1))}>
              <Pagination.PreviousIcon />
              Trước
            </Pagination.Previous>
          </Pagination.Item>
          {pages.map((p) => (
            <Pagination.Item key={p}>
              <Pagination.Link isActive={p === page} onPress={() => setPage(p)}>{p}</Pagination.Link>
            </Pagination.Item>
          ))}
          <Pagination.Item>
            <Pagination.Next isDisabled={page >= pageCount} onPress={() => setPage(Math.min(pageCount, page + 1))}>
              Sau
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>
    </Table.Footer>
  );

  const renderEmptyState = (icon: React.ReactNode, label: string) => (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      {icon}
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{label}</h3>
    </div>
  );

  const filteredSharedRoutes = useMemo(() => {
    const kw = (searchTerm || "").toLowerCase().trim();
    if (!Array.isArray(sharedRoutes)) return [];
    return sharedRoutes.filter(
      (r) =>
        Boolean(r && (
          (r.name && r.name.toLowerCase().includes(kw)) ||
          (r.vehicleName && r.vehicleName.toLowerCase().includes(kw))
        ))
    );
  }, [sharedRoutes, searchTerm]);

  const filteredOffices = useMemo(() => {
    const kw = (searchTerm || "").toLowerCase().trim();
    if (!Array.isArray(sharedOffices)) return [];
    return sharedOffices.filter(
      (o) =>
        Boolean(o && (
          (o.name && o.name.toLowerCase().includes(kw)) ||
          (o.city && o.city.toLowerCase().includes(kw)) ||
          (o.address && o.address.toLowerCase().includes(kw))
        ))
    );
  }, [sharedOffices, searchTerm]);

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
          <Route className="text-primary" size={26} />
          Quản lý Tuyến xe Liên tỉnh
        </h1>
        <p className="text-xs text-foreground/60 mt-1">
          Cấu hình danh sách tuyến đường liên tỉnh, bảng giá chi tiết theo loại xe và tuyến xe ghép.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-separator gap-6">
        <Tabs
          className="w-full"
          selectedKey={activeTab}
          onSelectionChange={(key) => { setActiveTab(key as TabKey); setSearchTerm(""); setRouteFormOpen(false); setPriceFormOpen(false); }}
        >
          <Tabs.List aria-label="Intercity tabs" className="">
            <Tabs.Tab id="routes">
              <span className="flex items-center gap-2">
                <Route size={16} />
                Tuyến xe riêng
              </span>
              <Tabs.Indicator className="bg-[#ffcc00a4]" />
            </Tabs.Tab>
            <Tabs.Tab id="prices">
              <span className="flex items-center gap-2">
                <DollarSign size={16} />
                Bảng giá xe riêng
              </span>
              <Tabs.Indicator className="bg-[#ffcc00a4]" />
            </Tabs.Tab>
            <Tabs.Tab id="shared_routes">
              <span className="flex items-center gap-2">
                <Bus size={16} />
                Tuyến xe ghép (Shared)
              </span>
              <Tabs.Indicator className="bg-[#ffcc00a4]" />
            </Tabs.Tab>
            <Tabs.Tab id="offices">
              <span className="flex items-center gap-2">
                <Building2 size={16} />
                Văn phòng đón/trả
              </span>
              <Tabs.Indicator className="bg-[#ffcc00a4]" />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border bg-white dark:bg-[var(--bg-card)] shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-grow max-w-xl">
            <SearchField name="search" value={searchTerm} onChange={(e: string) => setSearchTerm(e)} className="w-full sm:w-80 max-w-md">
              <SearchField.Group className="rounded-xl border border-border bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold h-10">
                <SearchField.SearchIcon />
                <SearchField.Input className="w-full" placeholder={
                  activeTab === "routes"
                    ? "Tìm tuyến xe riêng..."
                    : activeTab === "prices"
                      ? "Tìm loại xe..."
                      : activeTab === "shared_routes"
                        ? "Tìm tuyến xe ghép..."
                        : "Tìm văn phòng, thành phố..."
                } />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>

            {activeTab === "routes" && (
              <Popover>
                <Button
                  type="button"
                  variant="outline"
                  className={`rounded-xl font-bold text-xs h-10 px-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 cursor-pointer ${
                    activeRouteFilterCount > 0 ? "border-accent/60 bg-accent/5 text-accent dark:text-accent font-extrabold" : ""
                  }`}
                >
                  <Filter size={15} className={activeRouteFilterCount > 0 ? "text-accent" : "text-slate-500"} />
                  <span>{t.common.filter}</span>
                  {activeRouteFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-black flex items-center justify-center">
                      {activeRouteFilterCount}
                    </span>
                  )}
                </Button>
                <Popover.Content
                  placement="bottom start"
                  className="w-80 p-0 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
                >
                  <Popover.Dialog className="p-4 space-y-4 outline-none max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Filter size={15} className="text-accent" />
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {t.common.filterTitle}
                        </span>
                        {activeRouteFilterCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold text-[10px]">
                            {activeRouteFilterCount}
                          </span>
                        )}
                      </div>
                      {activeRouteFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={resetRouteFilters}
                          className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                        >
                          {t.common.filterReset}
                        </button>
                      )}
                    </div>

                    {/* Trạng thái hoạt động */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                        Trạng thái
                      </span>
                      <div className="space-y-1">
                        <Checkbox
                          isSelected={selectedRouteStatuses.includes("active")}
                          onChange={() => toggleRouteStatus("active")}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>Đang hoạt động</span>
                          </Checkbox.Content>
                        </Checkbox>
                        <Checkbox
                          isSelected={selectedRouteStatuses.includes("inactive")}
                          onChange={() => toggleRouteStatus("inactive")}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>Tạm dừng</span>
                          </Checkbox.Content>
                        </Checkbox>
                      </div>
                    </div>

                    {/* Loại hình phục vụ */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                        Loại hình dịch vụ
                      </span>
                      <div className="space-y-1">
                        <Checkbox
                          isSelected={selectedRouteTypes.includes("shared")}
                          onChange={() => toggleRouteType("shared")}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>Có vé xe ghép (Shared)</span>
                          </Checkbox.Content>
                        </Checkbox>
                        <Checkbox
                          isSelected={selectedRouteTypes.includes("private_only")}
                          onChange={() => toggleRouteType("private_only")}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>Chỉ xe riêng</span>
                          </Checkbox.Content>
                        </Checkbox>
                      </div>
                    </div>

                    {/* Khoảng cách */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                        Khoảng cách lộ trình
                      </span>
                      <div className="space-y-1">
                        <Checkbox
                          isSelected={selectedDistanceRanges.includes("<50")}
                          onChange={() => toggleDistanceRange("<50")}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>Dưới 50 km</span>
                          </Checkbox.Content>
                        </Checkbox>
                        <Checkbox
                          isSelected={selectedDistanceRanges.includes("50-150")}
                          onChange={() => toggleDistanceRange("50-150")}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>50 - 150 km</span>
                          </Checkbox.Content>
                        </Checkbox>
                        <Checkbox
                          isSelected={selectedDistanceRanges.includes(">150")}
                          onChange={() => toggleDistanceRange(">150")}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>Trên 150 km</span>
                          </Checkbox.Content>
                        </Checkbox>
                      </div>
                    </div>
                  </Popover.Dialog>
                </Popover.Content>
              </Popover>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PageSizeSelect
              value={pageSize}
              onChange={(size) => {
                setPageSize(size);
                setRoutePage(1);
                setPricePage(1);
              }}
            />
            <Button variant="outline" onClick={fetchAllData} className="font-bold text-xs h-10 px-4 rounded-xl cursor-pointer">
              <RefreshCw size={15} className="mr-1.5" />
              Làm mới
            </Button>
            <Button
              onClick={handleAdd}
              className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
            >
              <Plus size={16} />
              <span>{getAddLabel()}</span>
            </Button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeTab === "routes" && activeRouteFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 w-full">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              {t.common.appliedFilters}:
            </span>
            {selectedRouteStatuses.map((st) => (
              <span
                key={`rst-${st}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <span>{st === "active" ? "Đang hoạt động" : "Tạm dừng"}</span>
                <button
                  type="button"
                  onClick={() => toggleRouteStatus(st)}
                  className="w-3.5 h-3.5 rounded-full hover:bg-accent/20 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {selectedRouteTypes.map((tp) => (
              <span
                key={`rtp-${tp}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <span>{tp === "shared" ? "Có vé xe ghép" : "Chỉ xe riêng"}</span>
                <button
                  type="button"
                  onClick={() => toggleRouteType(tp)}
                  className="w-3.5 h-3.5 rounded-full hover:bg-accent/20 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {selectedDistanceRanges.map((d) => (
              <span
                key={`dist-${d}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <span>{d === "<50" ? "Dưới 50 km" : d === "50-150" ? "50 - 150 km" : "Trên 150 km"}</span>
                <button
                  type="button"
                  onClick={() => toggleDistanceRange(d)}
                  className="w-3.5 h-3.5 rounded-full hover:bg-accent/20 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={resetRouteFilters}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 underline transition-colors cursor-pointer ml-1"
            >
              {t.common.clearAll}
            </button>
          </div>
        )}
      </div>

      {/* Prices tab route selector */}
      {activeTab === "prices" && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-xl border bg-white dark:bg-[var(--bg-card)] shadow-xs">
          <span className="text-sm font-bold whitespace-nowrap text-slate-700 dark:text-slate-200">
            Lọc theo tuyến:
          </span>
          <Select
            className="w-full sm:w-80 md:w-96"
            selectedKey={selectedPriceRouteId != null ? String(selectedPriceRouteId) : "__all__"}
            onSelectionChange={(key) => {
              if (key === "__all__") {
                setSelectedPriceRouteId(null);
              } else if (key) {
                setSelectedPriceRouteId(Number(key));
              }
              setPricePage(1);
              setAllPrices([]);
            }}
          >
            <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-[var(--bg-surface)] text-sm h-[40px] cursor-pointer">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-border-secondary rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
              <ListBox>
                <ListBox.Item id="__all__" textValue="Tất cả tuyến" className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                  Tất cả tuyến
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {routes.map(r => (
                  <ListBox.Item key={r.id} id={String(r.id)} textValue={getRouteName(r)} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                    {getRouteName(r)}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      )}

      {/* Content */}
      <div className="bg-white dark:bg-black/10 rounded-2xl border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="md" className="mr-1.5" />
          </div>
        ) : activeTab === "routes" ? (
          <>

            {filteredRoutes.length === 0 ? (
              renderEmptyState(<Route className="text-slate-300 dark:text-slate-700 mb-4" size={48} />, "Không tìm thấy kết quả")
            ) : (
              <Table key="routes-table">
                <Table.ScrollContainer>
                  <Table.Content
                    aria-label="Routes table"
                    className="min-w-[700px] w-full"
                    sortDescriptor={routeSort}
                    onSortChange={setRouteSort}
                  >
                    <Table.Header>
                      {routeColumns.map((col) => (
                        <Table.Column
                          key={col.id}
                          id={col.id}
                          allowsSorting={col.sortable}
                          isRowHeader={col.isRowHeader}
                          className={col.id === "actions" ? "text-right" : undefined}
                        >
                          {col.sortable
                            ? ({ sortDirection }) => (<Table.SortableColumnHeader sortDirection={sortDirection}>{col.label}</Table.SortableColumnHeader>)
                            : col.label}
                        </Table.Column>
                      ))}
                    </Table.Header>
                    <Table.Body>
                      {paginatedRoutes.map((r) => (
                        <Table.Row key={r.id} id={String(r.id)}>
                          <Table.Cell>#{r.id}</Table.Cell>
                          <Table.Cell className="font-bold">{getRouteName(r)}</Table.Cell>
                          <Table.Cell>
                            {r.hasSharedRoute || r.linkedSharedRouteId ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <Bus size={13} /> Có vé xe ghép
                                </span>
                                {r.linkedSharedRouteId && (
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    ID ghép: #{r.linkedSharedRouteId}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Chưa liên kết</span>
                            )}
                          </Table.Cell>
                          <Table.Cell>{r.distanceKm ?? "N/A"}</Table.Cell>
                          <Table.Cell>{r.estimatedHours ?? "N/A"}</Table.Cell>
                          <Table.Cell>
                            <AppStatusChip status={r.active} />
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-right">
                            <RowActionButtons
                              className="justify-end"
                              onView={() => handleOpenRouteDetail(r)}
                              viewLabel="Xem chi tiết"
                              onEdit={() => handleEditRoute(r)}
                              editLabel="Chỉnh sửa"
                              onDelete={() => handleDeleteRoute(r.id!)}
                              deleteLabel="Xóa"
                            />
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
                {renderTableFooter(routePages, routePage, setRoutePage, routePageCount, routeStart, routeEnd, sortedRoutes.length)}
              </Table>
            )}
          </>
        ) : activeTab === "prices" ? (
          <>

            {filteredPrices.length === 0 ? (
              renderEmptyState(<DollarSign className="text-slate-300 dark:text-slate-700 mb-4" size={48} />, "Không có giá dịch vụ nào được tìm thấy")
            ) : (
              <Table key="prices-table">
                <Table.ScrollContainer>
                  <Table.Content
                    aria-label="Prices table"
                    className="min-w-[800px] w-full"
                    sortDescriptor={priceSort}
                    onSortChange={setPriceSort}
                  >
                    <Table.Header>
                      {priceColumns.map((col) => (
                        <Table.Column
                          key={col.id}
                          id={col.id}
                          allowsSorting={col.sortable}
                          isRowHeader={col.isRowHeader}
                          className={col.id === "actions" ? "text-right" : undefined}
                        >
                          {col.sortable
                            ? ({ sortDirection }) => (<Table.SortableColumnHeader sortDirection={sortDirection}>{col.label}</Table.SortableColumnHeader>)
                            : col.label}
                        </Table.Column>
                      ))}
                    </Table.Header>
                    <Table.Body>
                      {paginatedPrices.map((p) => {
                        const cat = categories.find((c) => c.id === p.vehicleCategoryId);
                        const r = routes.find((route) => route.id === (p.routeId || Number(p.scopeRefId)));
                        const isDaily = p.priceTypeCode === "DAILY_RATE" || p.priceTypeCategory === "DAILY_RATE";
                        const isRoundTripType = p.priceTypeCode === "ROUND_TRIP_SAME_DAY";
                        // One row = one price type: basePrice is that type's price.
                        const amount = Number(p.basePrice ?? 0);

                        return (
                          <Table.Row key={p.id} id={String(p.id)}>
                            <Table.Cell>#{p.id}</Table.Cell>
                            <Table.Cell className="font-bold">{getRouteName(r || routes[0])}</Table.Cell>
                            <Table.Cell>
                              <Chip size="sm" color="accent">{getCategoryName(cat)}</Chip>
                            </Table.Cell>
                            <Table.Cell>
                              {isDaily ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                  <Calendar size={12} /> Thuê theo ngày
                                </span>
                              ) : isRoundTripType ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                  <Clock size={12} /> Khứ hồi trong ngày
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                  <Clock size={12} /> Một chiều trong ngày
                                </span>
                              )}
                            </Table.Cell>
                            <Table.Cell className="font-black text-amber-500">
                              {amount > 0 ? (
                                <div className="flex flex-col">
                                  <span>
                                    {amount.toLocaleString()} {p.currency || "VND"}
                                    {isDaily ? "/ngày" : ""}
                                  </span>
                                  {isDaily && (
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      Tối thiểu {p.minDays ?? 1} ngày
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span>—</span>
                              )}
                            </Table.Cell>
                            <Table.Cell className="text-xs font-semibold">
                              {formatDepositPolicy(p, p.currency || "VND") ?? <span>—</span>}
                            </Table.Cell>
                            <Table.Cell>
                              <AppStatusChip status={p.active} />
                            </Table.Cell>
                            <Table.Cell className="px-6 py-4 text-right">
                              <RowActionButtons
                                className="justify-end"
                                onView={() => handleOpenPriceDetail(p)}
                                viewLabel="Xem chi tiết"
                                onEdit={() => handleEditPrice(p)}
                                editLabel="Chỉnh sửa"
                                onDelete={() => handleDeletePrice(p.id!)}
                                deleteLabel="Xóa"
                              />
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
                {renderTableFooter(pricePages, pricePage, setPricePage, pricePageCount, priceStart, priceEnd, sortedPrices.length)}
              </Table>
            )}
          </>
        ) : activeTab === "shared_routes" ? (
          <>
            {filteredSharedRoutes.length === 0 ? (
              renderEmptyState(<Bus className="text-slate-300 dark:text-slate-700 mb-4" size={48} />, "Chưa có tuyến xe ghép nào")
            ) : (
              <Table key="shared-routes-table">
                <Table.ScrollContainer>
                  <Table.Content aria-label="Shared routes table" className="min-w-[800px] w-full">
                    <Table.Header>
                      <Table.Column id="id" isRowHeader>ID</Table.Column>
                      <Table.Column id="name">Tên tuyến</Table.Column>
                      <Table.Column id="vehicle">Dòng xe</Table.Column>
                      <Table.Column id="outbound">Chiều đi (OUTBOUND)</Table.Column>
                      <Table.Column id="return">Chiều về (RETURN)</Table.Column>
                      <Table.Column id="status">Trạng thái</Table.Column>
                      <Table.Column id="actions" className="text-right">Thao tác</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {filteredSharedRoutes.map((r) => {
                        const outDir = r.directions?.find((d) => d.directionType === "OUTBOUND");
                        const retDir = r.directions?.find((d) => d.directionType === "RETURN");
                        return (
                          <Table.Row key={r.id} id={String(r.id)}>
                            <Table.Cell>#{r.id}</Table.Cell>
                            <Table.Cell className="font-bold text-slate-800 dark:text-slate-100">{r.name}</Table.Cell>
                            <Table.Cell className="text-xs font-semibold">{r.vehicleName || "Dcar Limousine"}</Table.Cell>
                            <Table.Cell>
                              {outDir ? (
                                <div className="flex flex-col gap-0.5 text-xs">
                                  <span className="font-bold text-accent">
                                    {Number(outDir.price).toLocaleString()} VND/vé
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {outDir.originCity} ➔ {outDir.destinationCity} ({outDir.distanceKm || "—"} km)
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {outDir.schedules?.length || 0} giờ chạy • {outDir.originOffices?.length || 0} VP đón
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              {retDir ? (
                                <div className="flex flex-col gap-0.5 text-xs">
                                  <span className="font-bold text-accent">
                                    {Number(retDir.price).toLocaleString()} VND/vé
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {retDir.originCity} ➔ {retDir.destinationCity} ({retDir.distanceKm || "—"} km)
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {retDir.schedules?.length || 0} giờ chạy • {retDir.originOffices?.length || 0} VP đón
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              <AppStatusChip status={r.active} />
                            </Table.Cell>
                            <Table.Cell className="px-6 py-4 text-right">
                              <RowActionButtons
                                className="justify-end"
                                onView={() => {
                                  setSelectedSharedRouteForDetail(r);
                                  setSharedRouteDetailOpen(true);
                                }}
                                viewLabel={t.common?.details || "Xem chi tiết"}
                                onEdit={() => {
                                  setEditingSharedRoute(r);
                                  setSharedRouteModalOpen(true);
                                }}
                                editLabel="Chỉnh sửa"
                                onDelete={() => handleDeleteSharedRoute(r.id!)}
                                deleteLabel="Xóa"
                              />
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            )}
          </>
        ) : activeTab === "offices" ? (
          <>
            {filteredOffices.length === 0 ? (
              renderEmptyState(<Building2 className="text-slate-300 dark:text-slate-700 mb-4" size={48} />, "Chưa có văn phòng đón/trả nào")
            ) : (
              <Table key="offices-table">
                <Table.ScrollContainer>
                  <Table.Content aria-label="Offices table" className="min-w-[700px] w-full">
                    <Table.Header>
                      <Table.Column id="id" isRowHeader>ID</Table.Column>
                      <Table.Column id="name">Tên văn phòng</Table.Column>
                      <Table.Column id="city">Thành phố</Table.Column>
                      <Table.Column id="address">Địa chỉ</Table.Column>
                      <Table.Column id="coords">Tọa độ</Table.Column>
                      <Table.Column id="status">Trạng thái</Table.Column>
                      <Table.Column id="actions" className="text-right">Thao tác</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {filteredOffices.map((o) => (
                        <Table.Row key={o.id} id={String(o.id)}>
                          <Table.Cell>#{o.id}</Table.Cell>
                          <Table.Cell className="font-bold text-slate-800 dark:text-slate-100">{o.name}</Table.Cell>
                          <Table.Cell className="text-xs font-semibold">{o.city}</Table.Cell>
                          <Table.Cell className="text-xs max-w-xs truncate">{o.address}</Table.Cell>
                          <Table.Cell className="text-xs font-mono text-slate-500">
                            {o.latitude != null && o.longitude != null
                              ? `${Number(o.latitude).toFixed(4)}, ${Number(o.longitude).toFixed(4)}`
                              : "—"}
                          </Table.Cell>
                          <Table.Cell>
                            <AppStatusChip status={o.active} />
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-right">
                            <RowActionButtons
                              className="justify-end"
                              onEdit={() => {
                                setEditingSharedOffice(o);
                                setSharedOfficeModalOpen(true);
                              }}
                              editLabel="Chỉnh sửa"
                              onDelete={() => handleDeleteSharedOffice(o.id!)}
                              deleteLabel="Xóa"
                            />
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            )}
          </>
        ) : null}
      </div>

      {/* Shared Route Detail Modal */}
      {selectedSharedRouteForDetail && (
        <SharedRouteDetailModal
          isOpen={sharedRouteDetailOpen}
          onClose={() => {
            setSharedRouteDetailOpen(false);
            setSelectedSharedRouteForDetail(null);
          }}
          route={selectedSharedRouteForDetail}
          offices={sharedOffices}
          onEdit={() => {
            const toEdit = selectedSharedRouteForDetail;
            setSharedRouteDetailOpen(false);
            setSelectedSharedRouteForDetail(null);
            setEditingSharedRoute(toEdit);
            setSharedRouteModalOpen(true);
          }}
        />
      )}

      {/* Shared Route Modal */}
      {sharedRouteModalOpen && (
        <SharedRouteModal
          isOpen={sharedRouteModalOpen}
          onClose={() => {
            setSharedRouteModalOpen(false);
            setEditingSharedRoute(null);
          }}
          editingRoute={editingSharedRoute}
          offices={sharedOffices}
          onSaveSuccess={async () => {
            await fetchSharedRoutes();
            await fetchSharedOffices();
          }}
        />
      )}

      {/* Shared Office Modal */}
      {sharedOfficeModalOpen && (
        <SharedOfficeModal
          isOpen={sharedOfficeModalOpen}
          onClose={() => {
            setSharedOfficeModalOpen(false);
            setEditingSharedOffice(null);
          }}
          editingOffice={editingSharedOffice}
          onSaveSuccess={async () => {
            await fetchSharedOffices();
            await fetchSharedRoutes();
          }}
        />
      )}

      {/* Route Form Modal */}
      {routeFormOpen && (
        <RouteCreateUpdateModal
          isOpen={routeFormOpen}
          onClose={() => {
            setRouteFormOpen(false);
            setEditingRoute(null);
          }}
          editingRoute={editingRoute}
          onSave={handleSaveRoute}
          categories={categories}
          prices={allPrices}
          onAddPrice={handleAddPrice}
          onEditPrice={handleEditPrice}
          onDeletePrice={handleDeletePrice}
          onRefreshPrices={() => fetchPricesForRoute(null)}
        />
      )}

      {/* Route Detail Modal */}
      {detailRouteOpen && (
        <RouteDetailModal
          isOpen={detailRouteOpen}
          onClose={() => {
            setDetailRouteOpen(false);
            setDetailRoute(null);
          }}
          route={detailRoute}
          prices={allPrices}
          categories={categories}
          onEditRoute={() => {
            setDetailRouteOpen(false);
            handleEditRoute(detailRoute!);
          }}
        />
      )}

      {/* Price Form Modal */}
      {priceFormOpen && (
        <PriceCreateUpdateModal
          isOpen={priceFormOpen}
          onClose={() => setPriceFormOpen(false)}
          routeId={priceRouteId || undefined}
          editingPrice={editingPrice}
          categories={categories}
          routes={routes}
          onSave={handleSavePrice}
        />
      )}

      {/* Price Detail Modal */}
      {detailPriceOpen && (
        <PriceDetailModal
          isOpen={detailPriceOpen}
          onClose={() => {
            setDetailPriceOpen(false);
            setDetailPrice(null);
          }}
          price={detailPrice}
          routes={routes}
          categories={categories}
          onEdit={() => {
            setDetailPriceOpen(false);
            handleEditPrice(detailPrice!);
          }}
        />
      )}

      {/* Surcharges modals removed */}

      {/* Departure Time Modal */}
      {departureTimeRouteId && (
        <IntercityDepartureTimeModal
          routeId={departureTimeRouteId}
          routeName={departureTimeRouteName}
          isOpen={departureTimeModalOpen}
          onClose={() => {
            setDepartureTimeModalOpen(false);
            setDepartureTimeRouteId(null);
          }}
        />
      )}
    </div>
  );
}
