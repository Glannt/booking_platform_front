"use client";

import React, { useState } from "react";
import {
  Table,
  Button,
  Chip,
  Pagination,
  Tooltip,
  Popover,
  Checkbox,
  SearchField,
} from "@heroui/react";
import { PageSizeSelect, AppStatusChip, TableLoadingState, TableEmptyState } from "@/components/common";
import {
  Tag,
  Plus,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  Calendar,
  CheckCircle,
  Percent,
  Layers,
  X,
  RotateCcw,
  UserPlus,
  History,
  Eye,
} from "lucide-react";
import { PriceDiscountDto } from "@/lib/api/discount";
import { useAdminDiscounts, useDeleteDiscount } from "@/lib/queries/useDiscounts";
import {
  DiscountCreateUpdateModal,
  DiscountDetailModal,
  DiscountModal,
  GrantVoucherModal,
  PromotionAuditModal,
} from "@/components/admin/discount";
import { useI18n } from "@/context/LanguageContext";
import { headerColumns } from "@/config/headerColumns";

export default function DiscountsPortalPage() {
  const { t } = useI18n();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedIssuanceTypes, setSelectedIssuanceTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<PriceDiscountDto | null>(null);

  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [selectedForGrant, setSelectedForGrant] = useState<PriceDiscountDto | null>(null);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedForAudit, setSelectedForAudit] = useState<PriceDiscountDto | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedForDetail, setSelectedForDetail] = useState<PriceDiscountDto | null>(null);

  const scopeParam = selectedScopes.length === 1 ? selectedScopes[0] : undefined;
  const { data, isLoading, refetch } = useAdminDiscounts(page, pageSize, scopeParam);
  const deleteMutation = useDeleteDiscount();

  const discounts = data?.content || [];
  const totalElements = data?.totalElements || 0;

  const activeFilterCount =
    selectedScopes.length +
    selectedStatuses.length +
    selectedTypes.length +
    selectedIssuanceTypes.length;

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
    setPage(0);
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPage(0);
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setPage(0);
  };

  const toggleIssuanceType = (type: string) => {
    setSelectedIssuanceTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setPage(0);
  };

  const handleResetFilters = () => {
    setSelectedScopes([]);
    setSelectedStatuses([]);
    setSelectedTypes([]);
    setSelectedIssuanceTypes([]);
    setPage(0);
  };

  const SCOPE_OPTIONS = [
    { id: "GLOBAL", label: t.discounts.scopeGlobal },
    { id: "INTERCITY_ROUTE", label: t.discounts.scopeRoute },
    { id: "SHARED_ROUTE", label: t.discounts.scopeSharedRoute },
    { id: "SELF_DRIVE", label: t.discounts.scopeSelfDrive },
    { id: "TOUR", label: t.discounts.scopeTour },
    { id: "AIRPORT_TRANSFER", label: t.discounts.scopeAirport },
  ];

  const STATUS_OPTIONS = [
    { id: "ACTIVE", label: t.discounts.active },
    { id: "INACTIVE", label: t.discounts.inactive },
  ];

  const TYPE_OPTIONS = [
    { id: "PERCENT", label: t.discounts.percent },
    { id: "FIXED_AMOUNT", label: t.discounts.fixedAmount },
  ];

  const ISSUANCE_OPTIONS = [
    { id: "PUBLIC", label: t.discounts.public },
    { id: "PRIVATE_TARGETED", label: t.discounts.privateTargeted },
    { id: "AUTO_REWARD", label: t.discounts.autoReward },
  ];

  const handleOpenCreate = () => {
    setEditingDiscount(null);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (d: PriceDiscountDto) => {
    setSelectedForDetail(d);
    setIsDetailModalOpen(true);
  };

  const handleOpenEdit = (d: PriceDiscountDto) => {
    setEditingDiscount(d);
    setIsModalOpen(true);
  };

  const handleOpenGrant = (d: PriceDiscountDto) => {
    setSelectedForGrant(d);
    setIsGrantModalOpen(true);
  };

  const handleOpenAudit = (d: PriceDiscountDto) => {
    setSelectedForAudit(d);
    setIsAuditModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!window.confirm(t.discounts.deleteConfirm)) return;
    deleteMutation.mutate(id);
  };

  const filteredDiscounts = discounts.filter((d) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        d.code?.toLowerCase().includes(q) ||
        d.name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.scopeRefId?.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    // 2. Scopes
    if (selectedScopes.length > 0) {
      const hasMatchingScope =
        (d.scopes && d.scopes.some((s) => selectedScopes.includes(s.scopeType))) ||
        selectedScopes.includes(d.scopeType || "GLOBAL");
      if (!hasMatchingScope) return false;
    }

    // 3. Statuses
    if (selectedStatuses.length > 0) {
      const statusStr = d.active ? "ACTIVE" : "INACTIVE";
      if (!selectedStatuses.includes(statusStr)) return false;
    }

    // 4. Types
    if (selectedTypes.length > 0) {
      if (!selectedTypes.includes(d.discountType)) return false;
    }

    // 5. Issuance Type
    if (selectedIssuanceTypes.length > 0) {
      const issuance = d.issuanceType || "PUBLIC";
      if (!selectedIssuanceTypes.includes(issuance)) return false;
    }

    return true;
  });

  const getScopeBadge = (scopeType?: string, refId?: string) => {
    switch (scopeType) {
      case "INTERCITY_ROUTE":
        return (
          <Chip size="sm" variant="soft" color="accent">
            {t.discounts.scopeRoute} {refId ? `#${refId}` : ""}
          </Chip>
        );
      case "SHARED_ROUTE":
        return (
          <Chip size="sm" variant="soft" color="accent">
            {t.discounts.scopeSharedRoute} {refId ? `#${refId}` : ""}
          </Chip>
        );
      case "SELF_DRIVE":
        return (
          <Chip size="sm" variant="soft" color="warning">
            {t.discounts.scopeSelfDrive} {refId ? `#${refId}` : ""}
          </Chip>
        );
      case "TOUR":
        return (
          <Chip size="sm" variant="soft" color="success">
            {t.discounts.scopeTour} {refId ? `#${refId}` : ""}
          </Chip>
        );
      case "AIRPORT_TRANSFER":
        return (
          <Chip size="sm" variant="soft" color="accent">
            {t.discounts.scopeAirport} {refId ? `#${refId}` : ""}
          </Chip>
        );
      case "GLOBAL":
      default:
        return (
          <Chip size="sm" variant="soft" color="default">
            {t.discounts.scopeGlobal}
          </Chip>
        );
    }
  };

  const getIssuanceBadge = (type?: string) => {
    switch (type) {
      case "PRIVATE_TARGETED":
        return (
          <Chip size="sm" variant="soft" color="warning" className="font-bold text-[10px]">
            {t.discounts.privateTargeted}
          </Chip>
        );
      case "AUTO_REWARD":
        return (
          <Chip size="sm" variant="soft" color="default" className="font-bold text-[10px]">
            {t.discounts.autoReward}
          </Chip>
        );
      case "PUBLIC":
      default:
        return (
          <Chip size="sm" variant="soft" color="accent" className="font-bold text-[10px]">
            {t.discounts.public}
          </Chip>
        );
    }
  };

  const renderScopes = (d: PriceDiscountDto) => {
    if (d.scopes && d.scopes.length > 0) {
      return (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {d.scopes.slice(0, 2).map((s, idx) => (
            <React.Fragment key={idx}>
              {getScopeBadge(s.scopeType, s.scopeRefId)}
            </React.Fragment>
          ))}
          {d.scopes.length > 2 && (
            <Chip size="sm" variant="soft" color="default" className="text-[10px]">
              +{d.scopes.length - 2}
            </Chip>
          )}
        </div>
      );
    }
    return getScopeBadge(d.scopeType, d.scopeRefId);
  };

  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  const startItem = filteredDiscounts.length === 0 ? 0 : page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalElements);

  // Stats calculation
  const activeCount = discounts.filter((d) => d.active).length;
  const globalCount = discounts.filter(
    (d) => d.scopeType === "GLOBAL" || (d.scopes && d.scopes.some((s) => s.scopeType === "GLOBAL"))
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-black">
              <Tag size={22} />
            </div>
            {t.discounts.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.discounts.description}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            isIconOnly
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            onClick={() => refetch()}
            isDisabled={isLoading}
            aria-label="Refresh"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </Button>
          <Button
            type="button"
            className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            <span>{t.discounts.addDiscount}</span>
          </Button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Tag size={20} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Tổng khuyến mãi</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalElements}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">{t.discounts.active}</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Layers size={20} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">{t.discounts.scopeGlobal}</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">{globalCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex-1 w-full sm:w-auto max-w-md">
            <SearchField
              name="search_discounts"
              value={searchQuery}
              onChange={(val: string) => {
                setSearchQuery(val);
                setPage(0);
              }}
              fullWidth
              className="min-w-[220px]"
            >
              <SearchField.Group className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent text-xs font-bold">
                <SearchField.SearchIcon />
                <SearchField.Input className="w-full" placeholder="Tìm theo mã, tên, mô tả..." />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <PageSizeSelect
              value={pageSize}
              onChange={(s) => {
                setPageSize(s);
                setPage(0);
              }}
            />

            <Popover>
              <Button
                type="button"
                variant="outline"
                className={`rounded-xl font-bold text-xs h-10 px-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 cursor-pointer ${
                  activeFilterCount > 0 ? "border-accent/60 bg-accent/5 text-accent dark:text-accent font-extrabold" : ""
                }`}
              >
                <Filter size={15} className={activeFilterCount > 0 ? "text-accent" : "text-slate-500"} />
                <span>{t.discounts.filter}</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              <Popover.Content
                placement="bottom end"
                className="w-80 p-0 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
              >
                <Popover.Dialog className="p-4 space-y-4 outline-none">
                  {/* Popover Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        {t.discounts.filterTitle}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                        {t.discounts.appliedFilters}: <span className="font-bold text-accent">{activeFilterCount}</span>
                      </p>
                    </div>
                    {activeFilterCount > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResetFilters}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 p-1 h-auto cursor-pointer"
                      >
                        <RotateCcw size={12} className="mr-1 inline" />
                        {t.discounts.filterReset}
                      </Button>
                    )}
                  </div>

                  {/* Issuance Type Filter Section */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      {t.discounts.issuanceType}
                    </span>
                    <div className="space-y-1.5">
                      {ISSUANCE_OPTIONS.map((iss) => {
                        const checked = selectedIssuanceTypes.includes(iss.id);
                        return (
                          <Checkbox
                            key={iss.id}
                            isSelected={checked}
                            onChange={() => toggleIssuanceType(iss.id)}
                            className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <span className="truncate">{iss.label}</span>
                            </Checkbox.Content>
                          </Checkbox>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scope Filter Section */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      {t.discounts.scopeType}
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {SCOPE_OPTIONS.map((scope) => {
                        const checked = selectedScopes.includes(scope.id);
                        return (
                          <Checkbox
                            key={scope.id}
                            isSelected={checked}
                            onChange={() => toggleScope(scope.id)}
                            className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <span className="truncate">{scope.label}</span>
                            </Checkbox.Content>
                          </Checkbox>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status Filter Section */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      {t.discounts.status}
                    </span>
                    <div className="space-y-1.5">
                      {STATUS_OPTIONS.map((st) => {
                        const checked = selectedStatuses.includes(st.id);
                        return (
                          <Checkbox
                            key={st.id}
                            isSelected={checked}
                            onChange={() => toggleStatus(st.id)}
                            className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <span>{st.label}</span>
                            </Checkbox.Content>
                          </Checkbox>
                        );
                      })}
                    </div>
                  </div>

                  {/* Discount Type Section */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      {t.discounts.discountType}
                    </span>
                    <div className="space-y-1.5">
                      {TYPE_OPTIONS.map((tp) => {
                        const checked = selectedTypes.includes(tp.id);
                        return (
                          <Checkbox
                            key={tp.id}
                            isSelected={checked}
                            onChange={() => toggleType(tp.id)}
                            className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <span>{tp.label}</span>
                            </Checkbox.Content>
                          </Checkbox>
                        );
                      })}
                    </div>
                  </div>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
          </div>
        </div>

        {/* Active Filter Badges */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 w-full">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Filter size={12} />
              {t.discounts.appliedFilters}:
            </span>
            {selectedIssuanceTypes.map((issId) => {
              const label = ISSUANCE_OPTIONS.find((s) => s.id === issId)?.label || issId;
              return (
                <span
                  key={`iss-${issId}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-accent/10 text-accent dark:bg-accent/20 border border-accent/30"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => toggleIssuanceType(issId)}
                    className="hover:opacity-70 cursor-pointer border-none bg-transparent p-0 flex items-center"
                    aria-label="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            {selectedScopes.map((sId) => {
              const label = SCOPE_OPTIONS.find((s) => s.id === sId)?.label || sId;
              return (
                <span
                  key={`scope-${sId}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => toggleScope(sId)}
                    className="hover:opacity-70 cursor-pointer border-none bg-transparent p-0 flex items-center"
                    aria-label="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            {selectedStatuses.map((stId) => {
              const label = STATUS_OPTIONS.find((s) => s.id === stId)?.label || stId;
              return (
                <span
                  key={`status-${stId}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => toggleStatus(stId)}
                    className="hover:opacity-70 cursor-pointer border-none bg-transparent p-0 flex items-center"
                    aria-label="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            {selectedTypes.map((tpId) => {
              const label = TYPE_OPTIONS.find((s) => s.id === tpId)?.label || tpId;
              return (
                <span
                  key={`type-${tpId}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => toggleType(tpId)}
                    className="hover:opacity-70 cursor-pointer border-none bg-transparent p-0 flex items-center"
                    aria-label="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 underline ml-1 cursor-pointer bg-transparent border-none p-0"
            >
              {t.discounts.clearAll}
            </button>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableLoadingState message={t.common?.loading || "Đang tải dữ liệu..."} />
        ) : filteredDiscounts.length === 0 ? (
          <TableEmptyState
            icon={Tag}
            title={t.discounts?.noDiscounts || "Không tìm thấy mã khuyến mãi nào"}
            description={
              searchQuery
                ? "Hãy thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc phạm vi áp dụng."
                : "Hiện chưa có mã khuyến mãi nào được tạo. Hãy nhấn Thêm khuyến mãi để bắt đầu."
            }
          />
        ) : (
          <Table aria-label="Discounts Table" className="w-full">
            <Table.ScrollContainer>
              <Table.Content aria-label="Discounts Table Content" className="w-full min-w-[960px]">
                <Table.Header className="bg-slate-50 dark:bg-[var(--bg-card)] font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  {headerColumns.discounts(t).map((col) => (
                    <Table.Column key={col.id} id={col.id} isRowHeader={col.isRowHeader} className={col.className}>
                      {col.value}
                    </Table.Column>
                  ))}
                </Table.Header>

                <Table.Body className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredDiscounts.map((d) => (
                    <Table.Row
                      key={d.id}
                      id={String(d.id)}
                      className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-[var(--bg-elevated)] transition-colors text-xs font-semibold"
                    >
                      <Table.Cell>
                        <div>
                          <span className="font-mono font-black text-slate-900 dark:text-white block">
                            {d.code}
                          </span>
                          {d.name && (
                            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                              {d.name}
                            </span>
                          )}
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        {getIssuanceBadge(d.issuanceType)}
                      </Table.Cell>

                      <Table.Cell>
                        {renderScopes(d)}
                      </Table.Cell>

                      <Table.Cell>
                        <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                          {d.discountType === "PERCENT" ? (
                            <Percent size={13} className="text-accent" />
                          ) : (
                            <Tag size={13} className="text-accent" />
                          )}
                          {d.discountType === "PERCENT" ? t.discounts.percent : t.discounts.fixedAmount}
                        </span>
                      </Table.Cell>

                      <Table.Cell>
                        <div>
                          <span className="font-extrabold text-accent text-sm">
                            {d.discountType === "PERCENT"
                              ? `${d.discountValue}%`
                              : `${Number(d.discountValue).toLocaleString("vi-VN")} VND`}
                          </span>
                          {d.maxDiscountAmount && d.maxDiscountAmount > 0 ? (
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                              Tối đa: {d.maxDiscountAmount.toLocaleString("vi-VN")} VND
                            </span>
                          ) : null}
                          {d.minOrderAmount && d.minOrderAmount > 0 ? (
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                              Đơn tối thiểu: {d.minOrderAmount.toLocaleString("vi-VN")} VND
                            </span>
                          ) : null}
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <div className="space-y-0.5 text-[11px]">
                          {d.validFrom || d.validTo ? (
                            <>
                              {d.validFrom && (
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Calendar size={11} className="shrink-0" />
                                  <span>Từ: {d.validFrom.slice(0, 10)}</span>
                                </div>
                              )}
                              {d.validTo && (
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Calendar size={11} className="shrink-0" />
                                  <span>Đến: {d.validTo.slice(0, 10)}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400 italic">Vô thời hạn</span>
                          )}
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <span className="font-mono text-xs">
                          {d.usageCount || 0} /{" "}
                          {(d.maxUsageTotal || d.maxUsage) && (d.maxUsageTotal || d.maxUsage)! > 0
                            ? (d.maxUsageTotal || d.maxUsage)
                            : "∞"}
                        </span>
                      </Table.Cell>

                      <Table.Cell>
                        <AppStatusChip status={d.active} />
                      </Table.Cell>

                      <Table.Cell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Grant Voucher to Customer */}
                          <Tooltip delay={300} closeDelay={100}>
                            <Tooltip.Trigger>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="secondary"
                                aria-label={t.discounts.grantVoucher}
                                onPress={() => handleOpenGrant(d)}
                                className="text-amber-600 dark:text-amber-400 cursor-pointer"
                              >
                                <UserPlus size={16} />
                              </Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                              <Tooltip.Arrow />
                              {t.discounts.grantVoucher}
                            </Tooltip.Content>
                          </Tooltip>

                          {/* View Discount Details */}
                          <Tooltip delay={300} closeDelay={100}>
                            <Tooltip.Trigger>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="tertiary"
                                aria-label={t.common?.details || "Xem chi tiết"}
                                onPress={() => handleOpenDetail(d)}
                                className="cursor-pointer"
                              >
                                <Eye size={16} />
                              </Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                              <Tooltip.Arrow />
                              {t.common?.details || "Xem chi tiết"}
                            </Tooltip.Content>
                          </Tooltip>

                          {/* Redemptions & Grants Audit */}
                          <Tooltip delay={300} closeDelay={100}>
                            <Tooltip.Trigger>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="tertiary"
                                aria-label={t.discounts.redemptionsList}
                                onPress={() => handleOpenAudit(d)}
                                className="cursor-pointer"
                              >
                                <History size={16} />
                              </Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                              <Tooltip.Arrow />
                              {t.discounts.redemptionsList}
                            </Tooltip.Content>
                          </Tooltip>

                          {/* Edit Discount */}
                          <Tooltip delay={300} closeDelay={100}>
                            <Tooltip.Trigger>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="secondary"
                                aria-label={t.common.edit}
                                onPress={() => handleOpenEdit(d)}
                                className="cursor-pointer"
                              >
                                <Edit size={16} />
                              </Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                              <Tooltip.Arrow />
                              {t.common.edit}
                            </Tooltip.Content>
                          </Tooltip>

                          {/* Delete Discount */}
                          <Tooltip delay={300} closeDelay={100}>
                            <Tooltip.Trigger>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="danger"
                                aria-label={t.common.clear}
                                onPress={() => d.id && handleDelete(d.id)}
                                isDisabled={deleteMutation.isPending}
                                className="cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content className="text-rose-600 dark:text-rose-400">
                              <Tooltip.Arrow />
                              {t.common.clear}
                            </Tooltip.Content>
                          </Tooltip>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>

            <Table.Footer>
              <Pagination size="sm">
                <Pagination.Summary>
                  {startItem} - {endItem} / {totalElements} {t.common.results}
                </Pagination.Summary>
                <Pagination.Content>
                  <Pagination.Item>
                    <Pagination.Previous
                      isDisabled={page <= 0}
                      onPress={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      <Pagination.PreviousIcon /> {t.common?.previous || "Trước"}
                    </Pagination.Previous>
                  </Pagination.Item>
                  {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
                    <Pagination.Item key={p}>
                      <Pagination.Link
                        isActive={p === page}
                        onPress={() => setPage(p)}
                      >
                        {p + 1}
                      </Pagination.Link>
                    </Pagination.Item>
                  ))}
                  <Pagination.Item>
                    <Pagination.Next
                      isDisabled={page >= totalPages - 1}
                      onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    >
                      {t.common?.next || "Sau"} <Pagination.NextIcon />
                    </Pagination.Next>
                  </Pagination.Item>
                </Pagination.Content>
              </Pagination>
            </Table.Footer>
          </Table>
        )}
      </div>

      {/* Modal create / edit */}
      <DiscountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={async () => {
          await refetch();
        }}
        initialData={editingDiscount}
      />

      {/* Modal detail */}
      {selectedForDetail && (
        <DiscountDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedForDetail(null);
          }}
          promotion={selectedForDetail}
          onEdit={() => {
            const itemToEdit = selectedForDetail;
            setIsDetailModalOpen(false);
            setSelectedForDetail(null);
            handleOpenEdit(itemToEdit);
          }}
        />
      )}

      {/* Modal grant voucher to customer */}
      {selectedForGrant && (
        <GrantVoucherModal
          isOpen={isGrantModalOpen}
          onClose={() => {
            setIsGrantModalOpen(false);
            setSelectedForGrant(null);
          }}
          promotion={selectedForGrant}
          onGrantSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Modal audit (grants & redemptions) */}
      {selectedForAudit && (
        <PromotionAuditModal
          isOpen={isAuditModalOpen}
          onClose={() => {
            setIsAuditModalOpen(false);
            setSelectedForAudit(null);
          }}
          promotion={selectedForAudit}
        />
      )}
    </div>
  );
}
