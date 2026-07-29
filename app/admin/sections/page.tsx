"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Trash2,
  RefreshCw,
  LayoutList,
  Eye,
  EyeOff,
  ArrowUpDown,
  Layers,
} from "lucide-react";
import {
  Button,
  Label,
  Pagination,
  SearchField,
  SortDescriptor,
  Table,
  toast,
  Select,
  ListBox
} from "@heroui/react";
import { StatusChip } from "@/components/StatusChip";
import SectionCreateModal from "@/components/admin/sections/SectionCreateModal";
import SectionDetailsModal from "@/components/admin/sections/SectionDetailsModal";
import {
  getSectionsByPagePath,
  deleteSection,
  SectionDto,
} from "@/lib/api/sections";

const PAGE_SIZE = 8;

const PAGE_PATHS = [
  { value: "/", label: "Trang chủ" },
  { value: "/tours", label: "Tour" },
  { value: "/self-drive", label: "Thuê xe tự lái" },
  { value: "/airport-transfer", label: "Đưa đón sân bay" },
  { value: "/rent-car", label: "Thuê xe có tài xế" },
];

const SECTION_TYPES = [
  { value: "HERO_BANNER", label: "Hero Banner" },
  { value: "FEATURES", label: "Tính năng" },
  { value: "PROMO", label: "Khuyến mãi" },
  { value: "TESTIMONIALS", label: "Đánh giá" },
  { value: "CTA", label: "Call to Action" },
  { value: "BANNER", label: "Banner" },
];

export default function SectionsManagementPage() {
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPagePath, setFilterPagePath] = useState("/");

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<SectionDto | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.danger(message);
    }
  };

  const fetchSections = async () => {
    setLoading(true);
    try {
      const data = await getSectionsByPagePath(filterPagePath);
      setSections(data);
    } catch (error) {
      console.error("Error loading sections:", error);
      showToast("Không thể tải danh sách sections.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [filterPagePath]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa section này không?")) return;
    try {
      await deleteSection(id);
      showToast("Đã xóa section thành công!", "success");
      setSections((prev) => prev.filter((s) => s.id !== id));
    } catch {
      showToast("Xóa section thất bại.", "error");
    }
  };

  const filtered = sections.filter((s) => {
    const matchSearch =
      !searchTerm ||
      s.sectionName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const [sort, setSort] = useState<SortDescriptor>({
    column: "orderIndex",
    direction: "ascending",
  });

  const columns = [
    { id: "id", label: "ID", sortable: true, isRowHeader: true },
    { id: "sectionType", label: "Loại", sortable: true },
    { id: "sectionName", label: "Tên section", sortable: false },
    { id: "title", label: "Tiêu đề (VI)", sortable: false },
    { id: "orderIndex", label: "Thứ tự", sortable: true },
    { id: "status", label: "Trạng thái", sortable: true },
    { id: "actions", label: "Hành động", sortable: false },
  ];

  const sorted = useMemo(() => {
    const { column, direction } = sort;
    const dir = direction === "descending" ? -1 : 1;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (column) {
        case "id":
          cmp = (a.id || 0) - (b.id || 0);
          break;
        case "orderIndex":
          cmp = a.orderIndex - b.orderIndex;
          break;
        case "status":
          cmp = (a.active ? 1 : 0) - (b.active ? 1 : 0);
          break;
        default:
          return 0;
      }
      return cmp * dir;
    });
  }, [filtered, sort]);

  const [page, setPage] = useState(1);
  const paginated = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page]
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  useEffect(() => {
    if (page > pages.length) setPage(pageCount);
  }, [page, pageCount]);

  const getSectionTypeLabel = (type: string) =>
    SECTION_TYPES.find((t) => t.value === type)?.label || type;

  const getTranslation = (s: SectionDto, locale = "vi") =>
    s.translations.find((t) => t.locale === locale) || s.translations[0];

  return (
    <div className="w-full space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-black/10 p-6 rounded-2xl border border-yellow-100 dark:border-yellow-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-grow max-w-2xl">
          <SearchField
            name="search"
            value={searchTerm}
            onChange={(e: string) => setSearchTerm(e)}
            fullWidth
            className="min-w-[200px]"
          >
            <SearchField.Group className="rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-transparent text-slate-805 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold">
              <SearchField.SearchIcon />
              <SearchField.Input
                className="w-full"
                placeholder="Tìm kiếm section..."
              />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <Select
            selectedKey={filterPagePath}
            onSelectionChange={(key) => {
              setFilterPagePath(key as string);
              setPage(1);
            }}
            className="w-56"
          >
            <Select.Trigger className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[var(--bg-card)] text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center justify-between cursor-pointer min-w-[200px]">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
              <ListBox>
                {PAGE_PATHS.map((p) => (
                  <ListBox.Item key={p.value} id={p.value} textValue={p.label}>
                    {p.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            variant="outline"
            className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 shadow-sm border border-transparent"
            onClick={fetchSections}
          >
            <RefreshCw size={16} className="mr-1.5" />
            Làm mới
          </Button>
          <Button
            className="rounded-xl font-bold bg-[#C9A227] hover:bg-[#B8911F] text-white shadow-sm border border-transparent"
            onClick={() => {
              setSelectedSection(null);
              setCreateModalOpen(true);
            }}
          >
            <Plus size={18} className="mr-1" />
            Thêm Section
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-black/10 rounded-2xl border-1 border-yellow-100 dark:border-yellow-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="animate-spin text-primary" size={32} />
            <p className="text-sm font-bold text-slate-500">
              Đang tải danh sách sections...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Layers className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
              Không tìm thấy section
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Chưa có section nào cho trang này.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Bảng quản lý sections" className="w-full text-left">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header className="bg-slate-50 dark:bg-black/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {columns.map((col) => (
                      <Table.Column
                        key={col.id}
                        id={col.id}
                        allowsSorting={col.sortable}
                        isRowHeader={col.isRowHeader}
                      >
                        {col.sortable
                          ? ({ sortDirection }) => (
                            <Table.SortableColumnHeader
                              sortDirection={sortDirection}
                            >
                              {col.label}
                            </Table.SortableColumnHeader>
                          )
                          : col.label}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {paginated.map((s) => {
                      const viTrans = getTranslation(s, "vi");
                      return (
                        <Table.Row
                          key={s.id}
                          className="cursor-pointer hover:bg-slate-50 dark:hover:bg-[var(--bg-card)]/30"
                        >
                          <Table.Cell className="px-6 py-4 text-sm font-bold text-slate-500">
                            {s.id}
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-[var(--bg-card)] text-slate-600 dark:text-slate-300">
                              {getSectionTypeLabel(s.sectionType)}
                            </span>
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">
                            {s.sectionName}
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                            {viTrans?.title || "—"}
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-sm text-slate-500">
                            <ArrowUpDown size={14} className="inline mr-1 opacity-50" />
                            {s.orderIndex}
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4">
                            <StatusChip
                              status={s.active ? "active" : "inactive"}
                              type="active"
                            />
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                isIconOnly
                                variant="ghost"
                                className="text-slate-500 hover:text-primary"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  setSelectedSection(s);
                                  setDetailsModalOpen(true);
                                }}
                              >
                                <Eye size={16} />
                              </Button>
                              <Button
                                isIconOnly
                                variant="ghost"
                                className="text-slate-400 hover:text-red-500"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  if (s.id) handleDelete(s.id);
                                }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {sorted.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Hiển thị {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, sorted.length)} / {sorted.length}
            </p>
            <Pagination size="sm">
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous isDisabled={page <= 1} onPress={() => setPage(p => Math.max(1, p - 1))}>
                    <Pagination.PreviousIcon />
                  </Pagination.Previous>
                </Pagination.Item>
                {pages.map(p => (
                  <Pagination.Item key={p}>
                    <Pagination.Link isActive={p === page} onPress={() => setPage(p)}>{p}</Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next isDisabled={page >= pageCount} onPress={() => setPage(p => Math.min(pageCount, p + 1))}>
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </div>
        )}
      </div>

      {/* Modals */}
      <SectionCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          fetchSections();
        }}
        pagePath={filterPagePath}
        initialData={selectedSection}
      />
      <SectionDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        section={selectedSection}
        onEdit={() => {
          setDetailsModalOpen(false);
          setCreateModalOpen(true);
        }}
        onRefresh={fetchSections}
      />
    </div>
  );
}
