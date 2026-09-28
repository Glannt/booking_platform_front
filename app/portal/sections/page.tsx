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
  Edit3,
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
  ListBox,
  Tooltip
} from "@heroui/react";
import { StatusChip } from "@/components/StatusChip";
import { SectionCreateModal, SectionDetailModal } from "@/components/admin/sections";
import { useI18n } from "@/context/LanguageContext";
import { useAuthStore } from "@/lib/store/authStore";
import { headerColumns } from "@/config/headerColumns";
import {
  getSectionsByPagePath,
  deleteSection,
  SectionDto,
} from "@/lib/api/sections";
import { PageSizeSelect, TableLoadingState, TableEmptyState } from "@/components/common";

const PAGE_PATHS = [
  { value: "/", label: "Trang chủ" },
  { value: "/tours", label: "Tour" },
  { value: "/self-drive", label: "Thuê xe tự lái" },
  { value: "/airport-transfer", label: "Đưa đón sân bay" },
  { value: "/intercity", label: "Thuê xe có tài xế / Đi tỉnh (Intercity)" },
];

const SECTION_TYPES = [
  { value: "HERO_BANNER", label: "Hero Banner" },
  { value: "FEATURES", label: "Tính năng" },
  { value: "PROMO", label: "Khuyến mãi" },
  { value: "TESTIMONIALS", label: "Đánh giá" },
  { value: "CTA", label: "Call to Action" },
  { value: "BANNER", label: "Banner" },
  { value: "FAQ", label: "FAQ (Câu hỏi thường gặp)" },
];

export default function SectionsManagementPage() {
  const { t } = useI18n();
  const { user: authUser } = useAuthStore();
  const isModerator = authUser?.role === "MODERATOR";
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
      if (selectedSection) {
        const fresh = data.find((s) => s.id === selectedSection.id);
        if (fresh) {
          setSelectedSection(fresh);
        }
      }
      return data;
    } catch (error) {
      console.error("Error loading sections:", error);
      showToast("Không thể tải danh sách sections.", "error");
      return [];
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

  const columns = headerColumns.sections(t);

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

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const paginated = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize]
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-accent/10 text-accent">
              <Layers size={22} />
            </span>
            <span>Quản lý Sections & Banner Trang Chủ</span>
          </h1>
          <p className="text-xs text-foreground/60 mt-1">
            Cấu hình giao diện động, banner tiếp thị và các section sản phẩm cho toàn hệ thống
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-[var(--bg-surface)] p-4 rounded-2xl border border-separator shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-grow">
          <SearchField
            className="w-72"
            value={searchTerm}
            onChange={setSearchTerm}
          >
            <SearchField.Group className="h-10 border border-separator rounded-xl">
              <SearchField.SearchIcon />
              <SearchField.Input
                className="w-full"
                placeholder="Tìm kiếm section..."
              />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <PageSizeSelect
            value={pageSize}
            onChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />

          <Select
            selectedKey={filterPagePath}
            onSelectionChange={(key) => {
              setFilterPagePath(key as string);
              setPage(1);
            }}
            className="w-56"
          >
            <Select.Trigger className="h-10 px-3 rounded-xl border border-separator bg-muted/40 dark:bg-[var(--bg-card)] text-sm font-bold text-foreground flex items-center justify-between cursor-pointer min-w-[200px]">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="bg-white dark:bg-[var(--bg-card)] border border-separator rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
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
            className="rounded-xl font-bold bg-muted/50 hover:bg-muted dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-foreground/80 shadow-sm border border-separator cursor-pointer"
            onClick={fetchSections}
          >
            <RefreshCw size={16} className="mr-1.5" />
            Làm mới
          </Button>

          {!isModerator && (
            <Button
              className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
              onClick={() => {
                setSelectedSection(null);
                setCreateModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Thêm Section</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-separator shadow-sm overflow-hidden">
        {loading ? (
          <TableLoadingState message="Đang tải danh sách sections..." />
        ) : filtered.length === 0 ? (
          <TableEmptyState
            icon={Layers}
            title="Không tìm thấy section"
            description="Chưa có section nào cho trang này."
          />
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
                            <div className="flex items-center gap-1.5">
                              <Tooltip delay={300} closeDelay={100}>
                                <Tooltip.Trigger>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="tertiary"
                                    aria-label="Xem chi tiết section"
                                    onPress={() => {
                                      setSelectedSection(s);
                                      setDetailsModalOpen(true);
                                    }}
                                  >
                                    <Eye size={16} />
                                  </Button>
                                </Tooltip.Trigger>
                                <Tooltip.Content>
                                  <Tooltip.Arrow />
                                  Xem chi tiết section
                                </Tooltip.Content>
                              </Tooltip>

                              <Tooltip delay={300} closeDelay={100}>
                                <Tooltip.Trigger>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="secondary"
                                    aria-label="Chỉnh sửa section"
                                    onPress={() => {
                                      setSelectedSection(s);
                                      setCreateModalOpen(true);
                                    }}
                                  >
                                    <Edit3 size={16} />
                                  </Button>
                                </Tooltip.Trigger>
                                <Tooltip.Content>
                                  <Tooltip.Arrow />
                                  Chỉnh sửa section
                                </Tooltip.Content>
                              </Tooltip>

                              {!isModerator && (
                                <Tooltip delay={300} closeDelay={100}>
                                  <Tooltip.Trigger>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="danger"
                                      aria-label="Xóa section"
                                      onPress={() => {
                                        if (s.id) handleDelete(s.id);
                                      }}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Content className="text-rose-600 dark:text-rose-400">
                                    <Tooltip.Arrow />
                                    Xóa section
                                  </Tooltip.Content>
                                </Tooltip>
                              )}
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Hiển thị {sorted.length === 0 ? 0 : (page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, sorted.length)} / {sorted.length} kết quả
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
      </div>

      {/* Modals */}
      <SectionCreateModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          if (selectedSection) {
            setDetailsModalOpen(true);
          }
        }}
        onSuccess={async () => {
          await fetchSections();
          setCreateModalOpen(false);
          if (selectedSection) {
            setDetailsModalOpen(true);
          }
        }}
        pagePath={filterPagePath}
        initialData={selectedSection}
      />
      <SectionDetailModal
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
