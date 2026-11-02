"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/context/LanguageContext";
import { Language } from "@/config/translations";
import {
  Search,
  Plus,
  Trash2,
  Eye,
  Edit3,
  RefreshCw,
  Sparkles,
  Layers,
  AlertCircle
} from "lucide-react";
import { Button, Input, Table, toast, Tooltip } from "@heroui/react";
import clsx from "clsx";
import { CategoryCreateModal, CategoryDetailModal } from "@/components/admin/categories";
import { headerColumns } from "@/config/headerColumns";
import { AppStatusChip, TableLoadingState, TableEmptyState } from "@/components/common";

import { getCategories, deleteCategory, ServiceCategoryDto, ServiceCategoryTranslationDto } from "@/lib/api/categories";
import { backendUrl } from "@/lib/api/client";

// Initial fallback mock data
const fallbackCategories: ServiceCategoryDto[] = [
  {
    id: 1,
    iconImageId: 101,
    status: "published",
    translations: [
      { locale: "vi", name: "Tour Du Lịch", slug: "tour-du-lich", description: "Các tour tham quan trọn gói" },
      { locale: "en", name: "Sightseeing Tours", slug: "sightseeing-tours", description: "All-inclusive guided sightseeing tours" },
    ]
  }
];

export default function ServiceCategoriesPage() {
  const { language, t } = useI18n();

  const [categories, setCategories] = useState<ServiceCategoryDto[]>(fallbackCategories);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal open states
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategoryDto | null>(null);
  const [detailsDefaultEditMode, setDetailsDefaultEditMode] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.danger(message);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const json = await getCategories();
      if (json.data) {
        setCategories(json.data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      showToast("Cannot connect to API. Loaded offline mock data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Delete Category (Soft Delete)
  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này? (Xóa mềm sẽ không làm hỏng các tour đang liên kết)")) {
      return;
    }

    try {
      await deleteCategory(id);
      showToast("Category deleted successfully!", "success");
      setCategories(categories.filter(c => c.id !== id));
    } catch (e) {
      showToast("Error connecting to server. Local deletion simulated.", "success");
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const handleSaveSuccess = async (simulatedCat?: ServiceCategoryDto) => {
    if (simulatedCat) {
      const exists = categories.some(c => c.id === simulatedCat.id);
      if (exists) {
        setCategories(categories.map(c => c.id === simulatedCat.id ? simulatedCat : c));
      } else {
        setCategories([simulatedCat, ...categories]);
      }
    } else {
      await fetchCategories();
    }
  };

  const filteredCategories = categories.filter(c => {
    const trans = c.translations.find(t => t.locale === language) || c.translations[0];
    return trans?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           trans?.slug.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-accent/10 text-accent">
              <Layers size={22} />
            </span>
            <span>Danh mục Tour & Dịch vụ</span>
          </h1>
          <p className="text-xs text-foreground/60 mt-1">
            Phân loại và cấu hình danh mục các tour du lịch, bảng giá dịch vụ
          </p>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-separator shadow-sm">
        <div className="relative flex-grow max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
          <Input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-separator bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            variant="outline"
            className="rounded-xl font-bold bg-muted hover:bg-muted/80 text-foreground shadow-sm border border-separator"
            onClick={fetchCategories}
          >
            <RefreshCw size={16} className="mr-1.5" />
            Làm Mới
          </Button>

          <Button
            className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus size={16} />
            <span>Thêm Danh Mục</span>
          </Button>
        </div>
      </div>

      {/* Category List Card/Table */}
      <div className="bg-surface rounded-2xl border border-separator shadow-sm overflow-hidden">
        {loading ? (
          <TableLoadingState message="Đang tải danh mục..." />
        ) : filteredCategories.length === 0 ? (
          <TableEmptyState
            icon={Layers}
            title="Chưa có danh mục nào"
            description="Hãy tạo danh mục dịch vụ đầu tiên để phân loại các tour du lịch và bảng giá xe."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Bảng quản lý danh mục" className="w-full text-left">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header className="bg-muted/30 border-b border-separator text-foreground/60 text-xs font-bold uppercase tracking-wider">
                    {headerColumns.serviceCategories(t).map((col) => (
                      <Table.Column
                        key={col.id}
                        id={col.id}
                        isRowHeader={col.isRowHeader}
                        className={col.className}
                      >
                        {col.value}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body className="divide-y divide-separator">
                    {filteredCategories.map((cat) => {
                      const trans = cat.translations.find(t => t.locale === language) || cat.translations[0];
                      return (
                        <Table.Row
                          key={cat.id}
                          className="hover:bg-muted/20 transition-colors duration-150"
                        >
                          <Table.Cell className="px-6 py-4 font-mono text-xs text-foreground/40">#{cat.id}</Table.Cell>
                          <Table.Cell className="px-6 py-4 font-bold text-foreground">
                            <div>
                              <span>{trans?.name || "Untitled Category"}</span>
                              <span className="block text-xs font-medium text-foreground/50 mt-0.5 line-clamp-1">{trans?.description || "No description."}</span>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 font-mono text-xs text-foreground/60">{trans?.slug || "no-slug"}</Table.Cell>
                          <Table.Cell className="px-6 py-4 text-sm font-semibold text-foreground/70">
                            {cat.iconImageId ? `#${cat.iconImageId}` : "—"}
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4">
                            <AppStatusChip status={cat.status} category="publish" />
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Tooltip delay={300} closeDelay={100}>
                                <Tooltip.Trigger>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="tertiary"
                                    aria-label="Xem chi tiết"
                                    onPress={() => {
                                      setSelectedCategory(cat);
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
                                      setSelectedCategory(cat);
                                      setDetailsDefaultEditMode(true);
                                      setDetailsModalOpen(true);
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
                                    aria-label="Xóa"
                                    onPress={() => handleDeleteCategory(cat.id)}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </Tooltip.Trigger>
                                <Tooltip.Content className="text-rose-600 dark:text-rose-400">
                                  <Tooltip.Arrow />
                                  Xóa
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
            </Table>
          </div>
        )}
      </div>

      {/* Extracted Category Modals */}
      <CategoryCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        language={language}
        backendUrl={backendUrl}
        onSaveSuccess={handleSaveSuccess}
        showToast={showToast}
      />

      <CategoryDetailModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedCategory(null);
          setDetailsDefaultEditMode(false);
        }}
        category={selectedCategory}
        language={language}
        backendUrl={backendUrl}
        onSaveSuccess={handleSaveSuccess}
        showToast={showToast}
        defaultEditMode={detailsDefaultEditMode}
      />
    </div>
  );
}
