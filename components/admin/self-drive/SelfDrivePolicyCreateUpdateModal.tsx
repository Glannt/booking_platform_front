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
  ModalCloseTrigger,
  Input,
  Label,
  TextField,
  TextArea,
  NumberField,
  FieldError,
} from "@heroui/react";
import { X, Sparkles, ShieldCheck, BadgeCheck, Route, Fuel, Clock, FileText, AlertCircle, Info, Save, RefreshCw } from "lucide-react";
import { SvgIconRenderer } from "./SvgIconRenderer";
import type { SelfDrivePolicyDto, SelfDrivePolicyTranslationDto } from "@/lib/api/self-drive-policy";

interface SelfDrivePolicyCreateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPolicy: SelfDrivePolicyDto | null;
  onSave: (payload: Partial<SelfDrivePolicyDto>) => Promise<void>;
  existingPolicies?: SelfDrivePolicyDto[];
}

type LocaleTab = "vi" | "en" | "ko" | "ru";

const SVG_PRESETS = [
  {
    name: "Huy hiệu",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  },
  {
    name: "Bảo vệ",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,
  },
  {
    name: "Lộ trình",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>`,
  },
  {
    name: "Nhiên liệu",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>`,
  },
  {
    name: "Đồng hồ",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  },
  {
    name: "Tài liệu",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
  },
  {
    name: "Lưu ý",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
  },
  {
    name: "Ưu đãi",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
  },
];

export const SelfDrivePolicyCreateUpdateModal: React.FC<SelfDrivePolicyCreateUpdateModalProps> = ({
  isOpen,
  onClose,
  editingPolicy,
  onSave,
  existingPolicies = [],
}) => {
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

      editingPolicy.translations?.forEach((tr) => {
        const loc = tr.locale as LocaleTab;
        if (transMap[loc]) {
          transMap[loc] = {
            name: tr.name || "",
            description: tr.description || "",
          };
        }
      });

      setTranslations(transMap);
    } else {
      setCode("");
      setIcon(SVG_PRESETS[0].svg);
      setSortOrder(0);
      setActive(true);
      setTranslations({
        vi: { name: "", description: "" },
        en: { name: "", description: "" },
        ko: { name: "", description: "" },
        ru: { name: "", description: "" },
      });
    }
  }, [editingPolicy, isOpen]);

  const handleTransChange = (field: "name" | "description", val: string) => {
    setTranslations((prev) => ({
      ...prev,
      [activeLangTab]: {
        ...prev[activeLangTab],
        [field]: val,
      },
    }));
  };

  const normalizeCode = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "-");
  const viNameOf = (p: SelfDrivePolicyDto) =>
    p.translations?.find((tr) => tr.locale === "vi")?.name?.trim()?.toLowerCase() ?? "";

  const {
    isCodeEmpty,
    isCodeDuplicate,
    isNameInvalid,
    isNameDuplicate,
    sortOrderConflict,
    maxExistingSortOrder,
  } = useMemo(() => {
    const otherPolicies = existingPolicies.filter((p) => p.id !== editingPolicy?.id);
    const normalizedCode = normalizeCode(code);
    const normalizedName = translations.vi.name.trim().toLowerCase();

    return {
      isCodeEmpty: !code.trim(),
      isCodeDuplicate: normalizedCode !== "" && otherPolicies.some((p) => normalizeCode(p.code) === normalizedCode),
      isNameInvalid: !translations.vi.name.trim() && !translations[activeLangTab].name.trim(),
      isNameDuplicate:
        normalizedName !== "" && otherPolicies.some((p) => viNameOf(p) === normalizedName),
      sortOrderConflict:
        sortOrder >= 1
          ? otherPolicies.find((p) => Number(p.sortOrder) === sortOrder) || null
          : null,
      maxExistingSortOrder: otherPolicies.reduce(
        (max, p) => Math.max(max, Number(p.sortOrder) || 0),
        0
      ),
    };
  }, [code, translations, activeLangTab, sortOrder, existingPolicies, editingPolicy]);

  const displacedTargetOrder = editingPolicy?.sortOrder ?? maxExistingSortOrder + 1;

  const sortedOrderLabel =
    sortOrderConflict
      ? editingPolicy
        ? `Số thứ tự #${sortOrder} hiện thuộc chính sách "${sortOrderConflict.translations?.find((tr) => tr.locale === "vi")?.name || sortOrderConflict.code}". Chính sách này sẽ được dời xuống vị trí #${displacedTargetOrder} (vị trí cũ của chính sách đang sửa).`
        : `Số thứ tự #${sortOrder} hiện thuộc chính sách "${sortOrderConflict.translations?.find((tr) => tr.locale === "vi")?.name || sortOrderConflict.code}". Chính sách này sẽ được dời xuống vị trí cuối (#${displacedTargetOrder}).`
      : sortOrder >= 1
        ? `Thứ tự #${sortOrder} hiện đang trống — không có chính sách nào bị ảnh hưởng.`
        : "Chưa đặt thứ tự hiển thị — không có chính sách nào bị ảnh hưởng.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCodeEmpty || isCodeDuplicate || isNameInvalid || isNameDuplicate) {
      return;
    }

    setSubmitting(true);
    try {
      const transList: SelfDrivePolicyTranslationDto[] = (
        ["vi", "en", "ko", "ru"] as LocaleTab[]
      ).map((loc) => ({
        locale: loc,
        name: translations[loc].name.trim() || translations.vi.name.trim(),
        description: translations[loc].description.trim() || translations.vi.description.trim(),
      }));

      await onSave({
        code: code.trim().toLowerCase().replace(/\s+/g, "-"),
        icon: icon.trim(),
        sortOrder: Number(sortOrder) || 0,
        active,
        translations: transList,
      });

      onClose();
    } catch (err: any) {
      toast.danger(err?.message || "Không thể lưu chính sách");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-border-secondary overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-separator flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingPolicy ? "Chỉnh sửa chính sách thuê xe" : "Thêm mới chính sách thuê xe"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Quản lý nội dung điều khoản, thứ tự hiển thị và biểu tượng SVG
                </p>
              </div>
            </ModalHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
                {/* General Config Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <TextField isRequired isInvalid={isCodeEmpty || isCodeDuplicate} className="w-full sm:col-span-2">
                    <Label className="text-xs font-bold">
                      Mã chính sách (Code)
                    </Label>
                    <Input
                      type="text"
                      required
                      placeholder="VD: driver-age, fuel-policy"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="text-xs font-semibold"
                    />
                    {isCodeDuplicate ? (
                      <FieldError className="text-[11px] font-bold">
                        Mã chính sách đã tồn tại ở chính sách khác.
                      </FieldError>
                    ) : isCodeEmpty ? (
                      <FieldError className="text-[11px] font-bold">
                        Vui lòng nhập mã chính sách.
                      </FieldError>
                    ) : null}
                  </TextField>

                  <NumberField
                    className="w-full"
                    value={sortOrder}
                    minValue={0}
                    onChange={(v) => setSortOrder(v || 0)}
                  >
                    <Label className="text-xs font-bold">
                      Thứ tự hiển thị
                    </Label>
                    <NumberField.Group className="border-1 border-separator">
                      <NumberField.DecrementButton />
                      <NumberField.Input className="text-xs font-semibold" />
                      <NumberField.IncrementButton />
                    </NumberField.Group>
                  </NumberField>
                </div>

                {/* sortOrder override note — always visible */}
                <div
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-[11px] font-semibold leading-relaxed transition-colors ${sortOrderConflict
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-200"
                    : "bg-slate-50 dark:bg-[var(--bg-card)] border border-separator text-slate-500 dark:text-slate-400"
                    }`}
                >
                  <Info size={15} className={`shrink-0 mt-0.5 ${sortOrderConflict ? "text-amber-500" : "text-accent"}`} />
                  <div className="space-y-0.5">
                    <p className="font-extrabold">Lưu ý về thứ tự hiển thị</p>
                    <p className="font-medium opacity-90">
                      {editingPolicy
                        ? `Chỉnh sửa: nếu đặt thứ tự trùng chính sách đã có, chính sách bị ghi đè sẽ dời xuống vị trí cũ (#${displacedTargetOrder}) của chính sách đang sửa — hai chính sách chỉ đổi chỗ cho nhau.`
                        : `Thêm mới: nếu đặt thứ tự trùng chính sách đã có, chính sách mới sẽ chiếm vị trí đó và chính sách bị ghi đè sẽ được dời xuống vị trí cuối (#${displacedTargetOrder}) — ngay sau vị trí lớn nhất hiện có.`}
                    </p>
                    <p className="font-medium opacity-70">
                      Các chính sách khác giữ nguyên vị trí, không bị ảnh hưởng.
                    </p>
                    <p className={sortOrderConflict ? "font-extrabold text-amber-700 dark:text-amber-300" : "font-bold text-accent"}>
                      {sortedOrderLabel}
                    </p>
                  </div>
                </div>

                {/* SVG Icon Editor & Live Preview */}
                <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold flex items-center gap-1.5">
                      <Sparkles size={14} className="text-accent" />
                      Biểu tượng SVG (Raw SVG text)
                    </label>
                    <span className="text-[11px] text-slate-400">Xem trước trực tiếp bên dưới</span>
                  </div>

                  {/* Input & Preview Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3 space-y-1">
                      <textarea
                        rows={3}
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        placeholder="Dán mã SVG (<svg ...>...</svg>) vào đây..."
                        className="w-full p-2.5 text-[11px] font-mono rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-surface)] focus:border-accent outline-none resize-none leading-relaxed text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    {/* Live Preview Box */}
                    <div className="sm:col-span-1 flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-border-secondary bg-white dark:bg-[var(--bg-surface)]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Preview
                      </span>
                      <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center p-2.5 shadow-sm">
                        <SvgIconRenderer svgString={icon} className="w-full h-full text-accent" />
                      </div>
                    </div>
                  </div>

                  {/* Preset Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Mẫu SVG có sẵn:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SVG_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setIcon(p.svg)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-border bg-white dark:bg-[var(--bg-surface)] hover:bg-accent/10 hover:text-accent hover:border-accent/40 cursor-pointer transition-colors"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Switch */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-separator bg-white dark:bg-[var(--bg-card)]">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Kích hoạt hiển thị
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Chính sách sẽ xuất hiện ngay trên trang chi tiết xe tự lái khi bật
                    </span>
                  </div>
                  <Checkbox
                    id="policy-active"
                    isSelected={active}
                    onChange={setActive}
                    render={(props) => <div {...props} data-custom="bar" />}
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                </div>

                {/* Multilingual Translation Tabs */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-separator pb-2">
                    <label className="text-xs font-black uppercase tracking-wider">
                      Nội dung Đa ngôn ngữ (4 Locale)
                    </label>
                    <Tabs
                      selectedKey={activeLangTab}
                      onSelectionChange={(k) => setActiveLangTab(k as LocaleTab)}
                    >
                      <Tabs.List aria-label="Chọn ngôn ngữ" className="h-8 p-0.5 bg-slate-100 dark:bg-[var(--bg-card)] rounded-lg">
                        <Tabs.Tab id="vi" className="text-xs font-bold px-2.5 py-1">VI 🇻🇳</Tabs.Tab>
                        <Tabs.Tab id="en" className="text-xs font-bold px-2.5 py-1">EN 🇺🇸</Tabs.Tab>
                        <Tabs.Tab id="ko" className="text-xs font-bold px-2.5 py-1">KO 🇰🇷</Tabs.Tab>
                        <Tabs.Tab id="ru" className="text-xs font-bold px-2.5 py-1">RU 🇷🇺</Tabs.Tab>
                      </Tabs.List>
                    </Tabs>
                  </div>

                  {/* Active Lang Form */}
                  <div className="space-y-3">
                    <TextField isRequired isInvalid={isNameInvalid || isNameDuplicate} className="w-full">
                      <Label className="text-xs font-bold">
                        Tiêu đề chính sách ({activeLangTab.toUpperCase()})
                      </Label>
                      <Input
                        type="text"
                        required
                        placeholder={`VD: Độ tuổi người lái (${activeLangTab.toUpperCase()})`}
                        value={translations[activeLangTab].name}
                        onChange={(e) => handleTransChange("name", e.target.value)}
                        className="text-xs border-1 border-separator font-semibold"
                      />
                      {isNameDuplicate ? (
                        <FieldError className="text-[11px] font-bold">
                          Tiêu đề chính sách đã tồn tại ở chính sách khác.
                        </FieldError>
                      ) : isNameInvalid ? (
                        <FieldError className="text-[11px] font-bold">
                          Vui lòng nhập tiêu đề chính sách.
                        </FieldError>
                      ) : null}
                    </TextField>

                    <TextField className="w-full">
                      <Label className="text-xs font-bold">
                        Mô tả chi tiết ({activeLangTab.toUpperCase()})
                      </Label>
                      <TextArea
                        rows={3}
                        placeholder={`VD: Yêu cầu tối thiểu 21 tuổi trở lên (${activeLangTab.toUpperCase()})`}
                        value={translations[activeLangTab].description}
                        onChange={(e) => handleTransChange("description", e.target.value)}
                        className="text-xs border-1 border-separator font-semibold leading-relaxed resize-none"
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
                  isDisabled={submitting}
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isDisabled={submitting}
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                >
                  {submitting ? (
                    <RefreshCw size={15} className="animate-spin mr-1.5" />
                  ) : (
                    <Save size={15} className="mr-1.5" />
                  )}
                  {editingPolicy ? "Cập nhật chính sách" : "Tạo chính sách"}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
};
