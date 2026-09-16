"use client";

import React from "react";
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
  Chip,
  Input,
  Label,
} from "@heroui/react";
import { Sparkles, Layers, Plus, Code2, X } from "lucide-react";
import { SurchargeRuleDto, ModuleSurchargeMappingDto } from "@/lib/api/surcharge";
import { useI18n } from "@/context/LanguageContext";

interface SurchargeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: SurchargeRuleDto | null;
  mappings?: ModuleSurchargeMappingDto[];
  onAssignModule?: (rule: SurchargeRuleDto) => void;
  onDeleteMapping?: (mappingId: number) => Promise<void>;
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Thứ Hai",
  TUESDAY: "Thứ Ba",
  WEDNESDAY: "Thứ Tư",
  THURSDAY: "Thứ Năm",
  FRIDAY: "Thứ Sáu",
  SATURDAY: "Thứ Bảy",
  SUNDAY: "Chủ Nhật",
};

export function SurchargeDetailModal({
  isOpen,
  onClose,
  rule,
  mappings = [],
  onAssignModule,
  onDeleteMapping,
}: SurchargeDetailModalProps) {
  const { t } = useI18n();
  const tr = t.surchargeEngine;

  if (!isOpen || !rule) return null;

  const relevantMappings = mappings.filter(
    (m) => m.surchargeRuleId === rule.id || m.surchargeRule?.id === rule.id
  );

  const cond = rule.condition as any;
  const condType = cond?.type;

  const getConditionTypeLabel = (type?: string) => {
    if (!type) return "Áp dụng cho mọi trường hợp (Không có điều kiện)";
    if (type === "date_range" || type === "seasonal") return "Khoảng ngày / Theo mùa (date_range)";
    if (type === "time_range") return "Khung giờ trong ngày (time_range)";
    if (type === "day_of_week") return "Ngày trong tuần (day_of_week)";
    if (type === "zone") return "Theo khu vực (zone)";
    if (type === "vehicle_category") return "Theo hạng xe (vehicle_category)";
    if (type === "route") return "Theo tuyến đường (route)";
    if (type === "and") return "Tổ hợp AND (Tất cả điều kiện phải thỏa mãn)";
    if (type === "or") return "Tổ hợp OR (Một trong các điều kiện thỏa mãn)";
    return `Tùy chỉnh (${type})`;
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalBackdrop>
        <ModalContainer>
          <ModalDialog className="w-full max-w-2xl bg-white dark:bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <ModalCloseTrigger />
            <ModalHeader className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {tr.ruleDetail}
                </h2>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
              {/* Header info */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary uppercase">
                    {rule.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1.5">
                    {rule.name}
                  </h3>
                </div>
                <Chip
                  variant="soft"
                  color={rule.active ? "success" : "danger"}
                  className="text-xs font-bold"
                >
                  {rule.active ? tr.active : tr.inactive}
                </Chip>
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs font-bold mb-1 block">
                  {tr.descriptionLabel}
                </Label>
                <Input
                  readOnly
                  value={rule.description || "Không có mô tả."}
                  className="w-full h-10 px-3 rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-xs text-slate-700 dark:text-slate-300 outline-none cursor-default"
                />
              </div>

              {/* Pricing details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold mb-1 block">
                    {tr.calcType} & Mức phụ thu
                  </Label>
                  <Input
                    readOnly
                    value={
                      rule.calculationType === "PERCENT"
                        ? `+${rule.value}% (${tr.percent})`
                        : `+${Number(rule.value).toLocaleString()} ${rule.currency} (${tr.fixed})`
                    }
                    className="w-full h-10 px-3 rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-xs font-bold text-emerald-600 dark:text-emerald-400 outline-none cursor-default"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold mb-1 block">
                    {tr.calcBase}
                  </Label>
                  <Input
                    readOnly
                    value={rule.calculationBase === "BASE_PRICE" ? tr.basePrice : tr.runningTotal}
                    className="w-full h-10 px-3 rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-default"
                  />
                </div>
              </div>

              {/* Condition Section (Rendered as clean read-only Inputs) */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[var(--bg-surface)] space-y-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {tr.condition}
                  </span>
                </div>

                <div>
                  <Label className="text-[11px] font-semibold mb-1 block">
                    {tr.conditionType}
                  </Label>
                  <Input
                    readOnly
                    value={getConditionTypeLabel(condType)}
                    className="w-full h-10 px-3 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-default"
                  />
                </div>

                {/* Date range details */}
                {(condType === "date_range" || condType === "seasonal") && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] font-semibold mb-1 block">
                        {tr.fromDate}
                      </Label>
                      <Input
                        readOnly
                        value={cond.from || "—"}
                        className="w-full h-10 px-3 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-default"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold mb-1 block">
                        {tr.toDate}
                      </Label>
                      <Input
                        readOnly
                        value={cond.to || "—"}
                        className="w-full h-10 px-3 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-default"
                      />
                    </div>
                  </div>
                )}

                {/* Time range details */}
                {condType === "time_range" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] font-semibold mb-1 block">
                        {tr.fromTime}
                      </Label>
                      <Input
                        readOnly
                        value={cond.from || "—"}
                        className="w-full h-10 px-3 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-default"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold mb-1 block">
                        {tr.toTime}
                      </Label>
                      <Input
                        readOnly
                        value={cond.to || "—"}
                        className="w-full h-10 px-3 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-default"
                      />
                    </div>
                  </div>
                )}

                {/* Day of week details */}
                {condType === "day_of_week" && (
                  <div>
                    <Label className="text-[11px] font-semibold mb-1 block">
                      {tr.days}
                    </Label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(cond.days || []).map((d: string) => (
                        <span
                          key={d}
                          className="px-3 py-1 text-xs rounded-lg font-bold bg-primary text-white"
                        >
                          {DAY_LABELS[d] || d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zone details */}
                {condType === "zone" && (
                  <div>
                    <Label className="text-[11px] font-semibold mb-1 block">
                      Khu vực áp dụng
                    </Label>
                    <Input
                      readOnly
                      value={cond.zone || (cond.in || []).join(", ") || "—"}
                      className="w-full h-10 px-3 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-default"
                    />
                  </div>
                )}

                {/* Composite or Custom condition summary */}
                {(condType === "and" || condType === "or") && (
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold block">
                      Danh sách điều kiện con ({cond.conditions?.length || 0})
                    </Label>
                    {(cond.conditions || []).map((sub: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[var(--bg-card)] text-xs"
                      >
                        <span className="font-bold text-primary">#{idx + 1}: </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {getConditionTypeLabel(sub?.type)}
                          {sub?.from && sub?.to ? ` (${sub.from} ➔ ${sub.to})` : ""}
                          {sub?.days ? ` (${sub.days.join(", ")})` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Effective dates & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold mb-1 block">
                    {tr.effectiveDates}
                  </Label>
                  <Input
                    readOnly
                    value={
                      rule.effectiveFrom || rule.effectiveTo
                        ? `${rule.effectiveFrom || "..."} ➔ ${rule.effectiveTo || "..."}`
                        : "Không thời hạn"
                    }
                    className="w-full h-10 px-3 rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-default"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold mb-1 block">
                    {tr.priority}
                  </Label>
                  <Input
                    readOnly
                    value={String(rule.priority ?? 0)}
                    className="w-full h-10 px-3 rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-surface)] text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-default"
                  />
                </div>
              </div>

              {/* Assigned Modules */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>
                      {tr.assignedModules} ({relevantMappings.length})
                    </span>
                  </div>

                  {onAssignModule && (
                    <Button
                      size="sm"
                      onPress={() => {
                        onClose();
                        onAssignModule(rule);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg shadow-sm border-none cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{tr.assignModule}</span>
                    </Button>
                  )}
                </div>

                {relevantMappings.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-2">
                    {tr.noModulesAssigned}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {relevantMappings.map((m) => (
                      <div
                        key={m.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[var(--bg-elevated)] text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 group"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{m.moduleCode}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          (Thứ tự: {m.applyOrder ?? 0}{m.isOptional ? ", Tùy chọn" : ""})
                        </span>
                        {onDeleteMapping && m.id && (
                          <button
                            type="button"
                            onClick={() => onDeleteMapping(m.id!)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 rounded ml-1 cursor-pointer"
                            title={`Gỡ khỏi module ${m.moduleCode}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                variant="outline"
                onPress={onClose}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Đóng
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
