"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  Car,
  KeyRound,
  Edit3,
  Eye,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { SortDescriptor } from "@heroui/react";
import {
  Button,
  Chip,
  Pagination,
  SearchField,
  Select,
  ListBox,
  Spinner,
  Switch,
  Table,
  toast,
} from "@heroui/react";
import clsx from "clsx";

import { StatusChip } from "@/components/StatusChip";
import {
  getAdminRentals,
  createRental,
  updateRental,
  deleteRental,
  getRentalPricesByRental,
  createRentalPrice,
  updateRentalPrice,
  type RentalDto,
  type RentalPriceDto,
} from "@/lib/api/rental";
import { getVehicleCategories, getVehicles, type VehicleCategoryDto, type VehicleDto } from "@/lib/api/fleet";
import { formatPriceSync } from "@/lib/format";
import { useI18n } from "@/context/LanguageContext";
import { ColumnInterface } from "@/lib/interface/column.interface";

import { SelfDriveFormModal } from "@/components/admin/self-drive/SelfDriveFormModal";
import { SelfDriveDeleteModal } from "@/components/admin/self-drive/SelfDriveDeleteModal";
import { SelfDriveDetailModal } from "@/components/admin/self-drive/SelfDriveDetailModal";

const PAGE_SIZE = 8;

interface RentalWithDetails extends RentalDto {
  category?: VehicleCategoryDto;
  vehiclesCount?: number;
  prices?: RentalPriceDto[];
}

const columns: ColumnInterface[] = [
  { id: "id", label: "ID", sortable: true, isRowHeader: true },
  { id: "category", label: "Phân khúc xe", sortable: true },
  { id: "vehicles", label: "Số lượng xe", sortable: false },
  { id: "deposit", label: "Tiền cọc", sortable: true },
  { id: "minimumDays", label: "Số ngày tối thiểu", sortable: true },
  { id: "price", label: "Giá thuê / ngày", sortable: false },
  { id: "status", label: "Trạng thái", sortable: false },
  { id: "actions", label: "Thao tác", sortable: false },
];

export default function AdminSelfDrivePage() {
  const { language } = useI18n();
  const [rentals, setRentals] = useState<RentalDto[]>([]);
  const [categories, setCategories] = useState<VehicleCategoryDto[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [pricesMap, setPricesMap] = useState<Record<number, RentalPriceDto[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<RentalDto | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRental, setDetailRental] = useState<RentalWithDetails | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [rentalsRes, catRes, vehRes] = await Promise.all([
        getAdminRentals(0, 100),
        getVehicleCategories({ active: true }, { skipTranslationFilter: true }),
        getVehicles(),
      ]);

      const rentalList = rentalsRes?.data?.content || [];
      setRentals(rentalList);
      setCategories(catRes?.data?.content || []);
      setVehicles(vehRes?.data?.content || []);

      const pMap: Record<number, RentalPriceDto[]> = {};
      await Promise.all(
        rentalList.map(async (r) => {
          try {
            const pRes = await getRentalPricesByRental(r.id);
            if (pRes?.data) {
              pMap[r.id] = pRes.data;
            }
          } catch {}
        })
      );
      setPricesMap(pMap);
    } catch (err) {
      console.error("Failed to load self-drive rentals:", err);
      toast.danger("Không thể tải danh sách cấu hình thuê xe tự lái");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const getCategoryName = (catId?: number) => {
    if (!catId) return "Chưa phân loại";
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return `Phân khúc #${catId}`;
    const trans =
      cat.translations?.find((t) => t.locale === language) ||
      cat.translations?.find((t) => t.locale === "vi") ||
      cat.translations?.[0];
    return trans?.name || cat.code || `Phân khúc #${catId}`;
  };

  const getCategorySeatText = (catId?: number) => {
    if (!catId) return "";
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return "";
    return `${cat.minSeat}-${cat.maxSeat} chỗ`;
  };

  const enrichedRentals: RentalWithDetails[] = useMemo(() => {
    return rentals.map((r) => {
      const cat = categories.find((c) => c.id === r.vehicleCategoryId);
      const vCount = vehicles.filter((v) => v.type?.id === r.vehicleCategoryId).length;
      return {
        ...r,
        category: cat,
        vehiclesCount: vCount,
        prices: pricesMap[r.id] || [],
      };
    });
  }, [rentals, categories, vehicles, pricesMap]);

  const filteredRentals = useMemo(() => {
    return enrichedRentals.filter((item) => {
      const catName = getCategoryName(item.vehicleCategoryId).toLowerCase();
      const matchSearch =
        !searchTerm ||
        catName.includes(searchTerm.toLowerCase()) ||
        String(item.id).includes(searchTerm);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.active) ||
        (statusFilter === "inactive" && !item.active);
      return matchSearch && matchStatus;
    });
  }, [enrichedRentals, searchTerm, statusFilter, categories, language]);

  const sortedRentals = useMemo(() => {
    return [...filteredRentals].sort((a, b) => {
      const col = sortDescriptor.column as string;
      let cmp = 0;
      if (col === "id") {
        cmp = a.id - b.id;
      } else if (col === "category") {
        cmp = getCategoryName(a.vehicleCategoryId).localeCompare(getCategoryName(b.vehicleCategoryId));
      } else if (col === "deposit") {
        cmp = (Number(a.deposit) || 0) - (Number(b.deposit) || 0);
      } else if (col === "minimumDays") {
        cmp = (a.minimumDays || 1) - (b.minimumDays || 1);
      }
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filteredRentals, sortDescriptor, categories, language]);

  const totalPages = Math.ceil(sortedRentals.length / PAGE_SIZE) || 1;
  const paginatedRentals = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedRentals.slice(start, start + PAGE_SIZE);
  }, [sortedRentals, currentPage]);

  const handleOpenCreate = () => {
    setEditingRental(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (rental: RentalDto) => {
    setEditingRental(rental);
    setFormOpen(true);
  };

  const handleOpenDetail = (rental: RentalWithDetails) => {
    setDetailRental(rental);
    setDetailOpen(true);
  };

  const handleSave = async (payload: Partial<RentalDto>, priceAmount?: number) => {
    // If activating this configuration, auto-deactivate other configurations for the same vehicle category
    if (payload.active && payload.vehicleCategoryId) {
      const conflicting = rentals.filter(
        (r) =>
          r.vehicleCategoryId === payload.vehicleCategoryId &&
          r.active &&
          (!editingRental || r.id !== editingRental.id)
      );
      for (const oldRental of conflicting) {
        try {
          await updateRental(oldRental.id, { ...oldRental, active: false });
        } catch (e) {
          console.error("Failed to deactivate old rental:", e);
        }
      }
    }

    let savedRentalId = editingRental?.id;
    if (editingRental) {
      const updateRes = await updateRental(editingRental.id, payload);
      if (updateRes?.data) {
        savedRentalId = updateRes.data.id;
      }
      toast.success("Cập nhật cấu hình xe tự lái thành công!");
    } else {
      const createRes = await createRental(payload);
      if (createRes?.data) {
        savedRentalId = createRes.data.id;
      }
      toast.success("Thêm mới cấu hình xe tự lái thành công!");
    }

    // Save or update RentalPrice if priceAmount is specified
    if (savedRentalId && priceAmount !== undefined && priceAmount > 0) {
      try {
        const existingPrices = pricesMap[savedRentalId] || [];
        const activePrice = existingPrices.find((p) => p.active) || existingPrices[0];
        if (activePrice && activePrice.id) {
          await updateRentalPrice(savedRentalId, activePrice.id, {
            rentalId: savedRentalId,
            vehicleCategoryId: payload.vehicleCategoryId,
            amount: priceAmount,
            currency: "VND",
            active: payload.active ?? true,
          });
        } else {
          await createRentalPrice(savedRentalId, {
            rentalId: savedRentalId,
            vehicleCategoryId: payload.vehicleCategoryId,
            amount: priceAmount,
            currency: "VND",
            active: payload.active ?? true,
          });
        }
      } catch (err) {
        console.error("Failed to save rental price:", err);
      }
    }

    fetchAllData();
  };

  const handleToggleActive = async (rental: RentalDto) => {
    try {
      const willBeActive = !rental.active;
      // If activating, deactivate other rentals for the same vehicle category
      if (willBeActive) {
        const conflicting = rentals.filter(
          (r) => r.vehicleCategoryId === rental.vehicleCategoryId && r.active && r.id !== rental.id
        );
        for (const oldRental of conflicting) {
          try {
            await updateRental(oldRental.id, { ...oldRental, active: false });
          } catch (e) {
            console.error("Failed to deactivate old rental:", e);
          }
        }
      }

      await updateRental(rental.id, {
        ...rental,
        active: willBeActive,
      });

      setRentals((prev) =>
        prev.map((r) => {
          if (r.id === rental.id) return { ...r, active: willBeActive };
          if (willBeActive && r.vehicleCategoryId === rental.vehicleCategoryId && r.id !== rental.id) {
            return { ...r, active: false };
          }
          return r;
        })
      );

      toast.success(
        willBeActive
          ? `Đã kích hoạt cấu hình #${rental.id} (các cấu hình cũ cùng phân khúc đã được tự động tắt)`
          : `Đã tạm dừng cấu hình #${rental.id}`
      );
    } catch {
      toast.danger("Không thể cập nhật trạng thái");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      await deleteRental(deletingId);
      toast.success("Đã xóa cấu hình xe tự lái!");
      setDeleteOpen(false);
      setDeletingId(null);
      fetchAllData();
    } catch {
      toast.danger("Không thể xóa cấu hình xe");
    } finally {
      setSubmitting(false);
    }
  };

  // Stats
  const totalRentals = rentals.length;
  const activeRentalsCount = rentals.filter((r) => r.active).length;
  const inactiveRentalsCount = totalRentals - activeRentalsCount;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
              <KeyRound size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Quản lý Thuê xe Tự lái
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thiết lập phân khúc xe, tiền đặt cọc, số ngày thuê tối thiểu và giá tự lái.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={fetchAllData}
            isDisabled={loading}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 h-10 rounded-xl border border-slate-200 dark:border-slate-800"
          >
            <RefreshCw size={14} className={clsx(loading && "animate-spin")} />
            <span>Làm mới</span>
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 text-xs font-bold px-4 h-10 rounded-xl bg-accent text-white hover:bg-accent-hover shadow-md cursor-pointer border-none"
          >
            <Plus size={16} />
            <span>Thêm cấu hình xe</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Tổng cấu hình</span>
            <Car size={16} className="text-accent" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalRentals}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Đang hoạt động</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeRentalsCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Tạm dừng</span>
            <XCircle size={16} className="text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{inactiveRentalsCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Phân khúc xe</span>
            <ShieldCheck size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{categories.length}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[var(--bg-card)] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="w-full sm:w-80">
          <SearchField
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-full"
          >
            <SearchField.Group className="flex items-center border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 h-10 bg-slate-50 dark:bg-[var(--bg-surface)]">
              <Search size={14} className="text-slate-400 mr-2 shrink-0" />
              <SearchField.Input
                placeholder="Tìm theo phân khúc xe..."
                className="text-xs font-semibold bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 w-full"
              />
              <SearchField.ClearButton className="text-slate-400 hover:text-slate-600" />
            </SearchField.Group>
          </SearchField>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="w-40">
            <Select
              selectedKey={statusFilter}
              onSelectionChange={(key) => {
                if (key) setStatusFilter(key as string);
              }}
              className="w-full"
            >
              <Select.Trigger className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[var(--bg-surface)] text-xs font-bold flex items-center justify-between cursor-pointer">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl z-50">
                <ListBox>
                  <ListBox.Item id="all" textValue="Tất cả trạng thái" className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)]">
                    Tất cả trạng thái
                  </ListBox.Item>
                  <ListBox.Item id="active" textValue="Đang hoạt động" className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)]">
                    Đang hoạt động
                  </ListBox.Item>
                  <ListBox.Item id="inactive" textValue="Tạm ngưng" className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)]">
                    Tạm ngưng
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        </div>
      </div>

      {/* HeroUI Table Section */}
      <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-3">
            <Spinner size="lg" />
            <p className="text-xs text-slate-500 font-semibold">Đang tải danh sách xe tự lái...</p>
          </div>
        ) : paginatedRentals.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-2">
            <KeyRound size={36} className="text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Không tìm thấy cấu hình xe nào</p>
            <p className="text-xs text-slate-400">Hãy thêm cấu hình thuê xe tự lái mới bằng nút bên trên.</p>
          </div>
        ) : (
          <Table aria-label="Bảng danh sách cấu hình xe tự lái">
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Self-Drive Rentals Table"
                className="min-w-[800px]"
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
              >
                <Table.Header>
                  {columns.map((col) => (
                    <Table.Column
                      key={col.id}
                      id={col.id}
                      allowsSorting={col.sortable}
                      isRowHeader={col.isRowHeader}
                    >
                      {col.sortable ? (
                        ({ sortDirection }) => (
                          <Table.SortableColumnHeader sortDirection={sortDirection}>
                            {col.label}
                          </Table.SortableColumnHeader>
                        )
                      ) : (
                        col.label
                      )}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body>
                  {paginatedRentals.map((item) => {
                    const catName = getCategoryName(item.vehicleCategoryId);
                    const seatText = getCategorySeatText(item.vehicleCategoryId);
                    const activePrice = item.prices?.find((p) => p.active);
                    const priceAmount = activePrice ? activePrice.amount : 0;

                    return (
                      <Table.Row key={item.id} id={String(item.id)}>
                        <Table.Cell>#{item.id}</Table.Cell>

                        <Table.Cell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-bold shrink-0">
                              <Car size={16} />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">{catName}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{seatText}</span>
                            </div>
                          </div>
                        </Table.Cell>

                        <Table.Cell>
                          <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                            {item.vehiclesCount || 0} xe
                          </span>
                        </Table.Cell>

                        <Table.Cell>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {formatPriceSync(Number(item.deposit) || 0, "vi")}
                          </span>
                        </Table.Cell>

                        <Table.Cell>
                          <span className="font-bold">{item.minimumDays || 1} ngày</span>
                        </Table.Cell>

                        <Table.Cell>
                          {priceAmount > 0 ? (
                            <span className="font-black text-accent text-sm">
                              {formatPriceSync(Number(priceAmount), "vi")}
                              <span className="text-[10px] font-normal text-slate-400"> /ngày</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa set giá</span>
                          )}
                        </Table.Cell>

                        <Table.Cell>
                          <div className="inline-flex items-center gap-2">
                            <Switch
                              isSelected={item.active}
                              onChange={() => handleToggleActive(item)}
                              size="sm"
                              aria-label="Toggle Active"
                            />
                            <StatusChip status={item.active ? "active" : "inactive"} />
                          </div>
                        </Table.Cell>

                        <Table.Cell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              isIconOnly
                              size="sm"
                              onClick={() => handleOpenDetail(item)}
                              className="rounded-lg h-8 w-8 text-slate-600 dark:text-slate-300 hover:text-accent cursor-pointer"
                              aria-label="View Details"
                            >
                              <Eye size={14} />
                            </Button>

                            <Button
                              variant="ghost"
                              isIconOnly
                              size="sm"
                              onClick={() => handleOpenEdit(item)}
                              className="rounded-lg h-8 w-8 text-slate-600 dark:text-slate-300 hover:text-accent cursor-pointer"
                              aria-label="Edit"
                            >
                              <Edit3 size={14} />
                            </Button>

                            <Button
                              variant="ghost"
                              isIconOnly
                              size="sm"
                              onClick={() => {
                                setDeletingId(item.id);
                                setDeleteOpen(true);
                              }}
                              className="rounded-lg h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              aria-label="Delete"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>

            {filteredRentals.length > PAGE_SIZE && (
              <Table.Footer>
                <Pagination size="sm">
                  <Pagination.Summary>
                    Hiển thị {paginatedRentals.length} trên tổng số {filteredRentals.length} cấu hình
                  </Pagination.Summary>
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.Previous
                        isDisabled={currentPage <= 1}
                        onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        <Pagination.PreviousIcon />
                        Trước
                      </Pagination.Previous>
                    </Pagination.Item>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Pagination.Item key={p}>
                        <Pagination.Link
                          isActive={p === currentPage}
                          onPress={() => setCurrentPage(p)}
                        >
                          {p}
                        </Pagination.Link>
                      </Pagination.Item>
                    ))}
                    <Pagination.Item>
                      <Pagination.Next
                        isDisabled={currentPage >= totalPages}
                        onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Sau
                        <Pagination.NextIcon />
                      </Pagination.Next>
                    </Pagination.Item>
                  </Pagination.Content>
                </Pagination>
              </Table.Footer>
            )}
          </Table>
        )}
      </div>

      {/* Form Modal (Separate Component) */}
      <SelfDriveFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        editingRental={editingRental}
        categories={categories}
        existingRentals={rentals}
        onSave={handleSave}
      />

      {/* Detail Modal (Separate Component) */}
      <SelfDriveDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        rental={detailRental}
        onEdit={(r) => {
          setDetailOpen(false);
          handleOpenEdit(r);
        }}
      />

      {/* Delete Confirmation Modal (Separate Component) */}
      <SelfDriveDeleteModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        submitting={submitting}
      />
    </div>
  );
}
