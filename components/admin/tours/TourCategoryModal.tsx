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
  Label,
  NumberField,
  Input,
  Checkbox
} from "@heroui/react";
import {
  Save,
  RefreshCw,
  Ship,
  Car,
  Compass,
  Utensils,
  Award,
  Shield,
  Anchor,
  Camera,
  Sun,
  Palmtree,
  MapPin,
  Sparkles
} from "lucide-react";
import clsx from "clsx";

import {
  TourCategoryDto,
  createTourCategory,
  updateTourCategory
} from "@/lib/api/tours";

const AVAILABLE_ICONS = [
  { id: "ship", label: "Cano / Tàu", icon: Ship },
  { id: "car", label: "Xe / Ô tô", icon: Car },
  { id: "compass", label: "La bàn", icon: Compass },
  { id: "palmtree", label: "Cây dừa", icon: Palmtree },
  { id: "sun", label: "Mặt trời", icon: Sun },
  { id: "anchor", label: "Mỏ neo", icon: Anchor },
  { id: "camera", label: "Máy ảnh", icon: Camera },
  { id: "utensils", label: "Ăn uống", icon: Utensils },
  { id: "award", label: "Danh hiệu", icon: Award },
  { id: "shield", label: "Bảo hiểm", icon: Shield },
  { id: "map-pin", label: "Địa điểm", icon: MapPin },
  { id: "sparkles", label: "VIP / Đặc biệt", icon: Sparkles }
];

interface TourCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: TourCategoryDto | null;
  onSaveSuccess: (savedCat?: TourCategoryDto) => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function TourCategoryModal({
  isOpen,
  onClose,
  categoryToEdit,
  onSaveSuccess,
  showToast
}: TourCategoryModalProps) {
  const isEditing = Boolean(categoryToEdit && categoryToEdit.id);
  const [activeFormLocale, setActiveFormLocale] = useState<string>("vi");
  const [loading, setLoading] = useState(false);

  // Form fields
  const [code, setCode] = useState<string>("");
  const [icon, setIcon] = useState<string>("ship");
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [active, setActive] = useState<boolean>(true);

  // 4-locale translations
  const [translations, setTranslations] = useState({
    vi: { name: "", slug: "", description: "" },
    en: { name: "", slug: "", description: "" },
    ko: { name: "", slug: "", description: "" },
    ru: { name: "", slug: "", description: "" }
  });

  useEffect(() => {
    if (!isOpen) return;

    if (categoryToEdit) {
      setCode(categoryToEdit.code || "");
      setIcon(categoryToEdit.icon || "ship");
      setSortOrder(categoryToEdit.sortOrder ?? 0);
      setActive(categoryToEdit.active ?? categoryToEdit.isActive ?? true);

      const transMap: Record<string, { name: string; slug: string; description: string }> = {
        vi: { name: "", slug: "", description: "" },
        en: { name: "", slug: "", description: "" },
        ko: { name: "", slug: "", description: "" },
        ru: { name: "", slug: "", description: "" }
      };

      if (categoryToEdit.translations && categoryToEdit.translations.length > 0) {
        categoryToEdit.translations.forEach((t) => {
          const loc = t.locale.toLowerCase();
          if (transMap[loc]) {
            transMap[loc] = {
              name: t.name || "",
              slug: t.slug || "",
              description: t.description || ""
            };
          }
        });
      } else {
        // Fallback to title/description for Vietnamese
        transMap.vi = {
          name: categoryToEdit.title || "",
          slug: (categoryToEdit.code || "").toLowerCase(),
          description: categoryToEdit.description || ""
        };
      }

      setTranslations(transMap as any);
    } else {
      // Create mode reset
      setCode("");
      setIcon("ship");
      setSortOrder(1);
      setActive(true);
      setTranslations({
        vi: { name: "", slug: "", description: "" },
        en: { name: "", slug: "", description: "" },
        ko: { name: "", slug: "", description: "" },
        ru: { name: "", slug: "", description: "" }
      });
    }
    setActiveFormLocale("vi");
  }, [isOpen, categoryToEdit]);

  const handleTranslationChange = (field: "name" | "slug" | "description", val: string) => {
    setTranslations((prev) => {
      const current = prev[activeFormLocale as keyof typeof prev];
      let slug = current.slug;
      if (field === "name") {
        slug = val
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[đĐ]/g, "d")
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-");

        // Auto-generate code if empty and typing VI name
        if (!isEditing && activeFormLocale === "vi" && (!code || code === current.slug)) {
          setCode(slug);
        }
      } else if (field === "slug") {
        slug = val;
      }

      return {
        ...prev,
        [activeFormLocale]: {
          ...current,
          [field]: val,
          slug
        }
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!code.trim()) {
      showToast("Vui lòng nhập mã danh mục (Code)", "error");
      return;
    }

    if (!translations.vi.name.trim()) {
      showToast("Vui lòng nhập tên danh mục tiếng Việt", "error");
      setActiveFormLocale("vi");
      return;
    }

    setLoading(true);

    try {
      const transList = (Object.keys(translations) as Array<keyof typeof translations>)
        .filter((loc) => translations[loc].name.trim().length > 0)
        .map((loc) => ({
          locale: loc,
          name: translations[loc].name.trim(),
          slug: translations[loc].slug.trim() || translations[loc].name.trim().toLowerCase().replace(/\s+/g, "-"),
          description: translations[loc].description.trim()
        }));

      const payload: Partial<TourCategoryDto> = {
        code: code.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        icon: icon || "ship",
        sortOrder: Number(sortOrder) || 0,
        active,
        isActive: active,
        title: translations.vi.name.trim(),
        description: translations.vi.description.trim(),
        translations: transList
      };

      let savedCat: TourCategoryDto | undefined;
      if (isEditing && categoryToEdit?.id) {
        const res = await updateTourCategory(categoryToEdit.id, payload);
        savedCat = res.data;
        showToast("Cập nhật danh mục tour thành công!", "success");
      } else {
        const res = await createTourCategory(payload);
        savedCat = res.data;
        showToast("Tạo mới danh mục tour thành công!", "success");
      }

      onSaveSuccess(savedCat);
      onClose();
    } catch (error: any) {
      console.error("Save tour category error:", error);
      showToast(error.message || "Không thể lưu danh mục tour. Vui lòng thử lại.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isEditing ? `Chỉnh sửa Danh mục: ${categoryToEdit?.code}` : "Tạo Danh mục Tour Mới"}
                </h2>
                <p className="text-xs text-slate-500">
                  Cấu hình mã, icon nhận diện và bản dịch 4 ngôn ngữ cho danh mục tour.
                </p>
              </div>
            </ModalHeader>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                {/* General Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Mã Danh mục (Code) *
                    </Label>
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="vd: island-cano, land-car..."
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-xs font-bold outline-none"
                      required
                    />
                  </div>

                  <div>
                    <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Thứ tự hiển thị (Sort)
                    </Label>
                    <NumberField
                      minValue={0}
                      value={sortOrder}
                      onChange={(val) => setSortOrder(val ?? 0)}
                    >
                      <Input className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-xs font-bold outline-none" />
                    </NumberField>
                  </div>

                  <div className="flex flex-col justify-center">
                    <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Trạng thái hoạt động
                    </Label>
                    <div className="flex items-center gap-2 h-10">
                      <Checkbox
                        isSelected={active}
                        onChange={setActive}
                        className="text-xs font-bold text-slate-700 dark:text-slate-300"
                      >
                        {active ? "Kích hoạt (Hiển thị)" : "Tạm ẩn"}
                      </Checkbox>
                    </div>
                  </div>
                </div>

                {/* Icon Selection */}
                <div>
                  <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Icon biểu tượng
                  </Label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {AVAILABLE_ICONS.map((ic) => {
                      const IconComp = ic.icon;
                      const isSelected = icon === ic.id;
                      return (
                        <button
                          key={ic.id}
                          type="button"
                          onClick={() => setIcon(ic.id)}
                          className={clsx(
                            "flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                            isSelected
                              ? "bg-accent/10 border-accent text-accent shadow-sm"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                          )}
                        >
                          <IconComp size={18} className="mb-1" />
                          <span className="text-[10px] truncate max-w-full">{ic.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Multi-language Translations Section */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Bản dịch đa ngôn ngữ
                    </Label>
                    <div className="flex gap-1 bg-slate-100 dark:bg-[var(--bg-card)] p-1 rounded-xl">
                      {[
                        { id: "vi", label: "Tiếng Việt 🇻🇳" },
                        { id: "en", label: "English 🇬🇧" },
                        { id: "ko", label: "한국어 🇰🇷" },
                        { id: "ru", label: "Русский 🇷🇺" }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveFormLocale(tab.id)}
                          className={clsx(
                            "px-2.5 py-1 text-xs font-bold rounded-lg transition-all border-none cursor-pointer",
                            activeFormLocale === tab.id
                              ? "bg-white dark:bg-[var(--bg-elevated)] text-slate-900 dark:text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50/50 dark:bg-[var(--bg-card)]/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <Label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Tên Danh mục ({activeFormLocale.toUpperCase()}) *
                      </Label>
                      <Input
                        value={translations[activeFormLocale as keyof typeof translations].name}
                        onChange={(e) => handleTranslationChange("name", e.target.value)}
                        placeholder={`Tên danh mục bằng ngôn ngữ ${activeFormLocale.toUpperCase()}...`}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-xs font-bold outline-none"
                      />
                    </div>

                    <div>
                      <Label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Đường dẫn tĩnh (Slug)
                      </Label>
                      <Input
                        value={translations[activeFormLocale as keyof typeof translations].slug}
                        onChange={(e) => handleTranslationChange("slug", e.target.value)}
                        placeholder={`Slug cho ${activeFormLocale.toUpperCase()}...`}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-xs font-medium outline-none text-slate-600 dark:text-slate-400"
                      />
                    </div>

                    <div>
                      <Label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Mô tả ngắn ({activeFormLocale.toUpperCase()})
                      </Label>
                      <textarea
                        value={translations[activeFormLocale as keyof typeof translations].description}
                        onChange={(e) => handleTranslationChange("description", e.target.value)}
                        placeholder={`Mô tả ngắn về danh mục này...`}
                        rows={2}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] text-xs font-medium outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  onPress={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] rounded-xl border-none cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isDisabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-xl border-none flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {loading ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                  {isEditing ? "Lưu thay đổi" : "Tạo danh mục"}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
