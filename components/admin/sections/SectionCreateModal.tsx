"use client";

import React, { useState, useEffect, useRef } from "react";
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
  toast,
  Label,
  Switch,
  Input,
  TextArea,
  NumberField,
  Select,
  ListBox,
  ColorPicker,
  ColorSwatch,
  ColorArea,
  ColorSlider,
  ColorField,
  parseColor,
} from "@heroui/react";
import {
  CreateSectionRequest,
  SectionDto,
  createSection,
  updateSection,
} from "@/lib/api/sections";
import { uploadMedia, deleteMedia, type MediaDto } from "@/lib/api/media";
import { ImagePlus, X, Upload, Shuffle } from "lucide-react";
import { KeyValueEditor } from "./KeyValueEditor";

interface SectionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pagePath: string;
  initialData?: SectionDto | null;
}

const SECTION_TYPES = [
  { value: "HERO_BANNER", label: "Hero Banner" },
  { value: "FEATURES", label: "Tính năng" },
  { value: "SLIDE_CARD", label: "Carousel Thẻ" },
  { value: "SLIDE_REVIEW", label: "Carousel Đánh giá" },
  { value: "INSPIRATION", label: "Truyền cảm hứng" },
  { value: "PROMO", label: "Khuyến mãi" },
  { value: "TESTIMONIALS", label: "Đánh giá" },
  { value: "CTA", label: "Call to Action" },
  { value: "BANNER", label: "Banner" },
];

interface UploadedImage {
  id: number;
  url: string;
  fileName: string;
}

export default function SectionCreateModal({
  isOpen,
  onClose,
  onSuccess,
  pagePath,
  initialData,
}: SectionCreateModalProps) {
  const isEdit = !!initialData;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sectionName, setSectionName] = useState("");
  const [sectionType, setSectionType] = useState("HERO_BANNER");
  const [orderIndex, setOrderIndex] = useState(0);
  const [active, setActive] = useState(true);
  const [textColor, setTextColor] = useState("");
  const [bgColor, setBgColor] = useState("");
  const [cssClass, setCssClass] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [contentData, setContentData] = useState("");

  const [transVi, setTransVi] = useState({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
  const [transEn, setTransEn] = useState({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
  const [transKo, setTransKo] = useState({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
  const [transRu, setTransRu] = useState({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const safeParseColor = (colorStr?: string, defaultHex: string = "#ffffff") => {
    try {
      return parseColor(colorStr || defaultHex);
    } catch {
      return parseColor(defaultHex);
    }
  };

  useEffect(() => {
    if (initialData) {
      setSectionName(initialData.sectionName);
      setSectionType(initialData.sectionType);
      setOrderIndex(initialData.orderIndex);
      setActive(initialData.active);
      setTextColor(initialData.textColor || "");
      setBgColor(initialData.bgColor || "");
      setCssClass(initialData.cssClass || "");
      setLinkUrl(initialData.linkUrl || "");
      setContentData(initialData.contentData || "");

      const findTrans = (locale: string) =>
        initialData.translations.find((t) => t.locale === locale);

      const vi = findTrans("vi");
      const en = findTrans("en");
      const ko = findTrans("ko");
      const ru = findTrans("ru");

      setTransVi(vi ? { title: vi.title || "", subtitle: vi.subtitle || "", description: vi.description || "", btnText: vi.btnText || "", btnLink: vi.btnLink || "" } : { title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
      setTransEn(en ? { title: en.title || "", subtitle: en.subtitle || "", description: en.description || "", btnText: en.btnText || "", btnLink: en.btnLink || "" } : { title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
      setTransKo(ko ? { title: ko.title || "", subtitle: ko.subtitle || "", description: ko.description || "", btnText: ko.btnText || "", btnLink: ko.btnLink || "" } : { title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
      setTransRu(ru ? { title: ru.title || "", subtitle: ru.subtitle || "", description: ru.description || "", btnText: ru.btnText || "", btnLink: ru.btnLink || "" } : { title: "", subtitle: "", description: "", btnText: "", btnLink: "" });

      // Load existing images from section.imageUrls
      if (initialData.imageUrls && initialData.imageUrls.length > 0) {
        setImages(
          initialData.imageUrls.map((url, i) => ({
            id: -(i + 1),
            url,
            fileName: `image-${i + 1}`,
          }))
        );
      }
    } else {
      setSectionName("");
      setSectionType("HERO_BANNER");
      setOrderIndex(0);
      setActive(true);
      setTextColor("");
      setBgColor("");
      setCssClass("");
      setLinkUrl("");
      setContentData("");
      setImages([]);
      setTransVi({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
      setTransEn({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
      setTransKo({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
      setTransRu({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
    }
  }, [initialData, isOpen]);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploads = Array.from(files).map(async (file) => {
        const res = await uploadMedia(file, sectionName || "section-image");
        const media: MediaDto = res.data.media;
        const url = media.filePath.startsWith("http")
          ? media.filePath
          : `${window.location.origin}${media.filePath}`;
        return { id: media.id, url, fileName: media.fileName };
      });
      const results = await Promise.all(uploads);
      setImages((prev) => [...prev, ...results]);
      toast.success(`Đã tải lên ${results.length} ảnh.`);
    } catch (err: any) {
      toast.danger(err?.message || "Tải ảnh thất bại.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const img = images[index];
    if (img && img.id > 0) {
      try { await deleteMedia(img.id); } catch { /* non-blocking */ }
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!sectionName.trim()) {
      toast.danger("Vui lòng nhập tên section.");
      return;
    }

    const translations = [
      { locale: "vi", ...transVi },
      { locale: "en", ...transEn },
      { locale: "ko", ...transKo },
      { locale: "ru", ...transRu },
    ].filter((t) => t.title.trim() !== "");

    const imageIds = images
      .map((img) => img.id)
      .filter((id) => id > 0);

    const payload: CreateSectionRequest = {
      sectionName: sectionName.trim(),
      sectionType,
      pagePath,
      orderIndex,
      active,
      textColor: textColor || undefined,
      bgColor: bgColor || undefined,
      cssClass: cssClass || undefined,
      linkUrl: linkUrl || undefined,
      contentData: contentData || undefined,
      imageIds: imageIds.length > 0 ? imageIds : undefined,
      translations,
    };

    setSubmitting(true);
    try {
      if (isEdit && initialData?.id) {
        await updateSection(initialData.id, payload);
        toast.success("Cập nhật section thành công!");
      } else {
        await createSection(payload);
        toast.success("Tạo section thành công!");
      }
      onSuccess();
    } catch (err: any) {
      toast.danger(err?.message || "Thao tác thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderTranslationFields = (
    locale: string,
    data: { title: string; subtitle: string; description: string; btnText: string; btnLink: string },
    setter: (d: any) => void
  ) => (
    <div key={locale} className="space-y-3 p-4 bg-default-50 dark:bg-[var(--bg-muted)] border border-divider rounded-xl">
      <Label className="text-sm font-bold text-foreground block">
        Ngôn ngữ: {locale.toUpperCase()}
      </Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground/80">Tiêu đề</Label>
          <Input
            placeholder="Tiêu đề banner..."
            value={data.title}
            onChange={(e) => setter({ ...data, title: e.target.value })}
            className="w-full rounded-xl border border-divider bg-white dark:bg-[var(--bg-surface)] text-foreground"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground/80">Tiêu đề phụ</Label>
          <Input
            placeholder="Tiêu đề phụ..."
            value={data.subtitle}
            onChange={(e) => setter({ ...data, subtitle: e.target.value })}
            className="w-full rounded-xl border border-divider bg-white dark:bg-[var(--bg-surface)] text-foreground"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold text-foreground/80">Mô tả</Label>
        <TextArea
          placeholder="Nội dung mô tả chi tiết..."
          value={data.description}
          onChange={(e) => setter({ ...data, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2.5 rounded-xl border border-divider bg-white dark:bg-[var(--bg-surface)] text-sm text-foreground resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground/80">Chữ trên nút (Button Text)</Label>
          <Input
            placeholder="VD: Hotline: 0764 971 971"
            value={data.btnText}
            onChange={(e) => setter({ ...data, btnText: e.target.value })}
            className="w-full rounded-xl border border-divider bg-white dark:bg-[var(--bg-surface)] text-foreground"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground/80">Đường dẫn nút (Button Link / tel / url)</Label>
          <Input
            placeholder="VD: tel:0764971971 hoặc /dat-xe"
            value={data.btnLink}
            onChange={(e) => setter({ ...data, btnLink: e.target.value })}
            className="w-full rounded-xl border border-divider bg-white dark:bg-[var(--bg-surface)] text-foreground"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="section-create-title">
      <ModalBackdrop className="bg-black/50 backdrop-blur-sm">
        <ModalContainer className="max-w-4xl w-full">
          <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-divider shadow-2xl overflow-hidden animate-scale-up w-full max-w-4xl relative">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-divider bg-default-50 dark:bg-[var(--bg-page)]/50">
              <h2 id="section-create-title" className="text-lg font-extrabold text-foreground">
                {isEdit ? "Chỉnh sửa Section" : "Thêm Section mới"}
              </h2>
            </ModalHeader>
            <ModalBody className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Thông tin cơ bản</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Tên section *</Label>
                    <Input
                      value={sectionName}
                      onChange={(e) => setSectionName(e.target.value)}
                      placeholder="VD: Hero Banner Homepage"
                      className="w-full rounded-xl border border-divider bg-white dark:bg-[var(--bg-card)] text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Loại section *</Label>
                    <Select
                      fullWidth
                      selectedKey={sectionType}
                      onSelectionChange={(key) => { if (key) setSectionType(String(key)); }}
                    >
                      <Select.Trigger className="w-full px-3 py-2 rounded-xl border border-divider bg-white dark:bg-[var(--bg-card)] text-foreground text-sm h-[38px] cursor-pointer">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-divider rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                        <ListBox>
                          {SECTION_TYPES.map((t) => (
                            <ListBox.Item key={t.value} id={t.value} textValue={t.label} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-default-100 dark:hover:bg-[var(--bg-elevated)] text-foreground flex items-center justify-between">
                              {t.label}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5 max-w-[120px]">
                    <Label className="text-xs font-bold text-foreground">Thứ tự</Label>
                    <NumberField value={orderIndex} onChange={(val) => setOrderIndex(val || 0)} minValue={0}>
                      <NumberField.Group className="flex items-center w-full rounded-xl border border-divider bg-white dark:bg-[var(--bg-card)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[38px]">
                        <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground outline-none border-none h-full" />
                        <div className="flex h-full flex-col border-l border-divider">
                          <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-foreground/60 hover:bg-default-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer bg-transparent text-xs">▲</NumberField.IncrementButton>
                          <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-foreground/60 hover:bg-default-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer bg-transparent text-xs border-t border-divider">▼</NumberField.DecrementButton>
                        </div>
                      </NumberField.Group>
                    </NumberField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Màu chữ</Label>
                      <ColorPicker
                        value={safeParseColor(textColor, "#ffffff")}
                        onChange={(color) => setTextColor(color.toString("hex"))}
                      >
                        <ColorPicker.Trigger className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-divider bg-white dark:bg-[var(--bg-card)] cursor-pointer w-full justify-between">
                          <div className="flex items-center gap-1.5">
                            <ColorSwatch size="xs" color={safeParseColor(textColor, "#ffffff")} />
                            <span className="text-xs font-bold text-foreground">{textColor || "#ffffff"}</span>
                          </div>
                        </ColorPicker.Trigger>
                        <ColorPicker.Popover className="gap-2 p-3 bg-white dark:bg-[var(--bg-card)] border border-divider shadow-xl rounded-xl">
                          <ColorArea aria-label="Color area" className="max-w-full h-32 rounded-lg" colorSpace="hsb" xChannel="saturation" yChannel="brightness">
                            <ColorArea.Thumb />
                          </ColorArea>
                          <div className="flex items-center gap-2">
                            <ColorSlider aria-label="Hue slider" channel="hue" className="flex-grow" colorSpace="hsb">
                              <ColorSlider.Track>
                                <ColorSlider.Thumb />
                              </ColorSlider.Track>
                            </ColorSlider>
                            <Button type="button" isIconOnly size="sm" variant="outline" aria-label="Chọn màu chữ ngẫu nhiên" className="h-8 w-8 rounded-lg bg-default-50 border border-divider" onClick={() => setTextColor("hsl(" + Math.floor(Math.random() * 360) + ", 75%, 50%)")}>
                              <Shuffle size={12} />
                            </Button>
                          </div>
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
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Màu nền</Label>
                      <ColorPicker
                        value={safeParseColor(bgColor, "#1a1a2e")}
                        onChange={(color) => setBgColor(color.toString("hex"))}
                      >
                        <ColorPicker.Trigger className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-divider bg-white dark:bg-[var(--bg-card)] cursor-pointer w-full justify-between">
                          <div className="flex items-center gap-1.5">
                            <ColorSwatch size="xs" color={safeParseColor(bgColor, "#1a1a2e")} />
                            <span className="text-xs font-bold text-foreground">{bgColor || "#1a1a2e"}</span>
                          </div>
                        </ColorPicker.Trigger>
                        <ColorPicker.Popover className="gap-2 p-3 bg-white dark:bg-[var(--bg-card)] border border-divider shadow-xl rounded-xl">
                          <ColorArea aria-label="Color area" className="max-w-full h-32 rounded-lg" colorSpace="hsb" xChannel="saturation" yChannel="brightness">
                            <ColorArea.Thumb />
                          </ColorArea>
                          <div className="flex items-center gap-2">
                            <ColorSlider aria-label="Hue slider" channel="hue" className="flex-grow" colorSpace="hsb">
                              <ColorSlider.Track>
                                <ColorSlider.Thumb />
                              </ColorSlider.Track>
                            </ColorSlider>
                            <Button type="button" isIconOnly size="sm" variant="outline" aria-label="Chọn màu nền ngẫu nhiên" className="h-8 w-8 rounded-lg bg-default-50 border border-divider" onClick={() => setBgColor("hsl(" + Math.floor(Math.random() * 360) + ", 75%, 50%)")}>
                              <Shuffle size={12} />
                            </Button>
                          </div>
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
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">CSS Class</Label>
                    <Input value={cssClass} onChange={(e) => setCssClass(e.target.value)} placeholder="hero-home" className="w-full rounded-xl border border-divider bg-white dark:bg-[var(--bg-card)] text-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Link URL</Label>
                    <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/tours" className="w-full rounded-xl border border-divider bg-white dark:bg-[var(--bg-card)] text-foreground" />
                  </div>
                </div>

                <KeyValueEditor
                  value={contentData}
                  onChange={setContentData}
                  sectionType={sectionType}
                  pagePath={pagePath}
                />

                {/* Image Upload */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Hình ảnh</Label>
                  <div
                    className="border-2 border-dashed border-divider rounded-xl p-4 cursor-pointer hover:border-primary transition-colors bg-default-50 dark:bg-[var(--bg-card)]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files)}
                    />
                    <div className="flex flex-col items-center gap-2 text-foreground/50">
                      {uploading ? (
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload size={24} />
                      )}
                      <p className="text-xs font-medium">
                        {uploading ? "Đang tải lên..." : "Nhấn để chọn ảnh hoặc kéo thả"}
                      </p>
                    </div>
                  </div>
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {images.map((img, idx) => (
                        <div key={`${img.id}-${idx}`} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-divider">
                          <img
                            src={img.url}
                            alt={img.fileName}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Switch isSelected={active} onChange={() => setActive(!active)}>
                    <Label className="text-xs font-bold text-foreground">Kích hoạt</Label>
                  </Switch>
                </div>
              </div>

              {/* Translations */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Nội dung đa ngôn ngữ</h4>
                {renderTranslationFields("vi", transVi, setTransVi)}
                {renderTranslationFields("en", transEn, setTransEn)}
                {renderTranslationFields("ko", transKo, setTransKo)}
                {renderTranslationFields("ru", transRu, setTransRu)}
              </div>
            </ModalBody>
            <ModalFooter className="px-6 py-4 border-t border-divider bg-default-50 dark:bg-[var(--bg-page)]/50 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={onClose} className="rounded-xl border-divider">
                Hủy
              </Button>
              <Button
                className="rounded-xl font-bold bg-accent hover:bg-accent-hover text-white shadow-sm"
                onClick={handleSubmit}
                isDisabled={submitting}
              >
                {submitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
