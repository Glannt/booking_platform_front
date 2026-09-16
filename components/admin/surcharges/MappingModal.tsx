"use client";

import React, { useState, useEffect } from "react";
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
  Select,
  ListBox,
  Checkbox,
  toast,
} from "@heroui/react";
import { Layers, Trash2, X, Save, RefreshCw } from "lucide-react";
import {
  ModuleDescriptorDto,
  ModuleSurchargeMappingDto,
  SurchargeRuleDto,
} from "@/lib/api/surcharge";
import { useI18n } from "@/context/LanguageContext";

export type MappingModalMode = "RULE_TO_MODULES" | "MODULE_TO_RULES" | "EDIT";

export interface SyncMappingParams {
  mode: MappingModalMode;
  ruleId?: number;
  moduleCode?: string;
  targetModuleCodes?: string[];
  targetRuleIds?: number[];
  applyOrder: number;
  isOptional: boolean;
  active: boolean;
  singleDto?: Partial<ModuleSurchargeMappingDto>;
}

interface MappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dtos: Partial<ModuleSurchargeMappingDto>[]) => Promise<void>;
  onSyncMapping?: (params: SyncMappingParams) => Promise<void>;
  modules: ModuleDescriptorDto[];
  rules: SurchargeRuleDto[];
  mappings?: ModuleSurchargeMappingDto[];
  initialData?: ModuleSurchargeMappingDto | null;
  defaultRuleId?: number | null;
  defaultModuleCode?: string | null;
  mode?: MappingModalMode;
  loading?: boolean;
}

export function MappingModal({
  isOpen,
  onClose,
  onSubmit,
  onSyncMapping,
  modules,
  rules,
  mappings = [],
  initialData,
  defaultRuleId,
  defaultModuleCode,
  mode = "MODULE_TO_RULES",
  loading = false,
}: MappingModalProps) {
  const { t } = useI18n();
  const tr = t.surchargeEngine;

  // State for Single Module / Single Rule
  const [singleModuleCode, setSingleModuleCode] = useState("");
  const [singleRuleId, setSingleRuleId] = useState<number | null>(null);

  // State for Multiple Modules (when mode is RULE_TO_MODULES)
  const [selectedModuleCodes, setSelectedModuleCodes] = useState<string[]>([]);

  // State for Multiple Rules (when mode is MODULE_TO_RULES)
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);

  const [applyOrder, setApplyOrder] = useState<number>(0);
  const [isOptional, setIsOptional] = useState(false);
  const [active, setActive] = useState(true);

  // Load initial data and existing mappings
  useEffect(() => {
    if (!isOpen) return;

    if (mode === "EDIT" && initialData) {
      setSingleModuleCode(initialData.moduleCode || (modules[0]?.moduleCode ?? ""));
      setSingleRuleId(
        initialData.surchargeRuleId ||
        initialData.surchargeRule?.id ||
        (rules[0]?.id ?? null)
      );
      setApplyOrder(initialData.applyOrder || 0);
      setIsOptional(initialData.isOptional || false);
      setActive(initialData.active !== undefined ? initialData.active : true);
    } else if (mode === "RULE_TO_MODULES") {
      // 1 Rule -> Multiple Modules
      const targetRuleId = defaultRuleId || (rules[0]?.id ?? null);
      setSingleRuleId(targetRuleId);

      // Pre-fill with currently mapped modules for this rule
      const existingCodes = mappings
        .filter((m) => (m.surchargeRuleId || m.surchargeRule?.id) === targetRuleId)
        .map((m) => m.moduleCode!)
        .filter(Boolean);
      setSelectedModuleCodes(existingCodes);

      // Get applyOrder, isOptional, active from first existing mapping if available
      const firstExisting = mappings.find((m) => (m.surchargeRuleId || m.surchargeRule?.id) === targetRuleId);
      setApplyOrder(firstExisting?.applyOrder ?? 0);
      setIsOptional(firstExisting?.isOptional ?? false);
      setActive(firstExisting?.active ?? true);
    } else {
      // MODULE_TO_RULES: 1 Module -> Multiple Rules
      const targetModuleCode = defaultModuleCode || (modules[0]?.moduleCode ?? "");
      setSingleModuleCode(targetModuleCode);

      // Pre-fill with currently mapped rules for this module
      const existingRuleIds = mappings
        .filter((m) => m.moduleCode === targetModuleCode)
        .map((m) => String(m.surchargeRuleId || m.surchargeRule?.id))
        .filter(Boolean);
      setSelectedRuleIds(existingRuleIds);

      // Get applyOrder, isOptional, active from first existing mapping if available
      const firstExisting = mappings.find((m) => m.moduleCode === targetModuleCode);
      setApplyOrder(firstExisting?.applyOrder ?? 0);
      setIsOptional(firstExisting?.isOptional ?? false);
      setActive(firstExisting?.active ?? true);
    }
  }, [isOpen, mode, initialData, defaultRuleId, defaultModuleCode, modules, rules, mappings]);

  // When changing singleRuleId in RULE_TO_MODULES mode, reload that rule's mapped modules
  const handleRuleChangeInRuleToModules = (rId: number) => {
    setSingleRuleId(rId);
    const existingCodes = mappings
      .filter((m) => (m.surchargeRuleId || m.surchargeRule?.id) === rId)
      .map((m) => m.moduleCode!)
      .filter(Boolean);
    setSelectedModuleCodes(existingCodes);
  };

  // When changing singleModuleCode in MODULE_TO_RULES mode, reload that module's mapped rules
  const handleModuleChangeInModuleToRules = (mCode: string) => {
    setSingleModuleCode(mCode);
    const existingRuleIds = mappings
      .filter((m) => m.moduleCode === mCode)
      .map((m) => String(m.surchargeRuleId || m.surchargeRule?.id))
      .filter(Boolean);
    setSelectedRuleIds(existingRuleIds);
  };

  const handleToggleModuleCode = (code: string) => {
    setSelectedModuleCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleToggleRuleId = (rId: string) => {
    setSelectedRuleIds((prev) =>
      prev.includes(rId) ? prev.filter((id) => id !== rId) : [...prev, rId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "EDIT") {
      if (!singleModuleCode) {
        toast.danger("Vui lòng chọn module!");
        return;
      }
      if (!singleRuleId) {
        toast.danger("Vui lòng chọn quy tắc phụ thu!");
        return;
      }
      const singleDto: Partial<ModuleSurchargeMappingDto> = {
        id: initialData?.id,
        moduleCode: singleModuleCode,
        surchargeRuleId: Number(singleRuleId),
        applyOrder: Number(applyOrder),
        isOptional,
        active,
      };

      if (onSyncMapping) {
        await onSyncMapping({
          mode: "EDIT",
          applyOrder: Number(applyOrder),
          isOptional,
          active,
          singleDto,
        });
      } else {
        await onSubmit([singleDto]);
      }
    } else if (mode === "RULE_TO_MODULES") {
      if (!singleRuleId) {
        toast.danger("Vui lòng chọn quy tắc phụ thu!");
        return;
      }
      if (onSyncMapping) {
        await onSyncMapping({
          mode: "RULE_TO_MODULES",
          ruleId: Number(singleRuleId),
          targetModuleCodes: selectedModuleCodes,
          applyOrder: Number(applyOrder),
          isOptional,
          active,
        });
      } else {
        const dtos: Partial<ModuleSurchargeMappingDto>[] = selectedModuleCodes.map((code) => ({
          moduleCode: code,
          surchargeRuleId: Number(singleRuleId),
          applyOrder: Number(applyOrder),
          isOptional,
          active,
        }));
        await onSubmit(dtos);
      }
    } else {
      // MODULE_TO_RULES
      if (!singleModuleCode) {
        toast.danger("Vui lòng chọn module!");
        return;
      }
      if (onSyncMapping) {
        await onSyncMapping({
          mode: "MODULE_TO_RULES",
          moduleCode: singleModuleCode,
          targetRuleIds: selectedRuleIds.map(Number),
          applyOrder: Number(applyOrder),
          isOptional,
          active,
        });
      } else {
        const dtos: Partial<ModuleSurchargeMappingDto>[] = selectedRuleIds.map((rId) => ({
          moduleCode: singleModuleCode,
          surchargeRuleId: Number(rId),
          applyOrder: Number(applyOrder),
          isOptional,
          active,
        }));
        await onSubmit(dtos);
      }
    }
  };

  if (!isOpen) return null;

  const modalTitle =
    mode === "EDIT"
      ? tr.editMapping
      : mode === "RULE_TO_MODULES"
      ? "Gán quy tắc vào các Module"
      : "Gán phụ thu cho Module";

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalBackdrop>
        <ModalContainer>
          <ModalDialog className="w-full max-w-lg bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <ModalCloseTrigger />
            <ModalHeader className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {modalTitle}
                </h2>
              </div>
            </ModalHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                {/* ── CASE 1: EDIT MODE (Single Module + Single Rule) ── */}
                {mode === "EDIT" && (
                  <>
                    <div>
                      <Select
                        className="w-full"
                        placeholder="Chọn module"
                        selectionMode="single"
                        selectedKey={singleModuleCode}
                        onSelectionChange={(key) => {
                          if (key) setSingleModuleCode(key as string);
                        }}
                        isRequired
                      >
                        <Label className="text-xs font-bold mb-1 block">
                          {tr.moduleCode}
                        </Label>
                        <Select.Trigger className="w-full px-3 py-2 rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border-1 border-separator rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                          <ListBox selectionMode="single">
                            {modules.map((m) => (
                              <ListBox.Item
                                key={m.moduleCode}
                                id={m.moduleCode}
                                textValue={`${m.moduleName} (${m.moduleCode})`}
                                className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100 flex items-center justify-between"
                              >
                                {m.moduleName} ({m.moduleCode})
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>

                    <div>
                      <Select
                        className="w-full"
                        placeholder="Chọn quy tắc phụ thu"
                        selectionMode="single"
                        selectedKey={singleRuleId != null ? String(singleRuleId) : undefined}
                        onSelectionChange={(key) => {
                          if (key != null) setSingleRuleId(Number(key));
                        }}
                        isRequired
                      >
                        <Label className="text-xs font-bold mb-1 block">
                          {tr.rulesTab}
                        </Label>
                        <Select.Trigger className="w-full px-3 py-2 rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border-1 border-separator rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                          <ListBox selectionMode="single">
                            {rules.map((r) => {
                              const label = `${r.name} (${r.code} - ${r.calculationType === "PERCENT" ? `${r.value}%` : `${r.value} ${r.currency}`})`;
                              return (
                                <ListBox.Item
                                  key={r.id}
                                  id={String(r.id)}
                                  textValue={label}
                                  className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100 flex items-center justify-between"
                                >
                                  {label}
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                              );
                            })}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>
                  </>
                )}

                {/* ── CASE 2: RULE_TO_MODULES (1 Rule -> Multiple Modules) ── */}
                {mode === "RULE_TO_MODULES" && (
                  <>
                    <div>
                      <Select
                        className="w-full"
                        placeholder="Chọn quy tắc phụ thu"
                        selectionMode="single"
                        selectedKey={singleRuleId != null ? String(singleRuleId) : undefined}
                        onSelectionChange={(key) => {
                          if (key != null) handleRuleChangeInRuleToModules(Number(key));
                        }}
                        isRequired
                      >
                        <Label className="text-xs font-bold mb-1 block">
                          {tr.rulesTab}
                        </Label>
                        <Select.Trigger className="w-full px-3 py-2 rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border-1 border-separator rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                          <ListBox selectionMode="single">
                            {rules.map((r) => {
                              const label = `${r.name} (${r.code} - ${r.calculationType === "PERCENT" ? `${r.value}%` : `${r.value} ${r.currency}`})`;
                              return (
                                <ListBox.Item
                                  key={r.id}
                                  id={String(r.id)}
                                  textValue={label}
                                  className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100 flex items-center justify-between"
                                >
                                  {label}
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                              );
                            })}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-bold mb-1 block">
                        {tr.moduleCode} (tích chọn các module áp dụng)
                      </Label>

                      {/* Interactive checkboxes list for modules */}
                      <div className="space-y-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[var(--bg-surface)] max-h-48 overflow-y-auto">
                        {modules.map((m) => {
                          const isSelected = selectedModuleCodes.includes(m.moduleCode);
                          return (
                            <div
                              key={m.moduleCode}
                              onClick={() => handleToggleModuleCode(m.moduleCode)}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-primary/10 text-primary font-bold"
                                  : "hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 font-medium"
                              }`}
                            >
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-primary" : "bg-slate-300 dark:bg-[var(--bg-elevated)]"}`} />
                                <span>{m.moduleName}</span>
                                <span className="text-[10px] text-slate-400">({m.moduleCode})</span>
                              </div>
                              <Checkbox
                                isSelected={isSelected}
                                onChange={() => handleToggleModuleCode(m.moduleCode)}
                              >
                                <Checkbox.Content>
                                  <Checkbox.Control>
                                    <Checkbox.Indicator />
                                  </Checkbox.Control>
                                </Checkbox.Content>
                              </Checkbox>
                            </div>
                          );
                        })}
                      </div>

                      {/* Selected Tags list with Delete buttons */}
                      {selectedModuleCodes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {selectedModuleCodes.map((code) => {
                            const mod = modules.find((m) => m.moduleCode === code);
                            const label = mod ? `${mod.moduleName} (${mod.moduleCode})` : code;
                            return (
                              <span
                                key={code}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20"
                              >
                                <span>{label}</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleModuleCode(code)}
                                  className="hover:text-rose-500 rounded p-0.5"
                                  title="Gỡ module này"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                          ⚠️ Chưa chọn module nào (lưu sẽ gỡ quy tắc này khỏi tất cả module).
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* ── CASE 3: MODULE_TO_RULES (1 Module -> Multiple Rules) ── */}
                {mode === "MODULE_TO_RULES" && (
                  <>
                    <div>
                      <Select
                        className="w-full"
                        placeholder="Chọn module áp dụng"
                        selectionMode="single"
                        selectedKey={singleModuleCode}
                        onSelectionChange={(key) => {
                          if (key) handleModuleChangeInModuleToRules(key as string);
                        }}
                        isRequired
                      >
                        <Label className="text-xs font-bold mb-1 block">
                          {tr.moduleCode}
                        </Label>
                        <Select.Trigger className="w-full px-3 py-2 rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 text-sm font-bold flex items-center justify-between cursor-pointer h-[40px]">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border-1 border-separator rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                          <ListBox selectionMode="single">
                            {modules.map((m) => (
                              <ListBox.Item
                                key={m.moduleCode}
                                id={m.moduleCode}
                                textValue={`${m.moduleName} (${m.moduleCode})`}
                                className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-800 dark:text-slate-100 flex items-center justify-between"
                              >
                                {m.moduleName} ({m.moduleCode})
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-bold mb-1 block">
                        {tr.rulesTab} (tích chọn các quy tắc phụ thu áp dụng)
                      </Label>

                      {/* Interactive checkboxes list for rules */}
                      <div className="space-y-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[var(--bg-surface)] max-h-56 overflow-y-auto">
                        {rules.map((r) => {
                          const rIdStr = String(r.id);
                          const isSelected = selectedRuleIds.includes(rIdStr);
                          return (
                            <div
                              key={r.id}
                              onClick={() => handleToggleRuleId(rIdStr)}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-primary/10 text-primary font-bold"
                                  : "hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 font-medium"
                              }`}
                            >
                              <div className="flex items-center gap-2 text-xs min-w-0 pr-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? "bg-primary" : "bg-slate-300 dark:bg-[var(--bg-elevated)]"}`} />
                                <div className="truncate">
                                  <span>{r.name}</span>
                                  <span className="text-[10px] text-slate-400 ml-1">
                                    ({r.code} - {r.calculationType === "PERCENT" ? `${r.value}%` : `${r.value} ${r.currency}`})
                                  </span>
                                </div>
                              </div>
                              <Checkbox
                                isSelected={isSelected}
                                onChange={() => handleToggleRuleId(rIdStr)}
                              >
                                <Checkbox.Content>
                                  <Checkbox.Control>
                                    <Checkbox.Indicator />
                                  </Checkbox.Control>
                                </Checkbox.Content>
                              </Checkbox>
                            </div>
                          );
                        })}
                      </div>

                      {/* Selected Tags list with Delete buttons */}
                      {selectedRuleIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {selectedRuleIds.map((rId) => {
                            const rule = rules.find((r) => String(r.id) === rId);
                            const label = rule ? `${rule.name} (${rule.code})` : `Rule #${rId}`;
                            return (
                              <span
                                key={rId}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20"
                              >
                                <span>{label}</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleRuleId(rId)}
                                  className="hover:text-rose-500 rounded p-0.5"
                                  title="Gỡ quy tắc này"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                          ⚠️ Chưa chọn quy tắc nào (lưu sẽ gỡ tất cả quy tắc khỏi module này).
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Apply Order */}
                <div>
                  <Label className="text-xs font-bold mb-1 block">
                    {tr.applyOrder}
                  </Label>
                  <Input
                    type="number"
                    value={applyOrder}
                    onChange={(e) => setApplyOrder(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full h-10 px-3 rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-sm text-slate-800 dark:text-slate-100 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Thứ tự áp dụng khi tính toán (số nhỏ hơn áp dụng trước).
                  </p>
                </div>

                {/* Optional switch */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[var(--bg-surface)]">
                  <div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {tr.isOptional}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Khách hàng có thể chọn bỏ qua phụ thu này
                    </div>
                  </div>
                  <Checkbox isSelected={isOptional} onChange={(val: boolean) => setIsOptional(val)}>
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                </div>

                {/* Active switch */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[var(--bg-surface)]">
                  <div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {tr.status}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {active ? tr.active : tr.inactive}
                    </div>
                  </div>
                  <Checkbox isSelected={active} onChange={(val: boolean) => setActive(val)}>
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                </div>

              </ModalBody>
              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onPress={onClose}
                  isDisabled={loading}
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isDisabled={loading}
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                >
                  {loading ? (
                    <RefreshCw size={15} className="animate-spin mr-1.5" />
                  ) : (
                    <Save size={15} className="mr-1.5" />
                  )}
                  Lưu ánh xạ
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
