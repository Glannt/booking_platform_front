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
    Ship,
    Car,
    Award,
    Shield,
    Utensils,
    Anchor,
    Camera,
    Sun,
    Palmtree,
    MapPin,
    Sparkles
} from "lucide-react";
import { Button, Pagination, SearchField, SortDescriptor, Table, toast } from "@heroui/react";
import { StatusChip } from "@/components/StatusChip";

import TourCreateModal from "@/components/admin/tours/TourCreateModal";
import TourDetailsModal from "@/components/admin/tours/TourDetailsModal";
import TourCategoryModal from "@/components/admin/tours/TourCategoryModal";

import {
    getTours,
    getAdminTourCategories,
    deleteTour,
    deleteTourCategory,
    TourDto,
    TourCategoryDto
} from "@/lib/api/tours";
import { backendUrl } from "@/lib/api/client";
import { ColumnInterface } from "@/lib/interface/column.interface";
import { ImageGrid } from "@/components/ImageGallery";
import { resolveImageUrls } from "@/lib/api/media";
import clsx from "clsx";

const PAGE_SIZE = 8;

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
    switch (iconName) {
        case "ship": return <Ship size={size} className={className} />;
        case "car": return <Car size={size} className={className} />;
        case "compass": return <Compass size={size} className={className} />;
        case "palmtree": return <Palmtree size={size} className={className} />;
        case "sun": return <Sun size={size} className={className} />;
        case "anchor": return <Anchor size={size} className={className} />;
        case "camera": return <Camera size={size} className={className} />;
        case "utensils": return <Utensils size={size} className={className} />;
        case "award": return <Award size={size} className={className} />;
        case "shield": return <Shield size={size} className={className} />;
        case "map-pin": return <MapPin size={size} className={className} />;
        case "sparkles": return <Sparkles size={size} className={className} />;
        default: return <Compass size={size} className={className} />;
    }
}

export default function ToursManagementPage() {
    const [activeTab, setActiveTab] = useState<"tours" | "categories">("tours");

    const [categories, setCategories] = useState<TourCategoryDto[]>([]);
    const [tours, setTours] = useState<TourDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [categorySearchTerm, setCategorySearchTerm] = useState<string>("");

    // Tour Modals
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [detailsDefaultEditMode, setDetailsDefaultEditMode] = useState(false);
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

    const fetchInitialData = async () => {
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

    // Filter Tours
    const filteredTours = tours.filter(t => {
        const trans = t.translations.find(tr => tr.locale === "vi") || t.translations[0];
        return trans?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    });

    // Tour Sort
    const [tourSort, setTourSort] = useState<SortDescriptor>(
        { column: "id", direction: "ascending" }
    );

    const tourColumns: ColumnInterface[] = [
        { id: "id", label: "ID", sortable: true, isRowHeader: true },
        { id: "image", label: "Ảnh", sortable: false, isRowHeader: false },
        { id: "name", label: "Tên tour", sortable: false, isRowHeader: false },
        { id: "category", label: "Danh mục", sortable: false, isRowHeader: false },
        { id: "duration", label: "Thời lượng", sortable: true, isRowHeader: false },
        { id: "minPrice", label: "Giá từ", sortable: true, isRowHeader: false },
        { id: "status", label: "Trạng thái", sortable: true, isRowHeader: false },
        { id: "actions", label: "Hành động", sortable: false, isRowHeader: false }
    ];

    const sortedTours = useMemo(() => {
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
                case "minPrice": {
                    const getP = (tour: TourDto) => {
                        if (tour.packages && tour.packages.length > 0) {
                            const act = tour.packages.filter(p => p.active && !p.isContactOnly);
                            const prs = act.map(p => (p.pricingType === "PER_PERSON" ? p.adultPrice : p.fixedPrice) || 0).filter(pr => pr > 0);
                            if (prs.length > 0) return Math.min(...prs);
                        }
                        if (!tour.prices || tour.prices.length === 0) return 0;
                        const ap = tour.prices.filter(p => p.active);
                        if (ap.length === 0) return 0;
                        return Math.min(...ap.map(p => p.amount));
                    };
                    cmp = getP(a) - getP(b);
                    break;
                }
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
    }, [filteredTours, tourSort]);

    // Tour Pagination
    const [tourPage, setTourPage] = useState<number>(1);
    const paginatedTours = useMemo(
        () => sortedTours.slice((tourPage - 1) * PAGE_SIZE, tourPage * PAGE_SIZE),
        [sortedTours, tourPage]
    );
    const tourPageCount = Math.max(1, Math.ceil(sortedTours.length / PAGE_SIZE));
    const tourStart = sortedTours.length === 0 ? 0 : (tourPage - 1) * PAGE_SIZE + 1;
    const tourEnd = Math.min(tourPage * PAGE_SIZE, sortedTours.length);
    const tourPages = Array.from({ length: tourPageCount }, (_, i) => i + 1);

    // Filter Categories
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

    return (
        <div className="w-full space-y-6">
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <button
                    onClick={() => setActiveTab("tours")}
                    className={clsx(
                        "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all border-none cursor-pointer",
                        activeTab === "tours"
                            ? "bg-accent text-white shadow-md"
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
                            ? "bg-accent text-white shadow-md"
                            : "bg-white dark:bg-[var(--bg-surface)] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)]"
                    )}
                >
                    <Layers size={16} />
                    <span>Danh mục Tour ({categories.length})</span>
                </button>
            </div>

            {/* TAB 1: TOURS MANAGEMENT */}
            {activeTab === "tours" && (
                <>
                    {/* Search Filters & Actions */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex flex-wrap items-center gap-3 flex-grow max-w-2xl">
                            <SearchField name="search" value={searchTerm} onChange={(e: string) => setSearchTerm(e)} fullWidth className="min-w-[200px]">
                                <SearchField.Group className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none text-sm font-bold">
                                    <SearchField.SearchIcon />
                                    <SearchField.Input className="w-full" placeholder="Tìm kiếm tour..." />
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
                                className="rounded-xl font-bold bg-accent hover:bg-accent-hover text-white cursor-pointer shadow-md"
                                onClick={() => setCreateModalOpen(true)}
                            >
                                <Plus size={18} className="mr-1" />
                                Thêm Tour
                            </Button>
                        </div>
                    </div>

                    {/* Main Tour List */}
                    <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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
                                        <Table.Header className="bg-slate-50/50 dark:bg-[var(--bg-card)]/20 border-b border-slate-100 dark:border-slate-800">
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
                                        <Table.Body className="divide-y divide-slate-100 dark:divide-slate-800/60">
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
                                                                    {t.isDefault && (
                                                                        <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                                                                            Bán chạy
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{trans?.description || "No description available."}</div>
                                                            </div>
                                                        </Table.Cell>
                                                        <Table.Cell className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                                                            <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-800">
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
                                                                        .map(p => (p.pricingType === "PER_PERSON" ? p.adultPrice : p.fixedPrice) || 0)
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
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedTour(t);
                                                                        setDetailsDefaultEditMode(false);
                                                                        setDetailsModalOpen(true);
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors border-none bg-transparent cursor-pointer"
                                                                    title="Xem chi tiết"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedTour(t);
                                                                        setDetailsDefaultEditMode(true);
                                                                        setDetailsModalOpen(true);
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-primary transition-colors border-none bg-transparent cursor-pointer"
                                                                    title="Chỉnh sửa"
                                                                >
                                                                    <Edit3 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteTour(t.id)}
                                                                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors border-none bg-transparent cursor-pointer"
                                                                    title="Xóa tour"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                );
                                            })}
                                        </Table.Body>
                                    </Table.Content>
                                </Table.ScrollContainer>

                                {tourPageCount > 1 && (
                                    <Table.Footer>
                                        <Pagination size="sm">
                                            <Pagination.Summary>
                                                {tourStart} - {tourEnd} / {sortedTours.length} tour
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
                                )}
                            </Table>
                        )}
                    </div>
                </>
            )}

            {/* TAB 2: CATEGORIES MANAGEMENT */}
            {activeTab === "categories" && (
                <>
                    {/* Category Search & Actions */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex flex-wrap items-center gap-3 flex-grow max-w-2xl">
                            <SearchField
                                name="categorySearch"
                                value={categorySearchTerm}
                                onChange={(e: string) => setCategorySearchTerm(e)}
                                fullWidth
                                className="min-w-[200px]"
                            >
                                <SearchField.Group className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none text-sm font-bold">
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
                                className="rounded-xl font-bold bg-accent hover:bg-accent-hover text-white cursor-pointer shadow-md"
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setCatModalOpen(true);
                                }}
                            >
                                <Plus size={18} className="mr-1" />
                                Thêm Danh mục
                            </Button>
                        </div>
                    </div>

                    {/* Category Table */}
                    <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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
                                    className="bg-accent text-white font-bold rounded-xl cursor-pointer"
                                    onClick={() => {
                                        setSelectedCategory(null);
                                        setCatModalOpen(true);
                                    }}
                                >
                                    <Plus size={16} className="mr-1" />
                                    Tạo danh mục ngay
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/50 dark:bg-[var(--bg-card)]/20 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                                        )}>
                                                            {isActive ? "Kích hoạt" : "Tạm ẩn"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedCategory(cat);
                                                                    setCatModalOpen(true);
                                                                }}
                                                                className="p-1.5 text-slate-400 hover:text-accent transition-colors border-none bg-transparent cursor-pointer"
                                                                title="Chỉnh sửa danh mục"
                                                            >
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteCategory(cat.id)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors border-none bg-transparent cursor-pointer"
                                                                title="Xóa danh mục"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
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

            {/* Tour Create Modal */}
            <TourCreateModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                categories={categories}
                onSaveSuccess={handleSaveSuccess}
                showToast={showToast}
                language="vi"
                backendUrl={backendUrl}
            />

            {/* Tour Details / Edit Modal */}
            {selectedTour && (
                <TourDetailsModal
                    isOpen={detailsModalOpen}
                    onClose={() => setDetailsModalOpen(false)}
                    tour={selectedTour}
                    categories={categories}
                    onSaveSuccess={handleSaveSuccess}
                    showToast={showToast}
                    language="vi"
                    backendUrl={backendUrl}
                    defaultEditMode={detailsDefaultEditMode}
                />
            )}

            {/* Tour Category Modal (Create & Edit) */}
            <TourCategoryModal
                isOpen={catModalOpen}
                onClose={() => setCatModalOpen(false)}
                categoryToEdit={selectedCategory}
                onSaveSuccess={() => {
                    fetchInitialData();
                }}
                showToast={showToast}
            />
        </div>
    );
}
