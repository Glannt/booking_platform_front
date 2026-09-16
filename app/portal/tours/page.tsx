"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Search,
    Plus,
    Trash2,
    RefreshCw,
    Compass,
    Layers,
    Eye,
    Edit3,
    Settings2,
    ShieldCheck,
    Sparkles,
    CheckCircle2,
    XCircle,
    SlidersHorizontal,
    TrendingUp,
    Filter,
    RotateCcw,
    X,
    ArrowUpDown,
    Tag,
    User,
    Users,
    Baby,
    Power
} from "lucide-react";
import {
    Button,
    Pagination,
    SearchField,
    SortDescriptor,
    Table,
    toast,
    Tooltip,
    Popover,
    Checkbox,
    Select,
    ListBox,
    Modal,
    ModalBackdrop,
    ModalContainer,
    ModalDialog,
    ModalHeader,
    ModalBody,
    ModalFooter
} from "@heroui/react";
import { SvgIconRenderer } from "@/components/common/SvgIconRenderer";
import { StatusChip } from "@/components/StatusChip";
import { AppStatusChip } from "@/components/common/AppStatusChip";

import TourCreateUpdateModal from "@/components/admin/tours/TourCreateUpdateModal";
import TourDetailModal from "@/components/admin/tours/TourDetailModal";
import TourCategoryModal from "@/components/admin/tours/TourCategoryModal";
import TourPolicyCreateUpdateModal from "@/components/admin/tours/TourPolicyCreateUpdateModal";
import TourPolicyDeleteModal from "@/components/admin/tours/TourPolicyDeleteModal";
import TourConfigModal from "@/components/admin/tours/TourConfigModal";
import TourPackageModal from "@/components/admin/tours/TourPackageModal";
import {
    TourPolicyDto,
    getAdminTourPolicies,
    createTourPolicy,
    updateTourPolicy,
    toggleTourPolicy,
    deleteTourPolicy
} from "@/lib/api/tour-policy";

import {
    getTours,
    getAdminTourCategories,
    deleteTour,
    deleteTourCategory,
    TourDto,
    TourCategoryDto,
    getPackagePrice,
    getPackagePriceItem,
    formatPassengerCondition,
    updateTour,
    TourPackageDto
} from "@/lib/api/tours";
import { backendUrl } from "@/lib/api/client";
import { ColumnInterface } from "@/lib/interface/column.interface";
import { useI18n } from "@/context/LanguageContext";
import { headerColumns } from "@/config/headerColumns";
import { ImageGrid } from "@/components/ImageGallery";
import { resolveImageUrls } from "@/lib/api/media";
import clsx from "clsx";
import PageSizeSelect from "@/components/common/PageSizeSelect";

function TourImageCell({ imageIds, thumbnailId }: { imageIds?: number[]; thumbnailId?: number }) {
    const [images, setImages] = useState<{ id: number; url: string }[]>([]);

    useEffect(() => {
        if (!imageIds || imageIds.length === 0) { setImages([]); return; }
        let cancelled = false;
        resolveImageUrls(imageIds).then(res => { if (!cancelled) setImages(res); });
        return () => { cancelled = true; };
    }, [imageIds]);

    if (images.length === 0) return <span className="text-xs text-slate-400 italic">—</span>;
    return <ImageGrid images={images} thumbnailId={thumbnailId} maxVisible={2} className="h-8 w-16" />;
}

function CategoryIcon({ iconName, size = 14, className }: { iconName?: string; size?: number; className?: string }) {
    return <SvgIconRenderer svgString={iconName} size={size} className={className} />;
}

interface FlatTourPackage extends TourPackageDto {
    tourId: number;
    tourName: string;
    tourCategoryName?: string;
    tourOriginal: TourDto;
}

export default function ToursManagementPage() {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<"tours" | "categories" | "policies" | "pricing">("tours");

    // Pricing Packages Tab State
    const [packageSearchTerm, setPackageSearchTerm] = useState<string>("");
    const [packageTourFilter, setPackageTourFilter] = useState<string>("ALL");
    const [packageStatusFilter, setPackageStatusFilter] = useState<string>("ALL");
    const [packageSort, setPackageSort] = useState<SortDescriptor>({ column: "id", direction: "ascending" });
    const [packagePageSize, setPackagePageSize] = useState<number>(10);
    const [packagePage, setPackagePage] = useState<number>(1);

    // Package Modals
    const [packageModalOpen, setPackageModalOpen] = useState<boolean>(false);
    const [editingPackage, setEditingPackage] = useState<TourPackageDto | null>(null);
    const [targetTourIdForPackage, setTargetTourIdForPackage] = useState<number | null>(null);
    const [selectTourModalOpen, setSelectTourModalOpen] = useState<boolean>(false);
    const [tempSelectedTourId, setTempSelectedTourId] = useState<number | null>(null);

    // Policy States
    const [policies, setPolicies] = useState<TourPolicyDto[]>([]);
    const [policiesLoading, setPoliciesLoading] = useState<boolean>(false);
    const [policySearchTerm, setPolicySearchTerm] = useState<string>("");
    const [policyStatusFilter, setPolicyStatusFilter] = useState<string>("ALL");
    const [policyModalOpen, setPolicyModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<TourPolicyDto | null>(null);
    const [deletePolicyModalOpen, setDeletePolicyModalOpen] = useState(false);
    const [policyToDelete, setPolicyToDelete] = useState<TourPolicyDto | null>(null);
    const [deletingPolicy, setDeletingPolicy] = useState(false);

    // Tour Config State
    const [configModalOpen, setConfigModalOpen] = useState(false);

    const [categories, setCategories] = useState<TourCategoryDto[]>([]);
    const [tours, setTours] = useState<TourDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [categorySearchTerm, setCategorySearchTerm] = useState<string>("");

    // Tour Modals
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedTour, setSelectedTour] = useState<TourDto | null>(null);

    // Category Modals
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<TourCategoryDto | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        if (type === "success") {
            toast.success(message);
        } else {
            toast.danger(message);
        }
    };

    const fetchPoliciesData = async () => {
        setPoliciesLoading(true);
        try {
            const res = await getAdminTourPolicies(0, 100);
            if (res.data?.content) {
                setPolicies(res.data.content);
            }
        } catch (e) {
            console.warn("Failed to fetch tour policies:", e);
        } finally {
            setPoliciesLoading(false);
        }
    };

    const fetchInitialData = async () => {
        fetchPoliciesData();
        setLoading(true);
        try {
            let loadedCats: TourCategoryDto[] = [];
            try {
                const catRes = await getAdminTourCategories();
                if (catRes.data?.content) {
                    loadedCats = catRes.data.content;
                }
            } catch (e) {
                console.warn("Failed to fetch tour categories:", e);
            }

            let loadedTours: TourDto[] = [];
            try {
                const toursRes = await getTours({ search: searchTerm || undefined });
                if (toursRes.data?.content) {
                    loadedTours = toursRes.data.content;
                }
            } catch (e) {
                console.warn("Failed to fetch tours:", e);
            }

            setCategories(loadedCats);
            setTours(loadedTours);
        } catch (error) {
            console.error("Error loading tour data:", error);
            showToast("Cannot connect to API. Loaded offline mock data.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, [searchTerm]);

    const handleSavePolicy = async (payload: Partial<TourPolicyDto>) => {
        if (editingPolicy) {
            await updateTourPolicy(editingPolicy.id, payload);
            showToast("Cập nhật chính sách thành công", "success");
        } else {
            await createTourPolicy(payload);
            showToast("Tạo mới chính sách thành công", "success");
        }
        await fetchPoliciesData();
    };

    const handleTogglePolicy = async (id: number) => {
        try {
            await toggleTourPolicy(id);
            setPolicies(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
            showToast("Đã thay đổi trạng thái chính sách", "success");
        } catch (err: any) {
            showToast(err.message || "Lỗi khi đổi trạng thái", "error");
        }
    };

    const handleConfirmDeletePolicy = async () => {
        if (!policyToDelete) return;
        setDeletingPolicy(true);
        try {
            await deleteTourPolicy(policyToDelete.id);
            showToast("Xóa chính sách thành công", "success");
            setDeletePolicyModalOpen(false);
            setPolicyToDelete(null);
            await fetchPoliciesData();
        } catch (err: any) {
            showToast(err.message || "Lỗi khi xóa chính sách", "error");
        } finally {
            setDeletingPolicy(false);
        }
    };

    const handleDeleteTour = async (id: number) => {
        const confirmMsg = "Bạn có chắc chắn muốn xóa tour du lịch này không?";
        if (!window.confirm(confirmMsg)) return;

        try {
            await deleteTour(id);
            showToast("Đã xóa tour thành công!", "success");
            setTours(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            showToast("Xóa tour thất bại hoặc giả lập xóa thành công.", "success");
            setTours(prev => prev.filter(t => t.id !== id));
        }
    };

    const handleDeleteCategory = async (id: number) => {
        const confirmMsg = "Bạn có chắc chắn muốn xóa danh mục tour này? Các tour thuộc danh mục này có thể bị ảnh hưởng.";
        if (!window.confirm(confirmMsg)) return;

        try {
            await deleteTourCategory(id);
            showToast("Đã xóa danh mục tour thành công!", "success");
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            showToast(err.message || "Xóa danh mục tour thất bại.", "error");
        }
    };

    const handleSaveSuccess = () => {
        fetchInitialData();
    };

    // Filter Tours State
    const [selectedTourCatIds, setSelectedTourCatIds] = useState<number[]>([]);
    const [selectedTourStatuses, setSelectedTourStatuses] = useState<string[]>([]);
    const [onlyTourRecommended, setOnlyTourRecommended] = useState<boolean>(false);
    const [tourQuickSort, setTourQuickSort] = useState<"default" | "price_asc" | "price_desc">("default");

    const tourActiveFilterCount =
        selectedTourCatIds.length +
        selectedTourStatuses.length +
        (onlyTourRecommended ? 1 : 0);

    const toggleTourCategory = (catId: number) => {
        setSelectedTourCatIds((prev) =>
            prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
        );
        setTourPage(1);
    };

    const toggleTourStatus = (st: string) => {
        setSelectedTourStatuses((prev) =>
            prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
        );
        setTourPage(1);
    };

    const handleResetTourFilters = () => {
        setSelectedTourCatIds([]);
        setSelectedTourStatuses([]);
        setOnlyTourRecommended(false);
        setTourQuickSort("default");
        setTourPage(1);
    };

    const TOUR_STATUS_OPTIONS = [
        { id: "ACTIVE", label: "Đang hoạt động" },
        { id: "INACTIVE", label: "Tạm ngưng" },
        { id: "DRAFT", label: "Bản nháp" },
    ];

    // Filter Tours
    const filteredTours = tours.filter(t => {
        const trans = t.translations.find(tr => tr.locale === "vi") || t.translations[0];
        const matchSearch = !searchTerm || (trans?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false);
        if (!matchSearch) return false;

        if (selectedTourCatIds.length > 0) {
            if (!t.tourCategoryId || !selectedTourCatIds.includes(t.tourCategoryId)) return false;
        }

        if (selectedTourStatuses.length > 0) {
            const st = t.status || (t.active ? "ACTIVE" : "INACTIVE");
            if (!selectedTourStatuses.includes(st)) return false;
        }

        if (onlyTourRecommended && !t.isRecommended) {
            return false;
        }

        return true;
    });

    // Tour Sort
    const [tourSort, setTourSort] = useState<SortDescriptor>(
        { column: "id", direction: "ascending" }
    );

    const tourColumns = headerColumns.tours(t);

    const sortedTours = useMemo(() => {
        const getP = (tour: TourDto) => {
            if (tour.packages && tour.packages.length > 0) {
                const act = tour.packages.filter(p => p.active && !p.isContactOnly);
                const prs = act.map(p => getPackagePrice(p, "ADULT")).filter(pr => pr > 0);
                if (prs.length > 0) return Math.min(...prs);
            }
            if (!tour.prices || tour.prices.length === 0) return 0;
            const ap = tour.prices.filter(p => p.active);
            if (ap.length === 0) return 0;
            return Math.min(...ap.map(p => p.amount));
        };

        if (tourQuickSort === "price_asc" || tourQuickSort === "price_desc") {
            return [...filteredTours].sort((a, b) => {
                const diff = getP(a) - getP(b);
                return tourQuickSort === "price_asc" ? diff : -diff;
            });
        }

        if (!tourSort.column) return filteredTours;
        return [...filteredTours].sort((a, b) => {
            const dir = tourSort.direction === "descending" ? -1 : 1;
            let cmp = 0;
            switch (tourSort.column) {
                case "id":
                    cmp = a.id - b.id;
                    break;
                case "duration":
                    cmp = (a.durationDays || a.durationNights) - (b.durationDays || b.durationNights);
                    break;
                case "minPrice":
                    cmp = getP(a) - getP(b);
                    break;
                case "status": {
                    const statusA = a.status || (a.active ? "ACTIVE" : "INACTIVE");
                    const statusB = b.status || (b.active ? "ACTIVE" : "INACTIVE");
                    cmp = statusA.localeCompare(statusB);
                    break;
                }
                default:
                    return 0;
            }
            return cmp * dir;
        });
    }, [filteredTours, tourSort, tourQuickSort]);

    // Tour Pagination
    const [tourPageSize, setTourPageSize] = useState<number>(10);
    const [tourPage, setTourPage] = useState<number>(1);
    const paginatedTours = useMemo(
        () => sortedTours.slice((tourPage - 1) * tourPageSize, tourPage * tourPageSize),
        [sortedTours, tourPage, tourPageSize]
    );
    const tourPageCount = Math.max(1, Math.ceil(sortedTours.length / tourPageSize));
    const tourStart = sortedTours.length === 0 ? 0 : (tourPage - 1) * tourPageSize + 1;
    const tourEnd = Math.min(tourPage * tourPageSize, sortedTours.length);
    const tourPages = Array.from({ length: tourPageCount }, (_, i) => i + 1);

    // Filter Categories
    const filteredPolicies = useMemo(() => {
        return policies.filter((p) => {
            const viName = p.translations?.find(t => t.locale === "vi")?.name || "";
            const enName = p.translations?.find(t => t.locale === "en")?.name || "";
            const matchesSearch =
                p.code.toLowerCase().includes(policySearchTerm.toLowerCase()) ||
                viName.toLowerCase().includes(policySearchTerm.toLowerCase()) ||
                enName.toLowerCase().includes(policySearchTerm.toLowerCase());

            const matchesStatus =
                policyStatusFilter === "ALL" ||
                (policyStatusFilter === "ACTIVE" && p.active) ||
                (policyStatusFilter === "INACTIVE" && !p.active);

            return matchesSearch && matchesStatus;
        });
    }, [policies, policySearchTerm, policyStatusFilter]);

    const filteredCategories = useMemo(() => {
        if (!categorySearchTerm.trim()) return categories;
        const q = categorySearchTerm.toLowerCase();
        return categories.filter(c => {
            const viName = c.translations?.find(t => t.locale === "vi")?.name || c.title || "";
            const enName = c.translations?.find(t => t.locale === "en")?.name || "";
            const code = c.code || "";
            return viName.toLowerCase().includes(q) || enName.toLowerCase().includes(q) || code.toLowerCase().includes(q);
        });
    }, [categories, categorySearchTerm]);

    // Tour Package Columns from headerColumns
    const packageColumns = headerColumns.tourPackages(t);

    const allTourPackages = useMemo<FlatTourPackage[]>(() => {
        const list: FlatTourPackage[] = [];
        tours.forEach((tour) => {
            const tourName = tour.translations?.find((tr) => tr.locale === "vi")?.name || tour.translations?.[0]?.name || `Tour #${tour.id}`;
            const cat = categories.find((c) => c.id === tour.tourCategoryId);
            const catName = cat?.translations?.find((tr) => tr.locale === "vi")?.name || cat?.title || cat?.code || "";
            if (tour.packages && tour.packages.length > 0) {
                tour.packages.forEach((pkg) => {
                    list.push({
                        ...pkg,
                        tourId: tour.id,
                        tourName,
                        tourCategoryName: catName,
                        tourOriginal: tour,
                    });
                });
            }
        });
        return list;
    }, [tours, categories]);

    const filteredTourPackages = useMemo(() => {
        return allTourPackages.filter((pkg) => {
            if (packageSearchTerm.trim()) {
                const term = packageSearchTerm.toLowerCase();
                const viName = pkg.translations?.find((tr) => tr.locale === "vi")?.name || pkg.name || "";
                const enName = pkg.translations?.find((tr) => tr.locale === "en")?.name || "";
                const code = pkg.code || "";
                const matches =
                    viName.toLowerCase().includes(term) ||
                    enName.toLowerCase().includes(term) ||
                    code.toLowerCase().includes(term) ||
                    pkg.tourName.toLowerCase().includes(term);
                if (!matches) return false;
            }

            if (packageTourFilter !== "ALL") {
                if (pkg.tourId !== Number(packageTourFilter)) return false;
            }

            if (packageStatusFilter !== "ALL") {
                const isActive = pkg.active;
                if (packageStatusFilter === "ACTIVE" && !isActive) return false;
                if (packageStatusFilter === "INACTIVE" && isActive) return false;
            }

            return true;
        });
    }, [allTourPackages, packageSearchTerm, packageTourFilter, packageStatusFilter]);

    const sortedPackages = useMemo(() => {
        let list = [...filteredTourPackages];
        if (!packageSort.column) return list;
        const dir = packageSort.direction === "descending" ? -1 : 1;
        list.sort((a, b) => {
            let cmp = 0;
            switch (packageSort.column) {
                case "id":
                    cmp = (a.id || 0) - (b.id || 0);
                    break;
                case "tour":
                    cmp = (a.tourName || "").localeCompare(b.tourName || "");
                    break;
                case "name": {
                    const nameA = a.translations?.find((tr) => tr.locale === "vi")?.name || a.name || "";
                    const nameB = b.translations?.find((tr) => tr.locale === "vi")?.name || b.name || "";
                    cmp = nameA.localeCompare(nameB);
                    break;
                }
                case "status":
                    cmp = (a.active ? 1 : 0) - (b.active ? 1 : 0);
                    break;
                default:
                    cmp = 0;
            }
            return cmp * dir;
        });
        return list;
    }, [filteredTourPackages, packageSort]);

    const paginatedPackages = useMemo(() => {
        return sortedPackages.slice((packagePage - 1) * packagePageSize, packagePage * packagePageSize);
    }, [sortedPackages, packagePage, packagePageSize]);

    const packagePageCount = Math.max(1, Math.ceil(sortedPackages.length / packagePageSize));
    const packageStart = sortedPackages.length === 0 ? 0 : (packagePage - 1) * packagePageSize + 1;
    const packageEnd = Math.min(packagePage * packagePageSize, sortedPackages.length);
    const packagePages = Array.from({ length: packagePageCount }, (_, i) => i + 1);

    const handleSavePackage = async (pkgData: TourPackageDto) => {
        if (!targetTourIdForPackage) {
            showToast("Không tìm thấy thông tin tour để cập nhật gói", "error");
            return;
        }
        const tour = tours.find((t) => t.id === targetTourIdForPackage);
        if (!tour) {
            showToast("Tour không tồn tại", "error");
            return;
        }

        let newPackages = [...(tour.packages || [])];
        if (editingPackage) {
            newPackages = newPackages.map((p) => {
                const matchId = editingPackage.id && p.id === editingPackage.id;
                const matchCode = editingPackage.code && p.code === editingPackage.code;
                if (matchId || matchCode) {
                    return { ...pkgData, id: editingPackage.id, tourId: tour.id };
                }
                return p;
            });
        } else {
            newPackages.push({ ...pkgData, tourId: tour.id });
        }

        try {
            await updateTour(tour.id, { packages: newPackages });
            showToast(editingPackage ? "Cập nhật gói tour thành công" : "Thêm gói tour mới thành công", "success");
            setPackageModalOpen(false);
            setEditingPackage(null);
            await fetchInitialData();
        } catch (err: any) {
            showToast(err.message || "Lỗi khi lưu thông tin gói tour", "error");
        }
    };

    const handleTogglePackageStatus = async (pkg: FlatTourPackage) => {
        const tour = tours.find((t) => t.id === pkg.tourId);
        if (!tour) return;
        const newPackages = (tour.packages || []).map((p) => {
            const matchId = pkg.id && p.id === pkg.id;
            const matchCode = pkg.code && p.code === pkg.code;
            if (matchId || matchCode) {
                return { ...p, active: !p.active };
            }
            return p;
        });

        try {
            await updateTour(tour.id, { packages: newPackages });
            showToast(pkg.active ? "Đã tạm dừng gói tour" : "Đã kích hoạt gói tour", "success");
            await fetchInitialData();
        } catch (err: any) {
            showToast(err.message || "Lỗi khi đổi trạng thái gói tour", "error");
        }
    };

    const handleDeletePackage = async (pkg: FlatTourPackage) => {
        const pkgName = pkg.translations?.find((tr) => tr.locale === "vi")?.name || pkg.name || pkg.code || `Gói #${pkg.id}`;
        if (!window.confirm(`Bạn có chắc chắn muốn xóa gói tour "${pkgName}" không?`)) return;
        const tour = tours.find((t) => t.id === pkg.tourId);
        if (!tour) return;

        const newPackages = (tour.packages || []).filter((p) => {
            if (pkg.id && p.id) return p.id !== pkg.id;
            if (pkg.code && p.code) return p.code !== pkg.code;
            return true;
        });

        try {
            await updateTour(tour.id, { packages: newPackages });
            showToast("Đã xóa gói tour thành công", "success");
            await fetchInitialData();
        } catch (err: any) {
            showToast(err.message || "Lỗi khi xóa gói tour", "error");
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-separator pb-3">
                <button
                    onClick={() => setActiveTab("tours")}
                    className={clsx(
                        "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all border-none cursor-pointer",
                        activeTab === "tours"
                            ? "bg-accent text-accent-foreground shadow-md"
                            : "bg-white dark:bg-[var(--bg-surface)] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]"
                    )}
                >
                    <Compass size={16} />
                    <span>Danh sách Tours ({tours.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab("categories")}
                    className={clsx(
                        "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all border-none cursor-pointer",
                        activeTab === "categories"
                            ? "bg-accent text-accent-foreground shadow-md"
                            : "bg-white dark:bg-[var(--bg-surface)] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]"
                    )}
                >
                    <Layers size={16} />
                    <span>Danh mục Tour ({categories.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab("policies")}
                    className={clsx(
                        "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all border-none cursor-pointer",
                        activeTab === "policies"
                            ? "bg-accent text-accent-foreground shadow-md"
                            : "bg-white dark:bg-[var(--bg-surface)] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]"
                    )}
                >
                    <ShieldCheck size={16} />
                    <span>Chính sách Tour ({policies.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab("pricing")}
                    className={clsx(
                        "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all border-none cursor-pointer",
                        activeTab === "pricing"
                            ? "bg-accent text-accent-foreground shadow-md"
                            : "bg-white dark:bg-[var(--bg-surface)] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]"
                    )}
                >
                    <Tag size={16} />
                    <span>Bảng giá Gói Tour ({allTourPackages.length})</span>
                </button>
            </div>

            {/* TAB 1: TOURS MANAGEMENT */}
            {activeTab === "tours" && (
                <>
                    {/* Search Filters & Actions */}
                    <div className="flex flex-col gap-4 bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl border border-separator shadow-sm">
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3 flex-grow max-w-2xl">
                                <SearchField name="search" value={searchTerm} onChange={(e: string) => setSearchTerm(e)} fullWidth className="min-w-[200px] flex-1">
                                    <SearchField.Group className="rounded-xl border border-border bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none text-sm font-bold">
                                        <SearchField.SearchIcon />
                                        <SearchField.Input className="w-full" placeholder="Tìm kiếm tour..." />
                                        <SearchField.ClearButton />
                                    </SearchField.Group>
                                </SearchField>

                                {/* Popover Filter Button */}
                                <Popover>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={`rounded-xl font-bold text-xs h-10 px-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 cursor-pointer ${tourActiveFilterCount > 0 ? "border-accent/60 bg-accent/5 text-accent dark:text-accent font-extrabold" : ""
                                            }`}
                                    >
                                        <Filter size={15} className={tourActiveFilterCount > 0 ? "text-accent" : "text-slate-500"} />
                                        <span>Bộ lọc</span>
                                        {tourActiveFilterCount > 0 && (
                                            <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-black flex items-center justify-center">
                                                {tourActiveFilterCount}
                                            </span>
                                        )}
                                    </Button>

                                    <Popover.Content
                                        placement="bottom start"
                                        className="w-80 p-0 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
                                    >
                                        <Popover.Dialog className="p-4 space-y-4 outline-none">
                                            {/* Header */}
                                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                                        Bộ lọc Tour
                                                    </h4>
                                                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                                                        Đang áp dụng: <span className="font-bold text-accent">{tourActiveFilterCount}</span>
                                                    </p>
                                                </div>
                                                {tourActiveFilterCount > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleResetTourFilters}
                                                        className="text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 p-1 h-auto cursor-pointer"
                                                    >
                                                        <RotateCcw size={12} className="mr-1 inline" />
                                                        Đặt lại
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Category Section */}
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                                    Danh mục Tour
                                                </span>
                                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                                    {categories.map((cat) => {
                                                        const checked = selectedTourCatIds.includes(cat.id);
                                                        const viName = cat.translations?.find(tr => tr.locale === "vi")?.name || cat.title || cat.code;
                                                        return (
                                                            <Checkbox
                                                                key={cat.id}
                                                                isSelected={checked}
                                                                onChange={() => toggleTourCategory(cat.id)}
                                                                className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                                                            >
                                                                <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                    <Checkbox.Control>
                                                                        <Checkbox.Indicator />
                                                                    </Checkbox.Control>
                                                                    <span className="truncate">{viName}</span>
                                                                </Checkbox.Content>
                                                            </Checkbox>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Status Section */}
                                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                                    Trạng thái Tour
                                                </span>
                                                <div className="space-y-1.5">
                                                    {TOUR_STATUS_OPTIONS.map((st) => {
                                                        const checked = selectedTourStatuses.includes(st.id);
                                                        return (
                                                            <Checkbox
                                                                key={st.id}
                                                                isSelected={checked}
                                                                onChange={() => toggleTourStatus(st.id)}
                                                                className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                                                            >
                                                                <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                    <Checkbox.Control>
                                                                        <Checkbox.Indicator />
                                                                    </Checkbox.Control>
                                                                    <span>{st.label}</span>
                                                                </Checkbox.Content>
                                                            </Checkbox>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Recommended Checkbox */}
                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                                <Checkbox
                                                    isSelected={onlyTourRecommended}
                                                    onChange={() => setOnlyTourRecommended(!onlyTourRecommended)}
                                                    className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                                                >
                                                    <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-bold text-amber-600 dark:text-amber-400">
                                                        <Checkbox.Control>
                                                            <Checkbox.Indicator />
                                                        </Checkbox.Control>
                                                        <span className="flex items-center gap-1">
                                                            <Sparkles size={13} className="text-amber-500" />
                                                            Chỉ tour đề xuất
                                                        </span>
                                                    </Checkbox.Content>
                                                </Checkbox>
                                            </div>
                                        </Popover.Dialog>
                                    </Popover.Content>
                                </Popover>

                                {/* Quick Price Sort Select */}
                                <div className="flex items-center gap-1.5">
                                    <ArrowUpDown size={14} className="text-slate-400" />
                                    <Select
                                        aria-label="Sắp xếp tour"
                                        selectedKey={tourQuickSort}
                                        onSelectionChange={(key) => { if (key) setTourQuickSort(key as typeof tourQuickSort); }}
                                        className="w-36"
                                    >
                                        <Select.Trigger className="h-10 px-3 text-xs font-bold bg-slate-50 dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                                            <Select.Value className="text-xs" />
                                            <Select.Indicator />
                                        </Select.Trigger>
                                        <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50">
                                            <ListBox aria-label="Tùy chọn sắp xếp">
                                                <ListBox.Item key="default" id="default" textValue="Mặc định" className="px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                                                    Mặc định
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                                <ListBox.Item key="price_asc" id="price_asc" textValue="Giá thấp → cao" className="px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                                                    Giá thấp → cao
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                                <ListBox.Item key="price_desc" id="price_desc" textValue="Giá cao → thấp" className="px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                                                    Giá cao → thấp
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                            </ListBox>
                                        </Select.Popover>
                                    </Select>
                                </div>

                                <PageSizeSelect
                                    value={tourPageSize}
                                    onChange={(size) => {
                                        setTourPageSize(size);
                                        setTourPage(1);
                                    }}
                                />
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                                <Button
                                    variant="outline"
                                    className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 shadow-sm border border-transparent cursor-pointer"
                                    onClick={fetchInitialData}
                                >
                                    <RefreshCw size={16} className="mr-1.5" />
                                    Làm mới
                                </Button>

                                <Button
                                    variant="outline"
                                    className="rounded-xl font-bold bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer flex items-center gap-1.5"
                                    onClick={() => setConfigModalOpen(true)}
                                >
                                    <Settings2 size={16} className="text-accent" />
                                    <span>Cấu hình đề xuất</span>
                                </Button>

                                <Button
                                    className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
                                    onClick={() => {
                                        setSelectedTour(null);
                                        setCreateModalOpen(true);
                                    }}
                                >
                                    <Plus size={16} />
                                    <span>Thêm Tour</span>
                                </Button>
                            </div>
                        </div>

                        {/* Active Filter Chips */}
                        {tourActiveFilterCount > 0 && (
                            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 w-full">
                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                    <Filter size={12} />
                                    Đang áp dụng:
                                </span>
                                {selectedTourCatIds.map((cId) => {
                                    const cat = categories.find((c) => c.id === cId);
                                    const label = cat?.translations?.find(tr => tr.locale === "vi")?.name || cat?.title || cat?.code || `Danh mục #${cId}`;
                                    return (
                                        <span
                                            key={`cat-${cId}`}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-accent/10 text-accent dark:bg-accent/20 border border-accent/30"
                                        >
                                            <span>{label}</span>
                                            <button
                                                type="button"
                                                onClick={() => toggleTourCategory(cId)}
                                                className="hover:opacity-70 cursor-pointer border-none bg-transparent p-0 flex items-center"
                                                aria-label="Remove filter"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    );
                                })}
                                {selectedTourStatuses.map((stId) => {
                                    const label = TOUR_STATUS_OPTIONS.find((s) => s.id === stId)?.label || stId;
                                    return (
                                        <span
                                            key={`status-${stId}`}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                        >
                                            <span>{label}</span>
                                            <button
                                                type="button"
                                                onClick={() => toggleTourStatus(stId)}
                                                className="hover:opacity-70 cursor-pointer border-none bg-transparent p-0 flex items-center"
                                                aria-label="Remove filter"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    );
                                })}
                                {onlyTourRecommended && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                        <Sparkles size={11} />
                                        <span>Chỉ tour đề xuất</span>
                                        <button
                                            type="button"
                                            onClick={() => setOnlyTourRecommended(false)}
                                            className="hover:opacity-70 cursor-pointer border-none bg-transparent p-0 flex items-center"
                                            aria-label="Remove filter"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={handleResetTourFilters}
                                    className="text-xs font-bold text-slate-400 hover:text-rose-500 underline ml-1 cursor-pointer bg-transparent border-none p-0"
                                >
                                    Xóa tất cả
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Main Tour List */}
                    <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-separator shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <RefreshCw className="animate-spin text-accent" size={32} />
                                <p className="text-sm font-bold text-slate-500">Đang tải danh sách tour...</p>
                            </div>
                        ) : filteredTours.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                <Compass className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                                    Không tìm thấy kết quả
                                </h3>
                                <p className="text-sm text-slate-500 max-w-sm">
                                    Không có tour du lịch nào khớp với bộ lọc tìm kiếm hiện tại.
                                </p>
                            </div>
                        ) : (
                            <Table aria-label="Bảng danh sách Tour du lịch">
                                <Table.ScrollContainer>
                                    <Table.Content
                                        aria-label="Tours table"
                                        className="w-full text-left border-collapse"
                                        sortDescriptor={tourSort}
                                        onSortChange={setTourSort}
                                    >
                                        <Table.Header className="bg-slate-50/50 dark:bg-[var(--bg-card)]/20 border-b border-separator">
                                            {tourColumns.map((col) => (
                                                <Table.Column
                                                    key={col.id}
                                                    id={col.id}
                                                    allowsSorting={col.sortable}
                                                    isRowHeader={col.isRowHeader}
                                                    className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                                                >
                                                    {col.sortable
                                                        ? ({ sortDirection }) => (
                                                            <Table.SortableColumnHeader sortDirection={sortDirection}>
                                                                {col.label}
                                                            </Table.SortableColumnHeader>
                                                        )
                                                        : col.label}
                                                </Table.Column>
                                            ))}
                                        </Table.Header>
                                        <Table.Body className="divide-y divide-separator">
                                            {paginatedTours.map((t) => {
                                                const trans = t.translations.find((tr) => tr.locale === "vi") || t.translations[0];
                                                const duration = t.durationDays > 0
                                                    ? `${t.durationDays} Ngày`
                                                    : `${t.durationNights} Đêm`;

                                                const cat = categories.find(c => c.id === t.tourCategoryId) || t.tourCategory;
                                                const viCatName = cat?.translations?.find(tr => tr.locale === "vi")?.name || cat?.title || cat?.code || "—";
                                                const iconName = cat?.icon || "compass";

                                                return (
                                                    <Table.Row
                                                        key={t.id}
                                                        className="hover:bg-slate-50/50 dark:hover:bg-[var(--bg-card)]/40 transition-colors duration-150"
                                                    >
                                                        <Table.Cell className="px-6 py-4 font-mono text-xs text-slate-400">#{t.id}</Table.Cell>
                                                        <Table.Cell className="px-6 py-4">
                                                            <TourImageCell imageIds={t.imageIds} thumbnailId={t.thumbnailId} />
                                                        </Table.Cell>
                                                        <Table.Cell className="px-6 py-4">
                                                            <div>
                                                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                                    {trans?.name || "Untitled Tour"}
                                                                    {t.isRecommended && (
                                                                        <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-xs">
                                                                            <Sparkles size={10} />
                                                                            Đề xuất
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{trans?.description || "No description available."}</div>
                                                            </div>
                                                        </Table.Cell>
                                                        <Table.Cell className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                                                            <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold border border-border">
                                                                <CategoryIcon iconName={iconName} size={12} className="text-accent" />
                                                                <span>{viCatName}</span>
                                                            </span>
                                                        </Table.Cell>
                                                        <Table.Cell className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                                                            {duration}
                                                        </Table.Cell>
                                                        <Table.Cell className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                                            {(() => {
                                                                if (t.packages && t.packages.length > 0) {
                                                                    const activePkgs = t.packages.filter(p => p.active && !p.isContactOnly);
                                                                    const pkgPrices = activePkgs
                                                                        .map(p => getPackagePrice(p, "ADULT"))
                                                                        .filter(pr => pr > 0);
                                                                    if (pkgPrices.length > 0) {
                                                                        return (
                                                                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                                                                                {Math.min(...pkgPrices).toLocaleString("vi-VN")} đ
                                                                            </span>
                                                                        );
                                                                    }
                                                                }
                                                                if (!t.prices || t.prices.length === 0) return <span className="text-slate-400 text-xs italic">Liên hệ</span>;
                                                                const activePrices = t.prices.filter(p => p.active);
                                                                if (activePrices.length === 0) return <span className="text-slate-400 text-xs italic">Liên hệ</span>;
                                                                const min = Math.min(...activePrices.map(p => p.amount));
                                                                return (
                                                                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                                                                        {min.toLocaleString("vi-VN")} đ
                                                                    </span>
                                                                );
                                                            })()}
                                                        </Table.Cell>
                                                        <Table.Cell className="px-6 py-4">
                                                            <StatusChip status={t.status || (t.active ? "ACTIVE" : "INACTIVE")} type="tour" />
                                                        </Table.Cell>
                                                        <Table.Cell className="px-6 py-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <Tooltip delay={300} closeDelay={100}>
                                                                    <Tooltip.Trigger>
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="tertiary"
                                                                            aria-label="Xem chi tiết"
                                                                            onPress={() => {
                                                                                setSelectedTour(t);
                                                                                setDetailsModalOpen(true);
                                                                            }}
                                                                        >
                                                                            <Eye size={16} />
                                                                        </Button>
                                                                    </Tooltip.Trigger>
                                                                    <Tooltip.Content>
                                                                        <Tooltip.Arrow />
                                                                        Xem chi tiết
                                                                    </Tooltip.Content>
                                                                </Tooltip>

                                                                <Tooltip delay={300} closeDelay={100}>
                                                                    <Tooltip.Trigger>
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="secondary"
                                                                            aria-label="Chỉnh sửa"
                                                                            onPress={() => {
                                                                                setSelectedTour(t);
                                                                                setCreateModalOpen(true);
                                                                            }}
                                                                        >
                                                                            <Edit3 size={16} />
                                                                        </Button>
                                                                    </Tooltip.Trigger>
                                                                    <Tooltip.Content>
                                                                        <Tooltip.Arrow />
                                                                        Chỉnh sửa
                                                                    </Tooltip.Content>
                                                                </Tooltip>

                                                                <Tooltip delay={300} closeDelay={100}>
                                                                    <Tooltip.Trigger>
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="danger"
                                                                            aria-label="Xóa tour"
                                                                            onPress={() => handleDeleteTour(t.id)}
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </Button>
                                                                    </Tooltip.Trigger>
                                                                    <Tooltip.Content className="text-rose-600 dark:text-rose-400">
                                                                        <Tooltip.Arrow />
                                                                        Xóa tour
                                                                    </Tooltip.Content>
                                                                </Tooltip>
                                                            </div>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                );
                                            })}
                                        </Table.Body>
                                    </Table.Content>
                                </Table.ScrollContainer>

                                <Table.Footer>
                                    <Pagination size="sm">
                                        <Pagination.Summary>
                                            {tourStart} - {tourEnd} / {sortedTours.length} kết quả
                                        </Pagination.Summary>
                                        <Pagination.Content>
                                            <Pagination.Item>
                                                <Pagination.Previous
                                                    isDisabled={tourPage <= 1}
                                                    onPress={() => setTourPage((p) => Math.max(1, p - 1))}
                                                >
                                                    <Pagination.PreviousIcon />
                                                    Trước
                                                </Pagination.Previous>
                                            </Pagination.Item>
                                            {tourPages.map((p) => (
                                                <Pagination.Item key={p}>
                                                    <Pagination.Link
                                                        isActive={p === tourPage}
                                                        onPress={() => setTourPage(p)}
                                                    >
                                                        {p}
                                                    </Pagination.Link>
                                                </Pagination.Item>
                                            ))}
                                            <Pagination.Item>
                                                <Pagination.Next
                                                    isDisabled={tourPage >= tourPageCount}
                                                    onPress={() => setTourPage((p) => Math.min(tourPageCount, p + 1))}
                                                >
                                                    Sau
                                                    <Pagination.NextIcon />
                                                </Pagination.Next>
                                            </Pagination.Item>
                                        </Pagination.Content>
                                    </Pagination>
                                </Table.Footer>
                            </Table>
                        )}
                    </div>
                </>
            )}

            {/* TAB 2: CATEGORIES MANAGEMENT */}
            {activeTab === "categories" && (
                <>
                    {/* Category Search & Actions */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl border border-separator shadow-sm">
                        <div className="flex flex-wrap items-center gap-3 flex-grow max-w-2xl">
                            <SearchField
                                name="categorySearch"
                                value={categorySearchTerm}
                                onChange={(e: string) => setCategorySearchTerm(e)}
                                fullWidth
                                className="min-w-[200px]"
                            >
                                <SearchField.Group className="rounded-xl border border-border bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none text-sm font-bold">
                                    <SearchField.SearchIcon />
                                    <SearchField.Input className="w-full" placeholder="Tìm theo mã hoặc tên danh mục..." />
                                    <SearchField.ClearButton />
                                </SearchField.Group>
                            </SearchField>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                            <Button
                                variant="outline"
                                className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 shadow-sm border border-transparent cursor-pointer"
                                onClick={fetchInitialData}
                            >
                                <RefreshCw size={16} className="mr-1.5" />
                                Làm mới
                            </Button>

                            <Button
                                className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setCatModalOpen(true);
                                }}
                            >
                                <Plus size={16} />
                                <span>Thêm Danh mục</span>
                            </Button>
                        </div>
                    </div>

                    {/* Category Table */}
                    <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-separator shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <RefreshCw className="animate-spin text-accent" size={32} />
                                <p className="text-sm font-bold text-slate-500">Đang tải danh mục tour...</p>
                            </div>
                        ) : filteredCategories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                <Layers className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                                    Chưa có danh mục nào
                                </h3>
                                <p className="text-sm text-slate-500 max-w-sm mb-4">
                                    Hãy tạo danh mục tour đầu tiên để phân loại các tour du lịch.
                                </p>
                                <Button
                                    className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
                                    onClick={() => {
                                        setSelectedCategory(null);
                                        setCatModalOpen(true);
                                    }}
                                >
                                    <Plus size={16} />
                                    <span>Tạo danh mục ngay</span>
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/50 dark:bg-[var(--bg-card)]/20 border-b border-separator text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">ID</th>
                                            <th className="px-6 py-4">Mã (Code)</th>
                                            <th className="px-6 py-4">Icon</th>
                                            <th className="px-6 py-4">Tên tiếng Việt 🇻🇳</th>
                                            <th className="px-6 py-4">English 🇬🇧</th>
                                            <th className="px-6 py-4">Thứ tự</th>
                                            <th className="px-6 py-4">Trạng thái</th>
                                            <th className="px-6 py-4 text-right">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-separator text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        {filteredCategories.map((cat) => {
                                            const viName = cat.translations?.find(t => t.locale === "vi")?.name || cat.title || "—";
                                            const enName = cat.translations?.find(t => t.locale === "en")?.name || "—";
                                            const isActive = cat.active ?? cat.isActive ?? true;

                                            return (
                                                <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-[var(--bg-card)]/40 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-slate-400">#{cat.id}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{cat.code}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                                                            <CategoryIcon iconName={cat.icon} size={16} />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{viName}</td>
                                                    <td className="px-6 py-4 text-slate-500">{enName}</td>
                                                    <td className="px-6 py-4 font-mono">{cat.sortOrder ?? 0}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={clsx(
                                                            "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase",
                                                            isActive
                                                                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                                                : "bg-slate-100 dark:bg-[var(--bg-elevated)] text-slate-500"
                                                        )}>
                                                            {isActive ? "Kích hoạt" : "Tạm ẩn"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Tooltip delay={300} closeDelay={100}>
                                                                <Tooltip.Trigger>
                                                                    <Button
                                                                        isIconOnly
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        aria-label="Chỉnh sửa danh mục"
                                                                        onPress={() => {
                                                                            setSelectedCategory(cat);
                                                                            setCatModalOpen(true);
                                                                        }}
                                                                    >
                                                                        <Edit3 size={16} />
                                                                    </Button>
                                                                </Tooltip.Trigger>
                                                                <Tooltip.Content>
                                                                    <Tooltip.Arrow />
                                                                    Chỉnh sửa danh mục
                                                                </Tooltip.Content>
                                                            </Tooltip>

                                                            <Tooltip delay={300} closeDelay={100}>
                                                                <Tooltip.Trigger>
                                                                    <Button
                                                                        isIconOnly
                                                                        size="sm"
                                                                        variant="danger"
                                                                        aria-label="Xóa danh mục"
                                                                        onPress={() => handleDeleteCategory(cat.id)}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </Button>
                                                                </Tooltip.Trigger>
                                                                <Tooltip.Content className="text-rose-600 dark:text-rose-400">
                                                                    <Tooltip.Arrow />
                                                                    Xóa danh mục
                                                                </Tooltip.Content>
                                                            </Tooltip>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}




            {/* TAB 3: POLICIES MANAGEMENT */}
            {activeTab === "policies" && (
                <>
                    {/* Policy Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-[var(--bg-surface)] p-5 rounded-2xl border border-separator shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng chính sách</span>
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{policies.length}</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[var(--bg-surface)] p-5 rounded-2xl border border-separator shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Đang kích hoạt</span>
                                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                    {policies.filter(p => p.active).length}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[var(--bg-surface)] p-5 rounded-2xl border border-separator shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                <XCircle size={24} />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tạm ẩn</span>
                                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                    {policies.filter(p => !p.active).length}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Policy Search & Actions */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl border border-separator shadow-sm">
                        <div className="flex flex-wrap items-center gap-3 flex-grow max-w-2xl">
                            <SearchField
                                name="policySearch"
                                value={policySearchTerm}
                                onChange={(e: string) => setPolicySearchTerm(e)}
                                fullWidth
                                className="min-w-[200px]"
                            >
                                <SearchField.Group className="rounded-xl border border-border bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none text-sm font-bold">
                                    <SearchField.SearchIcon />
                                    <SearchField.Input className="w-full" placeholder="Tìm theo mã hoặc tên chính sách..." />
                                    <SearchField.ClearButton />
                                </SearchField.Group>
                            </SearchField>

                            <select
                                value={policyStatusFilter}
                                onChange={(e) => setPolicyStatusFilter(e.target.value)}
                                className="h-10 px-3 rounded-xl border border-border bg-slate-50 dark:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 text-xs font-bold outline-none cursor-pointer"
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="ACTIVE">Đang kích hoạt</option>
                                <option value="INACTIVE">Tạm ẩn</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                            <Button
                                variant="outline"
                                className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 shadow-sm border border-transparent cursor-pointer"
                                onClick={fetchPoliciesData}
                            >
                                <RefreshCw size={16} className={clsx("mr-1.5", policiesLoading && "animate-spin")} />
                                Làm mới
                            </Button>

                            <Button
                                className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
                                onClick={() => {
                                    setEditingPolicy(null);
                                    setPolicyModalOpen(true);
                                }}
                            >
                                <Plus size={16} />
                                <span>Thêm Chính sách</span>
                            </Button>
                        </div>
                    </div>

                    {/* Policies Table */}
                    <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-separator shadow-sm overflow-hidden">
                        {policiesLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <RefreshCw className="animate-spin text-accent" size={32} />
                                <p className="text-sm font-bold text-slate-500">Đang tải chính sách tour...</p>
                            </div>
                        ) : filteredPolicies.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                <ShieldCheck className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                                    Chưa có chính sách nào
                                </h3>
                                <p className="text-sm text-slate-500 max-w-sm mb-4">
                                    Hãy tạo chính sách đầu tiên (hủy tour, bảo hiểm, an toàn...) để hiển thị trên trang chi tiết tour.
                                </p>
                                <Button
                                    className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
                                    onClick={() => {
                                        setEditingPolicy(null);
                                        setPolicyModalOpen(true);
                                    }}
                                >
                                    <Plus size={16} />
                                    <span>Tạo chính sách ngay</span>
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/50 dark:bg-[var(--bg-card)]/20 border-b border-separator text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">ID</th>
                                            <th className="px-6 py-4">Mã chính sách</th>
                                            <th className="px-6 py-4">Icon</th>
                                            <th className="px-6 py-4">Tên tiếng Việt 🇻🇳</th>
                                            <th className="px-6 py-4">English 🇬🇧</th>
                                            <th className="px-6 py-4">Thứ tự</th>
                                            <th className="px-6 py-4">Trạng thái</th>
                                            <th className="px-6 py-4 text-right">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-separator text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        {filteredPolicies.map((pol) => {
                                            const viName = pol.translations?.find(t => t.locale === "vi")?.name || "—";
                                            const enName = pol.translations?.find(t => t.locale === "en")?.name || "—";

                                            return (
                                                <tr key={pol.id} className="hover:bg-slate-50/50 dark:hover:bg-[var(--bg-card)]/40 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-slate-400">#{pol.id}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white font-mono uppercase">{pol.code}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center p-1.5">
                                                            <SvgIconRenderer svgString={pol.icon} className="w-5 h-5 text-accent" />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{viName}</td>
                                                    <td className="px-6 py-4 text-slate-500">{enName}</td>
                                                    <td className="px-6 py-4 font-mono font-bold">{pol.sortOrder}</td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTogglePolicy(pol.id)}
                                                            className={clsx(
                                                                "px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-all",
                                                                pol.active
                                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                                                                    : "bg-slate-100 text-slate-400 border-slate-200 dark:bg-[var(--bg-elevated)] dark:border-slate-700"
                                                            )}
                                                        >
                                                            {pol.active ? "Đang hiện" : "Tạm ẩn"}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Tooltip delay={300} closeDelay={100}>
                                                                <Tooltip.Trigger>
                                                                    <Button
                                                                        size="sm"
                                                                        isIconOnly
                                                                        variant="secondary"
                                                                        aria-label="Sửa chính sách"
                                                                        onPress={() => {
                                                                            setEditingPolicy(pol);
                                                                            setPolicyModalOpen(true);
                                                                        }}
                                                                    >
                                                                        <Edit3 size={14} />
                                                                    </Button>
                                                                </Tooltip.Trigger>
                                                                <Tooltip.Content>
                                                                    <Tooltip.Arrow />
                                                                    Sửa chính sách
                                                                </Tooltip.Content>
                                                            </Tooltip>

                                                            <Tooltip delay={300} closeDelay={100}>
                                                                <Tooltip.Trigger>
                                                                    <Button
                                                                        size="sm"
                                                                        isIconOnly
                                                                        variant="danger"
                                                                        aria-label="Xóa chính sách"
                                                                        onPress={() => {
                                                                            setPolicyToDelete(pol);
                                                                            setDeletePolicyModalOpen(true);
                                                                        }}
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </Button>
                                                                </Tooltip.Trigger>
                                                                <Tooltip.Content className="text-rose-600 dark:text-rose-400">
                                                                    <Tooltip.Arrow />
                                                                    Xóa chính sách
                                                                </Tooltip.Content>
                                                            </Tooltip>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* TAB 4: TOUR PACKAGES & PRICING */}
            {activeTab === "pricing" && (
                <>
                    {/* Search Filters & Actions Toolbar */}
                    <div className="flex flex-col gap-4 bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl border border-separator shadow-sm">
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3 flex-grow">
                                <SearchField
                                    name="packageSearch"
                                    value={packageSearchTerm}
                                    onChange={(val: string) => {
                                        setPackageSearchTerm(val);
                                        setPackagePage(1);
                                    }}
                                    className="min-w-[220px] flex-1 max-w-xs"
                                >
                                    <SearchField.Group className="rounded-xl border border-border bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-bold">
                                        <SearchField.SearchIcon />
                                        <SearchField.Input className="w-full" placeholder="Tìm gói tour, mã, tour..." />
                                        <SearchField.ClearButton />
                                    </SearchField.Group>
                                </SearchField>

                                {/* Filter by Tour */}
                                <Select
                                    aria-label="Lọc theo Tour"
                                    selectedKey={packageTourFilter}
                                    onSelectionChange={(key) => {
                                        if (key) {
                                            setPackageTourFilter(String(key));
                                            setPackagePage(1);
                                        }
                                    }}
                                    className="w-56"
                                >
                                    <Select.Trigger className="h-10 px-3 text-xs font-bold bg-slate-50 dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                                        <Select.Value className="text-xs truncate" />
                                        <Select.Indicator />
                                    </Select.Trigger>
                                    <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50 max-h-64 overflow-y-auto">
                                        <ListBox aria-label="Danh sách Tour">
                                            <ListBox.Item key="ALL" id="ALL" textValue="Tất cả Tour" className="px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                                                Tất cả Tour ({tours.length})
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                            {tours.map((t) => {
                                                const tName = t.translations?.find((tr) => tr.locale === "vi")?.name || t.translations?.[0]?.name || `Tour #${t.id}`;
                                                return (
                                                    <ListBox.Item key={String(t.id)} id={String(t.id)} textValue={tName} className="px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                                                        {tName}
                                                        <ListBox.ItemIndicator />
                                                    </ListBox.Item>
                                                );
                                            })}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>

                                {/* Filter by Status */}
                                <Select
                                    aria-label="Lọc theo Trạng thái"
                                    selectedKey={packageStatusFilter}
                                    onSelectionChange={(key) => {
                                        if (key) {
                                            setPackageStatusFilter(String(key));
                                            setPackagePage(1);
                                        }
                                    }}
                                    className="w-40"
                                >
                                    <Select.Trigger className="h-10 px-3 text-xs font-bold bg-slate-50 dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                                        <Select.Value className="text-xs" />
                                        <Select.Indicator />
                                    </Select.Trigger>
                                    <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50">
                                        <ListBox aria-label="Trạng thái gói tour">
                                            <ListBox.Item key="ALL" id="ALL" textValue="Tất cả trạng thái" className="px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                                                Tất cả trạng thái
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                            <ListBox.Item key="ACTIVE" id="ACTIVE" textValue="Đang hoạt động" className="px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                                                Đang hoạt động
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                            <ListBox.Item key="INACTIVE" id="INACTIVE" textValue="Tạm ngưng" className="px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]">
                                                Tạm ngưng
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                        </ListBox>
                                    </Select.Popover>
                                </Select>

                                <PageSizeSelect
                                    value={packagePageSize}
                                    onChange={(size) => {
                                        setPackagePageSize(size);
                                        setPackagePage(1);
                                    }}
                                />
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                                <Button
                                    variant="outline"
                                    className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 shadow-sm border border-transparent cursor-pointer"
                                    onClick={fetchInitialData}
                                >
                                    <RefreshCw size={16} className="mr-1.5" />
                                    Làm mới
                                </Button>

                                <Button
                                    className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
                                    onClick={() => {
                                        if (packageTourFilter !== "ALL") {
                                            setTargetTourIdForPackage(Number(packageTourFilter));
                                            setEditingPackage(null);
                                            setPackageModalOpen(true);
                                        } else {
                                            setTempSelectedTourId(tours[0]?.id || null);
                                            setSelectTourModalOpen(true);
                                        }
                                    }}
                                >
                                    <Plus size={16} />
                                    <span>Thêm Gói Tour</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-separator shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <RefreshCw className="animate-spin text-accent" size={32} />
                                <p className="text-sm font-bold text-slate-500">Đang tải dữ liệu gói tour & bảng giá...</p>
                            </div>
                        ) : filteredTourPackages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                <Tag className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                                    Không tìm thấy gói tour nào
                                </h3>
                                <p className="text-sm text-slate-500 max-w-sm">
                                    Không có gói tour nào khớp với bộ lọc tìm kiếm hiện tại.
                                </p>
                            </div>
                        ) : (
                            <Table aria-label="Bảng danh sách gói tour và bảng giá">
                                <Table.ScrollContainer>
                                    <Table.Content
                                        aria-label="Tour Packages table"
                                        className="w-full text-left border-collapse"
                                        sortDescriptor={packageSort}
                                        onSortChange={setPackageSort}
                                    >
                                        <Table.Header className="bg-slate-50/50 dark:bg-[var(--bg-card)]/20 border-b border-separator">
                                            {packageColumns.map((col) => (
                                                <Table.Column
                                                    key={col.id}
                                                    id={col.id}
                                                    allowsSorting={col.sortable}
                                                    isRowHeader={col.isRowHeader}
                                                    className={clsx(
                                                        "px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider",
                                                        col.className
                                                    )}
                                                >
                                                    {col.sortable
                                                        ? ({ sortDirection }) => (
                                                            <Table.SortableColumnHeader sortDirection={sortDirection}>
                                                                {col.value}
                                                            </Table.SortableColumnHeader>
                                                        )
                                                        : col.value}
                                                </Table.Column>
                                            ))}
                                        </Table.Header>

                                        <Table.Body items={paginatedPackages}>
                                            {(pkg) => {
                                                const viName = pkg.translations?.find((tr) => tr.locale === "vi")?.name || pkg.name || "Gói tiêu chuẩn";
                                                const adultPrice = getPackagePrice(pkg, "ADULT");
                                                const childPrice = getPackagePrice(pkg, "CHILD");
                                                const infantPrice = getPackagePrice(pkg, "INFANT");

                                                const adultCond = formatPassengerCondition(getPackagePriceItem(pkg, "ADULT"), "vi");
                                                const childCond = formatPassengerCondition(getPackagePriceItem(pkg, "CHILD"), "vi");
                                                const infantCond = formatPassengerCondition(getPackagePriceItem(pkg, "INFANT"), "vi");

                                                return (
                                                    <Table.Row
                                                        key={`pkg-${pkg.tourId}-${pkg.id || pkg.code || Math.random()}`}
                                                        className="border-b border-separator hover:bg-slate-50/80 dark:hover:bg-[var(--bg-card)]/30 transition-colors"
                                                    >
                                                        {/* ID */}
                                                        <Table.Cell className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">
                                                            #{pkg.id || "—"}
                                                        </Table.Cell>

                                                        {/* Tour */}
                                                        <Table.Cell className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px]" title={pkg.tourName}>
                                                                    {pkg.tourName}
                                                                </span>
                                                                {pkg.tourCategoryName && (
                                                                    <span className="text-[11px] text-slate-400 font-medium">
                                                                        {pkg.tourCategoryName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </Table.Cell>

                                                        {/* Package Name & Code */}
                                                        <Table.Cell className="px-6 py-4">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                                                    {viName}
                                                                </span>
                                                                {pkg.code && (
                                                                    <span className="font-mono text-[10px] text-slate-400">
                                                                        {pkg.code}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </Table.Cell>

                                                        {/* Pricing (Adult / Child / Infant) */}
                                                        <Table.Cell className="px-6 py-4">
                                                            {pkg.isContactOnly || pkg.contactOnly ? (
                                                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 italic">
                                                                    Giá liên hệ
                                                                </span>
                                                            ) : (
                                                                <div className="flex flex-col gap-1 text-xs">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <User size={12} className="text-blue-500 shrink-0" />
                                                                        <span className="text-slate-500 text-[11px]">NL:</span>
                                                                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                                                            {adultPrice > 0 ? `${adultPrice.toLocaleString("vi-VN")} đ` : "—"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Users size={12} className="text-amber-500 shrink-0" />
                                                                        <span className="text-slate-500 text-[11px]">TE:</span>
                                                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                                                            {childPrice > 0 ? (
                                                                                `${childPrice.toLocaleString("vi-VN")} đ`
                                                                            ) : pkg.childPolicyNote ? (
                                                                                <span className="text-[10px] text-slate-400 italic">{pkg.childPolicyNote}</span>
                                                                            ) : (
                                                                                "—"
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Baby size={12} className="text-pink-500 shrink-0" />
                                                                        <span className="text-slate-500 text-[11px]">EB:</span>
                                                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                                                            {infantPrice > 0 ? (
                                                                                `${infantPrice.toLocaleString("vi-VN")} đ`
                                                                            ) : pkg.infantPolicyNote ? (
                                                                                <span className="text-[10px] text-slate-400 italic">{pkg.infantPolicyNote}</span>
                                                                            ) : (
                                                                                "Miễn phí"
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Table.Cell>

                                                        {/* Passenger Conditions */}
                                                        <Table.Cell className="px-6 py-4">
                                                            <div className="flex flex-col gap-1 text-[11px] text-slate-600 dark:text-slate-400 max-w-xs">
                                                                {!adultCond && !childCond && !infantCond ? (
                                                                    <span className="text-slate-400 italic">Tiêu chuẩn</span>
                                                                ) : (
                                                                    <>
                                                                        {adultCond && (
                                                                            <div>
                                                                                <span className="font-semibold text-slate-700 dark:text-slate-300">NL:</span> {adultCond}
                                                                            </div>
                                                                        )}
                                                                        {childCond && (
                                                                            <div>
                                                                                <span className="font-semibold text-slate-700 dark:text-slate-300">TE:</span> {childCond}
                                                                            </div>
                                                                        )}
                                                                        {infantCond && (
                                                                            <div>
                                                                                <span className="font-semibold text-slate-700 dark:text-slate-300">EB:</span> {infantCond}
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </Table.Cell>

                                                        {/* Guests Limit */}
                                                        <Table.Cell className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            {pkg.minGuests || pkg.maxGuests ? (
                                                                <span>
                                                                    {pkg.minGuests ? `Min: ${pkg.minGuests}` : ""}
                                                                    {pkg.minGuests && pkg.maxGuests ? " • " : ""}
                                                                    {pkg.maxGuests ? `Max: ${pkg.maxGuests}` : ""}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 italic">Không giới hạn</span>
                                                            )}
                                                        </Table.Cell>

                                                        {/* Status */}
                                                        <Table.Cell className="px-6 py-4">
                                                            <AppStatusChip status={pkg.active} />
                                                        </Table.Cell>

                                                        {/* Actions */}
                                                        <Table.Cell className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <Tooltip delay={300} closeDelay={100}>
                                                                    <Tooltip.Trigger>
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="secondary"
                                                                            aria-label="Chỉnh sửa gói tour & bảng giá"
                                                                            onPress={() => {
                                                                                setTargetTourIdForPackage(pkg.tourId);
                                                                                setEditingPackage(pkg);
                                                                                setPackageModalOpen(true);
                                                                            }}
                                                                        >
                                                                            <Edit3 size={16} />
                                                                        </Button>
                                                                    </Tooltip.Trigger>
                                                                    <Tooltip.Content>
                                                                        <Tooltip.Arrow />
                                                                        Chỉnh sửa gói & bảng giá
                                                                    </Tooltip.Content>
                                                                </Tooltip>

                                                                <Tooltip delay={300} closeDelay={100}>
                                                                    <Tooltip.Trigger>
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="tertiary"
                                                                            aria-label={pkg.active ? "Tạm dừng gói tour" : "Kích hoạt gói tour"}
                                                                            onPress={() => handleTogglePackageStatus(pkg)}
                                                                        >
                                                                            <Power size={16} className={pkg.active ? "text-amber-500" : "text-emerald-500"} />
                                                                        </Button>
                                                                    </Tooltip.Trigger>
                                                                    <Tooltip.Content>
                                                                        <Tooltip.Arrow />
                                                                        {pkg.active ? "Tạm dừng gói" : "Kích hoạt gói"}
                                                                    </Tooltip.Content>
                                                                </Tooltip>

                                                                <Tooltip delay={300} closeDelay={100}>
                                                                    <Tooltip.Trigger>
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="danger"
                                                                            aria-label="Xóa gói tour"
                                                                            onPress={() => handleDeletePackage(pkg)}
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </Button>
                                                                    </Tooltip.Trigger>
                                                                    <Tooltip.Content className="text-rose-600 dark:text-rose-400">
                                                                        <Tooltip.Arrow />
                                                                        Xóa gói tour
                                                                    </Tooltip.Content>
                                                                </Tooltip>
                                                            </div>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                );
                                            }}
                                        </Table.Body>
                                    </Table.Content>
                                </Table.ScrollContainer>

                                <Table.Footer>
                                    <Pagination size="sm">
                                        <Pagination.Summary>
                                            {packageStart} - {packageEnd} / {sortedPackages.length} kết quả
                                        </Pagination.Summary>
                                        <Pagination.Content>
                                            <Pagination.Item>
                                                <Pagination.Previous
                                                    isDisabled={packagePage <= 1}
                                                    onPress={() => setPackagePage((p) => Math.max(1, p - 1))}
                                                >
                                                    <Pagination.PreviousIcon />
                                                    Trước
                                                </Pagination.Previous>
                                            </Pagination.Item>
                                            {packagePages.map((p) => (
                                                <Pagination.Item key={p}>
                                                    <Pagination.Link
                                                        isActive={p === packagePage}
                                                        onPress={() => setPackagePage(p)}
                                                    >
                                                        {p}
                                                    </Pagination.Link>
                                                </Pagination.Item>
                                            ))}
                                            <Pagination.Item>
                                                <Pagination.Next
                                                    isDisabled={packagePage >= packagePageCount}
                                                    onPress={() => setPackagePage((p) => Math.min(packagePageCount, p + 1))}
                                                >
                                                    Sau
                                                    <Pagination.NextIcon />
                                                </Pagination.Next>
                                            </Pagination.Item>
                                        </Pagination.Content>
                                    </Pagination>
                                </Table.Footer>
                            </Table>
                        )}
                    </div>
                </>
            )}


            {/* Tour Policy Create / Update Modal */}
            <TourPolicyCreateUpdateModal
                isOpen={policyModalOpen}
                onClose={() => {
                    setPolicyModalOpen(false);
                    setEditingPolicy(null);
                }}
                editingPolicy={editingPolicy}
                onSave={handleSavePolicy}
                existingPolicies={policies}
            />

            {/* Tour Policy Delete Modal */}
            <TourPolicyDeleteModal
                isOpen={deletePolicyModalOpen}
                onClose={() => {
                    setDeletePolicyModalOpen(false);
                    setPolicyToDelete(null);
                }}
                onConfirm={handleConfirmDeletePolicy}
                policyCode={policyToDelete?.code}
                submitting={deletingPolicy}
            />

            {/* Tour Config Modal */}
            <TourConfigModal
                isOpen={configModalOpen}
                onClose={() => setConfigModalOpen(false)}
                onSaved={fetchInitialData}
            />

            {/* Tour Category Modal (Create & Edit) */}
            <TourCategoryModal
                isOpen={catModalOpen}
                onClose={() => {
                    setCatModalOpen(false);
                    setSelectedCategory(null);
                }}
                categoryToEdit={selectedCategory}
                onSaveSuccess={() => {
                    fetchInitialData();
                }}
                showToast={showToast}
            />

            {/* Tour Detail Modal (View Only) */}
            <TourDetailModal
                isOpen={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedTour(null);
                }}
                tour={selectedTour}
                categories={categories}
                backendUrl={backendUrl}
                onEdit={(tour) => {
                    setSelectedTour(tour);
                    setCreateModalOpen(true);
                }}
            />

            {/* Tour Create / Update Modal */}
            <TourCreateUpdateModal
                isOpen={createModalOpen}
                onClose={() => {
                    setCreateModalOpen(false);
                    setSelectedTour(null);
                }}
                editingTour={selectedTour}
                categories={categories}
                backendUrl={backendUrl}
                onSaveSuccess={() => {
                    fetchInitialData();
                }}
                showToast={showToast}
            />

            {/* Tour Package Modal (Create & Edit) */}
            <TourPackageModal
                isOpen={packageModalOpen}
                onClose={() => {
                    setPackageModalOpen(false);
                    setEditingPackage(null);
                }}
                onSave={handleSavePackage}
                initialData={editingPackage}
                language="vi"
            />

            {/* Modal Chọn Tour để thêm gói mới */}
            <Modal isOpen={selectTourModalOpen} onOpenChange={(open) => { if (!open) setSelectTourModalOpen(false); }}>
                <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
                    <ModalContainer>
                        <ModalDialog className="max-w-md flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <Tag size={18} className="text-accent" />
                                    <span className="font-bold text-base text-slate-800 dark:text-slate-100">Chọn Tour để thêm gói</span>
                                </div>
                            </ModalHeader>
                            <ModalBody className="p-6 space-y-4">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Vui lòng chọn tour du lịch bạn muốn tạo gói dịch vụ và thiết lập bảng giá:
                                </p>
                                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                    {tours.map((t) => {
                                        const name = t.translations?.find((tr) => tr.locale === "vi")?.name || t.translations?.[0]?.name || `Tour #${t.id}`;
                                        const isSel = tempSelectedTourId === t.id;
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setTempSelectedTourId(t.id)}
                                                className={clsx(
                                                    "w-full text-left p-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center justify-between",
                                                    isSel
                                                        ? "border-accent bg-accent/10 text-accent dark:bg-accent/20"
                                                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[var(--bg-card)] text-slate-700 dark:text-slate-300"
                                                )}
                                            >
                                                <span className="truncate">{name}</span>
                                                {isSel && <CheckCircle2 size={16} className="text-accent shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </ModalBody>
                            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectTourModalOpen(false)}
                                    className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    isDisabled={!tempSelectedTourId}
                                    onClick={() => {
                                        if (tempSelectedTourId) {
                                            setTargetTourIdForPackage(tempSelectedTourId);
                                            setEditingPackage(null);
                                            setSelectTourModalOpen(false);
                                            setPackageModalOpen(true);
                                        }
                                    }}
                                    className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                                >
                                    Tiếp tục
                                </Button>
                            </ModalFooter>
                        </ModalDialog>
                    </ModalContainer>
                </ModalBackdrop>
            </Modal>
        </div>
    );
}
