"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Button,
  Label,
  Input,
  TextArea,
  Switch,
  ColorPicker,
  ColorSwatch,
  ColorArea,
  ColorSlider,
  ColorField,
  parseColor,
  toast,
} from "@heroui/react";
import {
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ZoomIn,
  X,
  ExternalLink,
  Upload,
  Loader2,
  RefreshCw,
  Layers,
  Sparkles,
  LayoutGrid,
  MessageSquare,
  ShieldCheck,
  Camera,
  ListOrdered,
  HelpCircle,
  Percent,
  PhoneCall,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Code2,
  FormInput,
  Check,
} from "lucide-react";
import { SvgIconPickerField } from "@/components/common/SvgIconPickerField";
import { uploadMedia, type MediaDto } from "@/lib/api/media";
import {
  SECTION_EDITOR_CONFIGS,
  SectionEditorConfig,
  FieldConfig,
  getDefaultContentDataForSection,
} from "./listEditorConfigs";
import { KeyValueEditor } from "./KeyValueEditor";

interface JsonListEditorProps {
  value: string;
  onChange: (json: string) => void;
  sectionType: string;
  pagePath?: string;
  sectionName?: string;
}

// ── Helpers ─────────────────────────────────────────────────────
function safeParseColor(colorStr?: string, defaultHex: string = "#3b82f6") {
  try {
    return parseColor(colorStr || defaultHex);
  } catch {
    return parseColor(defaultHex);
  }
}

function getLocalizedPreview(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, string>;
    return obj["vi"] || obj["en"] || obj["ko"] || obj["ru"] || Object.values(obj)[0] || "";
  }
  return String(val);
}

const EDITOR_LOCALES = [
  { code: "vi", label: "VI", flag: "🇻🇳" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "ko", label: "KO", flag: "🇰🇷" },
  { code: "ru", label: "RU", flag: "🇷🇺" },
] as const;

// ── Subcomponent: Multilingual 4 Languages (VI / EN / KO / RU) ───
function Multilingual4Input({
  label,
  value,
  onChange,
  placeholder,
  required,
  isTextarea,
}: {
  label: string;
  value?: { vi?: string; en?: string; ko?: string; ru?: string };
  onChange: (val: { vi: string; en: string; ko: string; ru: string }) => void;
  placeholder?: string;
  required?: boolean;
  isTextarea?: boolean;
}) {
  const [activeLang, setActiveLang] = useState<"vi" | "en" | "ko" | "ru">("vi");
  const vi = value?.vi || "";
  const en = value?.en || "";
  const ko = value?.ko || "";
  const ru = value?.ru || "";

  const getCurrentVal = () => {
    switch (activeLang) {
      case "vi":
        return vi;
      case "en":
        return en;
      case "ko":
        return ko;
      case "ru":
        return ru;
    }
  };

  const updateCurrent = (str: string) => {
    onChange({
      vi: activeLang === "vi" ? str : vi,
      en: activeLang === "en" ? str : en,
      ko: activeLang === "ko" ? str : ko,
      ru: activeLang === "ru" ? str : ru,
    });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label isRequired={required} className="text-sm font-bold text-foreground">
          {label}
        </Label>
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-default-100 dark:bg-[var(--bg-elevated)] border border-divider">
          {EDITOR_LOCALES.map(({ code, label: langLabel, flag }) => {
            const hasVal = !!value?.[code];
            const isActive = activeLang === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setActiveLang(code)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 ${isActive
                  ? "bg-accent text-accent-foreground shadow-2xs"
                  : "text-foreground/70 hover:text-foreground hover:bg-default-200/50"
                  }`}
              >
                <span>{flag} {langLabel}</span>
                {/* {hasVal && <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black">✓</span>} */}
              </button>
            );
          })}
        </div>
      </div>
      {isTextarea ? (
        <TextArea
          value={getCurrentVal()}
          onChange={(e) => updateCurrent(e.target.value)}
          placeholder={`${placeholder || label} (${activeLang.toUpperCase()})`}
          className="w-full rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-foreground text-sm"
          rows={3}
        />
      ) : (
        <Input
          value={getCurrentVal()}
          onChange={(e) => updateCurrent(e.target.value)}
          placeholder={`${placeholder || label} (${activeLang.toUpperCase()})`}
          className="w-full rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-foreground text-sm"
        />
      )}
    </div>
  );
}

// ── Subcomponent: Image Upload & Preview ─────────────────────────
function ImageFieldInput({
  label,
  value,
  onChange,
  onZoom,
  sectionName,
  description,
  required,
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  onZoom: (img: { url: string; title?: string }) => void;
  sectionName?: string;
  description?: string;
  required?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadMedia(file, sectionName || "section-item");
      const media: MediaDto = res.data.media;
      const url = media.filePath.startsWith("http")
        ? media.filePath
        : `${window.location.origin}${media.filePath}`;
      onChange(url);
      toast.success("Tải ảnh lên thành công!");
    } catch (err: any) {
      toast.danger(err?.message || "Tải ảnh thất bại.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label isRequired={required} className="text-sm font-bold text-foreground">
          {label}
        </Label>
        {description && (
          <span className="text-[11px] text-foreground/60">{description}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative group shrink-0">
            <div
              onClick={() => onZoom({ url: value, title: label })}
              className="w-14 h-14 rounded-xl border border-divider overflow-hidden bg-default-100 dark:bg-[var(--bg-card)] cursor-zoom-in relative"
              title="Xem ảnh phóng to"
            >
              <img
                src={value}
                alt={label}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <ZoomIn size={14} className="text-white drop-shadow" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -top-1 -right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md cursor-pointer transition-colors"
              title="Xóa ảnh"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl border-2 border-dashed border-divider flex items-center justify-center text-foreground/40 bg-default-50 dark:bg-[var(--bg-card)] shrink-0">
            <ImageIcon size={20} />
          </div>
        )}

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Dán URL hình ảnh hoặc bấm Tải ảnh..."
            className="flex-1 text-xs font-mono rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-foreground"
          />

          <Button
            type="button"
            size="sm"
            variant="outline"
            isDisabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-3 rounded-xl border border-divider text-xs font-bold shrink-0 cursor-pointer bg-white dark:bg-[var(--bg-card)] hover:bg-default-100 text-foreground"
          >
            {uploading ? (
              <Loader2 size={13} className="animate-spin text-accent mr-1" />
            ) : (
              <Upload size={13} className="mr-1 text-accent" />
            )}
            {uploading ? "Đang tải..." : "Tải ảnh"}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleUpload(e.target.files[0]);
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Subcomponent: Feature Styles (8 Color Tokens) ───────────────
function FeatureStylesInput({
  styles,
  onChange,
}: {
  styles?: Record<string, string>;
  onChange: (val: Record<string, string>) => void;
}) {
  const current = styles || {};

  const colorItems: { key: string; label: string; defaultHex: string }[] = [
    { key: "iconBg", label: "Nền Icon (Light)", defaultHex: "rgba(59, 130, 246, 0.1)" },
    { key: "iconBgDark", label: "Nền Icon (Dark)", defaultHex: "rgba(30, 58, 138, 0.3)" },
    { key: "iconColor", label: "Màu Icon (Light)", defaultHex: "#2563eb" },
    { key: "iconColorDark", label: "Màu Icon (Dark)", defaultHex: "#60a5fa" },
    { key: "titleColor", label: "Màu Tiêu đề (Light)", defaultHex: "#1e293b" },
    { key: "titleColorDark", label: "Màu Tiêu đề (Dark)", defaultHex: "#e2e8f0" },
    { key: "descColor", label: "Màu Mô tả (Light)", defaultHex: "#64748b" },
    { key: "descColorDark", label: "Màu Mô tả (Dark)", defaultHex: "#94a3b8" },
  ];

  return (
    <div className="p-3 rounded-xl border border-divider bg-default-50/50 dark:bg-[var(--bg-page)]/40 space-y-2">
      <Label className="text-sm font-bold text-foreground">
        Tùy biến màu sắc Icon & Chữ (Light / Dark mode)
      </Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
        {colorItems.map((item) => {
          const val = current[item.key] || item.defaultHex;
          return (
            <div key={item.key} className="space-y-1">
              <span className="text-[10px] font-semibold text-foreground/70 block truncate">
                {item.label}
              </span>
              <ColorPicker
                value={safeParseColor(val, item.defaultHex)}
                onChange={(c) => onChange({ ...current, [item.key]: c.toString("hex") })}
              >
                <ColorPicker.Trigger className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-divider bg-white dark:bg-[var(--bg-card)] cursor-pointer w-full justify-between h-7">
                  <div className="flex items-center gap-1.5 truncate">
                    <ColorSwatch className="w-3.5 h-3.5 rounded border border-divider shadow-xs shrink-0" />
                    <span className="text-[10px] font-mono font-medium text-foreground truncate">
                      {val}
                    </span>
                  </div>
                </ColorPicker.Trigger>
                <ColorPicker.Popover className="gap-2 p-3 bg-white dark:bg-[var(--bg-card)] border border-divider shadow-xl rounded-xl z-50">
                  <ColorArea aria-label="Color area" className="max-w-full h-28 rounded-lg" colorSpace="hsb" xChannel="saturation" yChannel="brightness">
                    <ColorArea.Thumb />
                  </ColorArea>
                  <ColorSlider aria-label="Hue slider" channel="hue" className="w-full" colorSpace="hsb">
                    <ColorSlider.Track>
                      <ColorSlider.Thumb />
                    </ColorSlider.Track>
                  </ColorSlider>
                  <ColorField aria-label="Color field">
                    <ColorField.Group variant="secondary">
                      <ColorField.Prefix>
                        <ColorSwatch size="xs" />
                      </ColorField.Prefix>
                      <ColorField.Input className="text-xs" />
                    </ColorField.Group>
                  </ColorField>
                </ColorPicker.Popover>
              </ColorPicker>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Subcomponent: Nested FAQ Items List ──────────────────────────
function NestedFaqItemsEditor({
  items,
  onChange,
}: {
  items?: any[];
  onChange: (val: any[]) => void;
}) {
  const list = Array.isArray(items) ? items : [];

  const handleAddItem = () => {
    onChange([
      ...list,
      {
        title: { vi: "", en: "", ko: "", ru: "" },
        content: { vi: "", en: "", ko: "", ru: "" },
      },
    ]);
  };

  const handleUpdateItem = (idx: number, field: "title" | "content", val: any) => {
    const next = [...list];
    next[idx] = { ...next[idx], [field]: val };
    onChange(next);
  };

  const handleDeleteItem = (idx: number) => {
    onChange(list.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3 pt-2 border-t border-divider">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <HelpCircle size={14} className="text-accent" />
          <Label className="text-sm font-bold text-foreground">
            Danh sách câu hỏi & trả lời ({list.length})
          </Label>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAddItem}
          className="h-7 px-2.5 text-xs font-bold rounded-lg border border-divider bg-white dark:bg-[var(--bg-card)] hover:bg-default-100 text-foreground cursor-pointer"
        >
          <Plus size={12} className="mr-1 text-accent" />
          Thêm câu hỏi
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-divider text-center text-xs text-foreground/50 bg-default-50/50 dark:bg-[var(--bg-card)]/50">
          Chưa có câu hỏi nào trong danh mục này. Bấm &quot;Thêm câu hỏi&quot; để tạo mới.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item, qIdx) => (
            <div
              key={qIdx}
              className="p-3.5 rounded-xl border border-divider bg-default-50/40 dark:bg-[var(--bg-page)]/40 space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[11px] font-extrabold">
                  Q#{qIdx + 1}
                </span>
                <Button
                  type="button"
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteItem(qIdx)}
                  className="h-6 w-6 text-foreground/40 hover:text-rose-600 rounded-md cursor-pointer"
                  aria-label="Xóa câu hỏi"
                >
                  <Trash2 size={13} />
                </Button>
              </div>

              <Multilingual4Input
                label="Câu hỏi"
                value={item.title}
                onChange={(val) => handleUpdateItem(qIdx, "title", val)}
                placeholder="VD: Làm thế nào để đặt dịch vụ đưa đón sân bay?"
                required
              />

              <Multilingual4Input
                label="Câu trả lời"
                value={item.content}
                onChange={(val) => handleUpdateItem(qIdx, "content", val)}
                placeholder="Chi tiết câu trả lời..."
                isTextarea
                required
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component: JsonListEditor ──────────────────────────────
export default function JsonListEditor({
  value,
  onChange,
  sectionType,
  pagePath,
  sectionName,
}: JsonListEditorProps) {
  const config: SectionEditorConfig | undefined = SECTION_EDITOR_CONFIGS[sectionType];
  const [viewMode, setViewMode] = useState<"form" | "json">("form");
  const [collapsedItems, setCollapsedItems] = useState<Record<number, boolean>>({});
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title?: string } | null>(null);

  // Parse JSON data safely
  const parsedData = useMemo(() => {
    if (!value || value.trim() === "") return {};
    try {
      const res = JSON.parse(value);
      return typeof res === "object" && res !== null ? res : {};
    } catch {
      return {};
    }
  }, [value]);

  // Extract list items
  const items: any[] = useMemo(() => {
    if (!config || !config.listKey) return [];
    const list = parsedData[config.listKey];
    return Array.isArray(list) ? list : [];
  }, [parsedData, config]);

  // Sync update back to parent
  const updateData = (newData: Record<string, any>) => {
    onChange(JSON.stringify(newData, null, 2));
  };

  const handleUpdateTopLevel = (key: string, val: any) => {
    updateData({
      ...parsedData,
      [key]: val,
    });
  };

  const handleUpdateItem = (index: number, updatedItem: any) => {
    if (!config?.listKey) return;
    const nextList = [...items];
    nextList[index] = updatedItem;
    updateData({
      ...parsedData,
      [config.listKey]: nextList,
    });
  };

  const handleAddItem = () => {
    if (!config?.listKey || !config.itemFactory) return;
    const newItem = config.itemFactory();
    const nextList = [...items, newItem];
    updateData({
      ...parsedData,
      [config.listKey]: nextList,
    });
    // expand new item
    setCollapsedItems((prev) => ({ ...prev, [nextList.length - 1]: false }));
  };

  const handleDeleteItem = (index: number) => {
    if (!config?.listKey) return;
    const nextList = items.filter((_, i) => i !== index);
    updateData({
      ...parsedData,
      [config.listKey]: nextList,
    });
  };

  const handleDuplicateItem = (index: number) => {
    if (!config?.listKey) return;
    const cloned = JSON.parse(JSON.stringify(items[index]));
    const nextList = [...items];
    nextList.splice(index + 1, 0, cloned);
    updateData({
      ...parsedData,
      [config.listKey]: nextList,
    });
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    if (!config?.listKey) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const nextList = [...items];
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;
    updateData({
      ...parsedData,
      [config.listKey]: nextList,
    });
  };

  const toggleCollapse = (index: number) => {
    setCollapsedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleLoadDefaultTemplate = () => {
    const defaultJson = getDefaultContentDataForSection(sectionType);
    onChange(defaultJson);
    toast.success("Đã nạp dữ liệu mẫu thành công!");
  };

  // If no config found for sectionType, fallback to KeyValueEditor
  if (!config) {
    return (
      <KeyValueEditor
        value={value}
        onChange={onChange}
        sectionType={sectionType}
        pagePath={pagePath}
      />
    );
  }

  // Render Form Field
  const renderField = (
    field: FieldConfig,
    itemValue: any,
    onFieldChange: (val: any) => void
  ) => {
    const val = itemValue?.[field.key];

    switch (field.type) {
      case "multilingual4":
      case "multilingual2" as any:
        return (
          <Multilingual4Input
            key={field.key}
            label={field.label}
            value={val}
            onChange={onFieldChange}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case "image":
        return (
          <ImageFieldInput
            key={field.key}
            label={field.label}
            value={val}
            onChange={onFieldChange}
            onZoom={setZoomedImage}
            sectionName={sectionName}
            description={field.description}
            required={field.required}
          />
        );

      case "color":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label isRequired={field.required} className="text-sm font-bold text-foreground mr-2">
              {field.label}
            </Label>
            <ColorPicker
              value={safeParseColor(val, field.defaultValue || "#ffffff")}
              onChange={(color) => onFieldChange(color.toString("hex"))}
            >
              <ColorPicker.Trigger className="flex items-center gap-2 px-3 py-2 rounded-xl border border-divider bg-white dark:bg-[var(--bg-card)] cursor-pointer w-full justify-between h-[38px]">
                <div className="flex items-center gap-2">
                  <ColorSwatch className="w-5 h-5 rounded-md border border-divider shadow-xs" />
                  <span className="text-xs font-mono font-medium text-foreground">
                    {val || field.defaultValue || "#ffffff"}
                  </span>
                </div>
              </ColorPicker.Trigger>
              <ColorPicker.Popover className="gap-2 p-3 bg-white dark:bg-[var(--bg-card)] border border-divider shadow-xl rounded-xl z-50">
                <ColorArea aria-label="Color area" className="max-w-full h-32 rounded-lg" colorSpace="hsb" xChannel="saturation" yChannel="brightness">
                  <ColorArea.Thumb />
                </ColorArea>
                <ColorSlider aria-label="Hue slider" channel="hue" className="w-full" colorSpace="hsb">
                  <ColorSlider.Track>
                    <ColorSlider.Thumb />
                  </ColorSlider.Track>
                </ColorSlider>
                <ColorField aria-label="Color field">
                  <ColorField.Group variant="secondary">
                    <ColorField.Prefix>
                      <ColorSwatch size="xs" />
                    </ColorField.Prefix>
                    <ColorField.Input className="text-xs" />
                  </ColorField.Group>
                </ColorField>
              </ColorPicker.Popover>
            </ColorPicker>
          </div>
        );

      case "icon":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label isRequired={field.required} className="text-sm font-bold text-foreground">
              {field.label}
            </Label>
            <SvgIconPickerField
              value={val || ""}
              onChange={onFieldChange}
              compact={true}
              label={field.label}
              placeholder="Chọn hoặc dán SVG / Tên Icon..."
            />
          </div>
        );

      case "number":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label isRequired={field.required} className="text-sm font-bold text-foreground">
              {field.label}
            </Label>
            <Input
              type="number"
              value={val !== undefined ? String(val) : String(field.defaultValue || 0)}
              onChange={(e) => onFieldChange(Number(e.target.value) || 0)}
              className="w-full rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-foreground text-sm"
            />
          </div>
        );

      case "boolean":
        return (
          <div key={field.key} className="flex items-center justify-between p-3 rounded-xl border border-divider bg-default-50/50 dark:bg-[var(--bg-card)]">
            <div>
              <Label className="text-sm font-bold text-foreground">{field.label}</Label>
              {field.description && (
                <p className="text-[11px] text-foreground/60">{field.description}</p>
              )}
            </div>
            <Switch
              isSelected={!!val}
              onChange={(isSelected) => onFieldChange(isSelected)}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label isRequired={field.required} className="text-sm font-bold text-foreground">
              {field.label}
            </Label>
            <TextArea
              value={val || ""}
              onChange={(e) => onFieldChange(e.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-foreground text-sm"
              rows={3}
            />
          </div>
        );

      case "styles_feature":
        return (
          <FeatureStylesInput
            key={field.key}
            styles={val}
            onChange={onFieldChange}
          />
        );

      case "nested_faq_items":
        return (
          <NestedFaqItemsEditor
            key={field.key}
            items={val}
            onChange={onFieldChange}
          />
        );

      case "select":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label isRequired={field.required} className="text-sm font-bold text-foreground">
              {field.label}
            </Label>
            <select
              value={val || field.options?.[0]?.value || ""}
              onChange={(e) => onFieldChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-separator bg-white dark:bg-[var(--bg-card)] text-foreground text-sm h-[38px] cursor-pointer outline-none"
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      default: // "text"
        return (
          <div key={field.key} className="space-y-1.5">
            <Label isRequired={field.required} className="text-sm font-bold text-foreground">
              {field.label}
            </Label>
            <Input
              value={val || ""}
              onChange={(e) => onFieldChange(e.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-foreground text-sm"
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 pt-2 border-t border-divider">
      {/* Header bar: Title & Mode toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl bg-accent/10 border border-accent/25">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-accent/20 text-accent font-extrabold shrink-0">
            <Sparkles size={18} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h5 className="text-sm font-extrabold text-foreground">{config.title}</h5>
              {config.listKey && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-accent/20 text-accent">
                  {items.length} mục
                </span>
              )}
            </div>
            <p className="text-xs text-foreground/60">{config.description}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-0.5 rounded-xl bg-white dark:bg-[var(--bg-card)] border border-divider">
            <button
              type="button"
              onClick={() => setViewMode("form")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${viewMode === "form"
                ? "bg-accent text-accent-foreground shadow-2xs"
                : "text-foreground/70 hover:text-foreground"
                }`}
            >
              <FormInput size={13} />
              Biểu mẫu
            </button>
            <button
              type="button"
              onClick={() => setViewMode("json")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${viewMode === "json"
                ? "bg-accent text-accent-foreground shadow-2xs"
                : "text-foreground/70 hover:text-foreground"
                }`}
            >
              <Code2 size={13} />
              Cây JSON
            </button>
          </div>

          {config.listKey && items.length === 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleLoadDefaultTemplate}
              className="h-8 px-2.5 text-xs font-bold rounded-xl border border-divider bg-white dark:bg-[var(--bg-card)] hover:bg-default-100 text-foreground cursor-pointer"
            >
              <RefreshCw size={13} className="mr-1 text-accent" />
              Nạp mẫu
            </Button>
          )}

          {config.listKey && (
            <Button
              type="button"
              size="sm"
              onClick={handleAddItem}
              className="h-8 px-3 text-xs font-bold rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground cursor-pointer shadow-sm border-none"
            >
              <Plus size={14} className="mr-1" />
              Thêm mục mới
            </Button>
          )}
        </div>
      </div>

      {/* Switch View Mode */}
      {viewMode === "json" ? (
        <div className="p-2 rounded-2xl border border-divider bg-default-50/50 dark:bg-[var(--bg-card)]/50">
          <KeyValueEditor
            value={value}
            onChange={onChange}
            sectionType={sectionType}
            pagePath={pagePath}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Level Fields (e.g. badgeTitle, ratingSummary, showInstagram) */}
          {config.topLevelFields && config.topLevelFields.length > 0 && (
            <div className="p-4 rounded-2xl border border-divider bg-default-50/60 dark:bg-[var(--bg-card)]/60 space-y-3">
              <h6 className="text-xs font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} className="text-accent" />
                Cài đặt chung của Section
              </h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.topLevelFields.map((field) => (
                  <div
                    key={field.key}
                    className={field.colSpan === 2 ? "col-span-1 md:col-span-2" : "col-span-1"}
                  >
                    {renderField(field, parsedData, (val) =>
                      handleUpdateTopLevel(field.key, val)
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single Object Form (e.g. PROMO, CTA, BANNER) */}
          {config.isSingleObject && config.singleFields && (
            <div className="p-5 rounded-2xl border border-divider bg-white dark:bg-[var(--bg-card)] space-y-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.singleFields.map((field) => (
                  <div
                    key={field.key}
                    className={field.colSpan === 2 ? "col-span-1 md:col-span-2" : "col-span-1"}
                  >
                    {renderField(field, parsedData, (val) =>
                      handleUpdateTopLevel(field.key, val)
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List Items Editor (e.g. cards, reviews, features, badges, items, categories) */}
          {config.listKey && (
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="p-8 rounded-2xl border-2 border-dashed border-divider text-center space-y-3 bg-default-50/50 dark:bg-[var(--bg-card)]/40">
                  <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-foreground">Danh sách hiện đang trống</h5>
                    <p className="text-xs text-foreground/60 mt-1">
                      Bạn có thể nạp mẫu có sẵn hoặc bấm &quot;Thêm mục mới&quot; để bắt đầu nhập liệu.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleLoadDefaultTemplate}
                      className="h-8 px-3 rounded-xl border border-divider text-xs font-bold bg-white dark:bg-[var(--bg-card)] cursor-pointer"
                    >
                      <RefreshCw size={13} className="mr-1 text-accent" />
                      Nạp mẫu mặc định
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddItem}
                      className="h-8 px-3 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold cursor-pointer border-none"
                    >
                      <Plus size={13} className="mr-1" />
                      Thêm mục mới
                    </Button>
                  </div>
                </div>
              ) : (
                items.map((item, index) => {
                  const isCollapsed = collapsedItems[index] || false;
                  const itemTitle = config.itemTitleField
                    ? getLocalizedPreview(item[config.itemTitleField]) || `Mục #${index + 1}`
                    : `Mục #${index + 1}`;
                  const itemSubtitle = config.itemSubtitleField
                    ? getLocalizedPreview(item[config.itemSubtitleField])
                    : "";

                  return (
                    <div
                      key={index}
                      className="rounded-2xl border border-divider bg-white dark:bg-[var(--bg-card)] shadow-xs transition-shadow hover:shadow-md overflow-hidden"
                    >
                      {/* Item Header */}
                      <div
                        onClick={() => toggleCollapse(index)}
                        className="flex items-center justify-between px-4 py-3 bg-default-50/70 dark:bg-[var(--bg-surface)] cursor-pointer select-none border-b border-divider"
                      >
                        <div className="flex items-center gap-2.5 truncate max-w-[60%]">
                          <span className="w-6 h-6 rounded-lg bg-accent text-accent-foreground flex items-center justify-center text-xs font-extrabold shrink-0 shadow-2xs">
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-foreground truncate">
                            {itemTitle}
                          </span>
                          {itemSubtitle && (
                            <span className="px-2 py-0.5 rounded-md bg-default-100 dark:bg-[var(--bg-elevated)] text-[10px] font-semibold text-foreground/70 truncate hidden sm:inline-block">
                              {itemSubtitle}
                            </span>
                          )}
                        </div>

                        {/* Item Control Actions */}
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            isDisabled={index === 0}
                            onClick={() => handleMoveItem(index, "up")}
                            className="h-7 w-7 text-foreground/60 hover:text-foreground rounded-lg cursor-pointer"
                            aria-label="Di chuyển lên"
                          >
                            <ArrowUp size={13} />
                          </Button>
                          <Button
                            type="button"
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            isDisabled={index === items.length - 1}
                            onClick={() => handleMoveItem(index, "down")}
                            className="h-7 w-7 text-foreground/60 hover:text-foreground rounded-lg cursor-pointer"
                            aria-label="Di chuyển xuống"
                          >
                            <ArrowDown size={13} />
                          </Button>
                          <Button
                            type="button"
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDuplicateItem(index)}
                            className="h-7 w-7 text-foreground/60 hover:text-foreground rounded-lg cursor-pointer"
                            aria-label="Nhân bản mục"
                          >
                            <Copy size={13} />
                          </Button>
                          <Button
                            type="button"
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteItem(index)}
                            className="h-7 w-7 text-foreground/60 hover:text-rose-600 rounded-lg cursor-pointer"
                            aria-label="Xóa mục"
                          >
                            <Trash2 size={13} />
                          </Button>
                          <Button
                            type="button"
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleCollapse(index)}
                            className="h-7 w-7 text-foreground/60 hover:text-foreground rounded-lg cursor-pointer ml-1"
                            aria-label={isCollapsed ? "Mở rộng" : "Thu gọn"}
                          >
                            {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                          </Button>
                        </div>
                      </div>

                      {/* Item Form Body */}
                      {!isCollapsed && config.itemFields && (
                        <div className="p-4 bg-white dark:bg-[var(--bg-card)]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {config.itemFields.map((field) => (
                              <div
                                key={field.key}
                                className={
                                  field.colSpan === 2
                                    ? "col-span-1 md:col-span-2"
                                    : "col-span-1"
                                }
                              >
                                {renderField(field, item, (fieldVal) => {
                                  const updated = { ...item, [field.key]: fieldVal };
                                  handleUpdateItem(index, updated);
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal độc lập z-[99999] */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-950/80 text-white shrink-0">
              <div className="flex items-center gap-2 truncate max-w-md">
                <ZoomIn size={16} className="text-accent shrink-0" />
                <span className="text-sm font-bold text-white truncate">
                  {zoomedImage?.title || "Xem ảnh phóng to"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {zoomedImage?.url && (
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(zoomedImage.url);
                      toast.success("Đã sao chép URL ảnh!");
                    }}
                    className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full"
                    aria-label="Sao chép URL"
                  >
                    <Copy size={14} />
                  </Button>
                )}
                <Button
                  type="button"
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onClick={() => setZoomedImage(null)}
                  className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0 flex items-center justify-center p-4 bg-black/90 overflow-hidden">
              {zoomedImage?.url && (
                <img
                  src={zoomedImage.url}
                  alt={zoomedImage.title || "Zoomed"}
                  className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl select-none"
                />
              )}
            </div>
            {zoomedImage?.url && (
              <div className="px-5 py-2.5 bg-neutral-950/90 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
                <span className="truncate max-w-xl font-mono text-[11px] select-all">
                  {zoomedImage.url}
                </span>
                <a
                  href={zoomedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline flex items-center gap-1 font-semibold text-[11px] shrink-0 ml-2"
                >
                  Mở tab mới
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
