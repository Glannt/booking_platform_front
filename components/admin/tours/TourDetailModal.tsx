"use client";

import React, { useState } from "react";
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
    Chip,
} from "@heroui/react";
import {
    Compass,
    Edit3,
    CheckCircle2,
    XCircle,
    Package,
    Sparkles,
    Calendar,
    Clock,
    Users,
    Tag,
    ShieldCheck,
} from "lucide-react";
import clsx from "clsx";

import { TourDto, TourCategoryDto, getPackagePrice, getPackagePriceItem, formatPassengerCondition } from "@/lib/api/tours";
import { formatDepositPolicy } from "@/lib/pricing/deposit";
import { getIconComponent } from "@/lib/utils/icons";
import { parseBulletList } from "@/lib/utils/bullet-helper";
import { ScopedDiscountTab } from "@/components/admin/discount";
import { useI18n } from "@/context/LanguageContext";
import MultiImageUpload from "@/components/MultiImageUpload";

const OPTION_LOCALES = [
    { code: "vi", label: "Tiếng Việt", flag: "🇻🇳 VI" },
    { code: "en", label: "English", flag: "🇬🇧 EN" },
    { code: "ko", label: "한국어", flag: "🇰🇷 KO" },
    { code: "ru", label: "Русский", flag: "🇷🇺 RU" },
] as const;

export interface TourDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    tour: TourDto | null;
    categories: TourCategoryDto[];
    language?: string;
    backendUrl?: string;
    onEdit?: (tour: TourDto) => void;
    onSaveSuccess?: (updatedTour?: TourDto) => void | Promise<void>;
    showToast?: (msg: string, type: "success" | "error") => void;
    defaultEditMode?: boolean;
}

export default function TourDetailModal({
    isOpen,
    onClose,
    tour,
    categories,
    language = "vi",
    backendUrl,
    onEdit,
}: TourDetailsModalProps) {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<"INFO" | "AMENITIES" | "PACKAGES" | "DISCOUNTS">("INFO");
    const [activeLocale, setActiveLocale] = useState<string>("vi");

    if (!tour) return null;

    const categoryObj = categories.find(c => c.id === tour.tourCategoryId);
    const catTranslation = categoryObj?.translations?.find(tr => tr.locale === language) || categoryObj?.translations?.[0];
    const categoryName = catTranslation?.name || categoryObj?.title || categoryObj?.code || "—";

    const currentTrans = tour.translations?.find(tr => tr.locale === activeLocale) || tour.translations?.[0];
    const defaultTrans = tour.translations?.find(tr => tr.locale === language) || tour.translations?.[0];
    const tourName = defaultTrans?.name || `Tour #${tour.id}`;

    const durationText = `${tour.durationDays} Ngày ${tour.durationNights} Đêm`;

    const renderOptionIcon = (iconName?: string, color?: string) => {
        const IconComponent = getIconComponent(iconName);
        return <IconComponent size={16} style={{ color }} />;
    };

    const isActive = tour.status === "ACTIVE" || (tour.status === undefined && tour.active);

    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="tour-details-title">
            <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
                <ModalContainer>
                    <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden w-full max-w-3xl flex flex-col max-h-[90vh]">
                        <ModalCloseTrigger />
                        <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold shrink-0">
                                    <Compass size={20} />
                                </div>
                                <div>
                                    <h2 id="tour-details-title" className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span>{tourName}</span>
                                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[var(--bg-card)] text-slate-500">
                                            #{tour.id}
                                        </span>
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {categoryName} • {durationText} • {tour.minGuest || 1} - {tour.maxGuest || 20} {"khách"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pr-6">
                                <Chip
                                    size="sm"
                                    color={isActive ? "success" : "default"}
                                    variant="soft"
                                    className="text-xs font-bold"
                                >
                                    {isActive
                                        ? ("Đang mở bán"): ("Tạm ngưng")}
                                </Chip>
                            </div>
                        </ModalHeader>

                        {/* Navigation Tabs */}
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
                                {t.tours.tabAmenities || "Tiện ích & Tùy chọn"} ({tour.options?.length || 0})
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
                                <span>{t.tours.tabPackages || "Gói dịch vụ"} ({tour.packages?.length || 0})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("DISCOUNTS")}
                                className={clsx(
                                    "py-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer bg-transparent flex items-center gap-1.5 whitespace-nowrap",
                                    activeTab === "DISCOUNTS"
                                        ? "border-accent text-accent"
                                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                )}
                            >
                                <Tag size={14} />
                                <span>{t.tours.tabDiscounts || "Khuyến mãi"}</span>
                            </button>
                        </div>

                        <ModalBody className="p-6 space-y-6 overflow-y-auto max-h-[65vh] flex-1">
                            {/* TAB 1: INFO */}
                            {activeTab === "INFO" && (
                                <div className="space-y-6">
                                    {/* Stats grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                {"Danh mục tour"}
                                            </span>
                                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                                                {categoryName}
                                            </p>
                                        </div>

                                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                {"Thời lượng"}
                                            </span>
                                            <p className="text-xs font-black text-slate-900 dark:text-white">
                                                {durationText}
                                            </p>
                                        </div>

                                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                {"Giới hạn khách"}
                                            </span>
                                            <p className="text-xs font-black text-slate-900 dark:text-white">
                                                {tour.minGuest || 1} - {tour.maxGuest || 20} {"người"}
                                            </p>
                                        </div>

                                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator">
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                {"Đặc điểm nổi bật"}
                                            </span>
                                            <p className="text-xs font-black text-accent">
                                                {tour.isRecommended
                                                    ? ("Bán chạy / Đề xuất"): ("Tiêu chuẩn")}
                                            </p>
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-100 dark:bg-[var(--bg-card)]" />

                                    {/* Tour Translations Section */}
                                    <div className="space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <Label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                                {"Nội dung dịch thuật Tour"}
                                            </Label>
                                            <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 shadow-2xs">
                                                {OPTION_LOCALES.map((loc) => (
                                                    <button
                                                        key={loc.code}
                                                        type="button"
                                                        className={clsx(
                                                            "px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer border-none",
                                                            activeLocale === loc.code
                                                                ? "bg-accent text-accent-foreground shadow-xs font-bold"
                                                                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent"
                                                        )}
                                                        onClick={() => setActiveLocale(loc.code)}
                                                    >
                                                        {loc.flag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[var(--bg-card)] border border-separator space-y-4">
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                    {"Tên Tour"} ({activeLocale.toUpperCase()})
                                                </span>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                                    {currentTrans?.name || "—"}
                                                </p>
                                            </div>

                                            <Separator className="bg-slate-200/50 dark:bg-slate-700/50" />

                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                    {"Mô tả ngắn"} ({activeLocale.toUpperCase()})
                                                </span>
                                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                                                    {currentTrans?.description || "—"}
                                                </p>
                                            </div>

                                            <Separator className="bg-slate-200/50 dark:bg-slate-700/50" />

                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                    {"Nội dung chi tiết"} ({activeLocale.toUpperCase()})
                                                </span>
                                                <div className="text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed font-mono bg-white dark:bg-[var(--bg-surface)] p-3.5 rounded-xl border border-separator max-h-48 overflow-y-auto">
                                                    {currentTrans?.content || "—"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-100 dark:bg-[var(--bg-card)]" />

                                    {/* Inclusions & Exclusions */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-950 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                                            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                                                <CheckCircle2 size={16} />
                                                <span className="text-xs font-extrabold uppercase tracking-wider">
                                                    {"Bao gồm theo chương trình"}
                                                </span>
                                            </div>
                                            {tour.inclusions ? (
                                                <ul className="space-y-1.5">
                                                    {parseBulletList(tour.inclusions).map((item, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                                                            <span className="text-emerald-500 font-bold mt-0.5">•</span>
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">
                                                    {"Chưa có thông tin bao gồm."}
                                                </p>
                                            )}
                                        </div>

                                        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-950 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                                            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                                                <XCircle size={16} />
                                                <span className="text-xs font-extrabold uppercase tracking-wider">
                                                    {"Chi phí tự túc nếu có"}
                                                </span>
                                            </div>
                                            {tour.exclusions ? (
                                                <ul className="space-y-1.5">
                                                    {parseBulletList(tour.exclusions).map((item, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                                                            <span className="text-amber-500 font-bold mt-0.5">•</span>
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">
                                                    {"Chưa có thông tin tự túc."}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tour Images */}
                                    {((tour.imageIds && tour.imageIds.length > 0) || tour.thumbnailId) && (
                                        <>
                                            <Separator className="bg-slate-100 dark:bg-[var(--bg-card)]" />
                                            <div className="space-y-3">
                                                <Label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                                    {"Hình ảnh Tour"}
                                                </Label>
                                                <MultiImageUpload
                                                    imageIds={tour.imageIds || []}
                                                    thumbnailId={tour.thumbnailId || null}
                                                    readOnly
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: AMENITIES / OPTIONS */}
                            {activeTab === "AMENITIES" && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                                {"Tiện ích & Tùy chọn Tour"}
                                            </Label>
                                            <p className="text-[11px] text-slate-400">
                                                {"Danh sách các tiện ích cấu hình đi kèm chương trình tour."}
                                            </p>
                                        </div>
                                        <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 shadow-2xs">
                                            {OPTION_LOCALES.map((loc) => (
                                                <button
                                                    key={loc.code}
                                                    type="button"
                                                    className={clsx(
                                                        "px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer border-none",
                                                        activeLocale === loc.code
                                                            ? "bg-accent text-accent-foreground shadow-xs font-bold"
                                                            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent"
                                                    )}
                                                    onClick={() => setActiveLocale(loc.code)}
                                                >
                                                    {loc.flag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {!tour.options || tour.options.length === 0 ? (
                                        <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                            <p className="text-xs text-slate-400 italic">
                                                {"Chưa cấu hình tùy chọn nào."}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {tour.options.map((opt, idx) => {
                                                const optTrans = opt.translations?.find(t => t.locale === activeLocale) || opt.translations?.[0];
                                                return (
                                                    <div
                                                        key={opt.id || idx}
                                                        className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] shadow-xs"
                                                    >
                                                        <div
                                                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                                            style={{ backgroundColor: `${opt.colorText || "#3b82f6"}15` }}
                                                        >
                                                            {renderOptionIcon(opt.iconUrl, opt.colorText || "#3b82f6")}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <span
                                                                className="text-xs font-bold block truncate"
                                                                style={{ color: opt.colorText || undefined }}
                                                            >
                                                                {optTrans?.content || "—"}
                                                            </span>
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
                                            <Label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                                {"Gói Tour & Bảng Giá"}
                                            </Label>
                                            <p className="text-[11px] text-slate-400">
                                                {"Bảng giá chi tiết theo người lớn, trẻ em hoặc trọn gói."}
                                            </p>
                                        </div>
                                        <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 shadow-2xs">
                                            {OPTION_LOCALES.map((loc) => (
                                                <button
                                                    key={loc.code}
                                                    type="button"
                                                    className={clsx(
                                                        "px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer border-none",
                                                        activeLocale === loc.code
                                                            ? "bg-accent text-accent-foreground shadow-xs font-bold"
                                                            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent"
                                                    )}
                                                    onClick={() => setActiveLocale(loc.code)}
                                                >
                                                    {loc.flag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {!tour.packages || tour.packages.length === 0 ? (
                                        <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                            <p className="text-xs text-slate-400 italic">
                                                {"Chưa cấu hình gói tour nào."}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {tour.packages.map((pkg, idx) => {
                                                const pTr = pkg.translations?.find(t => t.locale === activeLocale) || pkg.translations?.[0];
                                                const name = pTr?.name || pkg.code || (`Gói #${idx + 1}`);
                                                const depositLabel = formatDepositPolicy(pkg);

                                                return (
                                                    <div key={pkg.id || idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] space-y-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">{name}</span>
                                                                <span className="text-[10px] font-mono text-slate-400">{pkg.code}</span>
                                                            </div>
                                                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-slate-200 dark:bg-[var(--bg-elevated)] text-slate-600 dark:text-slate-300 shrink-0">
                                                                {pkg.pricingType === "PER_PERSON"
                                                                    ? ("Theo người"): ("Trọn gói")}
                                                            </span>
                                                        </div>

                                                        {pkg.isContactOnly ? (
                                                            <div className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg inline-block">
                                                                {"Liên hệ báo giá"}
                                                            </div>
                                                        ) : pkg.pricingType === "PER_PERSON" ? (
                                                            (() => {
                                                                const adultPrice = getPackagePrice(pkg, "ADULT");
                                                                const childPrice = getPackagePrice(pkg, "CHILD");
                                                                const infantPrice = getPackagePrice(pkg, "INFANT");
                                                                const adultCond = formatPassengerCondition(getPackagePriceItem(pkg, "ADULT"), language);
                                                                const childCond = formatPassengerCondition(getPackagePriceItem(pkg, "CHILD"), language);
                                                                const infantCond = formatPassengerCondition(getPackagePriceItem(pkg, "INFANT"), language);
                                                                return (
                                                                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                                                                        <div>
                                                                            <span className="text-[10px] text-slate-400 block font-medium">{"Người lớn"}</span>
                                                                            <span className="font-black text-accent text-xs">
                                                                                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(adultPrice)}
                                                                            </span>
                                                                            {adultCond && (
                                                                                <span className="text-[9px] text-slate-400 block font-mono">
                                                                                    ({adultCond})
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[10px] text-slate-400 block font-medium">{"Trẻ em"}</span>
                                                                            <span className="font-bold text-slate-800 dark:text-slate-100">
                                                                                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(childPrice)}
                                                                            </span>
                                                                            {childCond && (
                                                                                <span className="text-[9px] text-slate-400 block font-mono">
                                                                                    ({childCond})
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[10px] text-slate-400 block font-medium">{"Em bé"}</span>
                                                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                                                {infantPrice > 0
                                                                                    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(infantPrice)
                                                                                    : ("Miễn phí")}
                                                                            </span>
                                                                            {infantCond && (
                                                                                <span className="text-[9px] text-slate-400 block font-mono">
                                                                                    ({infantCond})
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()
                                                        ) : (
                                                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                                                <span className="text-[10px] text-slate-400 block">{"Giá trọn gói"}</span>
                                                                <span className="font-black text-accent text-sm">
                                                                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(pkg.fixedPrice || 0)}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {depositLabel && (
                                                            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                                                                <ShieldCheck size={13} className="text-amber-500 shrink-0" />
                                                                <span className="text-[10px] text-slate-400 font-medium">{"Đặt cọc"}:</span>
                                                                <span className="font-black text-amber-600 dark:text-amber-400">
                                                                    {depositLabel}
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

                            {/* TAB 4: DISCOUNTS */}
                            {activeTab === "DISCOUNTS" && (
                                <ScopedDiscountTab
                                    scopeType="TOUR"
                                    scopeRefId={tour.id}
                                    scopeTitle={`Tour: ${tourName}`}
                                />
                            )}
                        </ModalBody>

                        <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                            >
                                {"Đóng"}
                            </Button>
                            {onEdit && (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onEdit(tour);
                                    }}
                                    className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
                                >
                                    <Edit3 size={15} className="mr-1.5" />
                                    {"Chỉnh sửa"}
                                </Button>
                            )}
                        </ModalFooter>
                    </ModalDialog>
                </ModalContainer>
            </ModalBackdrop>
        </Modal>
    );
}
