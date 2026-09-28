"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  Edit3,
  Eye,
  Percent,
  Layers,
  Sparkles,
  Filter,
  X,
} from "lucide-react";
import {
  SurchargeCreateUpdateModal,
  SurchargeDetailModal,
  MappingModal,
} from "@/components/admin/surcharges";
import {
  Button,
  Chip,
  Pagination,
  SearchField,
  Spinner,
  Table,
  Tabs,
  Select,
  ListBox,
  toast,
  Tooltip,
  type SortDescriptor,
  Popover,
  Checkbox,
} from "@heroui/react";
import {
  getSurchargeRules,
  createSurchargeRule,
  updateSurchargeRule,
  deleteSurchargeRule,
  getRegisteredModules,
  getModuleSurchargeMappings,
  createOrUpdateModuleSurchargeMapping,
  deleteModuleSurchargeMapping,
  SurchargeRuleDto,
  ModuleSurchargeMappingDto,
  ModuleDescriptorDto,
} from "@/lib/api/surcharge";
import { ColumnInterface } from "@/lib/interface/column.interface";
import { useI18n } from "@/context/LanguageContext";
import { headerColumns } from "@/config/headerColumns";
import { AppStatusChip } from "@/components/common/AppStatusChip";
import PageSizeSelect from "@/components/common/PageSizeSelect";
import { TableEmptyState, RowActionButtons } from "@/components/common";

type TabKey = "rules" | "mappings";

export default function SurchargesAdminPage() {
  const { t } = useI18n();
  const tr = t.surchargeEngine;

  const [activeTab, setActiveTab] = useState<TabKey>("rules");
  const [loading, setLoading] = useState<boolean>(true);
  const [pageSize, setPageSize] = useState<number>(10);

  // Rules State
  const [rules, setRules] = useState<SurchargeRuleDto[]>([]);
  const [ruleSearch, setRuleSearch] = useState("");
  const [rulePage, setRulePage] = useState(1);
  const [ruleSort, setRuleSort] = useState<SortDescriptor>({ column: "code", direction: "ascending" });

  // Rule Multi-select Filters
  const [selectedRuleStatuses, setSelectedRuleStatuses] = useState<string[]>([]);
  const [selectedCalcTypes, setSelectedCalcTypes] = useState<string[]>([]);
  const [selectedConditionTypes, setSelectedConditionTypes] = useState<string[]>([]);

  const toggleRuleStatus = (status: string) => {
    setSelectedRuleStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleCalcType = (type: string) => {
    setSelectedCalcTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleConditionType = (type: string) => {
    setSelectedConditionTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const resetRuleFilters = () => {
    setSelectedRuleStatuses([]);
    setSelectedCalcTypes([]);
    setSelectedConditionTypes([]);
  };

  const activeRuleFilterCount =
    selectedRuleStatuses.length +
    selectedCalcTypes.length +
    selectedConditionTypes.length;

  // Mappings State
  const [mappings, setMappings] = useState<ModuleSurchargeMappingDto[]>([]);
  const [modules, setModules] = useState<ModuleDescriptorDto[]>([]);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>("ALL");
  const [mappingPage, setMappingPage] = useState(1);
  const [mappingSort, setMappingSort] = useState<SortDescriptor>({ column: "moduleCode", direction: "ascending" });

  // Modals
  const [isRuleFormOpen, setIsRuleFormOpen] = useState(false);
  const [isRuleDetailOpen, setIsRuleDetailOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<SurchargeRuleDto | null>(null);

  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<ModuleSurchargeMappingDto | null>(null);
  const [defaultRuleIdForMapping, setDefaultRuleIdForMapping] = useState<number | null>(null);
  const [defaultModuleCodeForMapping, setDefaultModuleCodeForMapping] = useState<string | null>(null);
  const [mappingModalMode, setMappingModalMode] = useState<"RULE_TO_MODULES" | "MODULE_TO_RULES" | "EDIT">("MODULE_TO_RULES");
  const [modalLoading, setModalLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rulesRes, mappingsRes, modulesRes] = await Promise.all([
        getSurchargeRules(0, 500),
        getModuleSurchargeMappings(),
        getRegisteredModules(),
      ]);

      if (rulesRes?.data?.content) {
        setRules(rulesRes.data.content);
      }
      if (mappingsRes?.data) {
        setMappings(mappingsRes.data);
      }
      if (modulesRes?.data) {
        setModules(modulesRes.data);
      }
    } catch (err: any) {
      toast.danger("Không thể tải dữ liệu phụ thu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Columns Definitions
  const ruleColumns = headerColumns.surchargeRules(t);
  const mappingColumns = headerColumns.surchargeMappings(t);

  // Filtered & Sorted Rules
  const filteredRules = useMemo(() => {
    const term = ruleSearch.toLowerCase().trim();
    return rules.filter((r) => {
      const matchSearch =
        !term ||
        r.code.toLowerCase().includes(term) ||
        r.name.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term));

      const matchStatus =
        selectedRuleStatuses.length === 0 ||
        (selectedRuleStatuses.includes("active") && r.active) ||
        (selectedRuleStatuses.includes("inactive") && !r.active);

      const matchCalcType =
        selectedCalcTypes.length === 0 ||
        selectedCalcTypes.includes(r.calculationType);

      const condType = (r.condition && typeof r.condition === "object" && (r.condition as any).type)
        ? (r.condition as any).type
        : "always";
      const matchCondType =
        selectedConditionTypes.length === 0 ||
        selectedConditionTypes.some(ct => {
          if (ct === "time_range") return condType === "time_range";
          if (ct === "date_range") return condType === "date_range" || condType === "seasonal";
          if (ct === "day_of_week") return condType === "day_of_week";
          if (ct === "always") return condType === "always" || !r.condition;
          return false;
        });

      return matchSearch && matchStatus && matchCalcType && matchCondType;
    });
  }, [rules, ruleSearch, selectedRuleStatuses, selectedCalcTypes, selectedConditionTypes]);

  const sortedRules = useMemo(() => {
    const { column, direction } = ruleSort;
    const dir = direction === "descending" ? -1 : 1;
    return [...filteredRules].sort((a, b) => {
      let cmp = 0;
      switch (column) {
        case "code": cmp = a.code.localeCompare(b.code); break;
        case "calculationType": cmp = a.calculationType.localeCompare(b.calculationType); break;
        case "value": cmp = Number(a.value) - Number(b.value); break;
        case "active": cmp = Number(a.active) - Number(b.active); break;
        default: cmp = 0;
      }
      return cmp * dir;
    });
  }, [filteredRules, ruleSort]);

  const rulePageCount = Math.max(1, Math.ceil(sortedRules.length / pageSize));
  const paginatedRules = useMemo(() => sortedRules.slice((rulePage - 1) * pageSize, rulePage * pageSize), [sortedRules, rulePage, pageSize]);
  const rulePages = Array.from({ length: rulePageCount }, (_, i) => i + 1);
  const ruleStart = sortedRules.length === 0 ? 0 : (rulePage - 1) * pageSize + 1;
  const ruleEnd = Math.min(rulePage * pageSize, sortedRules.length);

  // Filtered & Sorted Mappings
  const filteredMappings = useMemo(() => {
    let list = mappings;
    if (selectedModuleFilter !== "ALL") {
      list = list.filter((m) => m.moduleCode === selectedModuleFilter);
    }
    if (ruleSearch.trim()) {
      const term = ruleSearch.toLowerCase();
      list = list.filter(
        (m) =>
          (m.moduleCode && m.moduleCode.toLowerCase().includes(term)) ||
          (m.surchargeRule?.name && m.surchargeRule.name.toLowerCase().includes(term)) ||
          (m.surchargeRule?.code && m.surchargeRule.code.toLowerCase().includes(term))
      );
    }
    return list;
  }, [mappings, selectedModuleFilter, ruleSearch]);

  const sortedMappings = useMemo(() => {
    const { column, direction } = mappingSort;
    const dir = direction === "descending" ? -1 : 1;
    return [...filteredMappings].sort((a, b) => {
      let cmp = 0;
      switch (column) {
        case "moduleCode": cmp = (a.moduleCode || "").localeCompare(b.moduleCode || ""); break;
        case "ruleName": cmp = (a.surchargeRule?.name || "").localeCompare(b.surchargeRule?.name || ""); break;
        case "applyOrder": cmp = (a.applyOrder ?? 0) - (b.applyOrder ?? 0); break;
        case "isOptional": cmp = Number(a.isOptional) - Number(b.isOptional); break;
        case "active": cmp = Number(a.active) - Number(b.active); break;
        default: cmp = 0;
      }
      return cmp * dir;
    });
  }, [filteredMappings, mappingSort]);

  const mappingPageCount = Math.max(1, Math.ceil(sortedMappings.length / pageSize));
  const paginatedMappings = useMemo(() => sortedMappings.slice((mappingPage - 1) * pageSize, mappingPage * pageSize), [sortedMappings, mappingPage, pageSize]);
  const mappingPages = Array.from({ length: mappingPageCount }, (_, i) => i + 1);
  const mappingStart = sortedMappings.length === 0 ? 0 : (mappingPage - 1) * pageSize + 1;
  const mappingEnd = Math.min(mappingPage * pageSize, sortedMappings.length);

  // Rule Handlers
  const handleCreateRule = () => {
    setSelectedRule(null);
    setIsRuleFormOpen(true);
  };

  const handleEditRule = (rule: SurchargeRuleDto) => {
    setSelectedRule(rule);
    setIsRuleFormOpen(true);
  };

  const handleViewRule = (rule: SurchargeRuleDto) => {
    setSelectedRule(rule);
    setIsRuleDetailOpen(true);
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm(tr.confirmDeleteRule)) return;
    try {
      await deleteSurchargeRule(id);
      toast.success(tr.deleteSuccess);
      loadData();
    } catch {
      toast.danger("Không thể xóa quy tắc phụ thu");
    }
  };

  const handleRuleSubmit = async (dto: Partial<SurchargeRuleDto>) => {
    setModalLoading(true);
    try {
      if (selectedRule?.id) {
        await updateSurchargeRule(selectedRule.id, dto);
        toast.success(tr.saveSuccess);
      } else {
        await createSurchargeRule(dto);
        toast.success(tr.saveSuccess);
      }
      await loadData();
      setIsRuleFormOpen(false);
    } catch (err: any) {
      toast.danger(err.message || "Lỗi khi lưu quy tắc phụ thu");
    } finally {
      setModalLoading(false);
    }
  };

  // Mapping Handlers
  const handleAssignModuleForRule = (rule: SurchargeRuleDto) => {
    setSelectedMapping(null);
    setDefaultRuleIdForMapping(rule.id ?? null);
    setDefaultModuleCodeForMapping(null);
    setMappingModalMode("RULE_TO_MODULES");
    setIsMappingModalOpen(true);
  };

  const handleCreateMapping = () => {
    setSelectedMapping(null);
    setDefaultRuleIdForMapping(null);
    setDefaultModuleCodeForMapping(selectedModuleFilter !== "ALL" ? selectedModuleFilter : (modules[0]?.moduleCode ?? ""));
    setMappingModalMode("MODULE_TO_RULES");
    setIsMappingModalOpen(true);
  };

  const handleEditMapping = (m: ModuleSurchargeMappingDto) => {
    setSelectedMapping(m);
    setDefaultRuleIdForMapping(m.surchargeRuleId || m.surchargeRule?.id || null);
    setDefaultModuleCodeForMapping(m.moduleCode || null);
    setMappingModalMode("EDIT");
    setIsMappingModalOpen(true);
  };

  const handleDeleteMapping = async (id: number) => {
    if (!confirm(tr.confirmDeleteMapping)) return;
    try {
      await deleteModuleSurchargeMapping(id);
      toast.success(tr.deleteSuccess);
      loadData();
    } catch {
      toast.danger("Không thể xóa ánh xạ");
    }
  };

  const handleMappingSubmit = async (dtos: Partial<ModuleSurchargeMappingDto>[]) => {
    setModalLoading(true);
    try {
      for (const dto of dtos) {
        await createOrUpdateModuleSurchargeMapping(dto);
      }
      toast.success(tr.saveSuccess);
      await loadData();
      setIsMappingModalOpen(false);
    } catch (err: any) {
      toast.danger(err.message || "Lỗi khi lưu ánh xạ");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSyncMapping = async (params: {
    mode: "RULE_TO_MODULES" | "MODULE_TO_RULES" | "EDIT";
    ruleId?: number;
    moduleCode?: string;
    targetModuleCodes?: string[];
    targetRuleIds?: number[];
    applyOrder: number;
    isOptional: boolean;
    active: boolean;
    singleDto?: Partial<ModuleSurchargeMappingDto>;
  }) => {
    setModalLoading(true);
    try {
      if (params.mode === "EDIT" && params.singleDto) {
        await createOrUpdateModuleSurchargeMapping(params.singleDto);
      } else if (params.mode === "RULE_TO_MODULES" && params.ruleId) {
        const currentForThisRule = mappings.filter(
          (m) => (m.surchargeRuleId || m.surchargeRule?.id) === params.ruleId
        );
        const targetCodes = new Set(params.targetModuleCodes || []);

        const toDelete = currentForThisRule.filter((m) => !targetCodes.has(m.moduleCode!));
        for (const m of toDelete) {
          if (m.id) await deleteModuleSurchargeMapping(m.id);
        }

        for (const code of (params.targetModuleCodes || [])) {
          const existing = currentForThisRule.find((m) => m.moduleCode === code);
          await createOrUpdateModuleSurchargeMapping({
            ...(existing?.id ? { id: existing.id } : {}),
            moduleCode: code,
            surchargeRuleId: params.ruleId,
            applyOrder: params.applyOrder,
            isOptional: params.isOptional,
            active: params.active,
          });
        }
      } else if (params.mode === "MODULE_TO_RULES" && params.moduleCode) {
        const currentForThisModule = mappings.filter((m) => m.moduleCode === params.moduleCode);
        const targetRuleIds = new Set(params.targetRuleIds || []);

        const toDelete = currentForThisModule.filter(
          (m) => !targetRuleIds.has(m.surchargeRuleId || m.surchargeRule?.id || 0)
        );
        for (const m of toDelete) {
          if (m.id) await deleteModuleSurchargeMapping(m.id);
        }

        for (const rId of (params.targetRuleIds || [])) {
          const existing = currentForThisModule.find(
            (m) => (m.surchargeRuleId || m.surchargeRule?.id) === rId
          );
          await createOrUpdateModuleSurchargeMapping({
            ...(existing?.id ? { id: existing.id } : {}),
            moduleCode: params.moduleCode,
            surchargeRuleId: rId,
            applyOrder: params.applyOrder,
            isOptional: params.isOptional,
            active: params.active,
          });
        }
      }

      toast.success(tr.saveSuccess);
      await loadData();
      setIsMappingModalOpen(false);
    } catch (err: any) {
      toast.danger(err.message || "Lỗi khi lưu ánh xạ");
    } finally {
      setModalLoading(false);
    }
  };

  const formatConditionSummary = (cond: any) => {
    if (!cond) return "Mọi trường hợp";
    if (cond.type === "time_range") return `Khung giờ: ${cond.from} - ${cond.to}`;
    if (cond.type === "date_range" || cond.type === "seasonal") return `Mùa/Ngày: ${cond.from} - ${cond.to}`;
    if (cond.type === "day_of_week") return `Thứ: ${(cond.days || []).join(", ")}`;
    return cond.type || "Custom";
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-black/10 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Percent className="w-6 h-6 text-primary" />
            {tr.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {tr.description}
          </p>
        </div>

        <Tabs selectedKey={activeTab} onSelectionChange={(k) => { setActiveTab(k as TabKey); setRuleSearch(""); }}>
          <Tabs.List className="w-full">
            <Tabs.Tab id="rules">
              <span className="flex items-center gap-2">
                <Sparkles size={16} />
                {tr.rulesTab} ({rules.length})
              </span>
              <Tabs.Indicator className="bg-[#ffcc00a4]" />
            </Tabs.Tab>
            <Tabs.Tab id="mappings">
              <span className="flex items-center gap-2">
                <Layers size={16} />
                {tr.mappingsTab} ({mappings.length})
              </span>
              <Tabs.Indicator className="bg-[#ffcc00a4]" />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/10">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-grow max-w-2xl">
            <SearchField
              name="search"
              value={ruleSearch}
              onChange={(val: string) => {
                setRuleSearch(val);
                if (activeTab === "rules") setRulePage(1);
                else setMappingPage(1);
              }}
              className="w-full sm:w-80 min-w-[200px]"
            >
              <SearchField.Group className="rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-black/10 text-slate-805 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold">
                <SearchField.SearchIcon />
                <SearchField.Input
                  className="w-full"
                  placeholder={activeTab === "rules" ? tr.filterByCode : "Tìm theo mã module hoặc tên quy tắc..."}
                />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>

            {activeTab === "rules" && (
              <Popover>
                <Button
                  type="button"
                  variant="outline"
                  className={`rounded-xl font-bold text-xs h-10 px-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 cursor-pointer ${
                    activeRuleFilterCount > 0 ? "border-accent/60 bg-accent/5 text-accent dark:text-accent font-extrabold" : ""
                  }`}
                >
                  <Filter size={15} className={activeRuleFilterCount > 0 ? "text-accent" : "text-slate-500"} />
                  <span>{t.common.filter}</span>
                  {activeRuleFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-black flex items-center justify-center">
                      {activeRuleFilterCount}
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
                        {activeRuleFilterCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold text-[10px]">
                            {activeRuleFilterCount}
                          </span>
                        )}
                      </div>
                      {activeRuleFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={resetRuleFilters}
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
                          isSelected={selectedRuleStatuses.includes("active")}
                          onChange={() => toggleRuleStatus("active")}
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
                          isSelected={selectedRuleStatuses.includes("inactive")}
                          onChange={() => toggleRuleStatus("inactive")}
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

                    {/* Loại tính toán */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                        Loại tính toán
                      </span>
                      <div className="space-y-1">
                        <Checkbox
                          isSelected={selectedCalcTypes.includes("PERCENTAGE")}
                          onChange={() => toggleCalcType("PERCENTAGE")}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>Tỷ lệ (%)</span>
                          </Checkbox.Content>
                        </Checkbox>
                        <Checkbox
                          isSelected={selectedCalcTypes.includes("FIXED_AMOUNT")}
                          onChange={() => toggleCalcType("FIXED_AMOUNT")}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>Cố định (VNĐ)</span>
                          </Checkbox.Content>
                        </Checkbox>
                        <Checkbox
                          isSelected={selectedCalcTypes.includes("PER_KM")}
                          onChange={() => toggleCalcType("PER_KM")}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>Theo km</span>
                          </Checkbox.Content>
                        </Checkbox>
                      </div>
                    </div>

                    {/* Loại điều kiện */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                        Loại điều kiện
                      </span>
                      <div className="space-y-1">
                        <Checkbox
                          isSelected={selectedConditionTypes.includes("time_range")}
                          onChange={() => toggleConditionType("time_range")}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>Khung giờ</span>
                          </Checkbox.Content>
                        </Checkbox>
                        <Checkbox
                          isSelected={selectedConditionTypes.includes("date_range")}
                          onChange={() => toggleConditionType("date_range")}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>Khoảng ngày / Mùa</span>
                          </Checkbox.Content>
                        </Checkbox>
                        <Checkbox
                          isSelected={selectedConditionTypes.includes("day_of_week")}
                          onChange={() => toggleConditionType("day_of_week")}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>Ngày trong tuần</span>
                          </Checkbox.Content>
                        </Checkbox>
                        <Checkbox
                          isSelected={selectedConditionTypes.includes("always")}
                          onChange={() => toggleConditionType("always")}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>Mọi trường hợp</span>
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
                setRulePage(1);
                setMappingPage(1);
              }}
            />

            {activeTab === "mappings" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Module:</span>
                <Select
                  selectedKey={selectedModuleFilter}
                  onSelectionChange={(key) => {
                    if (key) {
                      setSelectedModuleFilter(key as string);
                      setMappingPage(1);
                    }
                  }}
                  className="w-48"
                >
                  <Select.Trigger className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-between cursor-pointer">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                    <ListBox>
                      <ListBox.Item key="ALL" id="ALL" textValue={tr.allModules} className="px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                        {tr.allModules}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      {modules.map((m) => (
                        <ListBox.Item key={m.moduleCode} id={m.moduleCode} textValue={`${m.moduleName} (${m.moduleCode})`} className="px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                          {m.moduleName} ({m.moduleCode})
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            )}

            <Button variant="outline" onClick={loadData} isDisabled={loading}>
              <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
              {tr.refresh}
            </Button>
            <Button
              onClick={activeTab === "rules" ? handleCreateRule : handleCreateMapping}
              className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
            >
              <Plus size={16} />
              <span>{activeTab === "rules" ? tr.createRule : tr.assignModule}</span>
            </Button>
          </div>
        </div>

        {/* Active Rules Chips */}
        {activeTab === "rules" && activeRuleFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 w-full">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              {t.common.appliedFilters}:
            </span>
            {selectedRuleStatuses.map((st) => (
              <span
                key={`rst-${st}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <span>{st === "active" ? "Đang hoạt động" : "Tạm ngưng"}</span>
                <button
                  type="button"
                  onClick={() => toggleRuleStatus(st)}
                  className="w-3.5 h-3.5 rounded-full hover:bg-accent/20 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {selectedCalcTypes.map((ct) => (
              <span
                key={`ct-${ct}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <span>{ct === "PERCENTAGE" ? "Tỷ lệ (%)" : ct === "FIXED_AMOUNT" ? "Cố định (VNĐ)" : "Theo km"}</span>
                <button
                  type="button"
                  onClick={() => toggleCalcType(ct)}
                  className="w-3.5 h-3.5 rounded-full hover:bg-accent/20 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {selectedConditionTypes.map((cond) => (
              <span
                key={`cond-${cond}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <span>{cond === "time_range" ? "Khung giờ" : cond === "date_range" ? "Khoảng ngày / Mùa" : cond === "day_of_week" ? "Ngày trong tuần" : "Mọi trường hợp"}</span>
                <button
                  type="button"
                  onClick={() => toggleConditionType(cond)}
                  className="w-3.5 h-3.5 rounded-full hover:bg-accent/20 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={resetRuleFilters}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 underline transition-colors cursor-pointer ml-1"
            >
              {t.common.clearAll}
            </button>
          </div>
        )}
      </div>

      {/* Content Table Container */}
      <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-separator overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="md" className="mr-1.5" />
          </div>
        ) : activeTab === "rules" ? (
          filteredRules.length === 0 ? (
            <TableEmptyState
              icon={Sparkles}
              title="Không tìm thấy quy tắc nào"
              description="Thử thay đổi bộ lọc tìm kiếm hoặc tạo quy tắc mới."
            />
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content
                  aria-label="Surcharge rules table"
                  className="min-w-[700px]"
                  sortDescriptor={ruleSort}
                  onSortChange={setRuleSort}
                >
                  <Table.Header>
                    {ruleColumns.map((col) => (
                      <Table.Column key={col.id} id={col.id} allowsSorting={col.sortable} isRowHeader={col.isRowHeader}>
                        {col.sortable
                          ? ({ sortDirection }) => (<Table.SortableColumnHeader sortDirection={sortDirection}>{col.label}</Table.SortableColumnHeader>)
                          : col.label}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body>
                    {paginatedRules.map((rule) => (
                      <Table.Row key={rule.id} id={String(rule.id)}>
                        <Table.Cell>
                          <div>
                            <span className="font-mono text-xs bg-slate-100 dark:bg-[var(--bg-page)] px-2 py-0.5 rounded font-bold text-primary">
                              {rule.code}
                            </span>
                            <p className="font-bold text-slate-900 dark:text-white mt-1">{rule.name}</p>
                            {rule.description && (
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{rule.description}</p>
                            )}
                          </div>
                        </Table.Cell>

                        <Table.Cell>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                            {rule.calculationType === "PERCENT" ? tr.percent : tr.fixed}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            ({rule.calculationBase === "BASE_PRICE" ? tr.basePrice : tr.runningTotal})
                          </div>
                        </Table.Cell>

                        <Table.Cell>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {rule.calculationType === "PERCENT"
                              ? `+${rule.value}%`
                              : `+${Number(rule.value).toLocaleString()} ${rule.currency}`}
                          </span>
                        </Table.Cell>

                        <Table.Cell>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[var(--bg-elevated)] font-medium text-[11px] text-slate-600 dark:text-slate-300">
                            {formatConditionSummary(rule.condition)}
                          </span>
                        </Table.Cell>

                        <Table.Cell>
                          {rule.effectiveFrom || rule.effectiveTo ? (
                            <span className="text-xs text-slate-500">
                              {rule.effectiveFrom || "..."} ➔ {rule.effectiveTo || "..."}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Không thời hạn</span>
                          )}
                        </Table.Cell>

                        <Table.Cell>
                          <AppStatusChip status={rule.active} />
                        </Table.Cell>

                        <Table.Cell>
                          <div className="flex items-center gap-1.5">
                            <Tooltip delay={300} closeDelay={100}>
                              <Tooltip.Trigger>
                                <Button isIconOnly size="sm" variant="tertiary" aria-label="Gán module" onPress={() => handleAssignModuleForRule(rule)}>
                                  <Layers size={16} />
                                </Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content>
                                <Tooltip.Arrow />
                                Gán module
                              </Tooltip.Content>
                            </Tooltip>

                            <Tooltip delay={300} closeDelay={100}>
                              <Tooltip.Trigger>
                                <Button isIconOnly size="sm" variant="tertiary" aria-label="Xem chi tiết" onPress={() => handleViewRule(rule)}>
                                  <Eye size={16} />
                                </Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content>
                                <Tooltip.Arrow />
                                Xem chi tiết
                              </Tooltip.Content>
                            </Tooltip>

                            <Tooltip delay={300} closeDelay={100}>
                              <Tooltip.Trigger>
                                <Button isIconOnly size="sm" variant="secondary" aria-label="Chỉnh sửa" onPress={() => handleEditRule(rule)}>
                                  <Edit3 size={16} />
                                </Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content>
                                <Tooltip.Arrow />
                                Chỉnh sửa
                              </Tooltip.Content>
                            </Tooltip>

                            <Tooltip delay={300} closeDelay={100}>
                              <Tooltip.Trigger>
                                <Button isIconOnly size="sm" variant="danger" aria-label="Xóa" onPress={() => rule.id && handleDeleteRule(rule.id)}>
                                  <Trash2 size={16} />
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
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>

              <Table.Footer>
                <Pagination size="sm">
                  <Pagination.Summary>{ruleStart} - {ruleEnd} trên {sortedRules.length} kết quả</Pagination.Summary>
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.Previous isDisabled={rulePage <= 1} onPress={() => setRulePage(p => Math.max(1, p - 1))}>
                        <Pagination.PreviousIcon />
                        Trước
                      </Pagination.Previous>
                    </Pagination.Item>
                    {rulePages.map((p) => (
                      <Pagination.Item key={p}>
                        <Pagination.Link isActive={p === rulePage} onPress={() => setRulePage(p)}>{p}</Pagination.Link>
                      </Pagination.Item>
                    ))}
                    <Pagination.Item>
                      <Pagination.Next isDisabled={rulePage >= rulePageCount} onPress={() => setRulePage(p => Math.min(rulePageCount, p + 1))}>
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
          /* Tab 2: Mappings Table */
          filteredMappings.length === 0 ? (
            <TableEmptyState
              icon={Layers}
              title="Không tìm thấy ánh xạ nào"
              description="Chưa có ánh xạ quy tắc nào cho module đã chọn."
            />
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content
                  aria-label="Module surcharge mappings table"
                  className="min-w-[700px]"
                  sortDescriptor={mappingSort}
                  onSortChange={setMappingSort}
                >
                  <Table.Header>
                    {mappingColumns.map((col) => (
                      <Table.Column key={col.id} id={col.id} allowsSorting={col.sortable} isRowHeader={col.isRowHeader}>
                        {col.sortable
                          ? ({ sortDirection }) => (<Table.SortableColumnHeader sortDirection={sortDirection}>{col.label}</Table.SortableColumnHeader>)
                          : col.label}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body>
                    {paginatedMappings.map((m) => (
                      <Table.Row key={m.id} id={String(m.id)}>
                        <Table.Cell>
                          <span className="font-mono text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-bold uppercase">
                            {m.moduleCode}
                          </span>
                        </Table.Cell>

                        <Table.Cell>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {m.surchargeRule?.name || `Rule #${m.surchargeRuleId}`}
                            </p>
                            <span className="font-mono text-xs text-slate-400">
                              {m.surchargeRule?.code}
                            </span>
                          </div>
                        </Table.Cell>

                        <Table.Cell>
                          {m.surchargeRule ? (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                              {m.surchargeRule.calculationType === "PERCENT"
                                ? `+${m.surchargeRule.value}%`
                                : `+${Number(m.surchargeRule.value).toLocaleString()} ${m.surchargeRule.currency}`}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </Table.Cell>

                        <Table.Cell>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {m.applyOrder ?? 0}
                          </span>
                        </Table.Cell>

                        <Table.Cell>
                          {m.isOptional ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">
                              Tùy chọn
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Bắt buộc</span>
                          )}
                        </Table.Cell>

                        <Table.Cell>
                          <AppStatusChip status={m.active} />
                        </Table.Cell>

                        <Table.Cell>
                          <RowActionButtons
                            onEdit={() => handleEditMapping(m)}
                            editLabel="Chỉnh sửa"
                            onDelete={() => m.id && handleDeleteMapping(m.id)}
                            deleteLabel="Gỡ ánh xạ"
                          />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>

              <Table.Footer>
                <Pagination size="sm">
                  <Pagination.Summary>{mappingStart} - {mappingEnd} trên {sortedMappings.length} kết quả</Pagination.Summary>
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.Previous isDisabled={mappingPage <= 1} onPress={() => setMappingPage(p => Math.max(1, p - 1))}>
                        <Pagination.PreviousIcon />
                        Trước
                      </Pagination.Previous>
                    </Pagination.Item>
                    {mappingPages.map((p) => (
                      <Pagination.Item key={p}>
                        <Pagination.Link isActive={p === mappingPage} onPress={() => setMappingPage(p)}>{p}</Pagination.Link>
                      </Pagination.Item>
                    ))}
                    <Pagination.Item>
                      <Pagination.Next isDisabled={mappingPage >= mappingPageCount} onPress={() => setMappingPage(p => Math.min(mappingPageCount, p + 1))}>
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

      {/* Modals */}
      <SurchargeCreateUpdateModal
        isOpen={isRuleFormOpen}
        onClose={() => setIsRuleFormOpen(false)}
        onSubmit={handleRuleSubmit}
        initialData={selectedRule}
        loading={modalLoading}
      />

      <SurchargeDetailModal
        isOpen={isRuleDetailOpen}
        onClose={() => setIsRuleDetailOpen(false)}
        rule={selectedRule}
        mappings={mappings}
        onAssignModule={handleAssignModuleForRule}
        onDeleteMapping={handleDeleteMapping}
      />

      <MappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        onSubmit={handleMappingSubmit}
        onSyncMapping={handleSyncMapping}
        modules={modules}
        rules={rules}
        mappings={mappings}
        initialData={selectedMapping}
        defaultRuleId={defaultRuleIdForMapping}
        defaultModuleCode={defaultModuleCodeForMapping}
        mode={mappingModalMode}
        loading={modalLoading}
      />
    </div>
  );
}
