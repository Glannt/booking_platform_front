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
import CategoryCreateModal from "@/components/admin/categories/CategoryCreateModal";
import CategoryDetailModal from "@/components/admin/categories/CategoryDetailModal";
import { headerColumns } from "@/config/headerColumns";
import { AppStatusChip } from "@/components/common/AppStatusChip";

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
      { locale: "ko", name: "관광 투어", slug: "sightseeing-tours-ko", description: "가이드 관광 투어 상품" },
      { locale: "ru", name: "Экскурсии", slug: "sightseeing-tours-ru", description: "Экскурсионные туры" }
    ]
  },
  {
    id: 2,
    iconImageId: 102,
    status: "published",
    translations: [
      { locale: "vi", name: "Dịch Vụ Xe", slug: "dich-vu-xe", description: "Thuê xe và đưa đón sân bay" },
      { locale: "en", name: "Car Transfers", slug: "car-transfers", description: "Private airport pickup and vehicle transfers" },
      { locale: "ko", name: "차량 샌딩", slug: "car-transfers-ko", description: "개인 공항 픽업 및 차량 샌딩" },
      { locale: "ru", name: "Трансферы", slug: "car-transfers-ru", description: "Аренда авто и трансферы" }
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

  const handleSaveSuccess = (simulatedCat?: ServiceCategoryDto) => {
    if (simulatedCat) {
      const exists = categories.some(c => c.id === simulatedCat.id);
      if (exists) {
        setCategories(categories.map(c => c.id === simulatedCat.id ? simulatedCat : c));
      } else {
        setCategories([simulatedCat, ...categories]);
      }
    } else {
      fetchCategories();
    }
  };

  const filteredCategories = categories.filter(c => {
    const trans = c.translations.find(t => t.locale === language) || c.translations[0];
    return trans?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           trans?.slug.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="w-full space-y-6">


      {/* Search & Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-black p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-grow max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            variant="outline"
            className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 shadow-sm border border-transparent"
            onClick={fetchCategories}
          >
            <RefreshCw size={16} className="mr-1.5" />
            "Làm Mới"
          </Button>

          <Button
            className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus size={16} />
            <span>{"Thêm Danh Mục"}</span>
          </Button>
        </div>
      </div>

      {/* Category List Card/Table */}
      <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="animate-spin text-primary" size={32} />
            <p className="text-sm font-bold text-slate-500">"Đang tải danh mục..."</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Layers className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
              "Chưa có danh mục nào"
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              "Hãy tạo danh mục dịch vụ đầu tiên để phân loại các tour du lịch và bảng giá xe."
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Bảng quản lý danh mục" className="w-full text-left">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header className="bg-slate-50 dark:bg-[var(--bg-card)]/20 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
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
                  <Table.Body className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredCategories.map((cat) => {
                      const trans = cat.translations.find(t => t.locale === language) || cat.translations[0];
                      return (
                        <Table.Row
                          key={cat.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-[var(--bg-page)]/20 transition-colors duration-150"
                        >
                          <Table.Cell className="px-6 py-4 font-mono text-xs text-slate-400">#{cat.id}</Table.Cell>
                          <Table.Cell className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                            <div>
                              <span>{trans?.name || "Untitled Category"}</span>
                              <span className="block text-xs font-medium text-slate-400 mt-0.5 line-clamp-1">{trans?.description || "No description."}</span>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 font-mono text-xs text-slate-500">{trans?.slug || "no-slug"}</Table.Cell>
                          <Table.Cell className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
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
