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
    Separator,
    Label,
    Checkbox,
    ColorPicker,
    ColorSwatch,
    ColorArea,
    ColorSlider,
    ColorField,
    parseColor,
    ComboBox,
    Input,
    TextField,
    Collection,
    ListBox,
    EmptyState,
    NumberField,
    Switch,
    TextArea,
    Chip,
} from "@heroui/react";
import { Save, Plus, Trash2, RefreshCw, Shuffle, Edit, Edit3, Package, Compass } from "lucide-react";
import clsx from "clsx";

import {
    createTour,
    updateTour,
    TourDto,
    TourCategoryDto,
    TourOptionDto,
    TourPackageDto,
    CreateTourRequest,
    formatPassengerCondition,
    getPackagePrice,
    getPackagePriceItem
} from "@/lib/api/tours";
import { TourOptionIconPicker } from "./TourOptionIconPicker";
import MultiImageUpload from "@/components/MultiImageUpload";
import TourPackageModal from "./TourPackageModal";
import { useI18n } from "@/context/LanguageContext";

const OPTION_LOCALES = [
    { code: "vi", label: "Tiếng Việt", flag: "🇻🇳 VI" },
    { code: "en", label: "English", flag: "🇬🇧 EN" },
    { code: "ko", label: "한국어", flag: "🇰🇷 KO" },
    { code: "ru", label: "Русский", flag: "🇷🇺 RU" },
] as const;

const safeParseColor = (colorStr?: string, fallback = "#3b82f6") => {
    try {
        if (!colorStr) return parseColor(fallback);
        return parseColor(colorStr);
    } catch {
        return parseColor(fallback);
    }
};

export interface TourCreateUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingTour: TourDto | null;
    categories: TourCategoryDto[];
    language?: string;
    backendUrl?: string;
    onSaveSuccess: (savedTour?: TourDto) => void;
    showToast: (msg: string, type: "success" | "error") => void;
}

export default function TourCreateUpdateModal({
    isOpen,
    onClose,
    editingTour,
    categories,
    language = "vi",
    backendUrl,
    onSaveSuccess,
    showToast,
}: TourCreateUpdateModalProps) {
    const { t } = useI18n();
    const isEdit = Boolean(editingTour);

    const [activeTab, setActiveTab] = useState<"INFO" | "AMENITIES" | "PACKAGES">("INFO");
    const [activeFormLocale, setActiveFormLocale] = useState<string>("vi");
    const [loading, setLoading] = useState<boolean>(false);

    // Form fields
    const [tourCategoryId, setTourCategoryId] = useState<number>(0);
    const [durationDays, setDurationDays] = useState<number>(1);
    const [durationNights, setDurationNights] = useState<number>(0);
    const [minGuest, setMinGuest] = useState<number>(2);
    const [maxGuest, setMaxGuest] = useState<number>(20);
    const [active, setActive] = useState<boolean>(true);
    const [status, setStatus] = useState<"ACTIVE" | "DRAFT" | "INACTIVE">("ACTIVE");
    const [isRecommend, setIsRecommend] = useState<boolean>(false);

    // Inclusions & Exclusions
    const [inclusions, setInclusions] = useState<string>("");
    const [exclusions, setExclusions] = useState<string>("");

    // Translations
    const [translations, setTranslations] = useState({
        vi: { name: "", description: "", content: "" },
        en: { name: "", description: "", content: "" },
        ko: { name: "", description: "", content: "" },
        ru: { name: "", description: "", content: "" }
    });

    // Options (Amenities)
    const [options, setOptions] = useState<TourOptionDto[]>([]);
    const [optionLocales, setOptionLocales] = useState<Record<number, string>>({});

    // Packages & Submodal
    const [packages, setPackages] = useState<TourPackageDto[]>([]);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState<boolean>(false);
    const [editingPackageIndex, setEditingPackageIndex] = useState<number | null>(null);

    // Media
    const [imageIds, setImageIds] = useState<number[]>([]);
    const [thumbnailId, setThumbnailId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (editingTour) {
                setTourCategoryId(editingTour.tourCategoryId || (categories[0]?.id || 0));
                setDurationDays(editingTour.durationDays ?? 1);
                setDurationNights(editingTour.durationNights ?? 0);
                setMinGuest(editingTour.minGuest ?? 2);
                setMaxGuest(editingTour.maxGuest ?? 20);
                setActive(editingTour.active ?? true);
                setStatus((editingTour.status as "ACTIVE" | "DRAFT" | "INACTIVE") || (editingTour.active ? "ACTIVE" : "INACTIVE"));
                setIsRecommend(Boolean(editingTour.isRecommended));
                setInclusions(editingTour.inclusions || "");
                setExclusions(editingTour.exclusions || "");

                const transObj = {
                    vi: { name: "", description: "", content: "" },
                    en: { name: "", description: "", content: "" },
                    ko: { name: "", description: "", content: "" },
                    ru: { name: "", description: "", content: "" }
                };
                if (editingTour.translations) {
                    editingTour.translations.forEach((tr) => {
                        if (transObj[tr.locale as keyof typeof transObj]) {
                            transObj[tr.locale as keyof typeof transObj] = {
                                name: tr.name || "",
                                description: tr.description || "",
                                content: tr.content || ""
                            };
                        }
                    });
                }
                setTranslations(transObj);

                setOptions(editingTour.options ? JSON.parse(JSON.stringify(editingTour.options)) : []);
                const initLocales: Record<number, string> = {};
                (editingTour.options || []).forEach((_, idx) => {
                    initLocales[idx] = "vi";
                });
                setOptionLocales(initLocales);

                const rawPkgs = editingTour.packages ? JSON.parse(JSON.stringify(editingTour.packages)) : [];
                const normalizedPkgs = rawPkgs.map((p: TourPackageDto) => {
                    const isCharter = p.pricingType === "PRIVATE_CHARTER" || (Boolean(p.fixedPrice) && p.fixedPrice! > 0);
                    const resolvedType: "PER_PERSON" | "PRIVATE_CHARTER" = isCharter ? "PRIVATE_CHARTER" : "PER_PERSON";
                    return {
                        ...p,
                        pricingType: p.pricingType || resolvedType,
                        adultPrice: p.adultPrice ?? getPackagePrice(p, "ADULT"),
                        childPrice: p.childPrice ?? getPackagePrice(p, "CHILD"),
                        infantPrice: p.infantPrice ?? getPackagePrice(p, "INFANT"),
                    };
                });
                setPackages(normalizedPkgs);
                setImageIds(editingTour.imageIds || []);
                setThumbnailId(editingTour.thumbnailId || null);
            } else {
                setTourCategoryId(categories[0]?.id || 0);
                setDurationDays(1);
                setDurationNights(0);
                setMinGuest(2);
                setMaxGuest(20);
                setActive(true);
                setStatus("ACTIVE");
                setIsRecommend(false);
                setInclusions("");
                setExclusions("");
                setTranslations({
                    vi: { name: "", description: "", content: "" },
                    en: { name: "", description: "", content: "" },
                    ko: { name: "", description: "", content: "" },
                    ru: { name: "", description: "", content: "" }
                });
                setOptions([]);
                setOptionLocales({});
                setPackages([]);
                setImageIds([]);
                setThumbnailId(null);
            }
            setActiveTab("INFO");
            setActiveFormLocale("vi");
        }
    }, [isOpen, editingTour, categories]);

    const handleTranslationChange = (field: "name" | "description" | "content", val: string) => {
        setTranslations(prev => ({
            ...prev,
            [activeFormLocale]: {
                ...prev[activeFormLocale as keyof typeof prev],
                [field]: val
            }
        }));
    };

    const handleAddOption = () => {
        const newIndex = options.length;
        setOptionLocales(prev => ({ ...prev, [newIndex]: "vi" }));
        setOptions(prev => [
            ...prev,
            {
                iconUrl: "check",
                colorText: "#1e293b",
                colorIcon: "#3b82f6",
                translations: [
                    { locale: "vi", content: "" },
                    { locale: "en", content: "" },
                    { locale: "ko", content: "" },
                    { locale: "ru", content: "" }
                ]
            }
        ]);
    };

    const handleRemoveOption = (index: number) => {
        setOptions(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleOptionChange = (index: number, field: keyof TourOptionDto, value: any) => {
        setOptions(prev => prev.map((opt, idx) => {
            if (idx === index) {
                return { ...opt, [field]: value };
            }
            return opt;
        }));
    };

    const handleOptionTranslationChange = (index: number, locale: string, content: string) => {
        setOptions(prev => prev.map((opt, idx) => {
            if (idx === index) {
                const existingTrans = opt.translations || [];
                const hasLocale = existingTrans.some(t => t.locale === locale);
                let newTrans;
                if (hasLocale) {
                    newTrans = existingTrans.map(t => t.locale === locale ? { ...t, content } : t);
                } else {
                    newTrans = [...existingTrans, { locale, content }];
                }
                return { ...opt, translations: newTrans };
            }
            return opt;
        }));
    };

    const handleAddPackage = () => {
        setEditingPackageIndex(null);
        setIsPackageModalOpen(true);
    };

    const handleEditPackage = (idx: number) => {
        setEditingPackageIndex(idx);
        setIsPackageModalOpen(true);
    };

    const handleSavePackage = (savedPkg: TourPackageDto) => {
        if (editingPackageIndex !== null && editingPackageIndex >= 0) {
            setPackages(prev => prev.map((p, i) => i === editingPackageIndex ? savedPkg : p));
        } else {
            setPackages(prev => [...prev, { ...savedPkg, sortOrder: prev.length + 1 }]);
        }
    };

    const handleRemovePackage = (idx: number) => {
        setPackages(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        if (!translations.vi.name.trim() && !translations.en.name.trim()) {
            showToast(language === "vi" ? "Tên Tour ít nhất phải có ở bản tiếng Việt hoặc tiếng Anh!" : "Tour Name must be specified in Vietnamese or English!", "error");
            setActiveTab("INFO");
            return;
        }

        if (!tourCategoryId || tourCategoryId === 0) {
            showToast(language === "vi" ? "Vui lòng chọn danh mục tour!" : "Please select a tour category!", "error");
            setActiveTab("INFO");
            return;
        }

        const transPayload = Object.entries(translations)
            .filter(([_, data]) => data.name.trim() !== "")
            .map(([locale, data]) => {
                const existing = editingTour?.translations?.find(t => t.locale === locale);
                return {
                    id: existing?.id,
                    locale,
                    name: data.name.trim(),
                    description: data.description.trim(),
                    content: data.content.trim()
                };
            });

        const optionsPayload = options.map((opt) => ({
            id: opt.id,
            iconUrl: opt.iconUrl,
            colorText: opt.colorText,
            colorIcon: opt.colorIcon,
            translations: (opt.translations || []).map((tr) => ({
                id: tr.id,
                locale: tr.locale,
                content: tr.content
            }))
        }));

        const payload: any = {
            tourCategoryId,
            inclusions,
            exclusions,
            durationDays,
            durationNights,
            minGuest,
            maxGuest,
            active: status === "ACTIVE",
            status,
            isRecommend,
            translations: transPayload,
            options: optionsPayload,
            days: editingTour?.days || [],
            prices: [],
            packages: packages.filter(p => {
                const name = p.translations?.find(t => t.name)?.name || p.code || p.name;
                return Boolean(name);
            }),
            thumbnailId: thumbnailId || undefined,
            imageIds: imageIds.length > 0 ? imageIds : undefined
        };

        setLoading(true);
        try {
            let res;
            if (isEdit && editingTour) {
                res = await updateTour(editingTour.id, payload);
                showToast(language === "vi" ? "Cập nhật tour thành công!" : "Tour updated successfully!", "success");
            } else {
                res = await createTour(payload);
                showToast(language === "vi" ? "Tạo mới tour thành công!" : "Tour created successfully!", "success");
            }
            onSaveSuccess(res?.data);
            onClose();
        } catch (err: any) {
            console.error("Save tour error:", err);
            showToast(err?.message || (language === "vi" ? "Lưu thông tin tour thất bại!" : "Failed to save tour!"), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="tour-form-title">
                <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
                    <ModalContainer>
                        <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden w-full max-w-3xl flex flex-col max-h-[90vh]">
                            <ModalCloseTrigger />
                            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                                <div>
                                    <h2 id="tour-form-title" className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Compass size={20} className="text-accent" />
                                        <span>
                                            {isEdit
                                                ? (language === "vi" ? "Chỉnh sửa Tour Du Lịch" : "Edit Sightseeing Tour")
                                                : (language === "vi" ? "Thêm mới Tour Du Lịch" : "Add New Sightseeing Tour")}
                                        </span>
                                        {isEdit && editingTour && (
                                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[var(--bg-card)] text-slate-500">
                                                #{editingTour.id}
                                            </span>
                                        )}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {isEdit
                                            ? (language === "vi" ? "Cập nhật chương trình tour, gói dịch vụ và dịch thuật đa ngôn ngữ." : "Edit tour package details and multi-language content.")
                                            : (language === "vi" ? "Tạo chương trình tour, gói dịch vụ và dịch thuật đa ngôn ngữ." : "Configure tour package details and multi-language content.")}
                                    </p>
                                </div>
                            </ModalHeader>

                            {/* Top Tabs */}
                            <div className="flex border-b border-separator px-6 bg-slate-50/50 dark:bg-[var(--bg-card)]/50 gap-2 shrink-0 overflow-x-auto">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("INFO")}
                                    className={clsx(
                                        "py-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer bg-transparent whitespace-nowrap",
                                        activeTab === "INFO"
                                            ? "border-accent text-accent"
                                            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                    )}
                                >
                                    {t.tours.tabInfo || "Thông tin chung"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("AMENITIES")}
                                    className={clsx(
                                        "py-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer bg-transparent whitespace-nowrap",
                                        activeTab === "AMENITIES"
                                            ? "border-accent text-accent"
                                            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                    )}
                                >
                                    {t.tours.tabAmenities || "Tiện ích & Tùy chọn"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("PACKAGES")}
                                    className={clsx(
                                        "py-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer bg-transparent flex items-center gap-1.5 whitespace-nowrap",
                                        activeTab === "PACKAGES"
                                            ? "border-accent text-accent"
                                            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                    )}
                                >
                                    <Package size={14} />
                                    <span>{t.tours.tabPackages || "Gói dịch vụ"} ({packages.length})</span>
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                <ModalBody className="p-6 space-y-6 overflow-y-auto max-h-[65vh] flex-1">
                                    {/* TAB 1: INFO */}
                                    {activeTab === "INFO" && (
                                        <div className="space-y-6">
                                            {/* General details grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                <div>
                                                    <ComboBox
                                                        allowsEmptyCollection
                                                        selectedKey={tourCategoryId ? String(tourCategoryId) : null}
                                                        onSelectionChange={(key) => setTourCategoryId(key ? Number(key) : 0)}
                                                    >
                                                        <Label className="block text-xs font-bold uppercase tracking-wider mb-2">
                                                            {language === "vi" ? "Danh mục tour" : "Tour Category"}
                                                        </Label>
                                                        <ComboBox.InputGroup>
                                                            <Input placeholder={language === "vi" ? "Chọn danh mục..." : "Select category..."} />
                                                            <ComboBox.Trigger />
                                                        </ComboBox.InputGroup>
                                                        <ComboBox.Popover>
                                                            <ListBox renderEmptyState={() => <EmptyState>{language === "vi" ? "Không tìm thấy" : "No results"}</EmptyState>}>
                                                                <Collection items={categories}>
                                                                    {(c) => {
                                                                        const tr = c.translations?.find((t: any) => t.locale === language) || c.translations?.[0];
                                                                        const name = tr?.name || c.title || c.code || "";
                                                                        return (
                                                                            <ListBox.Item key={c.id} id={String(c.id)} textValue={name}>
                                                                                {name}
                                                                                <ListBox.ItemIndicator />
                                                                            </ListBox.Item>
                                                                        );
                                                                    }}
                                                                </Collection>
                                                            </ListBox>
                                                        </ComboBox.Popover>
                                                    </ComboBox>
                                                </div>

                                                <div>
                                                    <NumberField minValue={0} value={durationDays} onChange={(val) => setDurationDays(val ?? 0)}>
                                                        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                            {language === "vi" ? "Thời lượng (Ngày)" : "Duration (Days)"}
                                                        </Label>
                                                        <NumberField.Group>
                                                            <NumberField.DecrementButton />
                                                            <NumberField.Input />
                                                            <NumberField.IncrementButton />
                                                        </NumberField.Group>
                                                    </NumberField>
                                                </div>

                                                <div>
                                                    <NumberField minValue={0} value={durationNights} onChange={(val) => setDurationNights(val ?? 0)}>
                                                        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                            {language === "vi" ? "Thời lượng (Đêm)" : "Duration (Nights)"}
                                                        </Label>
                                                        <NumberField.Group>
                                                            <NumberField.DecrementButton />
                                                            <NumberField.Input />
                                                            <NumberField.IncrementButton />
                                                        </NumberField.Group>
                                                    </NumberField>
                                                </div>

                                                <div>
                                                    <NumberField minValue={1} value={minGuest} onChange={(val) => setMinGuest(val ?? 1)}>
                                                        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                            {language === "vi" ? "Số khách tối thiểu" : "Min Guests"}
                                                        </Label>
                                                        <NumberField.Group>
                                                            <NumberField.DecrementButton />
                                                            <NumberField.Input />
                                                            <NumberField.IncrementButton />
                                                        </NumberField.Group>
                                                    </NumberField>
                                                </div>

                                                <div>
                                                    <NumberField minValue={1} value={maxGuest} onChange={(val) => setMaxGuest(val ?? 1)}>
                                                        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                            {language === "vi" ? "Số khách tối đa" : "Max Guests"}
                                                        </Label>
                                                        <NumberField.Group>
                                                            <NumberField.DecrementButton />
                                                            <NumberField.Input />
                                                            <NumberField.IncrementButton />
                                                        </NumberField.Group>
                                                    </NumberField>
                                                </div>
                                            </div>

                                            {/* Status & Recommendation switches */}
                                            <div className="flex flex-wrap items-center gap-6 pb-1">
                                                <div className="flex items-center gap-3">
                                                    <Switch
                                                        isSelected={status === "ACTIVE"}
                                                        onChange={(checked) => {
                                                            setStatus(checked ? "ACTIVE" : "INACTIVE");
                                                            setActive(checked);
                                                        }}
                                                    >
                                                        <Switch.Content className="flex items-center gap-3 cursor-pointer">
                                                            <Switch.Control>
                                                                <Switch.Thumb />
                                                            </Switch.Control>
                                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 select-none">
                                                                {status === "ACTIVE"
                                                                    ? (language === "vi" ? "Đang mở bán công khai" : "Active Publicly")
                                                                    : (language === "vi" ? "Tạm ngưng mở bán" : "Inactive")}
                                                            </span>
                                                        </Switch.Content>
                                                    </Switch>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id="tour-create-default"
                                                        isSelected={isRecommend}
                                                        onChange={(val: boolean) => setIsRecommend(val)}
                                                    >
                                                        <Checkbox.Content>
                                                            <Checkbox.Control>
                                                                <Checkbox.Indicator />
                                                            </Checkbox.Control>
                                                        </Checkbox.Content>
                                                    </Checkbox>
                                                    <Label htmlFor="tour-create-default" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none whitespace-nowrap">
                                                        {language === "vi" ? "Gắn nhãn Đề xuất" : "Best Seller / Recommended"}
                                                    </Label>
                                                </div>
                                            </div>

                                            <Separator className="bg-slate-100 dark:bg-[var(--bg-card)]" />

                                            {/* Translation Tabs Section */}
                                            <div className="space-y-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <Label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                                        {language === "vi" ? "Nội dung dịch thuật Tour" : "Tour Translations"}
                                                    </Label>
                                                    <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 shadow-2xs">
                                                        {OPTION_LOCALES.map((loc) => (
                                                            <button
                                                                key={loc.code}
                                                                type="button"
                                                                className={clsx(
                                                                    "px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer border-none",
                                                                    activeFormLocale === loc.code
                                                                        ? "bg-accent text-accent-foreground shadow-xs font-bold"
                                                                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent"
                                                                )}
                                                                onClick={() => setActiveFormLocale(loc.code)}
                                                            >
                                                                {loc.flag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <TextField className="w-full">
                                                            <Label className="text-xs font-bold uppercase tracking-wider">
                                                                {language === "vi" ? "Tên Tour" : "Tour Name"} ({activeFormLocale.toUpperCase()})
                                                            </Label>
                                                            <Input
                                                                type="text"
                                                                placeholder="e.g. Tour 3 Đảo Nha Trang VIP"
                                                                value={translations[activeFormLocale as keyof typeof translations]?.name || ""}
                                                                onChange={(e) => handleTranslationChange("name", e.target.value)}
                                                                className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100"
                                                            />
                                                        </TextField>
                                                    </div>

                                                    <div>
                                                        <Label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                                            {language === "vi" ? "Mô tả ngắn" : "Short Description"} ({activeFormLocale.toUpperCase()})
                                                        </Label>
                                                        <TextArea
                                                            rows={2}
                                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/30 text-xs font-semibold outline-none"
                                                            placeholder="e.g. Khám phá biển đảo Vịnh Nha Trang..."
                                                            value={translations[activeFormLocale as keyof typeof translations]?.description || ""}
                                                            onChange={(e) => handleTranslationChange("description", e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                                            {language === "vi" ? "Nội dung chi tiết" : "Detailed Content"} ({activeFormLocale.toUpperCase()})
                                                        </Label>
                                                        <TextArea
                                                            rows={4}
                                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/30 text-xs font-semibold outline-none font-mono"
                                                            placeholder="Markdown or HTML itinerary content..."
                                                            value={translations[activeFormLocale as keyof typeof translations]?.content || ""}
                                                            onChange={(e) => handleTranslationChange("content", e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator className="bg-slate-100 dark:bg-[var(--bg-card)]" />

                                            {/* Inclusions & Exclusions */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="block text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                                                        {language === "vi" ? "Dịch vụ bao gồm (Inclusions)" : "Tour Inclusions"}
                                                    </Label>
                                                    <p className="text-[11px] text-slate-400 mb-2">
                                                        {language === "vi"
                                                            ? "Nhập mỗi nội dung 1 dòng bắt đầu bằng dấu '-' (ví dụ: - Cano ghép theo hành trình)"
                                                            : "Enter each item on a new line starting with '-'"}
                                                    </p>
                                                    <TextArea
                                                        rows={4}
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30"
                                                        value={inclusions}
                                                        onChange={(e) => setInclusions(e.target.value)}
                                                        placeholder="- Cano ghép theo hành trình&#10;- Bữa trưa theo thực đơn tour&#10;- Vé tham quan theo chương trình"
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="block text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                                                        {language === "vi" ? "Chi phí tự túc nếu có (Exclusions)" : "Tour Exclusions"}
                                                    </Label>
                                                    <p className="text-[11px] text-slate-400 mb-2">
                                                        {language === "vi"
                                                            ? "Nhập mỗi nội dung 1 dòng bắt đầu bằng dấu '-' (ví dụ: - Vé lặn biển bằng bình dưỡng khí)"
                                                            : "Enter each item on a new line starting with '-'"}
                                                    </p>
                                                    <TextArea
                                                        rows={4}
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/30"
                                                        value={exclusions}
                                                        onChange={(e) => setExclusions(e.target.value)}
                                                        placeholder="- Chi phí cá nhân ngoài chương trình&#10;- Thuế VAT"
                                                    />
                                                </div>
                                            </div>

                                            <Separator className="bg-slate-100 dark:bg-[var(--bg-card)]" />

                                            {/* Image Gallery */}
                                            <div className="space-y-2">
                                                <Label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                                    {language === "vi" ? "Hình ảnh Tour" : "Tour Gallery"}
                                                </Label>
                                                <MultiImageUpload
                                                    imageIds={imageIds}
                                                    thumbnailId={thumbnailId}
                                                    onImageIdsChange={(ids) => setImageIds(ids)}
                                                    onThumbnailChange={(thumbId) => setThumbnailId(thumbId)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 2: AMENITIES / OPTIONS */}
                                    {activeTab === "AMENITIES" && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                                        {language === "vi" ? "Tiện ích & Tùy chọn đi kèm" : "Tour Amenities & Options"}
                                                    </Label>
                                                    <p className="text-[11px] text-slate-400">
                                                        {language === "vi"
                                                            ? "Cấu hình các tiện ích nổi bật hiển thị trên thẻ và trang chi tiết tour."
                                                            : "Configure tour highlights and amenities."}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="bg-accent hover:bg-accent-hover text-accent-foreground rounded-xl text-xs font-bold gap-1 border-none shadow-sm cursor-pointer transition-colors"
                                                    onClick={handleAddOption}
                                                >
                                                    <Plus size={14} />
                                                    {language === "vi" ? "Thêm tùy chọn" : "Add Option"}
                                                </Button>
                                            </div>

                                            {options.length === 0 ? (
                                                <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                                    <p className="text-xs text-slate-400 italic mb-3">
                                                        {language === "vi"
                                                            ? "Chưa có tùy chọn nào. Bấm 'Thêm tùy chọn' để tạo mới."
                                                            : "No options configured. Click 'Add Option' to create."}
                                                    </p>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="bg-accent hover:bg-accent-hover text-accent-foreground rounded-xl text-xs font-bold gap-1 border-none shadow-sm cursor-pointer transition-colors"
                                                        onClick={handleAddOption}
                                                    >
                                                        <Plus size={14} />
                                                        {language === "vi" ? "Thêm tùy chọn" : "Add Option"}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {options.map((opt, index) => {
                                                        const currentOptLocale = optionLocales[index] || "vi";
                                                        const currentOptContent = opt.translations?.find(t => t.locale === currentOptLocale)?.content || "";

                                                        return (
                                                            <div
                                                                key={index}
                                                                className="space-y-4 bg-slate-50 dark:bg-[var(--bg-card)] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs"
                                                            >
                                                                {/* ROW 1: Nội dung đa ngôn ngữ (Full width) */}
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                                            {language === "vi" ? "Nội dung tiện ích / Tùy chọn" : "Option Content"} ({currentOptLocale.toUpperCase()})
                                                                        </Label>
                                                                        {/* Tab 4 ngôn ngữ */}
                                                                        <div className="inline-flex items-center p-0.5 rounded-xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 shadow-2xs">
                                                                            {OPTION_LOCALES.map((loc) => (
                                                                                <button
                                                                                    key={loc.code}
                                                                                    type="button"
                                                                                    onClick={() => setOptionLocales(prev => ({ ...prev, [index]: loc.code }))}
                                                                                    className={clsx(
                                                                                        "px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer border-none",
                                                                                        currentOptLocale === loc.code
                                                                                            ? "bg-accent text-accent-foreground shadow-xs font-bold"
                                                                                            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent"
                                                                                    )}
                                                                                >
                                                                                    {loc.flag}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <Input
                                                                        type="text"
                                                                        placeholder={
                                                                            currentOptLocale === "vi"
                                                                                ? "Ví dụ: Cano cao tốc đời mới, Miễn phí nước suối & khăn lạnh..."
                                                                                : currentOptLocale === "en"
                                                                                    ? "e.g. Modern speedboat, Complimentary water & towels..."
                                                                                    : currentOptLocale === "ko"
                                                                                        ? "예: 최신 고속 스피드보트, 무료 생수..."
                                                                                        : "Например: Современный катер, Бесплатная вода..."
                                                                        }
                                                                        value={currentOptContent}
                                                                        onChange={(e) => handleOptionTranslationChange(index, currentOptLocale, e.target.value)}
                                                                        className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-200 focus:border-accent"
                                                                    />
                                                                </div>

                                                                {/* ROW 2: Chọn Icon SVG (Full width) */}
                                                                <div>
                                                                    <TourOptionIconPicker
                                                                        value={opt.iconUrl || ""}
                                                                        onChange={(val) => handleOptionChange(index, "iconUrl", val)}
                                                                        colorIcon={opt.colorIcon}
                                                                        language={language}
                                                                    />
                                                                </div>

                                                                {/* ROW 3: Màu icon, Màu chữ & Nút Xóa (1 Row ngang) */}
                                                                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                                                                    <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                                                                        {/* Màu Icon */}
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                                                                {language === "vi" ? "Màu Icon:" : "Icon Color:"}
                                                                            </span>
                                                                            <ColorPicker
                                                                                value={safeParseColor(opt.colorIcon, "#3b82f6")}
                                                                                onChange={(color) => handleOptionChange(index, "colorIcon", color.toString("hex"))}
                                                                            >
                                                                                <ColorPicker.Trigger className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] cursor-pointer shadow-2xs hover:border-accent transition-colors">
                                                                                    <ColorSwatch size="xs" color={safeParseColor(opt.colorIcon, "#3b82f6")} />
                                                                                    <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                                                                                        {opt.colorIcon || "#3b82f6"}
                                                                                    </span>
                                                                                </ColorPicker.Trigger>
                                                                                <ColorPicker.Popover className="gap-2 p-3 bg-white dark:bg-[var(--bg-surface)] border border-divider shadow-xl rounded-xl z-50">
                                                                                    <ColorArea
                                                                                        aria-label="Color area"
                                                                                        className="max-w-full h-32 rounded-lg"
                                                                                        colorSpace="hsb"
                                                                                        xChannel="saturation"
                                                                                        yChannel="brightness"
                                                                                    >
                                                                                        <ColorArea.Thumb />
                                                                                    </ColorArea>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <ColorSlider aria-label="Hue slider" channel="hue" className="flex-grow" colorSpace="hsb">
                                                                                            <ColorSlider.Track>
                                                                                                <ColorSlider.Thumb />
                                                                                            </ColorSlider.Track>
                                                                                        </ColorSlider>
                                                                                        <Button
                                                                                            type="button"
                                                                                            isIconOnly
                                                                                            size="sm"
                                                                                            variant="outline"
                                                                                            aria-label="Chọn màu biểu tượng ngẫu nhiên"
                                                                                            className="h-8 w-8 rounded-lg bg-slate-50 border border-divider"
                                                                                            onClick={() => handleOptionChange(index, "colorIcon", "hsl(" + Math.floor(Math.random() * 360) + ", 75%, 50%)")}
                                                                                        >
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

                                                                        {/* Màu Chữ */}
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                                                                {language === "vi" ? "Màu Chữ:" : "Text Color:"}
                                                                            </span>
                                                                            <ColorPicker
                                                                                value={safeParseColor(opt.colorText, "#1e293b")}
                                                                                onChange={(color) => handleOptionChange(index, "colorText", color.toString("hex"))}
                                                                            >
                                                                                <ColorPicker.Trigger className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] cursor-pointer shadow-2xs hover:border-accent transition-colors">
                                                                                    <ColorSwatch size="xs" color={safeParseColor(opt.colorText, "#1e293b")} />
                                                                                    <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                                                                                        {opt.colorText || "#1e293b"}
                                                                                    </span>
                                                                                </ColorPicker.Trigger>
                                                                                <ColorPicker.Popover className="gap-2 p-3 bg-white dark:bg-[var(--bg-surface)] border border-divider shadow-xl rounded-xl z-50">
                                                                                    <ColorArea
                                                                                        aria-label="Color area"
                                                                                        className="max-w-full h-32 rounded-lg"
                                                                                        colorSpace="hsb"
                                                                                        xChannel="saturation"
                                                                                        yChannel="brightness"
                                                                                    >
                                                                                        <ColorArea.Thumb />
                                                                                    </ColorArea>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <ColorSlider aria-label="Hue slider" channel="hue" className="flex-grow" colorSpace="hsb">
                                                                                            <ColorSlider.Track>
                                                                                                <ColorSlider.Thumb />
                                                                                            </ColorSlider.Track>
                                                                                        </ColorSlider>
                                                                                        <Button
                                                                                            type="button"
                                                                                            isIconOnly
                                                                                            size="sm"
                                                                                            variant="outline"
                                                                                            aria-label="Chọn màu chữ ngẫu nhiên"
                                                                                            className="h-8 w-8 rounded-lg bg-slate-50 border border-divider"
                                                                                            onClick={() => handleOptionChange(index, "colorText", "hsl(" + Math.floor(Math.random() * 360) + ", 75%, 50%)")}
                                                                                        >
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

                                                                    {/* Nút Xóa */}
                                                                    <Button
                                                                        type="button"
                                                                        isIconOnly
                                                                        variant="ghost"
                                                                        aria-label="Xóa tùy chọn này"
                                                                        className="rounded-xl h-9 w-9 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer border-none transition-colors"
                                                                        onClick={() => handleRemoveOption(index)}
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 3: PACKAGES */}
                                    {activeTab === "PACKAGES" && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="block text-xs font-extrabold uppercase tracking-wider">
                                                        {language === "vi" ? "Gói Tour & Bảng Giá" : "Tour Packages & Pricing"}
                                                    </Label>
                                                    <p className="text-[11px] text-slate-400">
                                                        {language === "vi"
                                                            ? "Cấu hình giá theo người lớn / trẻ em hoặc trọn gói / cano riêng."
                                                            : "Set prices per adult/child or fixed charter price."}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="bg-accent hover:bg-accent-hover text-accent-foreground rounded-xl text-xs font-bold gap-1 border-none shadow-sm cursor-pointer transition-colors"
                                                    onClick={handleAddPackage}
                                                >
                                                    <Plus size={14} />
                                                    {language === "vi" ? "Thêm gói tour" : "Add Package"}
                                                </Button>
                                            </div>

                                            {packages.length === 0 ? (
                                                <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                                    <p className="text-xs text-slate-400 italic mb-3">
                                                        {language === "vi"
                                                            ? "Chưa có gói tour nào. Bấm 'Thêm gói tour' để tạo bảng giá cho tour."
                                                            : "No tour packages configured. Click 'Add Package' to create."}
                                                    </p>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="bg-accent hover:bg-accent-hover text-accent-foreground rounded-xl text-xs font-bold gap-1 border-none shadow-sm cursor-pointer transition-colors"
                                                        onClick={handleAddPackage}
                                                    >
                                                        <Plus size={14} />
                                                        {language === "vi" ? "Thêm gói tour" : "Add Package"}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {packages.map((pkg, idx) => {
                                                        const pkgTrans = pkg.translations?.find(t => t.locale === activeFormLocale) || pkg.translations?.[0];
                                                        const pkgName = pkgTrans?.name || pkg.code || (language === "vi" ? `Gói #${idx + 1}` : `Package #${idx + 1}`);
                                                        const isPerPerson = pkg.pricingType === "PER_PERSON" || (!pkg.pricingType && !pkg.fixedPrice) || (pkg.prices && pkg.prices.length > 0);

                                                        return (
                                                            <div key={pkg.id || idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] space-y-3">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{pkgName}</span>
                                                                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-slate-200 dark:bg-[var(--bg-elevated)] text-slate-600 dark:text-slate-300">
                                                                                {isPerPerson
                                                                                    ? (language === "vi" ? "Theo người" : "Per Person")
                                                                                    : (language === "vi" ? "Trọn gói" : "Charter")}
                                                                            </span>
                                                                        </div>
                                                                        <div className="w-full ">
                                                                            {active ? (
                                                                                <Chip color="success" size="sm">Hoạt động</Chip>
                                                                            ) : (
                                                                                <Chip color="danger" size="sm">Không hoạt động</Chip>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        <Button
                                                                            type="button"
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 cursor-pointer border-none"
                                                                            onClick={() => handleEditPackage(idx)}
                                                                            aria-label={language === "vi" ? "Chỉnh sửa" : "Edit"}
                                                                        >
                                                                            <Edit size={13} />
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 cursor-pointer border-none"
                                                                            onClick={() => handleRemovePackage(idx)}
                                                                            aria-label={language === "vi" ? "Xóa" : "Delete"}
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {pkg.isContactOnly ? (
                                                                    <div className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg inline-block">
                                                                        {language === "vi" ? "Liên hệ báo giá" : "Contact for Price"}
                                                                    </div>
                                                                ) : isPerPerson ? (
                                                                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                                                                        <div>
                                                                            <span className="text-[10px] text-slate-400 block font-semibold">{language === "vi" ? "Người lớn" : "Adult"}</span>
                                                                            <span className="font-bold text-slate-800 dark:text-slate-100">
                                                                                {new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(pkg.adultPrice ?? getPackagePrice(pkg, "ADULT"))}
                                                                            </span>
                                                                            {formatPassengerCondition(getPackagePriceItem(pkg, "ADULT"), language) && (
                                                                                <span className="text-[9px] text-slate-400 block truncate font-medium mt-0.5">
                                                                                    {formatPassengerCondition(getPackagePriceItem(pkg, "ADULT"), language)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[10px] text-slate-400 block font-semibold">{language === "vi" ? "Trẻ em" : "Child"}</span>
                                                                            <span className="font-bold text-slate-800 dark:text-slate-100">
                                                                                {new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(pkg.childPrice ?? getPackagePrice(pkg, "CHILD"))}
                                                                            </span>
                                                                            {formatPassengerCondition(getPackagePriceItem(pkg, "CHILD"), language) && (
                                                                                <span className="text-[9px] text-slate-400 block truncate font-medium mt-0.5">
                                                                                    {formatPassengerCondition(getPackagePriceItem(pkg, "CHILD"), language)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[10px] text-slate-400 block font-semibold">{language === "vi" ? "Em bé" : "Infant"}</span>
                                                                            {(() => {
                                                                                const infPrice = pkg.infantPrice ?? getPackagePrice(pkg, "INFANT");
                                                                                return (
                                                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                                                        {infPrice > 0
                                                                                            ? new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(infPrice)
                                                                                            : (language === "vi" ? "Miễn phí" : "Free")}
                                                                                    </span>
                                                                                );
                                                                            })()}
                                                                            {formatPassengerCondition(getPackagePriceItem(pkg, "INFANT"), language) && (
                                                                                <span className="text-[9px] text-slate-400 block truncate font-medium mt-0.5">
                                                                                    {formatPassengerCondition(getPackagePriceItem(pkg, "INFANT"), language)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                                                        <span className="text-[10px] text-slate-400 block">{language === "vi" ? "Giá trọn gói" : "Fixed Price"}</span>
                                                                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                                                                            {new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(pkg.fixedPrice || 0)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </ModalBody>

                                <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onClose}
                                        isDisabled={loading}
                                        className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                    >
                                        {language === "vi" ? "Hủy" : "Cancel"}
                                    </Button>
                                    <Button
                                        type="submit"
                                        isDisabled={loading}
                                        className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                                    >
                                        {loading ? (
                                            <RefreshCw size={15} className="animate-spin mr-1.5" />
                                        ) : isEdit ? (
                                            <Save size={15} className="mr-1.5" />
                                        ) : (
                                            <Plus size={15} className="mr-1.5" />
                                        )}
                                        {isEdit
                                            ? (language === "vi" ? "Lưu thay đổi" : "Save Changes")
                                            : (language === "vi" ? "Tạo mới Tour" : "Create Tour")}
                                    </Button>
                                </ModalFooter>
                            </form>
                        </ModalDialog>
                    </ModalContainer>
                </ModalBackdrop>
            </Modal>

            {/* Tour Package Submodal */}
            <TourPackageModal
                isOpen={isPackageModalOpen}
                onClose={() => {
                    setIsPackageModalOpen(false);
                    setEditingPackageIndex(null);
                }}
                onSave={handleSavePackage}
                initialData={editingPackageIndex !== null ? packages[editingPackageIndex] : null}
                language={language}
            />
        </>
    );
}
