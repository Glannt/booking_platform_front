"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  Plane,
  Route,
  DollarSign,
  Eye,
  Edit3
} from "lucide-react";
import type { SortDescriptor } from "@heroui/react";
import { Button, Chip, Pagination, SearchField, Spinner, Table, Tabs, toast } from "@heroui/react";
import { StatusChip } from "@/components/StatusChip";
import clsx from "clsx";

import AirportRouteModal from "@/components/admin/vehicles/AirportRouteModal";
import AirportTransferModal from "@/components/admin/vehicles/AirportTransferModal";
import AirportModal from "@/components/admin/vehicles/AirportModal";

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

const PAGE_SIZE = 8;

export default function AirportTransferManagementPage() {
  const [activeTab, setActiveTab] = useState<"airports" | "routes" | "transfers">("airports");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [categories, setCategories] = useState<VehicleCategoryDto[]>([]);
  const [airports, setAirports] = useState<AirportDto[]>([]);
  const [routes, setRoutes] = useState<AirportRouteDto[]>([]);
  const [transfers, setTransfers] = useState<AirportTransferPrice[]>([]);

  const [airportModalOpen, setAirportModalOpen] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<AirportDto | null>(null);
  const [airportDefaultEditMode, setAirportDefaultEditMode] = useState(false);

  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<AirportRouteDto | null>(null);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
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
    if (activeTab === "airports") { setSelectedAirport(null); setAirportModalOpen(true); }
    else if (activeTab === "routes") { setSelectedRoute(null); setRouteModalOpen(true); }
    else { setSelectedTransfer(null); setTransferModalOpen(true); }
  };

  // ── Airports ──
  const [airportSort, setAirportSort] = useState<SortDescriptor>({ column: "id", direction: "ascending" });
  const [airportPage, setAirportPage] = useState(1);

  const airportColumns: ColumnInterface[] = [
    { id: "id", label: "ID", sortable: true, isRowHeader: true },
    { id: "code", label: "Mã", sortable: true },
    { id: "name", label: "Tên", sortable: true },
    { id: "location", label: "Vị trí", sortable: false },
    { id: "active", label: "Trạng thái", sortable: true },
    { id: "actions", label: "Thao tác", sortable: false },
  ];

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

  const airportPageCount = Math.max(1, Math.ceil(sortedAirports.length / PAGE_SIZE));
  const paginatedAirports = useMemo(() => sortedAirports.slice((airportPage - 1) * PAGE_SIZE, airportPage * PAGE_SIZE), [sortedAirports, airportPage]);
  const airportPages = Array.from({ length: airportPageCount }, (_, i) => i + 1);
  const airportStart = sortedAirports.length === 0 ? 0 : (airportPage - 1) * PAGE_SIZE + 1;
  const airportEnd = Math.min(airportPage * PAGE_SIZE, sortedAirports.length);
  useEffect(() => { if (airportPage > airportPageCount) setAirportPage(airportPageCount); }, [airportPage, airportPageCount]);

  // ── Routes ──
  const [routeSort, setRouteSort] = useState<SortDescriptor>({ column: "id", direction: "ascending" });
  const [routePage, setRoutePage] = useState(1);

  const routeColumns: ColumnInterface[] = [
    { id: "id", label: "ID", sortable: true, isRowHeader: true },
    { id: "code", label: "Mã tuyến", sortable: true },
    { id: "airport", label: "Sân bay", sortable: false },
    { id: "active", label: "Trạng thái", sortable: true },
    { id: "actions", label: "Thao tác", sortable: false },
  ];

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

  // ── Transfers ──
  const [transferSort, setTransferSort] = useState<SortDescriptor>({ column: "id", direction: "ascending" });
  const [transferPage, setTransferPage] = useState(1);

  const transferColumns: ColumnInterface[] = [
    { id: "id", label: "ID", sortable: true, isRowHeader: true },
    { id: "route", label: "Tuyến", sortable: true },
    { id: "category", label: "Loại xe", sortable: true },
    { id: "serviceType", label: "Loại chuyến", sortable: true },
    { id: "amount", label: "Giá", sortable: true },
    { id: "active", label: "Trạng thái", sortable: true },
    { id: "actions", label: "Thao tác", sortable: false },
  ];

  const filteredTransfers = useMemo(() => {
    const kw = searchTerm.toLowerCase();
    return transfers.filter(t => {
      const route = routes.find(r => r.id === t.airportRouteId);
      return (route?.code || "").toLowerCase().includes(kw)
        || t.serviceType.toLowerCase().includes(kw);
    });
  }, [transfers, routes, searchTerm]);

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
        case "serviceType": cmp = a.serviceType.localeCompare(b.serviceType); break;
        case "amount": cmp = a.amount - b.amount; break;
        case "active": cmp = Number(a.active) - Number(b.active); break;
        default: cmp = 0;
      }
      return cmp * dir;
    });
  }, [filteredTransfers, transferSort, routes, categories]);

  const transferPageCount = Math.max(1, Math.ceil(sortedTransfers.length / PAGE_SIZE));
  const paginatedTransfers = useMemo(() => sortedTransfers.slice((transferPage - 1) * PAGE_SIZE, transferPage * PAGE_SIZE), [sortedTransfers, transferPage]);
  const transferPages = Array.from({ length: transferPageCount }, (_, i) => i + 1);
  const transferStart = sortedTransfers.length === 0 ? 0 : (transferPage - 1) * PAGE_SIZE + 1;
  const transferEnd = Math.min(transferPage * PAGE_SIZE, sortedTransfers.length);
  useEffect(() => { if (transferPage > transferPageCount) setTransferPage(transferPageCount); }, [transferPage, transferPageCount]);

  return (
    <div className="w-full space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-black/10 gap-6">
        <Tabs
          className="w-full"
          selectedKey={activeTab}
          onSelectionChange={(key) => { setActiveTab(key as "airports" | "routes" | "transfers"); setSearchTerm(""); }}
        >
          <Tabs.ListContainer>
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
          </Tabs.ListContainer>
        </Tabs>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 p-6 rounded-2xl border">
        <SearchField name="search" value={searchTerm} onChange={(e: string) => setSearchTerm(e)} fullWidth className="min-w-[200px]">
          <SearchField.Group className="rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-black/10 text-slate-805 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold">
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
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw size={16} className="mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleAdd}>
            <Plus size={16} />
            {getAddLabel()}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-black/10 rounded-2xl border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="md" className="mr-1.5" />
          </div>
        ) : activeTab === "airports" ? (
          filteredAirports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <Plane className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Không tìm thấy kết quả</h3>
            </div>
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
                      <Table.Column key={col.id} id={col.id} allowsSorting={col.sortable} isRowHeader={col.isRowHeader}>
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
                        <Table.Cell>
                          <div className="flex gap-2">
                            <Button isIconOnly size="sm" variant="ghost" aria-label="Xem" onPress={() => { setSelectedAirport(a); setAirportDefaultEditMode(false); setAirportModalOpen(true); }}>
                              <Eye size={16} />
                            </Button>
                            <Button isIconOnly size="sm" variant="ghost" aria-label="Sửa" onPress={() => { setSelectedAirport(a); setAirportDefaultEditMode(true); setAirportModalOpen(true); }}>
                              <Edit3 size={16} />
                            </Button>
                            <Button isIconOnly size="sm" variant="ghost" aria-label="Xóa" onPress={() => handleDeleteAirport(a.id!)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
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
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <Route className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Không tìm thấy kết quả</h3>
            </div>
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
                        <Table.Cell className="font-bold">{r.code}</Table.Cell>
                        <Table.Cell>{r.airportName || "N/A"}</Table.Cell>
                        <Table.Cell>
                          <StatusChip status={String(r.active)} type="active" />
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex gap-2">
                            <Button isIconOnly size="sm" variant="ghost" aria-label="Xem" onPress={() => { setSelectedRoute(r); setRouteModalOpen(true); }}>
                              <Eye size={16} />
                            </Button>
                            <Button isIconOnly size="sm" variant="ghost" aria-label="Sửa" onPress={() => { setSelectedRoute(r); setRouteModalOpen(true); }}>
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
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <DollarSign className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Không tìm thấy kết quả</h3>
            </div>
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
                      <Table.Column key={col.id} id={col.id} allowsSorting={col.sortable} isRowHeader={col.isRowHeader}>
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
                          <Table.Cell>{t.serviceType === "ROUND_TRIP" ? "Khứ hồi" : "Một chiều"}</Table.Cell>
                          <Table.Cell className="font-black text-amber-500">{t.amount > 0 ? `${t.amount.toLocaleString()} ${t.currency}` : "—"}</Table.Cell>
                          <Table.Cell>
                            <StatusChip status={String(t.active)} type="active" />
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex gap-2">
                              <Button isIconOnly size="sm" variant="ghost" aria-label="Xem" onPress={() => { setSelectedTransfer(t); setTransferModalOpen(true); }}>
                                <Eye size={16} />
                              </Button>
                              <Button isIconOnly size="sm" variant="ghost" aria-label="Sửa" onPress={() => { setSelectedTransfer(t); setTransferModalOpen(true); }}>
                                <Edit3 size={16} />
                              </Button>
                              <Button isIconOnly size="sm" variant="ghost" aria-label="Xóa" onPress={() => handleDeleteTransfer(t.id!)}>
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
      <AirportRouteModal isOpen={routeModalOpen} onClose={() => { setRouteModalOpen(false); setSelectedRoute(null); }} route={selectedRoute} airports={airports} onSaveSuccess={fetchData} showToast={showToast} />
      <AirportTransferModal isOpen={transferModalOpen} onClose={() => { setTransferModalOpen(false); setSelectedTransfer(null); }} transfer={selectedTransfer} routes={routes} categories={categories} onSaveSuccess={fetchData} showToast={showToast} />
    </div>
  );
}
