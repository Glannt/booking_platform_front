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
  Tabs,
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
import {
  type DestinationItem,
  DEFAULT_TEMPLATE_DESTINATIONS,
} from "@/lib/api/section-templates";
import {
  ImagePlus,
  X,
  Upload,
  Shuffle,
  Save,
  RefreshCw,
  Sparkles,
  MapPin,
  Plus,
  Trash2,
  ZoomIn,
  Copy,
  ExternalLink,
} from "lucide-react";
import JsonListEditor from "./JsonListEditor";
import { getDefaultContentDataForSection } from "./listEditorConfigs";
import { AirportPackagesEditor } from "./AirportPackagesEditor";
import type { AirportPackageConfig, PackageLocale } from "@/lib/airport-packages";
import { getVehicleCategories, type VehicleCategoryDto } from "@/lib/api/fleet";

interface SectionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  pagePath: string;
  initialData?: SectionDto | null;
}

const SECTION_TYPES = [
  { value: "HERO_BANNER", label: "Hero Banner" },
  { value: "SYSTEM_CATALOG", label: "Dữ liệu hệ thống (Tour, Xe, Sân bay...)" },
  { value: "FEATURES", label: "Tính năng" },
  { value: "SLIDE_CARD", label: "Carousel Thẻ" },
  { value: "SLIDE_REVIEW", label: "Carousel Đánh giá" },
  { value: "INSPIRATION", label: "Truyền cảm hứng" },
  { value: "PROMO", label: "Khuyến mãi" },
  { value: "TESTIMONIALS", label: "Đánh giá" },
  { value: "COMPANY_LOCATION", label: "Vị trí công ty & Văn phòng" },
  { value: "PARTNER_COOPERATION", label: "Nhận hợp tác đối tác" },
  { value: "CTA", label: "Call to Action" },
  { value: "BANNER", label: "Banner" },
  { value: "FAQ", label: "FAQ (Câu hỏi thường gặp)" },
];

const SYSTEM_SOURCES = [
  { value: "tours", label: "Tour du lịch nổi bật (Tours)", defaultLink: "/tours" },
  { value: "self-drive", label: "Thuê xe tự lái Nha Trang (Self-Drive)", defaultLink: "/self-drive" },
  { value: "intercity", label: "Tuyến xe liên tỉnh & Xe ghép (Intercity)", defaultLink: "/intercity" },
  { value: "airport-transfer", label: "Đưa đón sân bay Cam Ranh ⇌ Nha Trang", defaultLink: "/airport-transfer" },
  { value: "destinations", label: "Điểm đến du lịch (Bạn muốn đi đâu chơi?)", defaultLink: "/tours" },
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
  const [linkUrl, setLinkUrl] = useState("");
  const [contentData, setContentData] = useState("");

  // System Catalog settings
  const [systemSource, setSystemSource] = useState<string>("tours");
  const [systemLimit, setSystemLimit] = useState<number>(8);
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);

  const [transVi, setTransVi] = useState({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
  const [transEn, setTransEn] = useState({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
  const [transKo, setTransKo] = useState({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
  const [transRu, setTransRu] = useState({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
  const [activeTransTab, setActiveTransTab] = useState<"vi" | "en" | "ko" | "ru">("vi");
  const [packages, setPackages] = useState<AirportPackageConfig[]>([]);
  const [activePkgLocale, setActivePkgLocale] = useState<PackageLocale>("vi");
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategoryDto[]>([]);

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDestIndex, setUploadingDestIndex] = useState<number | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title?: string } | null>(null);

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
      setLinkUrl(initialData.linkUrl || "");
      setContentData(initialData.contentData || "");

      // Parse systemSource if SYSTEM_CATALOG
      if (initialData.contentData) {
        try {
          const parsed = JSON.parse(initialData.contentData);
          if (parsed.systemSource) setSystemSource(parsed.systemSource);
          if (parsed.itemLimit) setSystemLimit(Number(parsed.itemLimit) || 8);
          if (Array.isArray(parsed.destinations)) {
            setDestinations(parsed.destinations);
          } else if (parsed.systemSource === "destinations") {
            setDestinations(DEFAULT_TEMPLATE_DESTINATIONS);
          } else {
            setDestinations([]);
          }
          if (Array.isArray(parsed.packages)) {
            setPackages(parsed.packages);
          } else {
            setPackages([]);
          }
        } catch {
          setDestinations([]);
          setPackages([]);
        }
      } else {
        setDestinations([]);
        setPackages([]);
      }

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
      setLinkUrl("");
      setContentData("");
      setSystemSource("tours");
      setSystemLimit(8);
      setDestinations([]);
      setPackages([]);
      setImages([]);
      setTransVi({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
      setTransEn({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
      setTransKo({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
      setTransRu({ title: "", subtitle: "", description: "", btnText: "", btnLink: "" });
    }
  }, [initialData, isOpen]);

  // Load vehicle categories when airport-transfer editing is active (for price-linked select)
  useEffect(() => {
    if (systemSource === "airport-transfer" && vehicleCategories.length === 0) {
      getVehicleCategories({ active: true }, { skipTranslationFilter: true })
        .then((res) => {
          if (res?.data?.content) setVehicleCategories(res.data.content);
        })
        .catch(() => { });
    }
  }, [systemSource, vehicleCategories.length]);

  const handleSystemSourceChange = (source: string) => {
    setSystemSource(source);
    const found = SYSTEM_SOURCES.find((s) => s.value === source);
    if (found && !linkUrl) {
      setLinkUrl(found.defaultLink);
    }
    if (source === "tours" && !transVi.title) {
      setTransVi((prev) => ({ ...prev, title: "Các hoạt động nổi bật", subtitle: "Trải nghiệm tour du lịch và hoạt động giải trí không thể bỏ lỡ tại Nha Trang" }));
      setTransEn((prev) => ({ ...prev, title: "Featured Activities", subtitle: "Must-try guided sightseeing tours and island experiences in Nha Trang" }));
    } else if (source === "self-drive" && !transVi.title) {
      setTransVi((prev) => ({ ...prev, title: "Thuê xe tự lái Nha Trang", subtitle: "Đa dạng dòng xe 4-7 chỗ đời mới, bảo hiểm toàn diện, giao xe tận nơi" }));
      setTransEn((prev) => ({ ...prev, title: "Self-Drive Car Rental Nha Trang", subtitle: "Modern 4-7 seater fleet, comprehensive insurance, doorstep delivery" }));
    } else if (source === "intercity" && !transVi.title) {
      setTransVi((prev) => ({ ...prev, title: "Tuyến xe liên tỉnh & Xe ghép", subtitle: "Di chuyển êm ái, đón tận nơi giữa Nha Trang và các tỉnh thành (Đà Lạt, Cam Ranh, Phan Thiết...)" }));
      setTransEn((prev) => ({ ...prev, title: "Intercity Private & Shared Transfers", subtitle: "Door-to-door comfort between Nha Trang and other cities" }));
    } else if (source === "airport-transfer" && !transVi.title) {
      setTransVi((prev) => ({ ...prev, title: "Đưa đón sân bay Cam Ranh ⇌ Nha Trang", subtitle: "Giá trọn gói cố định, miễn phí chờ chuyến bay delay, đón sảnh đúng giờ 24/7" }));
      setTransEn((prev) => ({ ...prev, title: "Cam Ranh Airport Transfers ⇌ Nha Trang", subtitle: "Fixed all-inclusive rates, free waiting for flight delays, 24/7 pickup" }));
    } else if (source === "destinations") {
      if (destinations.length === 0) {
        setDestinations(DEFAULT_TEMPLATE_DESTINATIONS);
      }
      if (!transVi.title) {
        setTransVi((prev) => ({ ...prev, title: "Bạn muốn đi đâu chơi?", subtitle: "Khám phá các điểm đến du lịch tuyệt vời gần Nha Trang và Nam Trung Bộ" }));
        setTransEn((prev) => ({ ...prev, title: "Where do you want to go?", subtitle: "Explore top exciting travel destinations around Nha Trang" }));
      }
    }
  };

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

  const handleDestinationImageUpload = async (index: number, file: File | null) => {
    if (!file) return;
    setUploadingDestIndex(index);
    try {
      const res = await uploadMedia(file, "destination-image");
      const media: MediaDto = res.data.media;
      const url = media.filePath.startsWith("http")
        ? media.filePath
        : `${window.location.origin}${media.filePath}`;

      setDestinations((prev) =>
        prev.map((d, i) => (i === index ? { ...d, imageUrl: url } : d))
      );
      toast.success("Tải ảnh điểm đến thành công!");
    } catch (err: any) {
      toast.danger(err?.message || "Tải ảnh thất bại.");
    } finally {
      setUploadingDestIndex(null);
    }
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

    let finalContentData = contentData || undefined;
    if (sectionType === "SYSTEM_CATALOG") {
      finalContentData = JSON.stringify({
        systemSource,
        itemLimit: systemLimit,
        viewAllLink: linkUrl || (SYSTEM_SOURCES.find((s) => s.value === systemSource)?.defaultLink || "/tours"),
        ...(systemSource === "destinations" ? { destinations } : {}),
        ...(systemSource === "airport-transfer" ? { packages } : {}),
      });
    }

    const payload: CreateSectionRequest = {
      sectionName: sectionName.trim(),
      sectionType,
      pagePath,
      orderIndex,
      active,
      textColor: textColor || undefined,
      bgColor: bgColor || undefined,
      linkUrl: linkUrl || undefined,
      contentData: finalContentData,
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
      await onSuccess?.();
    } catch (err: any) {
      toast.danger(err?.message || "Thao tác thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const TRANSLATION_TABS = [
    { code: "vi", label: "Tiếng Việt", flag: "🇻🇳 VI" },
    { code: "en", label: "English", flag: "🇬🇧 EN" },
    { code: "ko", label: "한국어", flag: "🇰🇷 KO" },
    { code: "ru", label: "Русский", flag: "🇷🇺 RU" },
  ] as const;

  const renderTranslationFields = (
    locale: string,
    data: { title: string; subtitle: string; description: string; btnText: string; btnLink: string },
    setter: (d: any) => void
  ) => {
    const locInfo = TRANSLATION_TABS.find((t) => t.code === locale);
    return (
      <div key={locale} className="space-y-4 p-4 bg-default-50 dark:bg-[var(--bg-muted)] border border-divider rounded-xl">
        <div className="flex items-center gap-2 pb-2 border-b border-divider">
          <span className="px-2.5 py-1 rounded-lg bg-accent/15 text-accent font-bold text-xs flex items-center gap-1.5">
            <span>{locInfo?.flag || locale.toUpperCase()}</span>
            <span>{locInfo?.label || locale}</span>
          </span>
          <span className="text-xs text-foreground/50">Cấu hình hiển thị cho ngôn ngữ này</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-foreground/80">Tiêu đề</Label>
            <Input
              placeholder="Tiêu đề banner..."
              value={data.title}
              onChange={(e) => setter({ ...data, title: e.target.value })}
              className="w-full rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-foreground/80">Tiêu đề phụ</Label>
            <Input
              placeholder="Tiêu đề phụ..."
              value={data.subtitle}
              onChange={(e) => setter({ ...data, subtitle: e.target.value })}
              className="w-full rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-semibold text-foreground/80">Mô tả</Label>
          <TextArea
            placeholder="Nội dung mô tả chi tiết..."
            value={data.description}
            onChange={(e) => setter({ ...data, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-sm text-foreground resize-y min-h-[90px] focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-foreground/80">Chữ trên nút (Button Text)</Label>
            <Input
              placeholder="VD: Hotline: 0764 971 971"
              value={data.btnText}
              onChange={(e) => setter({ ...data, btnText: e.target.value })}
              className="w-full rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-foreground/80">Đường dẫn nút (Button Link / tel / url)</Label>
            <Input
              placeholder="VD: tel:0764971971 hoặc /dat-xe"
              value={data.btnLink}
              onChange={(e) => setter({ ...data, btnLink: e.target.value })}
              className="w-full rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="section-create-title">
        <ModalBackdrop className="bg-black/50 backdrop-blur-sm">
          <ModalContainer className="max-w-7xl w-full">
            <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-divider shadow-2xl overflow-hidden animate-scale-up w-full max-w-7xl relative">
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
                      <Label isRequired className="text-sm font-bold text-foreground">Tên section</Label>
                      <Input
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value)}
                        placeholder="VD: Hero Banner Homepage"
                        className="w-full rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label isRequired className="text-sm font-bold text-foreground">Loại section</Label>
                      <Select
                        fullWidth
                        selectedKey={sectionType}
                        onSelectionChange={(key) => {
                          if (key) {
                            const newType = String(key);
                            setSectionType(newType);
                            if (!contentData || contentData === "{}" || contentData.trim() === "") {
                              setContentData(getDefaultContentDataForSection(newType));
                            }
                          }
                        }}
                      >
                        <Select.Trigger className="w-full px-3 py-2 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-foreground text-sm h-[38px] cursor-pointer">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border-1 border-separator rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
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

                  {sectionType === "SYSTEM_CATALOG" && (
                    <div className="p-4 rounded-2xl bg-accent/10 border border-accent/25 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-accent/20 text-accent font-bold">
                          <Sparkles size={16} />
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-foreground">Nguồn Dữ Liệu Hệ Thống</h5>
                          <p className="text-[11px] text-foreground/60">Hệ thống sẽ tự động gọi API tương ứng để hiển thị card carousel trên giao diện</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1.5">
                          <Label isRequired className="text-sm font-bold text-foreground">Chọn dịch vụ hệ thống</Label>
                          <Select
                            fullWidth
                            selectedKey={systemSource}
                            onSelectionChange={(k) => { if (k) handleSystemSourceChange(String(k)); }}
                          >
                            <Select.Trigger className="w-full px-3 py-2 rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-foreground text-sm h-[38px] cursor-pointer">
                              <Select.Value />
                              <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border-1 border-separator rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                              <ListBox>
                                {SYSTEM_SOURCES.map((s) => (
                                  <ListBox.Item key={s.value} id={s.value} textValue={s.label} className="px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-default-100 dark:hover:bg-[var(--bg-elevated)] text-foreground flex items-center justify-between">
                                    {s.label}
                                    <ListBox.ItemIndicator />
                                  </ListBox.Item>
                                ))}
                              </ListBox>
                            </Select.Popover>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-bold text-foreground">Số lượng hiển thị (Limit)</Label>
                          <NumberField value={systemLimit} onChange={(val) => setSystemLimit(val || 8)} minValue={1} maxValue={20}>
                            <NumberField.Group className="flex items-center w-full rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[38px]">
                              <NumberField.Input className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground outline-none border-none h-full" />
                              <div className="flex h-full flex-col border-l border-divider">
                                <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-foreground/60 hover:bg-default-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer bg-transparent text-xs">▲</NumberField.IncrementButton>
                                <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center border-0 text-foreground/60 hover:bg-default-100 dark:hover:bg-[var(--bg-elevated)] cursor-pointer bg-transparent text-xs border-t border-divider">▼</NumberField.DecrementButton>
                              </div>
                            </NumberField.Group>
                          </NumberField>
                        </div>
                      </div>

                      {systemSource === "destinations" && (
                        <div className="pt-3 border-t border-divider space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded-md bg-accent/20 text-accent">
                                <MapPin size={15} />
                              </span>
                              <div>
                                <h6 className="text-xs font-bold text-foreground">
                                  Quản lý danh sách điểm đến ({destinations.length})
                                </h6>
                                <p className="text-[11px] text-foreground/60">
                                  Bật/tắt, chỉnh sửa hoặc thêm các điểm đến du lịch (lưu trong JSON)
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {destinations.length === 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDestinations(DEFAULT_TEMPLATE_DESTINATIONS)}
                                  className="h-8 px-2.5 text-xs font-semibold rounded-xl border border-divider cursor-pointer bg-white dark:bg-[var(--bg-card)] hover:bg-default-100"
                                >
                                  <RefreshCw size={13} className="mr-1" />
                                  Nạp mẫu mặc định
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={() => {
                                  setDestinations((prev) => [
                                    ...prev,
                                    {
                                      id: "dest-" + Date.now(),
                                      name: "",
                                      activityCountText: "",
                                      imageUrl: "",
                                      href: "/tours",
                                      active: true,
                                    },
                                  ]);
                                }}
                                className="h-8 px-3 text-xs font-bold rounded-xl bg-accent text-accent-foreground border-none cursor-pointer hover:bg-accent-hover transition-colors shadow-xs"
                              >
                                <Plus size={14} className="mr-1" />
                                Thêm điểm đến
                              </Button>
                            </div>
                          </div>

                          {destinations.length === 0 ? (
                            <div className="p-6 text-center rounded-xl border border-dashed border-divider bg-default-50/50 dark:bg-[var(--bg-muted)]">
                              <MapPin size={24} className="mx-auto text-foreground/40 mb-1.5" />
                              <p className="text-xs font-bold text-foreground">Chưa có điểm đến nào</p>
                              <p className="text-[11px] text-foreground/60 mt-0.5">
                                Bấm "Nạp mẫu mặc định" hoặc "+ Thêm điểm đến" để cấu hình danh sách điểm đến hiển thị trên Trang chủ.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                              {destinations.map((dest, idx) => (
                                <div
                                  key={dest.id || idx}
                                  className="p-3.5 rounded-xl border border-divider bg-white dark:bg-[var(--bg-card)] space-y-3 shadow-xs"
                                >
                                  <div className="flex items-center justify-between border-b border-divider/60 pb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-accent/20 text-accent font-bold text-[10px] flex items-center justify-center">
                                        {idx + 1}
                                      </span>
                                      <span className="text-xs font-bold text-foreground">
                                        {dest.name || `Điểm đến #${idx + 1}`}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-semibold text-foreground/70">
                                          {dest.active !== false ? "Hiển thị" : "Tạm ẩn"}
                                        </span>
                                        <Switch
                                          isSelected={dest.active !== false}
                                          onChange={(isSelected) => {
                                            setDestinations((prev) =>
                                              prev.map((d, i) =>
                                                i === idx ? { ...d, active: isSelected } : d
                                              )
                                            );
                                          }}
                                          size="sm"
                                        />
                                      </div>
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setDestinations((prev) => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="h-7 w-7 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900 cursor-pointer rounded-lg"
                                        aria-label="Xóa điểm đến"
                                      >
                                        <Trash2 size={13} />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div className="space-y-1">
                                      <Label isRequired className="text-sm font-bold text-foreground">Tên điểm đến</Label>
                                      <Input
                                        placeholder="Ví dụ: Nha Trang, Đà Lạt..."
                                        value={dest.name}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setDestinations((prev) =>
                                            prev.map((d, i) => (i === idx ? { ...d, name: val } : d))
                                          );
                                        }}
                                        className="w-full h-8 text-xs rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground px-2.5"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <Label className="text-sm font-bold text-foreground">Mô tả / Số lượng hoạt động</Label>
                                      <Input
                                        placeholder="Ví dụ: 35 tour & xe dịch vụ"
                                        value={dest.activityCountText || ""}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setDestinations((prev) =>
                                            prev.map((d, i) =>
                                              i === idx ? { ...d, activityCountText: val } : d
                                            )
                                          );
                                        }}
                                        className="w-full h-8 text-xs rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground px-2.5"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <Label isRequired className="text-sm font-bold text-foreground">Đường dẫn liên kết (href)</Label>
                                      <Input
                                        placeholder="Ví dụ: /tours hoặc /intercity?route=..."
                                        value={dest.href}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setDestinations((prev) =>
                                            prev.map((d, i) => (i === idx ? { ...d, href: val } : d))
                                          );
                                        }}
                                        className="w-full h-8 text-xs rounded-lg border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-foreground px-2.5 font-mono"
                                      />
                                    </div>

                                    <div className="space-y-1.5 sm:col-span-2 pt-1 border-t border-divider/40">
                                      <div className="flex items-center justify-between">
                                        <Label isRequired className="text-sm font-bold text-foreground">
                                          Ảnh đại diện điểm đến
                                        </Label>
                                        {dest.imageUrl && (
                                          <span className="text-[10px] font-mono text-foreground/50 truncate max-w-[240px]" title={dest.imageUrl}>
                                            {dest.imageUrl}
                                          </span>
                                        )}
                                      </div>

                                      <input
                                        type="file"
                                        id={`dest-image-upload-${idx}`}
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleDestinationImageUpload(idx, file);
                                          e.target.value = "";
                                        }}
                                      />

                                      {dest.imageUrl ? (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-2.5 rounded-xl border border-divider bg-default-50/70 dark:bg-[var(--bg-muted)]">
                                          {/* Thumbnail with hover zoom overlay */}
                                          <div className="relative group w-28 h-20 sm:w-32 sm:h-22 rounded-lg overflow-hidden border border-divider shrink-0 bg-default-100 shadow-xs">
                                            <img
                                              src={dest.imageUrl}
                                              alt={dest.name || "Destination"}
                                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                            {/* Hover zoom overlay */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() => setZoomedImage({ url: dest.imageUrl, title: dest.name || `Điểm đến #${idx + 1}` })}
                                                className="p-1.5 rounded-full bg-white/30 hover:bg-white/50 text-white backdrop-blur-xs transition-colors cursor-pointer border-none shadow-md"
                                                title="Phóng to ảnh"
                                              >
                                                <ZoomIn size={15} />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => document.getElementById(`dest-image-upload-${idx}`)?.click()}
                                                className="p-1.5 rounded-full bg-white/30 hover:bg-white/50 text-white backdrop-blur-xs transition-colors cursor-pointer border-none shadow-md"
                                                title="Thay ảnh khác"
                                              >
                                                <Upload size={15} />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setDestinations((prev) =>
                                                    prev.map((d, i) => (i === idx ? { ...d, imageUrl: "" } : d))
                                                  );
                                                }}
                                                className="p-1.5 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white backdrop-blur-xs transition-colors cursor-pointer border-none shadow-md"
                                                title="Xóa ảnh"
                                              >
                                                <Trash2 size={15} />
                                              </button>
                                            </div>
                                          </div>

                                          {/* Info & View URL */}
                                          <div className="flex-1 min-w-0 space-y-1.5">
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                Đã tải ảnh lên
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => setZoomedImage({ url: dest.imageUrl, title: dest.name || `Điểm đến #${idx + 1}` })}
                                                className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                                              >
                                                <ZoomIn size={12} />
                                                Phóng to ảnh
                                              </button>
                                            </div>

                                            {/* View & Copy URL */}
                                            <div className="flex items-center gap-1.5">
                                              <span
                                                className="text-[10px] font-mono text-foreground/75 bg-white dark:bg-[var(--bg-surface)] px-2 py-1 rounded-lg border border-divider truncate max-w-[200px] sm:max-w-xs select-all"
                                                title={dest.imageUrl}
                                              >
                                                {dest.imageUrl}
                                              </span>
                                              <Button
                                                isIconOnly
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(dest.imageUrl);
                                                  toast.success("Đã sao chép URL ảnh!");
                                                }}
                                                className="h-7 w-7 rounded-lg border border-divider cursor-pointer"
                                                aria-label="Sao chép URL"
                                              >
                                                <Copy size={12} />
                                              </Button>
                                              <a
                                                href={dest.imageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-divider hover:bg-default-100 text-foreground/70 transition-colors"
                                                title="Mở tab mới"
                                              >
                                                <ExternalLink size={12} />
                                              </a>
                                            </div>

                                            <div>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => document.getElementById(`dest-image-upload-${idx}`)?.click()}
                                                isDisabled={uploadingDestIndex === idx}
                                                className="h-7 px-2.5 text-[11px] font-semibold rounded-lg border border-divider bg-white dark:bg-[var(--bg-surface)] cursor-pointer hover:bg-default-100"
                                              >
                                                {uploadingDestIndex === idx ? (
                                                  <>
                                                    <RefreshCw size={12} className="animate-spin mr-1" />
                                                    Đang tải lên...
                                                  </>
                                                ) : (
                                                  <>
                                                    <Upload size={12} className="mr-1" />
                                                    Thay ảnh khác
                                                  </>
                                                )}
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        /* Upload button trigger */
                                        <div
                                          onClick={() => document.getElementById(`dest-image-upload-${idx}`)?.click()}
                                          className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-divider hover:border-accent bg-default-50/60 dark:bg-[var(--bg-surface)] cursor-pointer transition-colors group"
                                        >
                                          {uploadingDestIndex === idx ? (
                                            <RefreshCw size={16} className="animate-spin text-accent" />
                                          ) : (
                                            <Upload size={16} className="text-foreground/50 group-hover:text-accent transition-colors" />
                                          )}
                                          <span className="text-xs font-semibold text-foreground/75 group-hover:text-foreground transition-colors">
                                            {uploadingDestIndex === idx ? "Đang tải ảnh lên hệ thống..." : "Nhấn để tải ảnh đại diện lên"}
                                          </span>
                                          <span className="text-[10px] text-foreground/40">(JPG, PNG, WEBP)</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {systemSource === "airport-transfer" && (
                        <AirportPackagesEditor
                          packages={packages}
                          onChange={setPackages}
                          categories={vehicleCategories}
                          activeLocale={activePkgLocale}
                          onActiveLocaleChange={setActivePkgLocale}
                        />
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1.5 max-w-[120px]">
                      <Label className="text-sm font-bold text-foreground">Thứ tự</Label>
                      <NumberField value={orderIndex} onChange={(val) => setOrderIndex(val || 0)} minValue={0}>
                        <NumberField.Group className="flex items-center w-full rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] overflow-hidden focus-within:ring-2 focus-within:ring-primary h-[38px]">
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
                        <Label className="text-sm font-bold text-foreground mr-2">Màu chữ</Label>
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
                        <Label className="text-sm font-bold text-foreground mr-2">Màu nền</Label>
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

                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold text-foreground">Link URL</Label>
                    <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/tours" className="w-full rounded-xl border-1 border-separator bg-white dark:bg-[var(--bg-card)] text-foreground" />
                  </div>

                  {sectionType !== "SYSTEM_CATALOG" && (
                    <JsonListEditor
                      value={contentData}
                      onChange={setContentData}
                      sectionType={sectionType}
                      pagePath={pagePath}
                      sectionName={sectionName}
                    />
                  )}

                  {/* Image Upload */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold text-foreground">Hình ảnh</Label>
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
                          <div key={`${img.id}-${idx}`} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-divider shadow-xs bg-default-100">
                            <img
                              src={img.url}
                              alt={img.fileName}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setZoomedImage({ url: img.url, title: img.fileName || `Ảnh #${idx + 1}` })}
                                className="w-6 h-6 bg-white/30 hover:bg-white/50 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer border-none shadow-sm"
                                title="Phóng to ảnh"
                              >
                                <ZoomIn size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="w-6 h-6 bg-rose-600/80 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer border-none shadow-sm"
                                title="Xóa ảnh"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch isSelected={active} onChange={() => setActive(!active)}>
                      <Label className="text-sm font-bold text-foreground">Kích hoạt</Label>
                    </Switch>
                  </div>
                </div>

                {/* Translations with 4 tabs */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold tracking-wider">Nội dung đa ngôn ngữ</h4>
                    <p className="text-xs">Chuyển đổi các tab để nhập tiêu đề, mô tả và nút bấm cho 4 ngôn ngữ</p>
                  </div>

                  <Tabs
                    selectedKey={activeTransTab}
                    onSelectionChange={(k) => setActiveTransTab(String(k) as "vi" | "en" | "ko" | "ru")}
                  >
                    <Tabs.List className="h-8 p-0.5 bg-slate-100 dark:bg-[var(--bg-card)] rounded-lg">
                      {TRANSLATION_TABS.map(({ code, flag }) => (
                        <Tabs.Tab key={code} id={code} className="text-xs font-bold px-2.5 py-1">
                          {flag}
                          <Tabs.Indicator className="bg-accent/20 rounded-lg" />
                        </Tabs.Tab>
                      ))}
                    </Tabs.List>
                  </Tabs>

                  {activeTransTab === "vi" && renderTranslationFields("vi", transVi, setTransVi)}
                  {activeTransTab === "en" && renderTranslationFields("en", transEn, setTransEn)}
                  {activeTransTab === "ko" && renderTranslationFields("ko", transKo, setTransKo)}
                  {activeTransTab === "ru" && renderTranslationFields("ru", transRu, setTransRu)}
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
                  type="button"
                  onClick={handleSubmit}
                  isDisabled={submitting}
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                >
                  {submitting ? (
                    <RefreshCw size={15} className="animate-spin mr-1.5" />
                  ) : (
                    <Save size={15} className="mr-1.5" />
                  )}
                  {isEdit ? "Cập nhật" : "Tạo mới"}
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>

      {/* Lightbox Modal phóng to ảnh z-[99999] */}
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
                <span id="zoomed-image-title" className="text-sm font-bold text-white truncate">
                  {zoomedImage?.title || "Xem ảnh phóng to"}
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
                    aria-label="Sao chép URL"
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
    </>
  );
}
