"use client";

import React, { useState } from "react";
import {
  Button,
  Input,
  Label,
  Select,
  ListBox,
  Switch,
  Tabs,
  toast,
} from "@heroui/react";
import { Plus, Trash2, Upload, Car, Sparkles, ZoomIn, X, Copy } from "lucide-react";
import { uploadMedia, type MediaDto } from "@/lib/api/media";
import type { VehicleCategoryDto } from "@/lib/api/fleet";
import {
  type AirportPackageConfig,
  type PackageLocale,
} from "@/lib/airport-packages";

/* ------------------------------------------------------------------ */
/*  Types & helpers                                                   */
/* ------------------------------------------------------------------ */

interface AirportPackagesEditorProps {
  packages: AirportPackageConfig[];
  onChange: (next: AirportPackageConfig[]) => void;
  categories: VehicleCategoryDto[];
  activeLocale: PackageLocale;
  onActiveLocaleChange: (locale: PackageLocale) => void;
}

const LOCALE_TABS: { code: PackageLocale; flag: string; label: string }[] = [
  { code: "vi", flag: "🇻🇳", label: "Tiếng Việt" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "ko", flag: "🇰🇷", label: "한국어" },
  { code: "ru", flag: "🇷🇺", label: "Русский" },
];

const EMPTY_LOCALIZED = (): Record<PackageLocale, string> => ({
  vi: "",
  en: "",
  ko: "",
  ru: "",
});

const emptyPackage = (): AirportPackageConfig => ({
  id: `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  active: true,
  name: EMPTY_LOCALIZED() as AirportPackageConfig["name"],
  tag: { vi: "", en: "", ko: "", ru: "" },
  categoryText: { vi: "", en: "", ko: "", ru: "" },
  capacityText: { vi: "", en: "", ko: "", ru: "" },
  luggageText: { vi: "", en: "", ko: "", ru: "" },
  features: {
    vi: ["", "", ""],
    en: ["", "", ""],
    ko: ["", "", ""],
    ru: ["", "", ""],
  },
});

const categoryName = (cat?: VehicleCategoryDto): string =>
  cat?.translations?.find((t) => t.locale === "vi")?.name || cat?.code || "";

/* ------------------------------------------------------------------ */
/*  Editor                                                            */
/* ------------------------------------------------------------------ */

export function AirportPackagesEditor({
  packages,
  onChange,
  categories,
  activeLocale,
  onActiveLocaleChange,
}: AirportPackagesEditorProps) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title?: string } | null>(null);

  const update = (idx: number, patch: Partial<AirportPackageConfig>) =>
    onChange(packages.map((p, i) => (i === idx ? { ...p, ...patch } : p)));

  const setLocalized = (
    idx: number,
    key: "name" | "tag" | "categoryText" | "capacityText" | "luggageText",
    loc: PackageLocale,
    value: string
  ) => {
    const p = packages[idx];
    update(idx, { [key]: { ...(p[key] || EMPTY_LOCALIZED()), [loc]: value } } as Partial<AirportPackageConfig>);
  };

  const setFeature = (idx: number, loc: PackageLocale, featIdx: number, value: string) => {
    const p = packages[idx];
    const features = { ...(p.features || {}), [loc]: [...(p.features?.[loc] || ["", "", ""])] };
    features[loc]![featIdx] = value;
    update(idx, { features });
  };

  const handleImageUpload = async (idx: number, file: File | null) => {
    if (!file) return;
    setUploadingIdx(idx);
    try {
      const res = await uploadMedia(file, "airport-package-image");
      const media: MediaDto = res.data.media;
      const url = media.filePath.startsWith("http")
        ? media.filePath
        : `${window.location.origin}${media.filePath}`;
      update(idx, { imageUrl: url });
      toast.success("Tải ảnh gói xe thành công!");
    } catch (err: any) {
      toast.danger(err?.message || "Tải ảnh thất bại.");
    } finally {
      setUploadingIdx(null);
    }
  };

  return (
    <div className="pt-3 border-t border-divider space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-accent/20 text-accent">
            <Car size={15} />
          </span>
          <div>
            <h6 className="text-xs font-bold text-foreground">
              Quản lý gói xe đưa đón ({packages.length})
            </h6>
            <p className="text-xs text-foreground/60">
              Tên/ảnh/tag/nội dung do admin nhập; giá lấy tự động = giá thấp nhất 1 chiều của loại xe từ bảng giá sân bay mặc định
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => onChange([...packages, emptyPackage()])}
          className="h-8 px-3 text-xs font-bold rounded-xl bg-accent text-accent-foreground border-none cursor-pointer hover:bg-accent-hover transition-colors shadow-xs shrink-0"
        >
          <Plus size={14} className="mr-1" />
          Thêm gói xe
        </Button>
      </div>

      {packages.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-divider bg-default-50/50 dark:bg-[var(--bg-muted)]">
          <Car size={24} className="mx-auto text-foreground/40 mb-1.5" />
          <p className="text-xs font-bold text-foreground">Chưa có gói xe nào</p>
          <p className="text-xs text-foreground/60 mt-0.5">
            Bấm "+ Thêm gói xe" để cấu hình. Nếu để trống, hệ thống tự sinh card từ các dòng xe có bảng giá.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {packages.map((pkg, idx) => {
            const selectedCatKey =
              pkg.vehicleCategoryId != null
                ? String(pkg.vehicleCategoryId)
                : "none";
            return (
              <div
                key={pkg.id || idx}
                className="p-3.5 rounded-xl border border-divider bg-white dark:bg-[var(--bg-card)] space-y-3 shadow-xs"
              >
                {/* Header row */}
                <div className="flex items-center justify-between border-b border-divider/60 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-accent/20 text-accent font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-foreground truncate">
                      {pkg.name?.vi || pkg.name?.en || `Gói xe #${idx + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground/70">
                        {pkg.active !== false ? "Hiển thị" : "Tạm ẩn"}
                      </span>
                      <Switch
                        isSelected={pkg.active !== false}
                        onChange={(isSelected) => update(idx, { active: isSelected })}
                        size="sm"
                      />
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="outline"
                      onClick={() => onChange(packages.filter((_, i) => i !== idx))}
                      className="h-7 w-7 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900 cursor-pointer rounded-lg"
                      aria-label="Xóa gói xe"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>

                {/* Row 1: vehicle category + image */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1 min-w-0">
                    <Label isRequired className="text-sm font-bold text-foreground">
                      Loại xe liên kết (lấy giá)
                    </Label>
                    <Select
                      fullWidth
                      selectedKey={selectedCatKey}
                      onSelectionChange={(k) =>
                        update(idx, {
                          vehicleCategoryId:
                            k && k !== "none" ? Number(k) : undefined,
                        })
                      }
                    >
                      <Select.Trigger className="w-full px-2.5 py-1.5 rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground text-xs h-[36px] cursor-pointer">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border-1 border-separator rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                        <ListBox>
                          <ListBox.Item
                            key="none"
                            id="none"
                            textValue="Không liên kết"
                            className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-default-100 dark:hover:bg-[var(--bg-elevated)] text-foreground flex items-center justify-between"
                          >
                            Không liên kết (không hiển thị giá)
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          {categories.map((cat) => (
                            <ListBox.Item
                              key={cat.id}
                              id={String(cat.id)}
                              textValue={categoryName(cat)}
                              className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-default-100 dark:hover:bg-[var(--bg-elevated)] text-foreground flex items-center justify-between"
                            >
                              <span className="truncate">
                                {categoryName(cat)}{" "}
                                <span className="text-foreground/50">
                                  ({cat.minSeat}-{cat.maxSeat} chỗ)
                                </span>
                              </span>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <Label className="text-sm font-bold text-foreground">Ảnh gói xe</Label>
                    <div className="flex items-center gap-2">
                      {pkg.imageUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setZoomedImage({
                              url: pkg.imageUrl!,
                              title: pkg.name?.vi || pkg.name?.en || `Gói xe #${idx + 1}`,
                            })
                          }
                          aria-label="Phóng to ảnh gói xe"
                          className="relative h-[36px] w-14 rounded-lg overflow-hidden border border-divider shrink-0 bg-muted cursor-zoom-in group/zoom hover:ring-2 hover:ring-accent/50 transition-all"
                        >
                          <img
                            src={pkg.imageUrl}
                            alt="Ảnh gói xe"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute right-0.5 bottom-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/zoom:opacity-100 transition-opacity">
                            <ZoomIn size={10} />
                          </span>
                        </button>
                      ) : (
                        <div className="h-[36px] w-14 rounded-lg border border-dashed border-divider bg-default-50 dark:bg-[var(--bg-muted)] flex items-center justify-center shrink-0">
                          <Car size={14} className="text-foreground/40" />
                        </div>
                      )}
                      <label className="flex items-center gap-1.5 px-2.5 h-[36px] rounded-lg border border-divider bg-default-50 dark:bg-[var(--bg-muted)] text-xs font-bold text-foreground/80 cursor-pointer hover:bg-default-100 dark:hover:bg-[var(--bg-elevated)] transition-colors shrink-0">
                        {uploadingIdx === idx ? (
                          <span className="text-foreground/60">Đang tải...</span>
                        ) : (
                          <>
                            <Upload size={13} />
                            {pkg.imageUrl ? "Đổi ảnh" : "Tải ảnh"}
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            handleImageUpload(idx, e.target.files?.[0] || null);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Row 2: 4-language tabs for content */}
                <Tabs
                  selectedKey={activeLocale}
                  onSelectionChange={(k) => onActiveLocaleChange(String(k) as PackageLocale)}
                >
                  <Tabs.List className="h-8 p-0.5 bg-slate-100 dark:bg-[var(--bg-card)] rounded-lg">
                    {LOCALE_TABS.map(({ code, flag }) => (
                      <Tabs.Tab key={code} id={code} className="text-xs font-bold px-2.5 py-1">
                        {flag} {code.toUpperCase()}
                        <Tabs.Indicator className="bg-accent/20 rounded-lg" />
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs>

                {/* Row 3: content fields for active locale */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label isRequired className="text-sm font-bold text-foreground">
                        Tên gói xe ({activeLocale.toUpperCase()})
                      </Label>
                      <Input
                        placeholder="VD: Xe 4 chỗ Sedan"
                        value={pkg.name?.[activeLocale] || ""}
                        onChange={(e) => setLocalized(idx, "name", activeLocale, e.target.value)}
                        className="w-full h-8 text-xs rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground px-2.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-bold text-foreground">
                        Tag nổi bật ({activeLocale.toUpperCase()})
                      </Label>
                      <Input
                        placeholder="VD: TIẾT KIỆM NHẤT"
                        value={pkg.tag?.[activeLocale] || ""}
                        onChange={(e) => setLocalized(idx, "tag", activeLocale, e.target.value)}
                        className="w-full h-8 text-xs rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground px-2.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold text-foreground">
                        Nhãn phân loại ({activeLocale.toUpperCase()})
                      </Label>
                      <Input
                        placeholder="VD: Sedan Tiết Kiệm"
                        value={pkg.categoryText?.[activeLocale] || ""}
                        onChange={(e) => setLocalized(idx, "categoryText", activeLocale, e.target.value)}
                        className="w-full h-8 text-xs rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground px-2.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-bold text-foreground">
                        Số chỗ ({activeLocale.toUpperCase()})
                      </Label>
                      <Input
                        placeholder="VD: Tối đa 3 khách"
                        value={pkg.capacityText?.[activeLocale] || ""}
                        onChange={(e) => setLocalized(idx, "capacityText", activeLocale, e.target.value)}
                        className="w-full h-8 text-xs rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground px-2.5"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-foreground">
                      Hành lý ({activeLocale.toUpperCase()})
                    </Label>
                    <Input
                      placeholder="VD: 2 vali cỡ vừa"
                      value={pkg.luggageText?.[activeLocale] || ""}
                      onChange={(e) => setLocalized(idx, "luggageText", activeLocale, e.target.value)}
                      className="w-full h-8 text-xs rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground px-2.5"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-foreground">
                      Điểm nổi bật ({activeLocale.toUpperCase()}) — 3 mục
                    </Label>
                    {[0, 1, 2].map((fIdx) => (
                      <div key={fIdx} className="flex items-center gap-1.5">
                        <Sparkles size={12} className="text-accent shrink-0" />
                        <Input
                          placeholder={
                            fIdx === 0
                              ? "VD: Bao trọn phí cầu đường"
                              : fIdx === 1
                                ? "VD: Đón sảnh đến sân bay"
                                : "VD: Miễn phí chờ delay"
                          }
                          value={pkg.features?.[activeLocale]?.[fIdx] || ""}
                          onChange={(e) => setFeature(idx, activeLocale, fIdx, e.target.value)}
                          className="w-full h-8 text-xs rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground px-2.5"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox phóng to ảnh gói xe */}
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
                  {zoomedImage?.title || "Ảnh gói xe"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {zoomedImage?.url && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(zoomedImage.url);
                      toast.success("Đã sao chép URL ảnh!");
                    }}
                    className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full"
                    aria-label="Sao chép URL ảnh"
                  >
                    <Copy size={14} />
                  </Button>
                )}
                <Button
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
                  alt={zoomedImage.title || "Ảnh gói xe"}
                  className="max-w-full max-h-full object-contain rounded-xl"
                />
              )}
            </div>
            {zoomedImage?.url && (
              <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between gap-3 shrink-0">
                <span className="text-xs text-neutral-400 font-medium truncate">
                  {zoomedImage.url}
                </span>
                <a
                  href={zoomedImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-accent hover:text-accent/80 no-underline shrink-0"
                >
                  Mở URL
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AirportPackagesEditor;