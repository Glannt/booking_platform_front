"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Search,
    Plus,
    Trash2,
    RefreshCw,
    Compass,
    Eye
} from "lucide-react";
import { Button, Label, Pagination, SearchField, SortDescriptor, Table, toast } from "@heroui/react";
import { StatusChip } from "@/components/StatusChip";

import TourCreateModal from "@/components/admin/tours/TourCreateModal";
import TourDetailsModal from "@/components/admin/tours/TourDetailsModal";

import {
    getTours,
    getTourCategories,
    deleteTour,
    TourDto,
    TourCategoryDto
} from "@/lib/api/tours";
import { backendUrl } from "@/lib/api/client";
import { ColumnInterface } from "@/lib/interface/column.interface";
import { ImageGrid } from "@/components/ImageGallery";
import { resolveImageUrls } from "@/lib/api/media";
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

export default function ToursManagementPage() {

    const [categories, setCategories] = useState<TourCategoryDto[]>([]);
    const [tours, setTours] = useState<TourDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Modal states
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedTour, setSelectedTour] = useState<TourDto | null>(null);

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
                const catRes = await getTourCategories();
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

    const handleSaveSuccess = () => {
        fetchInitialData();
    };

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
        {
            id: "image",
            label: "Ảnh",
            sortable: false,
            isRowHeader: false
        },
        {
            id: "name",
            label: "Tên tour",
            sortable: false,
            isRowHeader: false
        },
        {
            id: "duration",
            label: "Thời gian",
            sortable: true,
            isRowHeader: false
        },
        {
            id: "price",
            label: "Giá gốc nhỏ nhất",
            sortable: true,
            isRowHeader: false
        },
        {
            id: "status",
            label: "Trạng thái",
            sortable: true,
            isRowHeader: false
        },
        { id: "actions", label: "Hành động", sortable: false },
    ];

    const sortedTours = useMemo(() => {
        const { column, direction } = tourSort;
        const dir = direction === "descending" ? -1 : 1;

        return [...filteredTours].sort((a, b) => {
            let cmp = 0;
            switch (column) {
                case "id":
                    cmp = a.id - b.id;
                    break;
                case "duration":
                    cmp = a.durationDays - b.durationDays;
                    break;
                case "price":
                    cmp = (a.prices.find(p => p.active)?.amount || 0) - (b.prices.find(p => p.active)?.amount || 0);
                    break;
                case "status":
                    cmp = (a.active ? 1 : 0) - (b.active ? 1 : 0);
                    break;
                default:
                    return 0;
            }
            return cmp * dir;
        });
    }, [filteredTours, tourSort]);


    // Tour Pagination
    const [tourPage, setTourPage] = useState<number>(1);

    const paginatedTours = useMemo(
        () => sortedTours.slice(
            (tourPage - 1) * PAGE_SIZE,
            tourPage * PAGE_SIZE
        ), [sortedTours, tourPage]
    );
    const tourPageCount =
        Math.max(1, Math.ceil(sortedTours.length / PAGE_SIZE));


    const tourPages = Array.from(
        { length: Math.ceil(sortedTours.length / PAGE_SIZE) },
        (_, i) => i + 1
    );

    const tourStart =
        sortedTours.length === 0
            ? 0
            : (tourPage - 1) * PAGE_SIZE + 1;

    const tourEnd = Math.min(
        tourPage * PAGE_SIZE,
        sortedTours.length
    );

    useEffect(() => {
        if (tourPage > tourPages.length) {
            setTourPage(tourPageCount);
        }
    }, [tourPage, tourPageCount]);

    return (
        <div className="w-full space-y-6">
            {/* Search Filters & Actions */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-black/10 p-6 rounded-2xl border border-yellow-100 dark:border-yellow-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 flex-grow max-w-2xl">
                    <SearchField name="search" value={searchTerm} onChange={(e: string) => setSearchTerm(e)} fullWidth className={`min-w-[200px]`}>
                        <SearchField.Group className={` rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-transparent text-slate-805 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold`}>
                            <SearchField.SearchIcon />
                            <SearchField.Input className="w-full " placeholder="Tìm kiếm tour..." />
                            <SearchField.ClearButton />
                        </SearchField.Group>
                    </SearchField>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    <Button
                        variant="outline"
                        className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm border border-transparent"
                        onClick={fetchInitialData}
                    >
                        <RefreshCw size={16} className="mr-1.5" />
                        Làm mới
                    </Button>

                    <Button
                        className="rounded-xl font-bold"
                        onClick={() => setCreateModalOpen(true)}
                    >
                        <Plus size={18} className="mr-1" />
                        Thêm Tour
                    </Button>
                </div>
            </div>

            {/* Main List */}
            <div className="bg-white dark:bg-black/10 rounded-2xl border-1 border-yellow-100 dark:border-yellow-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <RefreshCw className="animate-spin text-primary" size={32} />
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
                    <div className="overflow-x-auto">
                        <Table aria-label="Bảng quản lý tours" className="w-full text-left">
                            <Table.ScrollContainer>
                                <Table.Content>
                                    <Table.Header className="bg-slate-50 dark:bg-black/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                        {/* <Table.Column isRowHeader className="px-6 py-4">ID</Table.Column>
                    <Table.Column className="px-6 py-4">{language === "vi" ? "Tên Tour" : "Tour Name"}</Table.Column>
                    <Table.Column className="px-6 py-4">{language === "vi" ? "Thời lượng" : "Duration"}</Table.Column>
                    <Table.Column className="px-6 py-4">{language === "vi" ? "Giá gốc nhỏ nhất" : "Min Price"}</Table.Column>
                    <Table.Column className="px-6 py-4">{language === "vi" ? "Trạng thái" : "Status"}</Table.Column>
                    <Table.Column className="px-6 py-4 text-right">{language === "vi" ? "Thao tác" : "Actions"}</Table.Column> */}
                                        {tourColumns.map((col) => (
                                            <Table.Column
                                                key={col.id}
                                                id={col.id}
                                                allowsSorting={col.sortable}
                                                isRowHeader={col.isRowHeader}>
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

                                            return (
                                                <Table.Row
                                                    key={t.id}
                                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors duration-150"
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
                                                            <div className="text-xs text-slate-550 line-clamp-1 mt-0.5">{trans?.description || "No description available."}</div>
                                                        </div>
                                                    </Table.Cell>
                                                    <Table.Cell className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                                                        {duration}
                                                    </Table.Cell>
                                                    <Table.Cell className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                                        {(() => {
                                                            if (!t.prices || t.prices.length === 0) return "N/A";
                                                            const activePrices = t.prices.filter(p => p.active);
                                                            if (activePrices.length === 0) return "N/A";
                                                            const minPrice = Math.min(...activePrices.map(p => p.amount));
                                                            const formatter = new Intl.NumberFormat("vi-VN", {
                                                                style: "currency",
                                                                currency: "VND",
                                                                maximumFractionDigits: 0
                                                            });
                                                            return formatter.format(minPrice);
                                                        })()}
                                                    </Table.Cell>
                                                    <Table.Cell className="px-6 py-4">
                                                        <StatusChip status={String(t.active)} type="active" />
                                                    </Table.Cell>
                                                    <Table.Cell className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                className="p-2 text-slate-650 dark:text-slate-350 hover:text-primary dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                                                onClick={() => {
                                                                    setSelectedTour(t);
                                                                    setDetailsModalOpen(true);
                                                                }}
                                                                title="Xem Chi Tiết"
                                                                aria-label="Xem Chi Tiết"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            <button
                                                                className="p-2 text-slate-650 dark:text-slate-350 hover:text-rose-605 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                                                onClick={() => handleDeleteTour(t.id)}
                                                                title="Xóa"
                                                                aria-label="Xóa"
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
                            <Table.Footer>
                                <Pagination size="sm">
                                    <Pagination.Summary>
                                        {tourStart} to {tourEnd} of {sortedTours.length} results
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
                    </div>
                )}
            </div>

            <TourCreateModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                categories={categories}
                language="vi"
                backendUrl={backendUrl}
                onSaveSuccess={handleSaveSuccess}
                showToast={showToast}
            />

            <TourDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedTour(null);
                }}
                tour={selectedTour}
                categories={categories}
                language="vi"
                backendUrl={backendUrl}
                onSaveSuccess={handleSaveSuccess}
                showToast={showToast}
            />
        </div>
    );
}
