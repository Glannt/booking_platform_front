"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/context/LanguageContext";
import { Language } from "@/config/translations";
import {
  Search,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  Sparkles,
  Layers,
  AlertCircle
} from "lucide-react";
import { Button, Input, Table, toast } from "@heroui/react";
import clsx from "clsx";
import CategoryCreateModal from "@/components/admin/categories/CategoryCreateModal";
import CategoryDetailsModal from "@/components/admin/categories/CategoryDetailsModal";

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
  const { language } = useI18n();

  const [categories, setCategories] = useState<ServiceCategoryDto[]>(fallbackCategories);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal open states
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategoryDto | null>(null);

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
            className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm border border-transparent"
            onClick={fetchCategories}
          >
            <RefreshCw size={16} className="mr-1.5" />
            "Làm Mới"
          </Button>

          <Button
            className="rounded-xl font-bold bg-[#C9A227] hover:bg-[#B8911F] text-white shadow-sm border border-transparent"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus size={18} className="mr-1" />
            "Thêm Danh Mục"
          </Button>
        </div>
      </div>

      {/* Category List Card/Table */}
      <div className="bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
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
                  <Table.Header className="bg-slate-50 dark:bg-black/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Table.Column isRowHeader className="px-6 py-4">ID</Table.Column>
                    <Table.Column className="px-6 py-4">"Tên Danh Mục"</Table.Column>
                    <Table.Column className="px-6 py-4">Slug</Table.Column>
                    <Table.Column className="px-6 py-4">"Mã Biểu Tượng"</Table.Column>
                    <Table.Column className="px-6 py-4">"Trạng thái"</Table.Column>
                    <Table.Column className="px-6 py-4 text-right">"Thao tác"</Table.Column>
                  </Table.Header>
                  <Table.Body className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredCategories.map((cat) => {
                      const trans = cat.translations.find(t => t.locale === language) || cat.translations[0];
                      return (
                        <Table.Row
                          key={cat.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors duration-150"
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
                            <span
                              className={clsx(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold",
                                cat.status === "published"
                                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50"
                                  : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/50"
                              )}
                            >
                              {cat.status === "published"
                                ? "Hoạt động"
                                : "Bản nháp"}
                            </span>
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="p-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                onClick={() => {
                                  setSelectedCategory(cat);
                                  setDetailsModalOpen(true);
                                }}
                                title="Xem Chi Tiết"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className="p-2 text-slate-600 dark:text-slate-305 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                onClick={() => handleDeleteCategory(cat.id)}
                                title="Xóa"
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

      <CategoryDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        language={language}
        backendUrl={backendUrl}
        onSaveSuccess={handleSaveSuccess}
        showToast={showToast}
      />
    </div>
  );
}
