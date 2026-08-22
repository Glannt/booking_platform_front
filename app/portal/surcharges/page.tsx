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
} from "lucide-react";
import { SurchargeFormModal } from "@/components/admin/surcharges/SurchargeFormModal";
import { SurchargeDetailModal } from "@/components/admin/surcharges/SurchargeDetailModal";
import { MappingModal } from "@/components/admin/surcharges/MappingModal";
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
  type SortDescriptor,
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

const PAGE_SIZE = 10;
type TabKey = "rules" | "mappings";

export default function SurchargesAdminPage() {
  const { t } = useI18n();
  const tr = t.surchargeEngine;

  const [activeTab, setActiveTab] = useState<TabKey>("rules");
  const [loading, setLoading] = useState(true);

  // Rules State
  const [rules, setRules] = useState<SurchargeRuleDto[]>([]);
  const [ruleSearch, setRuleSearch] = useState("");
  const [rulePage, setRulePage] = useState(1);
  const [ruleSort, setRuleSort] = useState<SortDescriptor>({ column: "code", direction: "ascending" });

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
  const ruleColumns: ColumnInterface[] = [
    { id: "code", label: "Mã & Tên", sortable: true, isRowHeader: true },
    { id: "calculationType", label: "Loại tính toán", sortable: true },
    { id: "value", label: "Giá trị", sortable: true },
    { id: "condition", label: "Điều kiện", sortable: false },
    { id: "effective", label: "Hiệu lực", sortable: false },
    { id: "active", label: "Trạng thái", sortable: true },
    { id: "actions", label: "Thao tác", sortable: false },
  ];

  const mappingColumns: ColumnInterface[] = [
    { id: "moduleCode", label: "Module", sortable: true, isRowHeader: true },
    { id: "ruleName", label: "Quy tắc phụ thu", sortable: true },
    { id: "value", label: "Giá trị", sortable: false },
    { id: "applyOrder", label: "Thứ tự (Order)", sortable: true },
    { id: "isOptional", label: "Tùy chọn", sortable: true },
    { id: "active", label: "Trạng thái", sortable: true },
    { id: "actions", label: "Thao tác", sortable: false },
  ];

  // Filtered & Sorted Rules
  const filteredRules = useMemo(() => {
    if (!ruleSearch.trim()) return rules;
    const term = ruleSearch.toLowerCase();
    return rules.filter(
      (r) =>
        r.code.toLowerCase().includes(term) ||
        r.name.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term))
    );
  }, [rules, ruleSearch]);

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

  const rulePageCount = Math.max(1, Math.ceil(sortedRules.length / PAGE_SIZE));
  const paginatedRules = useMemo(() => sortedRules.slice((rulePage - 1) * PAGE_SIZE, rulePage * PAGE_SIZE), [sortedRules, rulePage]);
  const rulePages = Array.from({ length: rulePageCount }, (_, i) => i + 1);
  const ruleStart = sortedRules.length === 0 ? 0 : (rulePage - 1) * PAGE_SIZE + 1;
  const ruleEnd = Math.min(rulePage * PAGE_SIZE, sortedRules.length);

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

  const mappingPageCount = Math.max(1, Math.ceil(sortedMappings.length / PAGE_SIZE));
  const paginatedMappings = useMemo(() => sortedMappings.slice((mappingPage - 1) * PAGE_SIZE, mappingPage * PAGE_SIZE), [sortedMappings, mappingPage]);
  const mappingPages = Array.from({ length: mappingPageCount }, (_, i) => i + 1);
  const mappingStart = sortedMappings.length === 0 ? 0 : (mappingPage - 1) * PAGE_SIZE + 1;
  const mappingEnd = Math.min(mappingPage * PAGE_SIZE, sortedMappings.length);

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
      setIsRuleFormOpen(false);
      loadData();
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
      setIsMappingModalOpen(false);
      loadData();
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
      setIsMappingModalOpen(false);
      loadData();
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
          <Tabs.ListContainer>
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
          </Tabs.ListContainer>
        </Tabs>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/10">
        <SearchField
          name="search"
          value={ruleSearch}
          onChange={(val: string) => {
            setRuleSearch(val);
            if (activeTab === "rules") setRulePage(1);
            else setMappingPage(1);
          }}
          fullWidth
          className="min-w-[200px]"
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

        <div className="flex gap-3 shrink-0">
          <Button variant="outline" onClick={loadData} isDisabled={loading}>
            <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            {tr.refresh}
          </Button>
          <Button onClick={activeTab === "rules" ? handleCreateRule : handleCreateMapping}>
            <Plus size={16} />
            {activeTab === "rules" ? tr.createRule : tr.assignModule}
          </Button>
        </div>
      </div>

      {/* Content Table Container */}
      <div className="bg-white dark:bg-black/10 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="md" className="mr-1.5" />
          </div>
        ) : activeTab === "rules" ? (
          filteredRules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <Sparkles className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Không tìm thấy quy tắc nào</h3>
              <p className="text-xs text-slate-500">Thử thay đổi bộ lọc tìm kiếm hoặc tạo quy tắc mới.</p>
            </div>
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
                          <Chip
                            variant="soft"
                            color={rule.active ? "success" : "danger"}
                            className="text-[10px] font-bold"
                          >
                            {rule.active ? tr.active : tr.inactive}
                          </Chip>
                        </Table.Cell>

                        <Table.Cell>
                          <div className="flex gap-1.5">
                            <Button isIconOnly size="sm" variant="ghost" aria-label="Gán module" onPress={() => handleAssignModuleForRule(rule)}>
                              <Layers size={16} />
                            </Button>
                            <Button isIconOnly size="sm" variant="ghost" aria-label="Xem chi tiết" onPress={() => handleViewRule(rule)}>
                              <Eye size={16} />
                            </Button>
                            <Button isIconOnly size="sm" variant="ghost" aria-label="Chỉnh sửa" onPress={() => handleEditRule(rule)}>
                              <Edit3 size={16} />
                            </Button>
                            <Button isIconOnly size="sm" variant="ghost" aria-label="Xóa" onPress={() => rule.id && handleDeleteRule(rule.id)}>
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
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <Layers className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Không tìm thấy ánh xạ nào</h3>
              <p className="text-xs text-slate-500">Chưa có ánh xạ quy tắc nào cho module đã chọn.</p>
            </div>
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
                          <Chip
                            variant="soft"
                            color={m.active ? "success" : "danger"}
                            className="text-[10px] font-bold"
                          >
                            {m.active ? tr.active : tr.inactive}
                          </Chip>
                        </Table.Cell>

                        <Table.Cell>
                          <div className="flex gap-1.5">
                            <Button isIconOnly size="sm" variant="ghost" aria-label="Chỉnh sửa" onPress={() => handleEditMapping(m)}>
                              <Edit3 size={16} />
                            </Button>
                            <Button isIconOnly size="sm" variant="ghost" aria-label="Gỡ ánh xạ" onPress={() => m.id && handleDeleteMapping(m.id)}>
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
      <SurchargeFormModal
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
