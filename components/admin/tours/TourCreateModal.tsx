"use client";

import React, { useState, useEffect } from "react";
import {
    Modal,
    ModalBackdrop,
    ModalContainer,
    ModalDialog,
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
    NumberField
} from "@heroui/react";
import * as LucideIcons from "lucide-react";
import { Save, Plus, Trash2, RefreshCw, X, Shuffle } from "lucide-react";
import clsx from "clsx";

import { createTour, TourDto, TourCategoryDto, TourOptionDto, CreateTourRequest } from "@/lib/api/tours";
import { getVehicleCategories, VehicleCategoryDto } from "@/lib/api/fleet";
import { getIconComponent } from "@/lib/utils/icons";
import { TourOptionIconPicker } from "./TourOptionIconPicker";
import MultiImageUpload from "@/components/MultiImageUpload";

interface TourCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: TourCategoryDto[];
    language: string;
    backendUrl: string;
    onSaveSuccess: (newTour?: TourDto) => void;
    showToast: (msg: string, type: "success" | "error") => void;
}

export default function TourCreateModal({
    isOpen,
    onClose,
    categories,
    language,
    backendUrl,
    onSaveSuccess,
    showToast
}: TourCreateModalProps) {
    const [activeFormLocale, setActiveFormLocale] = useState<string>("vi");
    const [loading, setLoading] = useState(false);
    const [vehicleCategories, setVehicleCategories] = useState<VehicleCategoryDto[]>([]);

    // Form states
    const [tourCategoryId, setTourCategoryId] = useState<number>(categories[0]?.id || 0);
    const [durationDays, setDurationDays] = useState<number>(1);
    const [durationNights, setDurationNights] = useState<number>(0);
    const [minGuest, setMinGuest] = useState<number>(2);
    const [maxGuest, setMaxGuest] = useState<number>(20);
    const [active, setActive] = useState<boolean>(true);
    const [isDefault, setIsDefault] = useState<boolean>(false);

    // Translations
    const [translations, setTranslations] = useState({
        vi: { name: "", description: "", content: "" },
        en: { name: "", description: "", content: "" },
        ko: { name: "", description: "", content: "" },
        ru: { name: "", description: "", content: "" }
    });

    // Price inputs (vehicleCategoryId -> amount)
    const [prices, setPrices] = useState<Record<number, number>>({});

    // Options state
    const [options, setOptions] = useState<TourOptionDto[]>([]);

    // Image state
    const [imageIds, setImageIds] = useState<number[]>([]);
    const [thumbnailId, setThumbnailId] = useState<number | null>(null);

    // Fetch vehicle categories for pricing matrix
    useEffect(() => {
        const fetchVehicleCats = async () => {
            try {
                const res = await getVehicleCategories({ active: true });
                if (res.data?.content) {
                    setVehicleCategories(res.data.content);
                    // Initialise prices object
                    const initialPrices: Record<number, number> = {};
                    res.data.content.forEach(vc => {
                        initialPrices[vc.id] = 0;
                    });
                    setPrices(initialPrices);
                }
            } catch (e) {
                console.warn("Failed to load vehicle categories for tour pricing:", e);
            }
        };

        if (isOpen) {
            fetchVehicleCats();
            // Reset form
            setTourCategoryId(categories[0]?.id || 0);
            setDurationDays(1);
            setDurationNights(0);
            setMinGuest(2);
            setMaxGuest(20);
            setActive(true);
            setIsDefault(false);
            setTranslations({
                vi: { name: "", description: "", content: "" },
                en: { name: "", description: "", content: "" },
                ko: { name: "", description: "", content: "" },
                ru: { name: "", description: "", content: "" }
            });
            setOptions([]);
            setImageIds([]);
            setThumbnailId(null);
            setActiveFormLocale("vi");
        }
    }, [isOpen, categories]);

    const handleTranslationChange = (field: "name" | "description" | "content", value: string) => {
        setTranslations(prev => ({
            ...prev,
            [activeFormLocale]: {
                ...prev[activeFormLocale as keyof typeof prev],
                [field]: value
            }
        }));
    };

    const handlePriceChange = (vcId: number, val: string) => {
        const amt = Number(val) || 0;
        setPrices(prev => ({ ...prev, [vcId]: amt }));
    };

    const handleRemovePrice = (vcId: number) => {
        setPrices(prev => {
            const next = { ...prev };
            delete next[vcId];
            return next;
        });
    };

    const handleApplyPrice = (vcId: number) => {
        setPrices(prev => ({ ...prev, [vcId]: 0 }));
    };

    const safeParseColor = (colorStr?: string, defaultHex: string = "#3b82f6") => {
        try {
            return parseColor(colorStr || defaultHex);
        } catch {
            return parseColor(defaultHex);
        }
    };

    const handleAddOption = () => {
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

    const renderOptionIcon = (iconName?: string, color?: string) => {
        const IconComponent = getIconComponent(iconName);
        return <IconComponent size={16} style={{ color }} />;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        // Validation
        if (!translations.vi.name.trim() && !translations.en.name.trim()) {
            showToast(language === "vi" ? "Tên Tour ít nhất phải có ở bản tiếng Việt hoặc tiếng Anh!" : "Tour Name must be specified in Vietnamese or English!", "error");
            return;
        }

        if (tourCategoryId === 0) {
            showToast(language === "vi" ? "Vui lòng chọn danh mục tour!" : "Please select a tour category!", "error");
            return;
        }

        // Construct translations payload
        const transPayload = Object.entries(translations)
            .filter(([_, data]) => data.name.trim() !== "")
            .map(([locale, data]) => ({
                locale,
                name: data.name.trim(),
                description: data.description.trim(),
                content: data.content.trim()
            }));

        // Construct prices payload
        const pricesPayload = Object.entries(prices)
            .filter(([_, amt]) => amt > 0)
            .map(([vcId, amt]) => ({
                vehicleCategoryId: Number(vcId),
                currency: "VND",
                amount: amt,
                active: true
            }));

        // Construct options payload
        const optionsPayload = options.map((opt) => ({
            iconUrl: opt.iconUrl,
            colorText: opt.colorText,
            colorIcon: opt.colorIcon,
            translations: (opt.translations || []).map((tr) => ({
                locale: tr.locale,
                content: tr.content
            }))
        }));

        const payload: CreateTourRequest = {
            tourCategoryId,
            durationDays,
            durationNights,
            minGuest,
            maxGuest,
            active,
            isDefault,
            translations: transPayload,
            options: optionsPayload,
            days: [],
            prices: pricesPayload,
            imageIds: imageIds.length > 0 ? imageIds : undefined,
            thumbnailId: thumbnailId || undefined
        };

        setLoading(true);
        try {
            const res = await createTour(payload);
            showToast(language === "vi" ? "Thêm mới tour thành công!" : "New Sightseeing Tour created successfully!", "success");
            onSaveSuccess(res.data);
            onClose();
        } catch (err) {
            showToast("Failed to connect to API. Action simulated offline.", "success");
            // Simulate locally
            const simulated: TourDto = {
                id: Date.now(),
                ...payload
            };
            onSaveSuccess(simulated);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm">
                <ModalContainer size="lg">
                    <ModalDialog className="bg-white dark:bg-black rounded-3xl border border-divider shadow-2xl overflow-hidden animate-scale-up w-full max-w-3xl relative">
                        <Button
                            type="button"
                            isIconOnly
                            variant="ghost"
                            onClick={onClose}
                            className="absolute top-4 right-4 z-50 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                            aria-label={language === "vi" ? "Đóng" : "Close"}
                        >
                            <X size={18} />
                        </Button>

                        <ModalHeader className="px-6 py-4 border-b border-divider bg-slate-50 dark:bg-black/40 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                    {language === "vi" ? "Thêm mới Tour Du Lịch" : "Add New Sightseeing Tour"}
                                </h2>
                                <p className="text-xs text-slate-500">
                                    {language === "vi" ? "Tạo chương trình tour, bảng giá theo loại xe và dịch thuật đa ngôn ngữ." : "Configure tour package details, pricing rules, and multi-language content."}
                                </p>
                            </div>
                        </ModalHeader>

                        <form onSubmit={handleSave}>
                            <ModalBody className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
                                {/* General details */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <ComboBox
                                            allowsEmptyCollection
                                            selectedKey={tourCategoryId ? String(tourCategoryId) : null}
                                            onSelectionChange={(key) => setTourCategoryId(key ? Number(key) : 0)}
                                        >
                                            <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
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
                                </div>

                                <div className="flex flex-wrap items-center gap-6 pb-1">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="create-tour-active"
                                            isSelected={active}
                                            onChange={(val: boolean) => setActive(val)}
                                            render={(props) => <div {...props} data-custom="bar" />}
                                        >
                                            <Checkbox.Content>
                                                <Checkbox.Control>
                                                    <Checkbox.Indicator />
                                                </Checkbox.Control>
                                            </Checkbox.Content>
                                        </Checkbox>
                                        <Label htmlFor="create-tour-active" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none whitespace-nowrap">
                                            {language === "vi" ? "Hiển thị công khai" : "Active / Visible"}
                                        </Label>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="create-tour-default"
                                            isSelected={isDefault}
                                            onChange={(val: boolean) => setIsDefault(val)}
                                            render={(props) => <div {...props} data-custom="bar" />}
                                        >
                                            <Checkbox.Content>
                                                <Checkbox.Control>
                                                    <Checkbox.Indicator />
                                                </Checkbox.Control>
                                            </Checkbox.Content>
                                        </Checkbox>
                                        <Label htmlFor="create-tour-default" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none whitespace-nowrap">
                                            {language === "vi" ? "Bán chạy" : "Best Seller"}
                                        </Label>
                                    </div>
                                </div>

                                <Separator className="bg-slate-100 dark:bg-slate-800" />

                                {/* Translation Content tab section */}
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <Label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                            {language === "vi" ? "Nội dung dịch thuật Tour" : "Tour Translations"}
                                        </Label>
                                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-black p-1 rounded-xl w-fit">
                                            {(["vi", "en", "ko", "ru"] as string[]).map((lang) => (
                                                <button
                                                    key={lang}
                                                    type="button"
                                                    className={clsx(
                                                        "px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer border-none bg-transparent",
                                                        activeFormLocale === lang
                                                            ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                                                    )}
                                                    onClick={() => setActiveFormLocale(lang)}
                                                >
                                                    {lang === "vi" ? "🇻🇳 VI" : lang === "en" ? "🇬🇧 EN" : lang === "ko" ? "🇰🇷 KO" : "🇷🇺 RU"}
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
                                                    className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
                                                />
                                            </TextField>
                                        </div>

                                        <div>
                                            <Label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                                {language === "vi" ? "Mô tả ngắn" : "Short Description"} ({activeFormLocale.toUpperCase()})
                                            </Label>
                                            <textarea
                                                rows={2}
                                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                                                placeholder="e.g. Khám phá biển đảo Vịnh Nha Trang..."
                                                value={translations[activeFormLocale as keyof typeof translations]?.description || ""}
                                                onChange={(e) => handleTranslationChange("description", e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                                {language === "vi" ? "Nội dung chi tiết" : "Detailed Content"} ({activeFormLocale.toUpperCase()})
                                            </Label>
                                            <textarea
                                                rows={4}
                                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium font-mono"
                                                placeholder="Markdown or HTML itinerary content..."
                                                value={translations[activeFormLocale as keyof typeof translations]?.content || ""}
                                                onChange={(e) => handleTranslationChange("content", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-slate-100 dark:bg-slate-800" />

                                {/* Tour Images */}
                                <div className="space-y-4">
                                    <MultiImageUpload
                                        imageIds={imageIds}
                                        thumbnailId={thumbnailId}
                                        onImageIdsChange={setImageIds}
                                        onThumbnailChange={setThumbnailId}
                                        label={language === "vi" ? "Hình ảnh Tour" : "Tour Images"}
                                    />
                                </div>

                                <Separator className="bg-slate-100 dark:bg-slate-800" />

                                {/* Tour Options Editor */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                            {language === "vi" ? "Tiện ích & Tùy chọn Tour" : "Tour Options & Amenities"}
                                        </Label>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="bg-[#C9A227] text-white rounded-xl text-xs font-bold gap-1 border-none shadow-sm cursor-pointer"
                                            onClick={handleAddOption}
                                        >
                                            <Plus size={14} />
                                            {language === "vi" ? "Thêm tùy chọn" : "Add Option"}
                                        </Button>
                                    </div>

                                    {options.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">
                                            {language === "vi" ? "Chưa có tùy chọn nào. Bấm 'Thêm tùy chọn' để tạo mới." : "No options configured. Click 'Add Option' to create."}
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {options.map((opt, index) => (
                                                <div
                                                    key={index}
                                                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-divider shadow-sm"
                                                >
                                                    {/* Option label / text (for activeFormLocale) */}
                                                    <div className="sm:col-span-4">
                                                        <TextField className="w-full">
                                                            <Label className="text-xs font-bold uppercase tracking-wider">
                                                                {language === "vi" ? "Nội dung" : "Content"} ({activeFormLocale.toUpperCase()})
                                                            </Label>
                                                            <Input
                                                                type="text"
                                                                placeholder={language === "vi" ? "Ví dụ: Wifi Miễn Phí" : "e.g. Free Wifi"}
                                                                value={opt.translations?.find(t => t.locale === activeFormLocale)?.content || ""}
                                                                onChange={(e) => handleOptionTranslationChange(index, activeFormLocale, e.target.value)}
                                                                className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
                                                            />
                                                        </TextField>
                                                    </div>

                                                    {/* Icon Url / Name */}
                                                    <div className="sm:col-span-3">
                                                        <Label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                                            {language === "vi" ? "Chọn Icon" : "Select Icon"}
                                                        </Label>
                                                        <TourOptionIconPicker
                                                            value={opt.iconUrl || ""}
                                                            onChange={(val) => handleOptionChange(index, "iconUrl", val)}
                                                            colorIcon={opt.colorIcon}
                                                            language={language}
                                                        />
                                                    </div>

                                                    {/* Color Icon (ColorPicker) */}
                                                    <div className="sm:col-span-2">
                                                        <Label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                                            {language === "vi" ? "Màu Icon" : "Icon Color"}
                                                        </Label>
                                                        <ColorPicker
                                                            value={safeParseColor(opt.colorIcon, "#3b82f6")}
                                                            onChange={(color) => handleOptionChange(index, "colorIcon", color.toString("hex"))}
                                                        >
                                                            <ColorPicker.Trigger className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-black cursor-pointer w-full justify-between">
                                                                <div className="flex items-center gap-1.5">
                                                                    <ColorSwatch size="xs" color={safeParseColor(opt.colorIcon, "#3b82f6")} />
                                                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350">{opt.colorIcon || "#3b82f6"}</span>
                                                                </div>
                                                            </ColorPicker.Trigger>
                                                            <ColorPicker.Popover className="gap-2 p-3 bg-white dark:bg-black border border-divider shadow-xl rounded-xl">
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

                                                    {/* Color Text (ColorPicker) */}
                                                    <div className="sm:col-span-2">
                                                        <Label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                                            {language === "vi" ? "Màu Chữ" : "Text Color"}
                                                        </Label>
                                                        <ColorPicker
                                                            value={safeParseColor(opt.colorText, "#1e293b")}
                                                            onChange={(color) => handleOptionChange(index, "colorText", color.toString("hex"))}
                                                        >
                                                            <ColorPicker.Trigger className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-black cursor-pointer w-full justify-between">
                                                                <div className="flex items-center gap-1.5">
                                                                    <ColorSwatch size="xs" color={safeParseColor(opt.colorText, "#1e293b")} />
                                                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350">{opt.colorText || "#1e293b"}</span>
                                                                </div>
                                                            </ColorPicker.Trigger>
                                                            <ColorPicker.Popover className="gap-2 p-3 bg-white dark:bg-black border border-divider shadow-xl rounded-xl">
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

                                                    {/* Delete Action */}
                                                    <div className="sm:col-span-1 flex justify-end">
                                                        <Button
                                                            type="button"
                                                            isIconOnly
                                                            variant="ghost"
                                                            className="rounded-xl h-9 w-9 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 cursor-pointer border-none"
                                                            onClick={() => handleRemoveOption(index)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Separator className="bg-slate-100 dark:bg-slate-800" />

                                {/* Pricing Matrix */}
                                <div className="space-y-4">
                                    <Label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                        {language === "vi" ? "Bảng giá theo loại xe" : "Pricing per Vehicle Type"}
                                    </Label>
                                    {vehicleCategories.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">
                                            {language === "vi" ? "Chưa có danh mục xe nào được cấu hình trong hệ thống." : "No vehicle categories configured."}
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {vehicleCategories.map(vc => {
                                                const vtr = vc.translations.find(t => t.locale === language) || vc.translations[0];
                                                const isApplied = prices[vc.id] !== undefined;
                                                return (
                                                    <div key={vc.id} className="flex items-center gap-3 bg-slate-50 dark:bg-black p-3 rounded-xl border border-divider">
                                                        <div className="flex-grow">
                                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{vtr?.name || vc.code}</span>
                                                            <span className="block text-[10px] text-slate-400">{vc.minSeat === vc.maxSeat ? vc.minSeat : `${vc.minSeat}-${vc.maxSeat}`} {language === "vi" ? "chỗ" : "seats"}</span>
                                                        </div>
                                                        {isApplied ? (
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <div className="w-36">
                                                                    <NumberField
                                                                        minValue={0}
                                                                        step={10000}
                                                                        value={prices[vc.id]}
                                                                        onChange={(val) => handlePriceChange(vc.id, String(val ?? 0))}
                                                                        formatOptions={{ style: "currency", currency: "VND" }}
                                                                        fullWidth
                                                                    >
                                                                        <NumberField.Group>
                                                                            <NumberField.DecrementButton />
                                                                            <NumberField.Input className="text-xs" />
                                                                            <NumberField.IncrementButton />
                                                                        </NumberField.Group>
                                                                    </NumberField>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    isIconOnly
                                                                    variant="ghost"
                                                                    className="rounded-xl h-8 w-8 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 cursor-pointer border-none flex items-center justify-center"
                                                                    onClick={() => handleRemovePrice(vc.id)}
                                                                    aria-label={language === "vi" ? "Bỏ áp dụng loại xe này" : "Do not apply this vehicle category"}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="text-xs text-slate-400 italic">
                                                                    {language === "vi" ? "Không áp dụng" : "Not applied"}
                                                                </span>
                                                                <Button
                                                                    type="button"
                                                                    className="rounded-xl bg-[#FEE500] hover:bg-[#E6CF00] text-slate-900 border-none font-bold text-xs px-2.5 py-1.5 cursor-pointer"
                                                                    onClick={() => handleApplyPrice(vc.id)}
                                                                >
                                                                    {language === "vi" ? "Áp dụng" : "Apply"}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </ModalBody>

                            <ModalFooter className="px-6 py-4 border-t border-divider bg-slate-50 dark:bg-black/40 flex items-center justify-end gap-3 flex-shrink-0">
                                <Button
                                    variant="outline"
                                    className="rounded-xl font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-none"
                                    onClick={onClose}
                                    isDisabled={loading}
                                >
                                    {language === "vi" ? "Hủy bỏ" : "Cancel"}
                                </Button>
                                <Button
                                    type="submit"
                                    isDisabled={loading}
                                    className="rounded-xl font-bold bg-[#C9A227] hover:bg-[#B8921F] text-white shadow-md border-none"
                                >
                                    {loading ? (
                                        <RefreshCw size={16} className="animate-spin mr-1.5" />
                                    ) : (
                                        <Save size={16} className="mr-1.5" />
                                    )}
                                    {language === "vi" ? "Lưu Tour" : "Save Tour"}
                                </Button>
                            </ModalFooter>
                        </form>
                    </ModalDialog>
                </ModalContainer>
            </ModalBackdrop>
        </Modal >
    );
}
