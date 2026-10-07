"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  RefreshCw,
  Plane,
  Route,
  DollarSign
} from "lucide-react";
import type { SortDescriptor } from "@heroui/react";
import { Button, Chip, Pagination, SearchField, Spinner, Table, Tabs, toast } from "@heroui/react";
import { StatusChip } from "@/components/StatusChip";
import clsx from "clsx";

import {
  AirportModal,
  AirportRouteCreateUpdateModal,
  AirportRouteDetailModal,
  AirportTransferCreateUpdateModal,
  AirportTransferDetailModal,
} from "@/components/admin/vehicles";

import {
  getVehicleCategories,
  VehicleCategoryDto,
  getAirportRoutes,
  deleteAirportRoute,
  getAirportTransfers,
  deleteAirportTransfer,
  AirportRouteDto,
  AirportTransferPrice,
  AirportDto,
  getAirports,
  deleteAirport
} from "@/lib/api/fleet";

import { ColumnInterface } from "@/lib/interface/column.interface";
import { useI18n } from "@/context/LanguageContext";
import { headerColumns } from "@/config/headerColumns";
import PageSizeSelect from "@/components/common/PageSizeSelect";
import { TableEmptyState, RowActionButtons } from "@/components/common";

export default function AirportTransferManagementPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"airports" | "routes" | "transfers">("airports");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);

  const [categories, setCategories] = useState<VehicleCategoryDto[]>([]);
  const [airports, setAirports] = useState<AirportDto[]>([]);
  const [routes, setRoutes] = useState<AirportRouteDto[]>([]);
  const [transfers, setTransfers] = useState<AirportTransferPrice[]>([]);

  const [airportModalOpen, setAirportModalOpen] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<AirportDto | null>(null);
  const [airportDefaultEditMode, setAirportDefaultEditMode] = useState(false);

  const [routeDetailOpen, setRouteDetailOpen] = useState(false);
  const [routeFormOpen, setRouteFormOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<AirportRouteDto | null>(null);

  const [transferDetailOpen, setTransferDetailOpen] = useState(false);
  const [transferFormOpen, setTransferFormOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<AirportTransferPrice | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    if (type === "success") toast.success(message);
    else toast.danger(message);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, airRes, routeRes, transferRes] = await Promise.allSettled([
        getVehicleCategories(),
        getAirports(),
        getAirportRoutes(),
        getAirportTransfers(),
      ]);

      if (catRes.status === "fulfilled" && catRes.value.data?.content) setCategories(catRes.value.data.content);
      if (airRes.status === "fulfilled" && airRes.value.data) setAirports((airRes.value.data as any).content || airRes.value.data);
      if (routeRes.status === "fulfilled" && routeRes.value.data) setRoutes((routeRes.value.data as any).content || routeRes.value.data);
      if (transferRes.status === "fulfilled" && transferRes.value.data) {
        setTransfers((transferRes.value.data as any).content || transferRes.value.data);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => { setAirportPage(1); setRoutePage(1); setTransferPage(1); }, [searchTerm, activeTab]);

  const handleDeleteAirport = async (id: number) => {
    if (!window.confirm("Xóa sân bay này?")) return;
    try {
      await deleteAirport(id);
      showToast("Đã xóa!", "success");
      setAirports(prev => prev.filter(a => a.id !== id));
    } catch { showToast("Xóa thất bại.", "error"); }
  };

  const handleDeleteRoute = async (id: number) => {
    if (!window.confirm("Xóa tuyến đường này?")) return;
    try {
      await deleteAirportRoute(id);
      showToast("Đã xóa!", "success");
      setRoutes(prev => prev.filter(r => r.id !== id));
    } catch { showToast("Xóa thất bại.", "error"); }
  };

  const handleDeleteTransfer = async (id: number) => {
    if (!window.confirm("Xóa cấu hình này?")) return;
    try {
      await deleteAirportTransfer(id);
      showToast("Đã xóa!", "success");
      setTransfers(prev => prev.filter(t => t.id !== id));
    } catch { showToast("Xóa thất bại.", "error"); }
  };

  const getCategoryName = (vc: VehicleCategoryDto | undefined) => {
    if (!vc) return "Chưa phân loại";
    const trans = vc.translations?.find(t => t.locale === "vi") || vc.translations?.[0];
    return trans?.name || vc.code;
  };

  const getAddLabel = () => {
    if (activeTab === "airports") return "Thêm Sân Bay";
    if (activeTab === "routes") return "Thêm Tuyến Đường";
    return "Thêm Giá Vé";
  };

  const handleAdd = () => {
    if (activeTab === "airports") { setSelectedAirport(null); setAirportDefaultEditMode(true); setAirportModalOpen(true); }
    else if (activeTab === "routes") { setSelectedRoute(null); setRouteFormOpen(true); }
    else { setSelectedTransfer(null); setTransferFormOpen(true); }
  };

  const getRouteAirportDisplay = (r: AirportRouteDto) => {
    const matched = r.airportId
      ? airports.find(a => a.id === r.airportId)
      : airports.find(a => a.code && r.code?.toUpperCase().includes(a.code.toUpperCase()));
    if (matched) {
      return `${matched.name} (${matched.code})`;
    }
    return r.airportName || "N/A";
  };

  const getRouteDistanceDisplay = (r: AirportRouteDto) => {
    if (r.distanceKm != null && r.distanceKm > 0) {
      return `${r.distanceKm} km`;
    }
    const matchedPrice = transfers.find(t => t.airportRouteId === r.id);
    if (matchedPrice?.baseKm) {
      return `${matchedPrice.baseKm} km (Cơ bản)`;
    }
    return "—";
  };

  const getRouteDepositDisplay = (r: AirportRouteDto) => {
    if (r.depositType === "FIXED") {
      return r.depositAmount ? `${r.depositAmount.toLocaleString()} VND (Cố định)` : "Cố định";
    }
    if (r.depositType === "PERCENT") {
      return `${r.depositRate}%`;
    }
    return "—";
  };

  const getTransferDepositDisplay = (tr: AirportTransferPrice) => {
    if (tr.depositType === "FIXED") {
      return tr.depositAmount ? `${tr.depositAmount.toLocaleString()} VND (Cố định)` : "Cố định";
    }
    if (tr.depositType === "PERCENT") {
      return `${tr.depositRate}%`;
    }
    // Inherit from route (only when the route actually configured a policy)
    const route = routes.find(r => r.id === tr.airportRouteId);
    if (route?.depositType) {
      const rateStr = route.depositType === "FIXED"
        ? (route.depositAmount ? `${route.depositAmount.toLocaleString()} VND` : "Cố định")
        : `${route.depositRate}%`;
      return (
        <span className="text-foreground/70">
          {rateStr} <span className="text-[10px] text-primary font-bold">(kế thừa tuyến)</span>
        </span>
      );
    }
    return "—";
  };

  // ── Airports ──
  const [airportSort, setAirportSort] = useState<SortDescriptor>({ column: "id", direction: "ascending" });
  const [airportPage, setAirportPage] = useState(1);

  const airportColumns = headerColumns.airports(t);

  const filteredAirports = useMemo(() => {
    const kw = searchTerm.toLowerCase();
    return airports.filter(a =>
      a.code.toLowerCase().includes(kw) || a.name.toLowerCase().includes(kw)
    );
  }, [airports, searchTerm]);

  const sortedAirports = useMemo(() => {
    const { column, direction } = airportSort;
    const dir = direction === "descending" ? -1 : 1;
    return [...filteredAirports].sort((a, b) => {
      let cmp = 0;
      switch (column) {
        case "id": cmp = (a.id ?? 0) - (b.id ?? 0); break;
        case "code": cmp = a.code.localeCompare(b.code); break;
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "active": cmp = Number(a.active) - Number(b.active); break;
        default: cmp = 0;
      }
      return cmp * dir;
    });
  }, [filteredAirports, airportSort]);

  const airportPageCount = Math.max(1, Math.ceil(sortedAirports.length / pageSize));
  const paginatedAirports = useMemo(() => sortedAirports.slice((airportPage - 1) * pageSize, airportPage * pageSize), [sortedAirports, airportPage, pageSize]);
  const airportPages = Array.from({ length: airportPageCount }, (_, i) => i + 1);
  const airportStart = sortedAirports.length === 0 ? 0 : (airportPage - 1) * pageSize + 1;
  const airportEnd = Math.min(airportPage * pageSize, sortedAirports.length);
  useEffect(() => { if (airportPage > airportPageCount) setAirportPage(airportPageCount); }, [airportPage, airportPageCount]);

  // ── Routes ──
  const [routeSort, setRouteSort] = useState<SortDescriptor>({ column: "id", direction: "ascending" });
  const [routePage, setRoutePage] = useState(1);

  const routeColumns = headerColumns.airportRoutes(t);

  const filteredRoutes = useMemo(() => {
    const kw = searchTerm.toLowerCase();
    return routes.filter(r => r.code.toLowerCase().includes(kw));
  }, [routes, searchTerm]);

  const sortedRoutes = useMemo(() => {
    const { column, direction } = routeSort;
    const dir = direction === "descending" ? -1 : 1;
    return [...filteredRoutes].sort((a, b) => {
      let cmp = 0;
      switch (column) {
        case "id": cmp = (a.id ?? 0) - (b.id ?? 0); break;
        case "code": cmp = a.code.localeCompare(b.code); break;
        case "distanceKm": cmp = (a.distanceKm ?? 0) - (b.distanceKm ?? 0); break;
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

  // ── Transfers ──
  const [transferSort, setTransferSort] = useState<SortDescriptor>({ column: "id", direction: "ascending" });
  const [transferPage, setTransferPage] = useState(1);

  const transferColumns = headerColumns.airportTransfers(t);

  const filteredTransfers = useMemo(() => {
    const kw = searchTerm.toLowerCase();
    return transfers.filter(t => {
      const route = routes.find(r => r.id === t.airportRouteId);
      return (route?.code || "").toLowerCase().includes(kw)
        || getCategoryName(categories.find(c => c.id === t.vehicleCategoryId)).toLowerCase().includes(kw);
    });
  }, [transfers, routes, searchTerm, categories]);

  const sortedTransfers = useMemo(() => {
    const { column, direction } = transferSort;
    const dir = direction === "descending" ? -1 : 1;
    return [...filteredTransfers].sort((a, b) => {
      let cmp = 0;
      switch (column) {
        case "id": cmp = (a.id ?? 0) - (b.id ?? 0); break;
        case "route": {
          const ra = routes.find(r => r.id === a.airportRouteId);
          const rb = routes.find(r => r.id === b.airportRouteId);
          cmp = (ra?.code || "").localeCompare(rb?.code || "");
          break;
        }
        case "category": {
          const ca = categories.find(c => c.id === a.vehicleCategoryId);
          const cb = categories.find(c => c.id === b.vehicleCategoryId);
          cmp = getCategoryName(ca).localeCompare(getCategoryName(cb));
          break;
        }
        case "baseKm": cmp = (a.baseKm ?? 0) - (b.baseKm ?? 0); break;
        case "baseAmount": cmp = (a.baseAmount ?? 0) - (b.baseAmount ?? 0); break;
        case "perKmAmount": cmp = (a.perKmAmount ?? 0) - (b.perKmAmount ?? 0); break;
        case "active": cmp = Number(a.active) - Number(b.active); break;
        default: cmp = 0;
      }
      return cmp * dir;
    });
  }, [filteredTransfers, transferSort, routes, categories]);

  const transferPageCount = Math.max(1, Math.ceil(sortedTransfers.length / pageSize));
  const paginatedTransfers = useMemo(() => sortedTransfers.slice((transferPage - 1) * pageSize, transferPage * pageSize), [sortedTransfers, transferPage, pageSize]);
  const transferPages = Array.from({ length: transferPageCount }, (_, i) => i + 1);
  const transferStart = sortedTransfers.length === 0 ? 0 : (transferPage - 1) * pageSize + 1;
  const transferEnd = Math.min(transferPage * pageSize, sortedTransfers.length);
  useEffect(() => { if (transferPage > transferPageCount) setTransferPage(transferPageCount); }, [transferPage, transferPageCount]);

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
          <Plane className="text-primary" size={26} />
          Đưa đón Sân bay
        </h1>
        <p className="text-xs text-foreground/60 mt-1">
          Quản lý danh sách sân bay, cấu hình tuyến đường và bảng giá xe đưa đón sân bay.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-separator gap-6">
        <Tabs
          className="w-full"
          selectedKey={activeTab}
          onSelectionChange={(key) => { setActiveTab(key as "airports" | "routes" | "transfers"); setSearchTerm(""); }}
        >
          <Tabs.List aria-label="Airport transfer tabs" className="dark:bg-black/10 border">
            <Tabs.Tab id="airports">
              <span className="flex items-center gap-2">
                <Plane size={16} />
                Sân bay
              </span>
              <Tabs.Indicator className="bg-[#ffcc00a4]" />
            </Tabs.Tab>
            <Tabs.Tab id="routes">
              <span className="flex items-center gap-2">
                <Route size={16} />
                Tuyến đường
              </span>
              <Tabs.Indicator className="bg-[#ffcc00a4]" />
            </Tabs.Tab>
            <Tabs.Tab id="transfers">
              <span className="flex items-center gap-2">
                <DollarSign size={16} />
                Bảng giá
              </span>
              <Tabs.Indicator className="bg-[#ffcc00a4]" />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 p-6 rounded-2xl border">
        <SearchField name="search" value={searchTerm} onChange={(e: string) => setSearchTerm(e)} fullWidth className="min-w-[200px]">
          <SearchField.Group className="rounded-xl border border-border bg-slate-50 dark:bg-black/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold">
            <SearchField.SearchIcon />
            <SearchField.Input className="w-full" placeholder={
              activeTab === "airports"
                ? "Tìm sân bay..."
                : activeTab === "routes"
                  ? "Tìm tuyến đường..."
                  : "Tìm bảng giá..."
            } />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <PageSizeSelect
          value={pageSize}
          onChange={(size) => {
            setPageSize(size);
            setAirportPage(1);
            setRoutePage(1);
            setTransferPage(1);
          }}
        />
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw size={16} className="mr-2" />
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

      {/* Content */}
      <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-separator overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="md" className="mr-1.5" />
          </div>
        ) : activeTab === "airports" ? (
          filteredAirports.length === 0 ? (
            <TableEmptyState
              icon={Plane}
              title="Không tìm thấy kết quả"
            />
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content
                  aria-label="Airports table"
                  className="min-w-[700px]"
                  sortDescriptor={airportSort}
                  onSortChange={setAirportSort}
                >
                  <Table.Header>
                    {airportColumns.map((col) => (
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
                    {paginatedAirports.map((a) => (
                      <Table.Row key={a.id} id={String(a.id)}>
                        <Table.Cell>#{a.id}</Table.Cell>
                        <Table.Cell><span className="font-mono text-sm bg-slate-100 dark:bg-[var(--bg-page)] px-2 py-0.5 rounded font-bold">{a.code}</span></Table.Cell>
                        <Table.Cell className="font-bold">{a.name}</Table.Cell>
                        <Table.Cell>{a.location || "N/A"}</Table.Cell>
                        <Table.Cell>
                          <StatusChip status={String(a.active)} type="active" />
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4 text-right">
                          <RowActionButtons
                            className="justify-end"
                            onView={() => { setSelectedAirport(a); setAirportDefaultEditMode(false); setAirportModalOpen(true); }}
                            viewLabel="Xem chi tiết"
                            onEdit={() => { setSelectedAirport(a); setAirportDefaultEditMode(true); setAirportModalOpen(true); }}
                            editLabel="Chỉnh sửa"
                            onDelete={() => handleDeleteAirport(a.id!)}
                            deleteLabel="Xóa"
                          />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
              <Table.Footer>
                <Pagination size="sm">
                  <Pagination.Summary>{airportStart} - {airportEnd} trên {sortedAirports.length} kết quả</Pagination.Summary>
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.Previous isDisabled={airportPage <= 1} onPress={() => setAirportPage(p => Math.max(1, p - 1))}>
                        <Pagination.PreviousIcon />
                        Trước
                      </Pagination.Previous>
                    </Pagination.Item>
                    {airportPages.map((p) => (
                      <Pagination.Item key={p}>
                        <Pagination.Link isActive={p === airportPage} onPress={() => setAirportPage(p)}>{p}</Pagination.Link>
                      </Pagination.Item>
                    ))}
                    <Pagination.Item>
                      <Pagination.Next isDisabled={airportPage >= airportPageCount} onPress={() => setAirportPage(p => Math.min(airportPageCount, p + 1))}>
                        Sau
                        <Pagination.NextIcon />
                      </Pagination.Next>
                    </Pagination.Item>
                  </Pagination.Content>
                </Pagination>
              </Table.Footer>
            </Table>
          )
        ) : activeTab === "routes" ? (
          filteredRoutes.length === 0 ? (
            <TableEmptyState
              icon={Route}
              title="Không tìm thấy kết quả"
            />
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content
                  aria-label="Routes table"
                  className="min-w-[600px]"
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
                        <Table.Cell className="font-bold">{r.code}</Table.Cell>
                        <Table.Cell className="font-medium text-foreground">{getRouteAirportDisplay(r)}</Table.Cell>
                        <Table.Cell>{getRouteDistanceDisplay(r)}</Table.Cell>
                        <Table.Cell>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/40">
                            {getRouteDepositDisplay(r)}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <StatusChip status={String(r.active)} type="active" />
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4 text-right">
                          <RowActionButtons
                            className="justify-end"
                            onView={() => { setSelectedRoute(r); setRouteDetailOpen(true); }}
                            viewLabel="Xem chi tiết"
                            onEdit={() => { setSelectedRoute(r); setRouteFormOpen(true); }}
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
              <Table.Footer>
                <Pagination size="sm">
                  <Pagination.Summary>{routeStart} to {routeEnd} of {sortedRoutes.length} results</Pagination.Summary>
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.Previous isDisabled={routePage <= 1} onPress={() => setRoutePage(p => Math.max(1, p - 1))}>
                        <Pagination.PreviousIcon />
                        Trước
                      </Pagination.Previous>
                    </Pagination.Item>
                    {routePages.map((p) => (
                      <Pagination.Item key={p}>
                        <Pagination.Link isActive={p === routePage} onPress={() => setRoutePage(p)}>{p}</Pagination.Link>
                      </Pagination.Item>
                    ))}
                    <Pagination.Item>
                      <Pagination.Next isDisabled={routePage >= routePageCount} onPress={() => setRoutePage(p => Math.min(routePageCount, p + 1))}>
                        Sau
                        <Pagination.NextIcon />
                      </Pagination.Next>
                    </Pagination.Item>
                  </Pagination.Content>
                </Pagination>
              </Table.Footer>
            </Table>
          )
        ) : (
          filteredTransfers.length === 0 ? (
            <TableEmptyState
              icon={DollarSign}
              title="Không tìm thấy kết quả"
            />
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content
                  aria-label="Transfer prices table"
                  className="min-w-[900px]"
                  sortDescriptor={transferSort}
                  onSortChange={setTransferSort}
                >
                  <Table.Header>
                    {transferColumns.map((col) => (
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
                    {paginatedTransfers.map((t) => {
                      const route = routes.find(r => r.id === t.airportRouteId);
                      const cat = categories.find(c => c.id === t.vehicleCategoryId);
                      return (
                        <Table.Row key={t.id} id={String(t.id)}>
                          <Table.Cell>#{t.id}</Table.Cell>
                          <Table.Cell className="font-bold">{route?.code || `#${t.airportRouteId}`}</Table.Cell>
                          <Table.Cell>
                            <Chip size="sm" color="accent">{getCategoryName(cat)}</Chip>
                          </Table.Cell>
                          <Table.Cell>{t.baseKm != null ? `${t.baseKm.toLocaleString()} km` : "—"}</Table.Cell>
                          <Table.Cell className="text-xs">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              +{t.zoneBufferKm ?? 2} km
                            </span>
                            <span className="text-foreground/50 block text-[10px]">
                              (đến {((t.baseKm ?? 0) + (t.zoneBufferKm ?? 2)).toFixed(1)} km)
                            </span>
                          </Table.Cell>
                          <Table.Cell className="font-black text-amber-500">{t.baseAmount > 0 ? `${t.baseAmount.toLocaleString()} ${t.currency}` : "—"}</Table.Cell>
                          <Table.Cell className="text-xs">
                            {t.fixedOvercharge ? (
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {`Cố định: ${t.feeOverchargeFixed?.toLocaleString() || "100.000"} ${t.currency}`}
                              </span>
                            ) : (
                              <span className="font-bold text-amber-500">
                                {`${t.perKmAmount?.toLocaleString() || "0"} ${t.currency}/km`}
                              </span>
                            )}
                          </Table.Cell>
                          <Table.Cell className="text-xs font-semibold">
                            {getTransferDepositDisplay(t)}
                          </Table.Cell>
                          <Table.Cell>
                            <StatusChip status={String(t.active)} type="active" />
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-right">
                            <RowActionButtons
                              className="justify-end"
                              onView={() => { setSelectedTransfer(t); setTransferDetailOpen(true); }}
                              viewLabel="Xem chi tiết"
                              onEdit={() => { setSelectedTransfer(t); setTransferFormOpen(true); }}
                              editLabel="Chỉnh sửa"
                              onDelete={() => handleDeleteTransfer(t.id!)}
                              deleteLabel="Xóa"
                            />
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
              <Table.Footer>
                <Pagination size="sm">
                  <Pagination.Summary>{transferStart} to {transferEnd} of {sortedTransfers.length} results</Pagination.Summary>
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.Previous isDisabled={transferPage <= 1} onPress={() => setTransferPage(p => Math.max(1, p - 1))}>
                        <Pagination.PreviousIcon />
                        Trước
                      </Pagination.Previous>
                    </Pagination.Item>
                    {transferPages.map((p) => (
                      <Pagination.Item key={p}>
                        <Pagination.Link isActive={p === transferPage} onPress={() => setTransferPage(p)}>{p}</Pagination.Link>
                      </Pagination.Item>
                    ))}
                    <Pagination.Item>
                      <Pagination.Next isDisabled={transferPage >= transferPageCount} onPress={() => setTransferPage(p => Math.min(transferPageCount, p + 1))}>
                        Sau
                        <Pagination.NextIcon />
                      </Pagination.Next>
                    </Pagination.Item>
                  </Pagination.Content>
                </Pagination>
              </Table.Footer>
            </Table>
          )
        )}
      </div>

      <AirportModal isOpen={airportModalOpen} onClose={() => { setAirportModalOpen(false); setSelectedAirport(null); setAirportDefaultEditMode(false); }} airport={selectedAirport} onSaveSuccess={fetchData} showToast={showToast} defaultEditMode={airportDefaultEditMode} />
      
      {/* Route Modals */}
      {selectedRoute && (
        <AirportRouteDetailModal
          isOpen={routeDetailOpen}
          onClose={() => {
            setRouteDetailOpen(false);
            setSelectedRoute(null);
          }}
          route={selectedRoute}
          airports={airports}
          categories={categories}
          routes={routes}
          onEdit={() => {
            setRouteDetailOpen(false);
            setRouteFormOpen(true);
          }}
          onPriceChanged={fetchData}
          showToast={showToast}
        />
      )}
      <AirportRouteCreateUpdateModal
        isOpen={routeFormOpen}
        onClose={() => {
          setRouteFormOpen(false);
          setSelectedRoute(null);
        }}
        route={selectedRoute}
        airports={airports}
        onSaveSuccess={fetchData}
        showToast={showToast}
      />

      {/* Transfer Modals */}
      {selectedTransfer && (
        <AirportTransferDetailModal
          isOpen={transferDetailOpen}
          onClose={() => {
            setTransferDetailOpen(false);
            setSelectedTransfer(null);
          }}
          transfer={selectedTransfer}
          routes={routes}
          categories={categories}
          onEdit={() => {
            setTransferDetailOpen(false);
            setTransferFormOpen(true);
          }}
        />
      )}
      <AirportTransferCreateUpdateModal
        isOpen={transferFormOpen}
        onClose={() => {
          setTransferFormOpen(false);
          setSelectedTransfer(null);
        }}
        transfer={selectedTransfer}
        routes={routes}
        categories={categories}
        onSaveSuccess={fetchData}
        showToast={showToast}
      />
    </div>
  );
}
