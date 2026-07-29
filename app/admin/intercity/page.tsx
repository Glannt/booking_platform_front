"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  Route,
  DollarSign,
  Calendar,
  Edit3,
  Clock,
  Eye,
} from "lucide-react";
import { RouteFormModal } from "@/components/admin/intercity/RouteFormModal";
import { RouteDetailModal } from "@/components/admin/intercity/RouteDetailModal";
import { PriceFormModal } from "@/components/admin/intercity/PriceFormModal";
import { SurchargeFormModal } from "@/components/admin/intercity/SurchargeFormModal";
import { PriceDetailModal } from "@/components/admin/intercity/PriceDetailModal";
import { SurchargeDetailModal } from "@/components/admin/intercity/SurchargeDetailModal";
import type { SortDescriptor } from "@heroui/react";
import { Button, Checkbox, Chip, Input, Label, ListBox, Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalHeader, ModalBody, NumberField, Pagination, SearchField, Select, Spinner, Switch, Table, Tabs, TextField, toast, Typography } from "@heroui/react";
import clsx from "clsx";

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
  getIntercitySurcharges,
  createIntercitySurcharge,
  updateIntercitySurcharge,
  deleteIntercitySurcharge,
  getSurchargesByRoute,
  assignSurchargeToRoute,
  unassignSurchargeFromRoute,
  IntercityRouteDto,
  IntercityRoutePriceDto,
  IntercitySeasonalSurchargeDto,
} from "@/lib/api/rental";

import { getVehicleCategories, VehicleCategoryDto } from "@/lib/api/fleet";
import MultiImageUpload from "@/components/MultiImageUpload";
import { backendUrl } from "@/lib/api/client";
import { IntercityDepartureTimeModal } from "@/components/admin/vehicles/IntercityDepartureTimeModal";

import { ColumnInterface } from "@/lib/interface/column.interface";

const PAGE_SIZE = 8;

type TabKey = "routes" | "prices" | "surcharges";

export default function IntercityManagementPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("routes");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [routes, setRoutes] = useState<IntercityRouteDto[]>([]);
  const [totalRoutes, setTotalRoutes] = useState(0);
  const [allPrices, setAllPrices] = useState<IntercityRoutePriceDto[]>([]);
  const [surcharges, setSurcharges] = useState<IntercitySeasonalSurchargeDto[]>([]);
  const [totalSurcharges, setTotalSurcharges] = useState(0);
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

  // Surcharge form modal state
  const [surchargeFormOpen, setSurchargeFormOpen] = useState(false);
  const [editingSurcharge, setEditingSurcharge] = useState<IntercitySeasonalSurchargeDto | null>(null);

  // Surcharge assign/unassign state
  const [assignedSurcharges, setAssignedSurcharges] = useState<IntercitySeasonalSurchargeDto[]>([]);
  const [unassignedSurcharges, setUnassignedSurcharges] = useState<IntercitySeasonalSurchargeDto[]>([]);

  // Price detail modal state
  const [detailPrice, setDetailPrice] = useState<IntercityRoutePriceDto | null>(null);
  const [detailPriceOpen, setDetailPriceOpen] = useState(false);

  // Surcharge detail modal state
  const [detailSurcharge, setDetailSurcharge] = useState<IntercitySeasonalSurchargeDto | null>(null);
  const [detailSurchargeOpen, setDetailSurchargeOpen] = useState(false);

  // Departure time modal state
  const [departureTimeModalOpen, setDepartureTimeModalOpen] = useState(false);
  const [departureTimeRouteId, setDepartureTimeRouteId] = useState<number | null>(null);
  const [departureTimeRouteName, setDepartureTimeRouteName] = useState("");

  // Prices tab route selector
  const [selectedPriceRouteId, setSelectedPriceRouteId] = useState<number | null>(null);

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

  const fetchSurcharges = async (page = 0) => {
    setLoading(true);
    try {
      const res = await getIntercitySurcharges(page, 200);
      console.log("fetchSurcharges raw res:", res);
      if (res.data?.content) {
        console.log("fetchSurcharges content:", res.data.content);
        setSurcharges(res.data.content);
        setTotalSurcharges(res.data.totalElements || res.data.content.length);
      } else {
        console.log("fetchSurcharges: res.data?.content is falsy. res.data:", res.data);
      }
    } catch (err) {
      console.error("fetchSurcharges error:", err);
      showToast("Không thể tải phụ thu.", "error");
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

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([fetchRoutes(), fetchSurcharges(), fetchCategories()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);
  useEffect(() => { setRoutePage(1); setSurchargePage(1); }, [searchTerm, activeTab]);
  useEffect(() => {
    if (activeTab === "prices") {
      fetchPricesForRoute(selectedPriceRouteId);
    }
  }, [activeTab, selectedPriceRouteId]);

  // Fetch assigned/unassigned surcharges when editingRoute changes
  useEffect(() => {
    if (editingRoute?.id) {
      getSurchargesByRoute(editingRoute.id).then(res => {
        const assigned = res.data || [];
        setAssignedSurcharges(assigned);
        const assignedIds = new Set(assigned.map(s => s.id));
        setUnassignedSurcharges(surcharges.filter(s => !assignedIds.has(s.id)));
      }).catch(() => {
        setAssignedSurcharges([]);
        setUnassignedSurcharges(surcharges);
      });
    }
  }, [editingRoute?.id, surcharges]);

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

  // ── Surcharges CRUD ──
  const handleAddSurcharge = (routeId?: number) => {
    setEditingSurcharge(null);
    setSurchargeFormOpen(true);
  };

  const handleEditSurcharge = (s: IntercitySeasonalSurchargeDto) => {
    setEditingSurcharge(s);
    setSurchargeFormOpen(true);
  };

  const handleOpenSurchargeDetail = (s: IntercitySeasonalSurchargeDto) => {
    setDetailSurcharge(s);
    setDetailSurchargeOpen(true);
  };

  const handleSaveSurcharge = async (payload: any) => {
    try {
      if (editingSurcharge?.id) {
        await updateIntercitySurcharge(editingSurcharge.id, payload);
        showToast("Đã cập nhật phụ thu!", "success");
      } else {
        await createIntercitySurcharge(payload);
        showToast("Đã thêm phụ thu!", "success");
      }
      setSurchargeFormOpen(false);
      fetchSurcharges();
    } catch {
      showToast("Thao tác thất bại.", "error");
    }
  };

  const handleDeleteSurcharge = async (id: number) => {
    if (!window.confirm("Xóa phụ thu này?")) return;
    try {
      await deleteIntercitySurcharge(id);
      showToast("Đã xóa!", "success");
      setSurcharges(prev => prev.filter(s => s.id !== id));
    } catch {
      showToast("Xóa thất bại.", "error");
    }
  };

  // ── Surcharge Assign/Unassign ──
  const handleAssignSurcharge = async (surchargeId: number) => {
    if (!editingRoute?.id) return;
    try {
      await assignSurchargeToRoute(surchargeId, editingRoute.id);
      showToast("Đã gán phụ thu!", "success");
      const res = await getSurchargesByRoute(editingRoute.id);
      const assigned = res.data || [];
      setAssignedSurcharges(assigned);
      const assignedIds = new Set(assigned.map(s => s.id));
      setUnassignedSurcharges(surcharges.filter(s => !assignedIds.has(s.id)));
    } catch {
      showToast("Gán phụ thu thất bại.", "error");
    }
  };

  const handleUnassignSurcharge = async (surchargeId: number) => {
    if (!editingRoute?.id) return;
    try {
      await unassignSurchargeFromRoute(surchargeId, editingRoute.id);
      showToast("Đã bỏ gán phụ thu!", "success");
      const res = await getSurchargesByRoute(editingRoute.id);
      const assigned = res.data || [];
      setAssignedSurcharges(assigned);
      const assignedIds = new Set(assigned.map(s => s.id));
      setUnassignedSurcharges(surcharges.filter(s => !assignedIds.has(s.id)));
    } catch {
      showToast("Bỏ gán thất bại.", "error");
    }
  };

  const handleAdd = () => {
    if (activeTab === "routes") handleAddRoute();
    else if (activeTab === "prices") handleAddPrice();
    else handleAddSurcharge();
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
    if (activeTab === "routes") return "Thêm Tuyến Đường";
    if (activeTab === "prices") return "Thêm Giá";
    return "Thêm Phụ Thu";
  };



  // ── Routes tab: pagination + sort ──
  const [routeSort, setRouteSort] = useState<SortDescriptor>({ column: "id", direction: "ascending" });
  const [routePage, setRoutePage] = useState(1);

  const routeColumns: ColumnInterface[] = [
    { id: "id", label: "ID", sortable: true, isRowHeader: true },
    { id: "name", label: "Tên", sortable: true },
    { id: "distance", label: "Khoảng cách (km)", sortable: true },
    { id: "hours", label: "Thời gian (h)", sortable: true },
    { id: "active", label: "Trạng thái", sortable: true },
    { id: "actions", label: "Thao tác", sortable: false },
  ];

  const filteredRoutes = useMemo(() => {
    const kw = searchTerm.toLowerCase();
    return routes.filter(r => {
      const name = getRouteName(r).toLowerCase();
      return name.includes(kw) || r.originCity.toLowerCase().includes(kw) || r.destinationCity.toLowerCase().includes(kw);
    });
  }, [routes, searchTerm]);

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

  const routePageCount = Math.max(1, Math.ceil(sortedRoutes.length / PAGE_SIZE));
  const paginatedRoutes = useMemo(() => sortedRoutes.slice((routePage - 1) * PAGE_SIZE, routePage * PAGE_SIZE), [sortedRoutes, routePage]);
  const routePages = Array.from({ length: routePageCount }, (_, i) => i + 1);
  const routeStart = sortedRoutes.length === 0 ? 0 : (routePage - 1) * PAGE_SIZE + 1;
  const routeEnd = Math.min(routePage * PAGE_SIZE, sortedRoutes.length);
  useEffect(() => { if (routePage > routePageCount) setRoutePage(routePageCount); }, [routePage, routePageCount]);

  // ── Prices tab: sort + local pagination ──
  const [priceSort, setPriceSort] = useState<SortDescriptor>({ column: "id", direction: "ascending" });
  const [pricePage, setPricePage] = useState(1);

  const priceColumns: ColumnInterface[] = [
    { id: "id", label: "ID", sortable: true, isRowHeader: true },
    { id: "route", label: "Tuyến đường", sortable: false },
    { id: "category", label: "Loại xe", sortable: false },
    { id: "oneWay", label: "Giá 1 chiều", sortable: true },
    { id: "roundTrip", label: "Giá khứ hồi", sortable: true },
    { id: "active", label: "Trạng thái", sortable: true },
    { id: "actions", label: "Thao tác", sortable: false },
  ];

  const filteredPrices = useMemo(() => {
    const kw = searchTerm.toLowerCase();
    return allPrices.filter(p => {
      const cat = categories.find(c => c.id === p.vehicleCategoryId);
      const matchesSearch = getCategoryName(cat).toLowerCase().includes(kw);
      if (selectedPriceRouteId != null) {
        return p.routeId === selectedPriceRouteId && matchesSearch;
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
        case "oneWay": cmp = a.oneWayAmount - b.oneWayAmount; break;
        case "roundTrip": cmp = a.roundTripAmount - b.roundTripAmount; break;
        case "active": cmp = Number(a.active) - Number(b.active); break;
        default: cmp = 0;
      }
      return cmp * dir;
    });
  }, [filteredPrices, priceSort]);

  const pricePageCount = Math.max(1, Math.ceil(sortedPrices.length / PAGE_SIZE));
  const paginatedPrices = useMemo(() => sortedPrices.slice((pricePage - 1) * PAGE_SIZE, pricePage * PAGE_SIZE), [sortedPrices, pricePage]);
  const pricePages = Array.from({ length: pricePageCount }, (_, i) => i + 1);
  const priceStart = sortedPrices.length === 0 ? 0 : (pricePage - 1) * PAGE_SIZE + 1;
  const priceEnd = Math.min(pricePage * PAGE_SIZE, sortedPrices.length);
  useEffect(() => { if (pricePage > pricePageCount) setPricePage(pricePageCount); }, [pricePage, pricePageCount]);

  // ── Surcharges tab: pagination + sort ──
  const [surchargeSort, setSurchargeSort] = useState<SortDescriptor>({ column: "id", direction: "ascending" });
  const [surchargePage, setSurchargePage] = useState(1);

  const surchargeColumns: ColumnInterface[] = [
    { id: "id", label: "ID", sortable: true, isRowHeader: true },
    { id: "season", label: "Tên mùa", sortable: true },
    { id: "startDate", label: "Ngày bắt đầu", sortable: true },
    { id: "endDate", label: "Ngày kết thúc", sortable: true },
    { id: "percent", label: "Phụ thu (%)", sortable: true },
    { id: "active", label: "Trạng thái", sortable: true },
    { id: "actions", label: "Thao tác", sortable: false },
  ];

  const filteredSurcharges = useMemo(() => {
    const kw = searchTerm.toLowerCase();
    console.log("filtering surcharges. surcharges state:", surcharges, "kw:", kw);
    const result = surcharges.filter(s => (s.seasonName || "").toLowerCase().includes(kw));
    console.log("filtering surcharges result:", result);
    return result;
  }, [surcharges, searchTerm]);

  const sortedSurcharges = useMemo(() => {
    const { column, direction } = surchargeSort;
    const dir = direction === "descending" ? -1 : 1;
    return [...filteredSurcharges].sort((a, b) => {
      let cmp = 0;
      switch (column) {
        case "id": cmp = (a.id ?? 0) - (b.id ?? 0); break;
        case "season": cmp = a.seasonName.localeCompare(b.seasonName); break;
        case "startDate": cmp = a.startDate.localeCompare(b.startDate); break;
        case "endDate": cmp = a.endDate.localeCompare(b.endDate); break;
        case "percent": cmp = a.surchargePercent - b.surchargePercent; break;
        case "active": cmp = Number(a.active) - Number(b.active); break;
        default: cmp = 0;
      }
      return cmp * dir;
    });
  }, [filteredSurcharges, surchargeSort]);

  const surchargePageCount = Math.max(1, Math.ceil(sortedSurcharges.length / PAGE_SIZE));
  const paginatedSurcharges = useMemo(() => sortedSurcharges.slice((surchargePage - 1) * PAGE_SIZE, surchargePage * PAGE_SIZE), [sortedSurcharges, surchargePage]);
  const surchargePages = Array.from({ length: surchargePageCount }, (_, i) => i + 1);
  const surchargeStart = sortedSurcharges.length === 0 ? 0 : (surchargePage - 1) * PAGE_SIZE + 1;
  const surchargeEnd = Math.min(surchargePage * PAGE_SIZE, sortedSurcharges.length);
  useEffect(() => { if (surchargePage > surchargePageCount) setSurchargePage(surchargePageCount); }, [surchargePage, surchargePageCount]);

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

  return (
    <div className="w-full space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-black/10 gap-6">
        <Tabs
          className="w-full"
          selectedKey={activeTab}
          onSelectionChange={(key) => { setActiveTab(key as TabKey); setSearchTerm(""); setRouteFormOpen(false); setPriceFormOpen(false); setSurchargeFormOpen(false); }}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Intercity tabs" className="dark:bg-black/10 border">
              <Tabs.Tab id="routes">
                <span className="flex items-center gap-2">
                  <Route size={16} />
                  Tuyến đường
                </span>
                <Tabs.Indicator className="bg-[#ffcc00a4]" />
              </Tabs.Tab>
              <Tabs.Tab id="prices">
                <span className="flex items-center gap-2">
                  <DollarSign size={16} />
                  Bảng giá
                </span>
                <Tabs.Indicator className="bg-[#ffcc00a4]" />
              </Tabs.Tab>
              <Tabs.Tab id="surcharges">
                <span className="flex items-center gap-2">
                  <Calendar size={16} />
                  Phụ thu theo mùa
                </span>
                <Tabs.Indicator className="bg-[#ffcc00a4]" />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 p-6 rounded-2xl border">
        <SearchField name="search" value={searchTerm} onChange={(e: string) => setSearchTerm(e)} fullWidth className="min-w-[200px]">
          <SearchField.Group className="rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-black/10 text-slate-805 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold">
            <SearchField.SearchIcon />
            <SearchField.Input className="w-full" placeholder={
              activeTab === "routes"
                ? "Tìm tuyến đường..."
                : activeTab === "prices"
                  ? "Tìm loại xe..."
                  : "Tìm mùa..."
            } />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchAllData}>
            <RefreshCw size={16} className="mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleAdd}>
            <Plus size={16} />
            {getAddLabel()}
          </Button>
        </div>
      </div>

      {/* Prices tab route selector */}
      {activeTab === "prices" && (
        <div className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-black/10">
          <span className="text-sm font-bold whitespace-nowrap">Tuyến đường:</span>
          <Select
            fullWidth
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
            <Select.Trigger className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-sm h-[38px]">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
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
              <Table>
                <Table.ScrollContainer>
                  <Table.Content
                    aria-label="Routes table"
                    className="min-w-[700px]"
                    sortDescriptor={routeSort}
                    onSortChange={setRouteSort}
                  >
                    <Table.Header>
                      {routeColumns.map((col) => (
                        <Table.Column key={col.id} id={col.id} allowsSorting={col.sortable} isRowHeader={col.isRowHeader}>
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
                          <Table.Cell>{r.distanceKm ?? "N/A"}</Table.Cell>
                          <Table.Cell>{r.estimatedHours ?? "N/A"}</Table.Cell>
                          <Table.Cell>
                            <Chip size="sm" color={r.active ? "success" : "warning"}>
                              {r.active ? "Hoạt động" : "Ngưng"}
                            </Chip>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex gap-2">
                              <Button isIconOnly size="sm" variant="ghost" aria-label="Xem chi tiết" onPress={() => handleOpenRouteDetail(r)}>
                                <Eye size={16} />
                              </Button>
                              <Button isIconOnly size="sm" variant="ghost" aria-label="Sửa" onPress={() => handleEditRoute(r)}>
                                <Edit3 size={16} />
                              </Button>
                              <Button isIconOnly size="sm" variant="ghost" aria-label="Xóa" onPress={() => handleDeleteRoute(r.id!)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
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
              <Table>
                <Table.ScrollContainer>
                  <Table.Content
                    aria-label="Prices table"
                    className="min-w-[800px]"
                    sortDescriptor={priceSort}
                    onSortChange={setPriceSort}
                  >
                    <Table.Header>
                      {priceColumns.map((col) => (
                        <Table.Column key={col.id} id={col.id} allowsSorting={col.sortable} isRowHeader={col.isRowHeader}>
                          {col.sortable
                            ? ({ sortDirection }) => (<Table.SortableColumnHeader sortDirection={sortDirection}>{col.label}</Table.SortableColumnHeader>)
                            : col.label}
                        </Table.Column>
                      ))}
                    </Table.Header>
                    <Table.Body>
                      {paginatedPrices.map((p) => {
                        const cat = categories.find(c => c.id === p.vehicleCategoryId);
                        return (
                          <Table.Row key={p.id} id={String(p.id)}>
                            <Table.Cell>#{p.id}</Table.Cell>
                            <Table.Cell className="font-bold">{getRouteName(routes.find(r => r.id === p.routeId) || routes[0])}</Table.Cell>
                            <Table.Cell>
                              <Chip size="sm" color="accent">{getCategoryName(cat)}</Chip>
                            </Table.Cell>
                            <Table.Cell className="font-black text-amber-500">{p.oneWayAmount > 0 ? `${p.oneWayAmount.toLocaleString()} ${p.currency}` : "—"}</Table.Cell>
                            <Table.Cell className="font-black text-amber-500">{p.roundTripAmount > 0 ? `${p.roundTripAmount.toLocaleString()} ${p.currency}` : "—"}</Table.Cell>
                            <Table.Cell>
                              <Chip size="sm" color={p.active ? "success" : "warning"}>
                                {p.active ? "Hoạt động" : "Ngưng"}
                              </Chip>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex gap-2">
                                <Button isIconOnly size="sm" variant="ghost" aria-label="Xem chi tiết" onPress={() => handleOpenPriceDetail(p)}>
                                  <Eye size={16} />
                                </Button>
                                <Button isIconOnly size="sm" variant="ghost" aria-label="Sửa" onPress={() => handleEditPrice(p)}>
                                  <Edit3 size={16} />
                                </Button>
                                <Button isIconOnly size="sm" variant="ghost" aria-label="Xóa" onPress={() => handleDeletePrice(p.id!)}>
                                  <Trash2 size={16} />
                                </Button>
                              </div>
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
        ) : (
          <>
            
            {filteredSurcharges.length === 0 ? (
              renderEmptyState(<Calendar className="text-slate-300 dark:text-slate-700 mb-4" size={48} />, "Không tìm thấy kết quả")
            ) : (
              <Table>
                <Table.ScrollContainer>
                  <Table.Content
                    aria-label="Surcharges table"
                    className="min-w-[800px]"
                    sortDescriptor={surchargeSort}
                    onSortChange={setSurchargeSort}
                  >
                    <Table.Header>
                      {surchargeColumns.map((col) => (
                        <Table.Column key={col.id} id={col.id} allowsSorting={col.sortable} isRowHeader={col.isRowHeader}>
                          {col.sortable
                            ? ({ sortDirection }) => (<Table.SortableColumnHeader sortDirection={sortDirection}>{col.label}</Table.SortableColumnHeader>)
                            : col.label}
                        </Table.Column>
                      ))}
                    </Table.Header>
                    <Table.Body>
                      {paginatedSurcharges.map((s) => (
                        <Table.Row key={s.id} id={String(s.id)}>
                          <Table.Cell>#{s.id}</Table.Cell>
                          <Table.Cell className="font-bold">{s.seasonName}</Table.Cell>
                          <Table.Cell>{s.startDate?.substring(0, 10)}</Table.Cell>
                          <Table.Cell>{s.endDate?.substring(0, 10)}</Table.Cell>
                          <Table.Cell className="font-black text-amber-500">{s.surchargePercent}%</Table.Cell>
                          <Table.Cell>
                            <Chip size="sm" color={s.active ? "success" : "warning"}>
                              {s.active ? "Hoạt động" : "Ngưng"}
                            </Chip>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex gap-2">
                              <Button isIconOnly size="sm" variant="ghost" aria-label="Xem chi tiết" onPress={() => handleOpenSurchargeDetail(s)}>
                                <Eye size={16} />
                              </Button>
                              <Button isIconOnly size="sm" variant="ghost" aria-label="Sửa" onPress={() => handleEditSurcharge(s)}>
                                <Edit3 size={16} />
                              </Button>
                              <Button isIconOnly size="sm" variant="ghost" aria-label="Xóa" onPress={() => handleDeleteSurcharge(s.id!)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
                {renderTableFooter(surchargePages, surchargePage, setSurchargePage, surchargePageCount, surchargeStart, surchargeEnd, sortedSurcharges.length)}
              </Table>
            )}
          </>
        )}
      </div>

      {/* Route Form Modal */}
      {routeFormOpen && (
        <RouteFormModal
          isOpen={routeFormOpen}
          onClose={() => setRouteFormOpen(false)}
          editingRoute={editingRoute}
          onSave={handleSaveRoute}
          categories={categories}
          prices={allPrices}
          surcharges={surcharges}
          onAddPrice={handleAddPrice}
          onEditPrice={handleEditPrice}
          onDeletePrice={handleDeletePrice}
          onAddSurcharge={handleAddSurcharge}
          onEditSurcharge={handleEditSurcharge}
          onDeleteSurcharge={handleDeleteSurcharge}
          assignedSurcharges={assignedSurcharges}
          unassignedSurcharges={unassignedSurcharges}
          onAssignSurcharge={handleAssignSurcharge}
          onUnassignSurcharge={handleUnassignSurcharge}
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
          surcharges={surcharges}
          categories={categories}
          onEditRoute={() => {
            setDetailRouteOpen(false);
            handleEditRoute(detailRoute!);
          }}
        />
      )}

      {/* Price Form Modal */}
      {priceFormOpen && (
        <PriceFormModal
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

      {/* Surcharge Form Modal */}
      {surchargeFormOpen && (
        <SurchargeFormModal
          isOpen={surchargeFormOpen}
          onClose={() => setSurchargeFormOpen(false)}
          editingSurcharge={editingSurcharge}
          routes={routes}
          onSave={handleSaveSurcharge}
        />
      )}

      {/* Surcharge Detail Modal */}
      {detailSurchargeOpen && (
        <SurchargeDetailModal
          isOpen={detailSurchargeOpen}
          onClose={() => {
            setDetailSurchargeOpen(false);
            setDetailSurcharge(null);
          }}
          surcharge={detailSurcharge}
          routes={routes}
          onEdit={() => {
            setDetailSurchargeOpen(false);
            handleEditSurcharge(detailSurcharge!);
          }}
        />
      )}

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
