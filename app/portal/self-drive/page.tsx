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
  FileText,
  Sparkles,
  Filter,
  X,
} from "lucide-react";
import type { SortDescriptor } from "@heroui/react";
import {
  Button,
  Pagination,
  SearchField,
  Select,
  ListBox,
  Spinner,
  Switch,
  Table,
  Tabs,
  toast,
  Tooltip,
  Popover,
  Checkbox,
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
} from "@/lib/api/selfDrive";
import {
  getAdminSelfDrivePolicies,
  createSelfDrivePolicy,
  updateSelfDrivePolicy,
  toggleSelfDrivePolicy,
  deleteSelfDrivePolicy,
  type SelfDrivePolicyDto,
} from "@/lib/api/self-drive-policy";
import { getVehicleCategories, getVehicles, type VehicleCategoryDto, type VehicleDto } from "@/lib/api/fleet";
import { formatPriceSync } from "@/lib/format";
import { useI18n } from "@/context/LanguageContext";
import { ColumnInterface } from "@/lib/interface/column.interface";
import { headerColumns } from "@/config/headerColumns";

import { SelfDriveCreateUpdateModal } from "@/components/admin/self-drive/SelfDriveCreateUpdateModal";
import { SelfDriveDeleteModal } from "@/components/admin/self-drive/SelfDriveDeleteModal";
import { SelfDriveDetailModal } from "@/components/admin/self-drive/SelfDriveDetailModal";
import { SelfDrivePolicyCreateUpdateModal } from "@/components/admin/self-drive/SelfDrivePolicyCreateUpdateModal";
import { SelfDrivePolicyDeleteModal } from "@/components/admin/self-drive/SelfDrivePolicyDeleteModal";
import { SvgIconRenderer } from "@/components/admin/self-drive/SvgIconRenderer";
import PageSizeSelect from "@/components/common/PageSizeSelect";

type TabKey = "rentals" | "policies";

interface RentalWithDetails extends RentalDto {
  category?: VehicleCategoryDto;
  vehiclesCount?: number;
  prices?: RentalPriceDto[];
}

export default function AdminSelfDrivePage() {
  const { t, language } = useI18n();
  const rentalColumns = headerColumns.selfDriveRentals(t);
  const policyColumns = headerColumns.selfDrivePolicies(t);
  const [activeTab, setActiveTab] = useState<TabKey>("rentals");

  // === RENTALS STATE ===
  const [rentals, setRentals] = useState<RentalDto[]>([]);
  const [categories, setCategories] = useState<VehicleCategoryDto[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [pricesMap, setPricesMap] = useState<Record<number, RentalPriceDto[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Rental Multi-select Filters
  const [selectedRentalCategories, setSelectedRentalCategories] = useState<number[]>([]);
  const [selectedRentalStatuses, setSelectedRentalStatuses] = useState<string[]>([]);
  const [selectedRentalMinDays, setSelectedRentalMinDays] = useState<string[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  const toggleRentalCategory = (id: number) => {
    setSelectedRentalCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };
  const toggleRentalStatus = (status: string) => {
    setSelectedRentalStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };
  const toggleRentalMinDays = (days: string) => {
    setSelectedRentalMinDays(prev =>
      prev.includes(days) ? prev.filter(d => d !== days) : [...prev, days]
    );
  };
  const resetRentalFilters = () => {
    setSelectedRentalCategories([]);
    setSelectedRentalStatuses([]);
    setSelectedRentalMinDays([]);
  };
  const activeRentalFilterCount =
    selectedRentalCategories.length +
    selectedRentalStatuses.length +
    selectedRentalMinDays.length;

  // Rental Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<RentalDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRental, setDetailRental] = useState<RentalWithDetails | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // === POLICIES STATE ===
  const [policies, setPolicies] = useState<SelfDrivePolicyDto[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policySearch, setPolicySearch] = useState("");
  const [selectedPolicyStatuses, setSelectedPolicyStatuses] = useState<string[]>([]);
  const [policyCurrentPage, setPolicyCurrentPage] = useState(1);
  const [policySortDescriptor, setPolicySortDescriptor] = useState<SortDescriptor>({
    column: "sortOrder",
    direction: "ascending",
  });

  const togglePolicyStatus = (status: string) => {
    setSelectedPolicyStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };
  const resetPolicyFilters = () => {
    setSelectedPolicyStatuses([]);
  };
  const activePolicyFilterCount = selectedPolicyStatuses.length;

  // Policy Modals
  const [policyFormOpen, setPolicyFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SelfDrivePolicyDto | null>(null);
  const [policyDeleteOpen, setPolicyDeleteOpen] = useState(false);
  const [deletingPolicy, setDeletingPolicy] = useState<SelfDrivePolicyDto | null>(null);
  const [policySubmitting, setPolicySubmitting] = useState(false);

  // === FETCH DATA ===
  const fetchRentalsData = async () => {
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
          } catch { }
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

  const fetchPoliciesData = async () => {
    setPoliciesLoading(true);
    try {
      const res = await getAdminSelfDrivePolicies(0, 100);
      setPolicies(res?.data?.content || []);
    } catch (err) {
      console.error("Failed to load self-drive policies:", err);
      toast.danger("Không thể tải danh sách chính sách thuê xe");
    } finally {
      setPoliciesLoading(false);
    }
  };

  useEffect(() => {
    fetchRentalsData();
    fetchPoliciesData();
  }, []);

  // === RENTALS HELPERS ===
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

      const matchCategory =
        selectedRentalCategories.length === 0 ||
        (item.vehicleCategoryId && selectedRentalCategories.includes(item.vehicleCategoryId));

      const matchStatus =
        selectedRentalStatuses.length === 0 ||
        (selectedRentalStatuses.includes("active") && item.active) ||
        (selectedRentalStatuses.includes("inactive") && !item.active);

      const minDays = item.minimumDays || 1;
      const matchMinDays =
        selectedRentalMinDays.length === 0 ||
        selectedRentalMinDays.some((d) => {
          if (d === "1") return minDays === 1;
          if (d === "2") return minDays === 2;
          if (d === "3_plus") return minDays >= 3;
          return false;
        });

      return matchSearch && matchCategory && matchStatus && matchMinDays;
    });
  }, [
    enrichedRentals,
    searchTerm,
    selectedRentalCategories,
    selectedRentalStatuses,
    selectedRentalMinDays,
    categories,
    language,
  ]);

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

  const [rentalPageSize, setRentalPageSize] = useState<number>(10);
  const totalPages = Math.max(1, Math.ceil(sortedRentals.length / rentalPageSize));
  const paginatedRentals = useMemo(() => {
    const start = (currentPage - 1) * rentalPageSize;
    return sortedRentals.slice(start, start + rentalPageSize);
  }, [sortedRentals, currentPage, rentalPageSize]);

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

    fetchRentalsData();
  };

  const handleToggleActive = async (rental: RentalDto) => {
    try {
      const willBeActive = !rental.active;
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
          ? `Đã kích hoạt cấu hình #${rental.id}`
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
      fetchRentalsData();
    } catch {
      toast.danger("Không thể xóa cấu hình xe");
    } finally {
      setSubmitting(false);
    }
  };

  // === POLICIES HELPERS ===
  const getPolicyTranslation = (policy: SelfDrivePolicyDto) => {
    const tr =
      policy.translations?.find((t) => t.locale === language) ||
      policy.translations?.find((t) => t.locale === "vi") ||
      policy.translations?.[0];
    return {
      name: tr?.name || policy.code,
      description: tr?.description || "—",
    };
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const { name, description } = getPolicyTranslation(p);
      const query = policySearch.toLowerCase();
      const matchSearch =
        !policySearch ||
        p.code.toLowerCase().includes(query) ||
        name.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query);

      const matchStatus =
        selectedPolicyStatuses.length === 0 ||
        (selectedPolicyStatuses.includes("active") && p.active) ||
        (selectedPolicyStatuses.includes("inactive") && !p.active);

      return matchSearch && matchStatus;
    });
  }, [policies, policySearch, selectedPolicyStatuses, language]);

  const sortedPolicies = useMemo(() => {
    return [...filteredPolicies].sort((a, b) => {
      const col = policySortDescriptor.column as string;
      let cmp = 0;
      if (col === "id") {
        cmp = a.id - b.id;
      } else if (col === "code") {
        cmp = a.code.localeCompare(b.code);
      } else if (col === "sortOrder") {
        cmp = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      } else if (col === "name") {
        cmp = getPolicyTranslation(a).name.localeCompare(getPolicyTranslation(b).name);
      }
      return policySortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filteredPolicies, policySortDescriptor, language]);

  const [policyPageSize, setPolicyPageSize] = useState<number>(10);
  const totalPolicyPages = Math.max(1, Math.ceil(sortedPolicies.length / policyPageSize));
  const paginatedPolicies = useMemo(() => {
    const start = (policyCurrentPage - 1) * policyPageSize;
    return sortedPolicies.slice(start, start + policyPageSize);
  }, [sortedPolicies, policyCurrentPage, policyPageSize]);

  const handleOpenCreatePolicy = () => {
    setEditingPolicy(null);
    setPolicyFormOpen(true);
  };

  const handleOpenEditPolicy = (policy: SelfDrivePolicyDto) => {
    setEditingPolicy(policy);
    setPolicyFormOpen(true);
  };

  const handleSavePolicy = async (payload: Partial<SelfDrivePolicyDto>) => {
    if (editingPolicy) {
      await updateSelfDrivePolicy(editingPolicy.id, payload);
      toast.success("Đã cập nhật chính sách thuê xe!");
    } else {
      await createSelfDrivePolicy(payload);
      toast.success("Đã thêm mới chính sách thuê xe!");
    }
    fetchPoliciesData();
  };

  const handleTogglePolicyActive = async (policy: SelfDrivePolicyDto) => {
    try {
      const willBeActive = !policy.active;
      await toggleSelfDrivePolicy(policy.id);
      setPolicies((prev) =>
        prev.map((p) => (p.id === policy.id ? { ...p, active: willBeActive } : p))
      );
      toast.success(
        willBeActive
          ? `Đã kích hoạt chính sách "${getPolicyTranslation(policy).name}"`
          : `Đã tạm ngưng chính sách "${getPolicyTranslation(policy).name}"`
      );
    } catch {
      toast.danger("Không thể thay đổi trạng thái chính sách");
    }
  };

  const handleDeletePolicyConfirm = async () => {
    if (!deletingPolicy) return;
    setPolicySubmitting(true);
    try {
      await deleteSelfDrivePolicy(deletingPolicy.id);
      toast.success("Đã xóa chính sách thành công!");
      setPolicyDeleteOpen(false);
      setDeletingPolicy(null);
      fetchPoliciesData();
    } catch {
      toast.danger("Không thể xóa chính sách");
    } finally {
      setPolicySubmitting(false);
    }
  };

  // Stats
  const totalRentals = rentals.length;
  const activeRentalsCount = rentals.filter((r) => r.active).length;
  const inactiveRentalsCount = totalRentals - activeRentalsCount;

  const totalPoliciesCount = policies.length;
  const activePoliciesCount = policies.filter((p) => p.active).length;
  const inactivePoliciesCount = totalPoliciesCount - activePoliciesCount;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
              {activeTab === "rentals" ? <KeyRound size={22} /> : <ShieldCheck size={22} />}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Quản lý Thuê xe Tự lái
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeTab === "rentals"
                  ? "Thiết lập phân khúc xe, tiền đặt cọc, số ngày thuê tối thiểu và bảng giá."
                  : "Quản lý điều khoản, chính sách thuê xe hiển thị trên trang chi tiết khách hàng."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={activeTab === "rentals" ? fetchRentalsData : fetchPoliciesData}
            isDisabled={activeTab === "rentals" ? loading : policiesLoading}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 h-10 rounded-xl border border-separator cursor-pointer"
          >
            <RefreshCw size={14} className={clsx((loading || policiesLoading) && "animate-spin")} />
            <span>Làm mới</span>
          </Button>

          {activeTab === "rentals" ? (
            <Button
              onClick={handleOpenCreate}
              className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
            >
              <Plus size={16} />
              <span>Thêm Cấu hình Xe</span>
            </Button>
          ) : (
            <Button
              onClick={handleOpenCreatePolicy}
              className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
            >
              <Plus size={16} />
              <span>Thêm Chính sách</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as TabKey)}
          className="w-full"
        >
          <Tabs.List
            aria-label="Self-Drive Management Tabs"
            className="h-11 p-1 bg-slate-100 dark:bg-[var(--bg-card)] rounded-2xl border border-border-secondary"
          >
            <Tabs.Tab
              id="rentals"
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 cursor-pointer transition-all"
            >
              <KeyRound size={15} />
              <span>Cấu hình & Bảng giá</span>
            </Tabs.Tab>
            <Tabs.Tab
              id="policies"
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 cursor-pointer transition-all"
            >
              <ShieldCheck size={15} />
              <span>Chính sách thuê xe</span>
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: RENTALS MANAGEMENT                                 */}
      {/* ========================================================= */}
      {activeTab === "rentals" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-separator shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Tổng cấu hình</span>
                <Car size={16} className="text-accent" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{totalRentals}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-separator shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Đang hoạt động</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeRentalsCount}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-separator shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Tạm dừng</span>
                <XCircle size={16} className="text-rose-500" />
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{inactiveRentalsCount}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-separator shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Phân khúc xe</span>
                <ShieldCheck size={16} className="text-blue-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{categories.length}</p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col gap-3 bg-white dark:bg-[var(--bg-card)] p-3.5 rounded-2xl border border-separator shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-80">
                <SearchField value={searchTerm} onChange={setSearchTerm} className="w-full">
                  <SearchField.Group className="flex items-center border border-border rounded-xl px-3 h-10 bg-slate-50 dark:bg-[var(--bg-surface)]">
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
                {/* Popover Filter */}
                <Popover>
                  <Button
                    type="button"
                    variant="outline"
                    className={`rounded-xl font-bold text-xs h-10 px-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 cursor-pointer ${
                      activeRentalFilterCount > 0 ? "border-accent/60 bg-accent/5 text-accent dark:text-accent font-extrabold" : ""
                    }`}
                  >
                    <Filter size={15} className={activeRentalFilterCount > 0 ? "text-accent" : "text-slate-500"} />
                    <span>{t.common.filter}</span>
                    {activeRentalFilterCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-black flex items-center justify-center">
                        {activeRentalFilterCount}
                      </span>
                    )}
                  </Button>
                  <Popover.Content
                    placement="bottom end"
                    className="w-80 p-0 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
                  >
                    <Popover.Dialog className="p-4 space-y-4 outline-none max-h-[80vh] overflow-y-auto">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Filter size={15} className="text-accent" />
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {t.common.filterTitle}
                          </span>
                          {activeRentalFilterCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold text-[10px]">
                              {activeRentalFilterCount}
                            </span>
                          )}
                        </div>
                        {activeRentalFilterCount > 0 && (
                          <button
                            type="button"
                            onClick={resetRentalFilters}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          >
                            {t.common.filterReset}
                          </button>
                        )}
                      </div>

                      {/* Phân khúc xe */}
                      {categories.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                            Phân khúc xe
                          </span>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {categories.map((cat) => {
                              const name = getCategoryName(cat.id);
                              const seats = getCategorySeatText(cat.id);
                              return (
                                <Checkbox
                                  key={cat.id}
                                  isSelected={selectedRentalCategories.includes(cat.id)}
                                  onChange={() => toggleRentalCategory(cat.id)}
                                  className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                                >
                                  <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <Checkbox.Control>
                                      <Checkbox.Indicator />
                                    </Checkbox.Control>
                                    <span className="truncate">{name} {seats ? `(${seats})` : ""}</span>
                                  </Checkbox.Content>
                                </Checkbox>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Trạng thái hoạt động */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                          Trạng thái hoạt động
                        </span>
                        <div className="space-y-1">
                          <Checkbox
                            isSelected={selectedRentalStatuses.includes("active")}
                            onChange={() => toggleRentalStatus("active")}
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
                            isSelected={selectedRentalStatuses.includes("inactive")}
                            onChange={() => toggleRentalStatus("inactive")}
                            className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <span>Tạm ngưng</span>
                            </Checkbox.Content>
                          </Checkbox>
                        </div>
                      </div>

                      {/* Số ngày thuê tối thiểu */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                          Số ngày thuê tối thiểu
                        </span>
                        <div className="space-y-1">
                          <Checkbox
                            isSelected={selectedRentalMinDays.includes("1")}
                            onChange={() => toggleRentalMinDays("1")}
                            className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <span>1 ngày</span>
                            </Checkbox.Content>
                          </Checkbox>
                          <Checkbox
                            isSelected={selectedRentalMinDays.includes("2")}
                            onChange={() => toggleRentalMinDays("2")}
                            className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <span>2 ngày</span>
                            </Checkbox.Content>
                          </Checkbox>
                          <Checkbox
                            isSelected={selectedRentalMinDays.includes("3_plus")}
                            onChange={() => toggleRentalMinDays("3_plus")}
                            className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <span>Từ 3 ngày trở lên</span>
                            </Checkbox.Content>
                          </Checkbox>
                        </div>
                      </div>
                    </Popover.Dialog>
                  </Popover.Content>
                </Popover>

                <PageSizeSelect
                  value={rentalPageSize}
                  onChange={(size) => {
                    setRentalPageSize(size);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Active Chips */}
            {activeRentalFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  {t.common.appliedFilters}:
                </span>
                {selectedRentalCategories.map((cId) => (
                  <span
                    key={`cat-${cId}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <span>{getCategoryName(cId)}</span>
                    <button
                      type="button"
                      onClick={() => toggleRentalCategory(cId)}
                      className="w-3.5 h-3.5 rounded-full hover:bg-accent/20 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {selectedRentalStatuses.map((st) => (
                  <span
                    key={`st-${st}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <span>{st === "active" ? "Đang hoạt động" : "Tạm ngưng"}</span>
                    <button
                      type="button"
                      onClick={() => toggleRentalStatus(st)}
                      className="w-3.5 h-3.5 rounded-full hover:bg-accent/20 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {selectedRentalMinDays.map((d) => (
                  <span
                    key={`md-${d}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <span>{d === "1" ? "1 ngày" : d === "2" ? "2 ngày" : "Từ 3 ngày trở lên"}</span>
                    <button
                      type="button"
                      onClick={() => toggleRentalMinDays(d)}
                      className="w-3.5 h-3.5 rounded-full hover:bg-accent/20 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={resetRentalFilters}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 underline transition-colors cursor-pointer ml-1"
                >
                  {t.common.clearAll}
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-separator shadow-sm overflow-hidden">
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
                      {rentalColumns.map((col) => (
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
                              {item.isContactOnly ? (
                                <span className="text-slate-400 text-xs italic">Theo báo giá</span>
                              ) : (
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                  {formatPriceSync(Number(item.deposit) || 0, "vi")}
                                </span>
                              )}
                            </Table.Cell>

                            <Table.Cell>
                              <span className="font-bold">{item.minimumDays || 1} ngày</span>
                            </Table.Cell>

                            <Table.Cell>
                              {item.isContactOnly ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  Liên hệ báo giá
                                </span>
                              ) : priceAmount > 0 ? (
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
                                >
                                  <Switch.Content className="cursor-pointer">
                                    <Switch.Control>
                                      <Switch.Thumb />
                                    </Switch.Control>
                                  </Switch.Content>
                                </Switch>
                                <StatusChip status={item.active ? "active" : "inactive"} />
                              </div>
                            </Table.Cell>

                            <Table.Cell>
                              <div className="flex items-center gap-1.5">
                                <Tooltip delay={300} closeDelay={100}>
                                  <Tooltip.Trigger>
                                    <Button
                                      variant="tertiary"
                                      isIconOnly
                                      size="sm"
                                      onPress={() => handleOpenDetail(item)}
                                      aria-label="Xem chi tiết"
                                    >
                                      <Eye size={14} />
                                    </Button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Content>
                                    <Tooltip.Arrow />
                                    Xem chi tiết
                                  </Tooltip.Content>
                                </Tooltip>

                                <Tooltip delay={300} closeDelay={100}>
                                  <Tooltip.Trigger>
                                    <Button
                                      variant="secondary"
                                      isIconOnly
                                      size="sm"
                                      onPress={() => handleOpenEdit(item)}
                                      aria-label="Chỉnh sửa"
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
                                      variant="danger"
                                      isIconOnly
                                      size="sm"
                                      onPress={() => {
                                        setDeletingId(item.id);
                                        setDeleteOpen(true);
                                      }}
                                      aria-label="Xóa"
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

                  <Table.Footer>
                    <Pagination size="sm">
                      <Pagination.Summary>
                        Hiển thị {sortedRentals.length === 0 ? 0 : (currentPage - 1) * rentalPageSize + 1} - {Math.min(currentPage * rentalPageSize, sortedRentals.length)} trên tổng số {sortedRentals.length} cấu hình
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
              </Table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: POLICIES MANAGEMENT                                */}
      {/* ========================================================= */}
      {activeTab === "policies" && (
        <div className="space-y-6">
          {/* Policy Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-separator shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Tổng chính sách</span>
                <FileText size={16} className="text-accent" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{totalPoliciesCount}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-separator shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Đang áp dụng</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activePoliciesCount}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-separator shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Tạm dừng</span>
                <XCircle size={16} className="text-rose-500" />
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{inactivePoliciesCount}</p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col gap-3 bg-white dark:bg-[var(--bg-card)] p-3.5 rounded-2xl border border-separator shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-80">
                <SearchField value={policySearch} onChange={setPolicySearch} className="w-full">
                  <SearchField.Group className="flex items-center border border-border rounded-xl px-3 h-10 bg-slate-50 dark:bg-[var(--bg-surface)]">
                    <Search size={14} className="text-slate-400 mr-2 shrink-0" />
                    <SearchField.Input
                      placeholder="Tìm theo mã hoặc tên chính sách..."
                      className="text-xs font-semibold bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 w-full"
                    />
                    <SearchField.ClearButton className="text-slate-400 hover:text-slate-600" />
                  </SearchField.Group>
                </SearchField>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Popover>
                  <Button
                    type="button"
                    variant="outline"
                    className={`rounded-xl font-bold text-xs h-10 px-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 cursor-pointer ${
                      activePolicyFilterCount > 0 ? "border-accent/60 bg-accent/5 text-accent dark:text-accent font-extrabold" : ""
                    }`}
                  >
                    <Filter size={15} className={activePolicyFilterCount > 0 ? "text-accent" : "text-slate-500"} />
                    <span>{t.common.filter}</span>
                    {activePolicyFilterCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-black flex items-center justify-center">
                        {activePolicyFilterCount}
                      </span>
                    )}
                  </Button>
                  <Popover.Content
                    placement="bottom end"
                    className="w-72 p-0 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
                  >
                    <Popover.Dialog className="p-4 space-y-4 outline-none">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Filter size={15} className="text-accent" />
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {t.common.filterTitle}
                          </span>
                          {activePolicyFilterCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold text-[10px]">
                              {activePolicyFilterCount}
                            </span>
                          )}
                        </div>
                        {activePolicyFilterCount > 0 && (
                          <button
                            type="button"
                            onClick={resetPolicyFilters}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          >
                            {t.common.filterReset}
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                          Trạng thái áp dụng
                        </span>
                        <div className="space-y-1">
                          <Checkbox
                            isSelected={selectedPolicyStatuses.includes("active")}
                            onChange={() => togglePolicyStatus("active")}
                            className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <span>Đang áp dụng</span>
                            </Checkbox.Content>
                          </Checkbox>
                          <Checkbox
                            isSelected={selectedPolicyStatuses.includes("inactive")}
                            onChange={() => togglePolicyStatus("inactive")}
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
                    </Popover.Dialog>
                  </Popover.Content>
                </Popover>

                <PageSizeSelect
                  value={policyPageSize}
                  onChange={(size) => {
                    setPolicyPageSize(size);
                    setPolicyCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Active Policy Chips */}
            {activePolicyFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  {t.common.appliedFilters}:
                </span>
                {selectedPolicyStatuses.map((st) => (
                  <span
                    key={`pol-st-${st}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <span>{st === "active" ? "Đang áp dụng" : "Tạm dừng"}</span>
                    <button
                      type="button"
                      onClick={() => togglePolicyStatus(st)}
                      className="w-3.5 h-3.5 rounded-full hover:bg-accent/20 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={resetPolicyFilters}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 underline transition-colors cursor-pointer ml-1"
                >
                  {t.common.clearAll}
                </button>
              </div>
            )}
          </div>

          {/* Policies Table */}
          <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-separator shadow-sm overflow-hidden">
            {policiesLoading ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-3">
                <Spinner size="lg" />
                <p className="text-xs text-slate-500 font-semibold">Đang tải danh sách chính sách...</p>
              </div>
            ) : paginatedPolicies.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-2">
                <ShieldCheck size={36} className="text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Không tìm thấy chính sách nào</p>
                <p className="text-xs text-slate-400">Hãy bấm &quot;Thêm chính sách&quot; để tạo chính sách tự lái mới.</p>
              </div>
            ) : (
              <Table aria-label="Bảng danh sách chính sách thuê xe tự lái">
                <Table.ScrollContainer>
                  <Table.Content
                    aria-label="Self-Drive Policies Table"
                    className="min-w-[800px]"
                    sortDescriptor={policySortDescriptor}
                    onSortChange={setPolicySortDescriptor}
                  >
                    <Table.Header>
                      {policyColumns.map((col) => (
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
                      {paginatedPolicies.map((item) => {
                        const { name, description } = getPolicyTranslation(item);

                        return (
                          <Table.Row key={item.id} id={String(item.id)}>
                            <Table.Cell>#{item.id}</Table.Cell>

                            <Table.Cell>
                              <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center p-2 shrink-0 shadow-sm">
                                <SvgIconRenderer svgString={item.icon} className="w-full h-full text-accent" />
                              </div>
                            </Table.Cell>

                            <Table.Cell>
                              <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md">
                                {item.code}
                              </span>
                            </Table.Cell>

                            <Table.Cell>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {name}
                              </span>
                            </Table.Cell>

                            <Table.Cell>
                              <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] line-clamp-2 leading-relaxed">
                                {description}
                              </span>
                            </Table.Cell>

                            <Table.Cell>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {item.sortOrder ?? 0}
                              </span>
                            </Table.Cell>

                            <Table.Cell>
                              <div className="inline-flex items-center gap-2">
                                <Switch
                                  isSelected={item.active}
                                  onChange={() => handleTogglePolicyActive(item)}
                                  size="sm"
                                  aria-label="Toggle Policy Active"
                                >
                                  <Switch.Content className="cursor-pointer">
                                    <Switch.Control>
                                      <Switch.Thumb />
                                    </Switch.Control>
                                  </Switch.Content>
                                </Switch>
                                <StatusChip status={item.active ? "active" : "inactive"} />
                              </div>
                            </Table.Cell>

                            <Table.Cell>
                              <div className="flex items-center gap-1.5">
                                <Tooltip delay={300} closeDelay={100}>
                                  <Tooltip.Trigger>
                                    <Button
                                      variant="secondary"
                                      isIconOnly
                                      size="sm"
                                      onPress={() => handleOpenEditPolicy(item)}
                                      aria-label="Chỉnh sửa chính sách"
                                    >
                                      <Edit3 size={14} />
                                    </Button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Content>
                                    <Tooltip.Arrow />
                                    Chỉnh sửa chính sách
                                  </Tooltip.Content>
                                </Tooltip>

                                <Tooltip delay={300} closeDelay={100}>
                                  <Tooltip.Trigger>
                                    <Button
                                      variant="danger"
                                      isIconOnly
                                      size="sm"
                                      onPress={() => {
                                        setDeletingPolicy(item);
                                        setPolicyDeleteOpen(true);
                                      }}
                                      aria-label="Xóa chính sách"
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Content className="text-rose-600 dark:text-rose-400">
                                    <Tooltip.Arrow />
                                    Xóa chính sách
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

                  <Table.Footer>
                    <Pagination size="sm">
                      <Pagination.Summary>
                        Hiển thị {sortedPolicies.length === 0 ? 0 : (policyCurrentPage - 1) * policyPageSize + 1} - {Math.min(policyCurrentPage * policyPageSize, sortedPolicies.length)} trên tổng số {sortedPolicies.length} chính sách
                      </Pagination.Summary>
                      <Pagination.Content>
                        <Pagination.Item>
                          <Pagination.Previous
                            isDisabled={policyCurrentPage <= 1}
                            onPress={() => setPolicyCurrentPage((p) => Math.max(1, p - 1))}
                          >
                            <Pagination.PreviousIcon />
                            Trước
                          </Pagination.Previous>
                        </Pagination.Item>
                        {Array.from({ length: totalPolicyPages }, (_, i) => i + 1).map((p) => (
                          <Pagination.Item key={p}>
                            <Pagination.Link
                              isActive={p === policyCurrentPage}
                              onPress={() => setPolicyCurrentPage(p)}
                            >
                              {p}
                            </Pagination.Link>
                          </Pagination.Item>
                        ))}
                        <Pagination.Item>
                          <Pagination.Next
                            isDisabled={policyCurrentPage >= totalPolicyPages}
                            onPress={() => setPolicyCurrentPage((p) => Math.min(totalPolicyPages, p + 1))}
                          >
                            Sau
                            <Pagination.NextIcon />
                          </Pagination.Next>
                        </Pagination.Item>
                      </Pagination.Content>
                    </Pagination>
                  </Table.Footer>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* Rentals Modals */}
      <SelfDriveCreateUpdateModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        editingRental={editingRental}
        categories={categories}
        existingRentals={rentals}
        onSave={handleSave}
      />

      <SelfDriveDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        rental={detailRental}
        onEdit={(r) => {
          setDetailOpen(false);
          handleOpenEdit(r);
        }}
      />

      <SelfDriveDeleteModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        submitting={submitting}
      />

      {/* Policies Modals */}
      <SelfDrivePolicyCreateUpdateModal
        isOpen={policyFormOpen}
        onClose={() => setPolicyFormOpen(false)}
        editingPolicy={editingPolicy}
        onSave={handleSavePolicy}
        existingPolicies={policies}
      />

      <SelfDrivePolicyDeleteModal
        isOpen={policyDeleteOpen}
        onClose={() => setPolicyDeleteOpen(false)}
        onConfirm={handleDeletePolicyConfirm}
        policyCode={deletingPolicy?.code}
        submitting={policySubmitting}
      />
    </div>
  );
}
