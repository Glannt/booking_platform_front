"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  Tabs,
  toast,
  Input,
  Label,
  TextField,
  TextArea,
  NumberField,
  FieldError,
  ModalCloseTrigger,
} from "@heroui/react";
import { X, Sparkles, ShieldCheck, BadgeCheck, Clock, FileText, AlertCircle, Info, CalendarCheck, MapPin, RefreshCw, Save } from "lucide-react";
import { SvgIconRenderer } from "@/components/admin/self-drive/SvgIconRenderer";
import type { TourPolicyDto, TourPolicyTranslationDto } from "@/lib/api/tour-policy";
import { useI18n } from "@/context/LanguageContext";

interface TourPolicyCreateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPolicy: TourPolicyDto | null;
  onSave: (payload: Partial<TourPolicyDto>) => Promise<void>;
  existingPolicies?: TourPolicyDto[];
}

type LocaleTab = "vi" | "en" | "ko" | "ru";

const SVG_PRESETS = [
  {
    name: "Huy hiệu cam kết",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  },
  {
    name: "Bảo hiểm & An toàn",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,
  },
  {
    name: "Hủy tour linh hoạt",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>`,
  },
  {
    name: "Đúng giờ khởi hành",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  },
  {
    name: "Hướng dẫn viên chuyên nghiệp",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    name: "Điểm đến chọn lọc",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`,
  },
];

export const TourPolicyCreateUpdateModal: React.FC<TourPolicyCreateUpdateModalProps> = ({
  isOpen,
  onClose,
  editingPolicy,
  onSave,
  existingPolicies = [],
}) => {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [icon, setIcon] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [activeLangTab, setActiveLangTab] = useState<LocaleTab>("vi");
  const [translations, setTranslations] = useState<Record<LocaleTab, { name: string; description: string }>>({
    vi: { name: "", description: "" },
    en: { name: "", description: "" },
    ko: { name: "", description: "" },
    ru: { name: "", description: "" },
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingPolicy) {
      setCode(editingPolicy.code || "");
      setIcon(editingPolicy.icon || "");
      setSortOrder(editingPolicy.sortOrder ?? 0);
      setActive(editingPolicy.active ?? true);

      const transMap: Record<LocaleTab, { name: string; description: string }> = {
        vi: { name: "", description: "" },
        en: { name: "", description: "" },
        ko: { name: "", description: "" },
        ru: { name: "", description: "" },
      };

      if (editingPolicy.translations && Array.isArray(editingPolicy.translations)) {
        editingPolicy.translations.forEach((tr: TourPolicyTranslationDto) => {
          const loc = tr.locale.toLowerCase() as LocaleTab;
          if (transMap[loc]) {
            transMap[loc] = {
              name: tr.name || "",
              description: tr.description || "",
            };
          }
        });
      }

      setTranslations(transMap);
      setActiveLangTab("vi");
    } else {
      setCode("");
      setIcon(SVG_PRESETS[0].svg);
      const maxOrder = existingPolicies.reduce((max, p) => Math.max(max, p.sortOrder ?? 0), -1);
      setSortOrder(maxOrder + 1);
      setActive(true);
      setTranslations({
        vi: { name: "", description: "" },
        en: { name: "", description: "" },
        ko: { name: "", description: "" },
        ru: { name: "", description: "" },
      });
      setActiveLangTab("vi");
    }
  }, [editingPolicy, isOpen, existingPolicies]);

  const isCodeDuplicate = useMemo(() => {
    if (!code.trim()) return false;
    const clean = code.trim().toUpperCase();
    return existingPolicies.some(
      (p) => p.code.toUpperCase() === clean && (!editingPolicy || p.id !== editingPolicy.id)
    );
  }, [code, existingPolicies, editingPolicy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.danger(t.tours.policyCode);
      return;
    }

    if (isCodeDuplicate) {
      toast.danger(t.tours.policyCode + " duplicate");
      return;
    }

    if (!translations.vi.name.trim()) {
      toast.danger(t.tours.policyName + " (VI)");
      setActiveLangTab("vi");
      return;
    }

    const payloadTranslations: TourPolicyTranslationDto[] = Object.entries(translations)
      .filter(([_, data]) => data.name.trim().length > 0)
      .map(([locale, data]) => ({
        locale,
        name: data.name.trim(),
        description: data.description.trim() || undefined,
      }));

    const payload: Partial<TourPolicyDto> = {
      code: code.trim().toUpperCase(),
      icon: icon.trim() || undefined,
      sortOrder: Number(sortOrder) || 0,
      active,
      translations: payloadTranslations,
    };

    setSubmitting(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      toast.danger(err.message || "Failed to save tour policy");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingPolicy ? t.tours.editPolicy : t.tours.addPolicy}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {t.tours.policies}
                  </p>
                </div>
              </div>
            </ModalHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <TextField isRequired isInvalid={isCodeDuplicate}>
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {t.tours.policyCode}
                      </Label>
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="VD: CANCELLATION, SAFETY, INSURANCE"
                        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] px-3 text-xs font-semibold uppercase"
                      />
                      {isCodeDuplicate && (
                        <FieldError className="text-[11px] text-rose-500 mt-1">
                          Mã chính sách đã tồn tại
                        </FieldError>
                      )}
                    </TextField>
                  </div>

                  <div>
                    <NumberField
                      value={sortOrder}
                      onChange={(val) => setSortOrder(Number(val) || 0)}
                      minValue={0}
                    >
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {t.tours.policySortOrder}
                      </Label>
                      <NumberField.Input
                        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] px-3 text-xs font-semibold"
                      />
                    </NumberField>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t.tours.policyIcon} (SVG)
                  </Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {SVG_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setIcon(preset.svg)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${icon === preset.svg
                          ? "border-accent bg-accent/10 text-accent font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] text-slate-600 dark:text-slate-300 hover:border-slate-300"
                          }`}
                      >
                        <span className="w-4 h-4 flex items-center justify-center">
                          <SvgIconRenderer svgString={preset.svg} className="w-3.5 h-3.5" />
                        </span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] flex items-center justify-center shrink-0 text-accent">
                      {icon ? (
                        <SvgIconRenderer svgString={icon} className="w-6 h-6" />
                      ) : (
                        <AlertCircle size={20} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <TextArea
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        placeholder="<svg ...>...</svg>"
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] p-2.5 text-[11px] font-mono leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    isSelected={active}
                    onChange={(checked) => setActive(checked)}
                  >
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Content>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t.tours.policyStatus} (Kích hoạt hiển thị)
                      </span>
                    </Checkbox.Content>
                  </Checkbox>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Nội dung bản dịch đa ngôn ngữ
                    </Label>
                    <div className="flex gap-1 bg-slate-100 dark:bg-[var(--bg-card)] p-1 rounded-xl">
                      {(["vi", "en", "ko", "ru"] as LocaleTab[]).map((loc) => {
                        const hasName = !!translations[loc].name.trim();
                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setActiveLangTab(loc)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${activeLangTab === loc
                              ? "bg-white dark:bg-[var(--bg-elevated)] text-accent shadow-sm"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                              }`}
                          >
                            {loc}
                            {hasName && <span className="ml-1 text-[10px] text-emerald-500">●</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50/50 dark:bg-[var(--bg-card)]/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <TextField isRequired={activeLangTab === "vi"}>
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {t.tours.policyName} ({activeLangTab.toUpperCase()})
                      </Label>
                      <Input
                        value={translations[activeLangTab].name}
                        onChange={(e) =>
                          setTranslations((prev) => ({
                            ...prev,
                            [activeLangTab]: { ...prev[activeLangTab], name: e.target.value },
                          }))
                        }
                        placeholder={
                          activeLangTab === "vi"
                            ? "VD: Cam kết đúng giờ khởi hành"
                            : "Policy title..."
                        }
                        className="mt-1 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] px-3 text-xs font-medium"
                      />
                    </TextField>

                    <TextField>
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {t.tours.policyDesc} ({activeLangTab.toUpperCase()})
                      </Label>
                      <TextArea
                        value={translations[activeLangTab].description}
                        onChange={(e) =>
                          setTranslations((prev) => ({
                            ...prev,
                            [activeLangTab]: { ...prev[activeLangTab], description: e.target.value },
                          }))
                        }
                        placeholder={
                          activeLangTab === "vi"
                            ? "Mô tả chi tiết quyền lợi khách hàng..."
                            : "Detailed description..."
                        }
                        rows={2}
                        className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] p-2.5 text-xs font-medium"
                      />
                    </TextField>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isDisabled={submitting}
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                >
                  {submitting ? <RefreshCw className="animate-spin mr-1.5" size={15} /> : <Save className="mr-1.5" size={15} />}
                  {editingPolicy ? "Lưu thay đổi" : "Tạo mới"}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
};
export default TourPolicyCreateUpdateModal;
