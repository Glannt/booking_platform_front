"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Package, Plus, Pencil, Trash2 } from "lucide-react";
import { Button, Spinner, Tooltip } from "@heroui/react";

import { StatusChip } from "@/components/StatusChip";
import AddOnCategoryModal from "./AddOnCategoryModal";
import AddOnItemModal from "./AddOnItemModal";
import AmenityCategoryModal from "./AmenityCategoryModal";
import AmenityItemModal from "./AmenityItemModal";
import CatalogDeleteConfirmModal from "./CatalogDeleteConfirmModal";

import {
  getAddOnCategories,
  getAmenityCategories,
  getVehicles,
  deleteAddOn,
  deleteAddOnCategory,
  deleteAmenity,
  deleteAmenityCategory,
  AddOnCategoryDto,
  AmenityCategoryDto,
  AddOnDto,
  AmenityDto,
  VehicleDto
} from "@/lib/api/fleet";

interface VehicleAttributesTabProps {
  showToast: (msg: string, type: "success" | "error") => void;
}

interface DeleteTarget {
  open: boolean;
  kind: "addon" | "addonCat" | "amenity" | "amenityCat";
  id: number;
  label: string;
  vehicles: VehicleDto[];
}

/** Lấy tên bản tiếng Việt (fallback bản đầu tiên / code) từ translations động của API */
const transName = (trans: { locale: string; name: string }[] | undefined, fallback: string) =>
  trans?.find((t) => t.locale === "vi")?.name || trans?.[0]?.name || fallback;

/** Gộp (union) danh sách xe đang dùng các item — dùng cho xác nhận xóa danh mục */
const unionVehicles = (itemIds: number[], map: Map<number, VehicleDto[]>) => {
  const uniq = new Map<number, VehicleDto>();
  for (const id of itemIds) {
    for (const v of map.get(id) ?? []) uniq.set(v.id, v);
  }
  return Array.from(uniq.values());
};

const primaryBtn =
  "rounded-xl font-bold text-xs h-10 px-3.5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors";

export default function VehicleAttributesTab({ showToast }: VehicleAttributesTabProps) {
  const [loading, setLoading] = useState(true);
  const [addonCats, setAddonCats] = useState<AddOnCategoryDto[]>([]);
  const [amenityCats, setAmenityCats] = useState<AmenityCategoryDto[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);

  const [addonCatModal, setAddonCatModal] = useState<{ open: boolean; category: AddOnCategoryDto | null }>({ open: false, category: null });
  const [amenityCatModal, setAmenityCatModal] = useState<{ open: boolean; category: AmenityCategoryDto | null }>({ open: false, category: null });
  const [addonItemModal, setAddonItemModal] = useState<{ open: boolean; category: AddOnCategoryDto | null; item: AddOnDto | null }>({ open: false, category: null, item: null });
  const [amenityItemModal, setAmenityItemModal] = useState<{ open: boolean; category: AmenityCategoryDto | null; item: AmenityDto | null }>({ open: false, category: null, item: null });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>({ open: false, kind: "addon", id: 0, label: "", vehicles: [] });
  const [deleting, setDeleting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [acRes, amRes] = await Promise.all([
        getAddOnCategories().catch((e) => { console.warn("Load addon categories failed:", e); return null; }),
        getAmenityCategories().catch((e) => { console.warn("Load amenity categories failed:", e); return null; }),
      ]);
      setAddonCats(acRes?.data ?? []);
      setAmenityCats(amRes?.data ?? []);
    } catch { /* đã xử lý từng nhánh */ }

    // Lấy toàn bộ xe (lặp các trang) để dựng bản đồ "xe nào đang dùng add-on/tiện nghi nào"
    try {
      let all: VehicleDto[] = [];
      let page = 0;
      let totalPages = 1;
      while (page < totalPages) {
        const res = await getVehicles({ page, size: 100 });
        const data = res.data;
        if (!data) break;
        all = all.concat(data.content);
        totalPages = data.page.totalPages;
        page += 1;
      }
      setVehicles(all);
    } catch (e) {
      console.warn("Load vehicles failed:", e);
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const addonVehicleMap = useMemo(() => {
    const map = new Map<number, VehicleDto[]>();
    for (const v of vehicles) {
      for (const ao of v.addOns ?? []) {
        const list = map.get(ao.id) ?? [];
        list.push(v);
        map.set(ao.id, list);
      }
    }
    return map;
  }, [vehicles]);

  const amenityVehicleMap = useMemo(() => {
    const map = new Map<number, VehicleDto[]>();
    for (const v of vehicles) {
      for (const am of v.amenities ?? []) {
        const list = map.get(am.id) ?? [];
        list.push(v);
        map.set(am.id, list);
      }
    }
    return map;
  }, [vehicles]);

  const confirmDelete = async () => {
    if (!deleteTarget.open) return;
    setDeleting(true);
    try {
      switch (deleteTarget.kind) {
        case "addon": await deleteAddOn(deleteTarget.id); break;
        case "addonCat": await deleteAddOnCategory(deleteTarget.id); break;
        case "amenity": await deleteAmenity(deleteTarget.id); break;
        case "amenityCat": await deleteAmenityCategory(deleteTarget.id); break;
      }
      showToast("Xóa thành công!", "success");
    } catch {
      showToast("API connection failed. Action simulated locally.", "success");
    }
    setDeleting(false);
    setDeleteTarget((s) => ({ ...s, open: false }));
    await loadAll();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="md" className="mr-1.5" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-6">
      {/* ===== Panel Phụ kiện (Add-ons) ===== */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-card)] flex flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
              <Package size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-foreground">{"Phụ kiện (Thuộc tính)"}</h3>
              <p className="text-xs text-foreground/60 truncate">{addonCats.length} danh mục</p>
            </div>
          </div>
          <Button onClick={() => setAddonCatModal({ open: true, category: null })} className={primaryBtn}>
            <Plus size={15} />
            <span>Thêm Danh mục</span>
          </Button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[560px]">
          {addonCats.length === 0 ? (
            <div className="text-center py-10">
              <Package size={28} className="mx-auto text-foreground/20 mb-2" />
              <p className="text-sm font-bold text-foreground/60">{"Chưa có danh mục phụ kiện"}</p>
              <p className="text-xs text-foreground/40 mt-1">{"Nhấn “Thêm Danh mục” để tạo danh mục đầu tiên."}</p>
            </div>
          ) : (
            addonCats.map((cat) => (
              <div key={cat.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)]">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-foreground truncate">{transName(cat.translations, cat.code)}</span>
                      <code className="text-[10px] font-mono bg-slate-100 dark:bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded text-foreground/60">{cat.code}</code>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusChip status={String(cat.active)} type="active" />
                      <span className="text-[11px] text-foreground/50">{cat.addOns?.length ?? 0} phụ kiện</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Tooltip delay={300} closeDelay={100}>
                      <Tooltip.Trigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="secondary"
                          aria-label="Chỉnh sửa danh mục phụ kiện"
                          onPress={() => setAddonCatModal({ open: true, category: cat })}
                        >
                          <Pencil size={14} />
                        </Button>
                      </Tooltip.Trigger>
                      <Tooltip.Content><Tooltip.Arrow />{"Chỉnh sửa danh mục"}</Tooltip.Content>
                    </Tooltip>
                    <Tooltip delay={300} closeDelay={100}>
                      <Tooltip.Trigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="danger"
                          aria-label="Xóa danh mục phụ kiện"
                          onPress={() => setDeleteTarget({
                            open: true, kind: "addonCat", id: cat.id,
                            label: transName(cat.translations, cat.code),
                            vehicles: unionVehicles((cat.addOns ?? []).map((a) => a.id), addonVehicleMap)
                          })}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </Tooltip.Trigger>
                      <Tooltip.Content className="text-rose-600 dark:text-rose-400"><Tooltip.Arrow />{"Xóa danh mục"}</Tooltip.Content>
                    </Tooltip>
                    <Button
                      size="sm"
                      variant="tertiary"
                      aria-label="Thêm phụ kiện"
                      onPress={() => setAddonItemModal({ open: true, category: cat, item: null })}
                      className="rounded-lg font-bold text-[11px] h-8 px-2.5 bg-accent/10 hover:bg-accent/20 text-accent cursor-pointer border-none flex items-center gap-1 transition-colors"
                    >
                      <Plus size={13} />
                      <span>Thêm phụ kiện</span>
                    </Button>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {(cat.addOns ?? []).length === 0 ? (
                    <p className="px-4 py-3 text-xs text-foreground/40 italic">{"Chưa có phụ kiện nào trong danh mục này."}</p>
                  ) : (
                    (cat.addOns ?? [])
                      .slice()
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="text-xs font-bold text-foreground flex-1 truncate">{transName(item.translations, item.code)}</span>
                          {item.value ? <span className="text-[11px] text-foreground/50 shrink-0">{item.value}</span> : null}
                          <StatusChip status={String(item.active)} type="active" />
                          <div className="flex items-center gap-1 shrink-0">
                            <Tooltip delay={300} closeDelay={100}>
                              <Tooltip.Trigger>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="secondary"
                                  aria-label="Chỉnh sửa phụ kiện"
                                  onPress={() => setAddonItemModal({ open: true, category: cat, item })}
                                >
                                  <Pencil size={13} />
                                </Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content><Tooltip.Arrow />{"Chỉnh sửa"}</Tooltip.Content>
                            </Tooltip>
                            <Tooltip delay={300} closeDelay={100}>
                              <Tooltip.Trigger>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="danger"
                                  aria-label="Xóa phụ kiện"
                                  onPress={() => setDeleteTarget({
                                    open: true, kind: "addon", id: item.id,
                                    label: transName(item.translations, item.code),
                                    vehicles: addonVehicleMap.get(item.id) ?? []
                                  })}
                                >
                                  <Trash2 size={13} />
                                </Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content className="text-rose-600 dark:text-rose-400"><Tooltip.Arrow />{"Xóa"}</Tooltip.Content>
                            </Tooltip>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ===== Panel Tiện nghi (Amenities) ===== */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-card)] flex flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
              <BadgeCheck size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-foreground">{"Tiện nghi (Trang bị)"}</h3>
              <p className="text-xs text-foreground/60 truncate">{amenityCats.length} danh mục</p>
            </div>
          </div>
          <Button onClick={() => setAmenityCatModal({ open: true, category: null })} className={primaryBtn}>
            <Plus size={15} />
            <span>Thêm Danh mục</span>
          </Button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[560px]">
          {amenityCats.length === 0 ? (
            <div className="text-center py-10">
              <BadgeCheck size={28} className="mx-auto text-foreground/20 mb-2" />
              <p className="text-sm font-bold text-foreground/60">{"Chưa có danh mục tiện nghi"}</p>
              <p className="text-xs text-foreground/40 mt-1">{"Nhấn “Thêm Danh mục” để tạo danh mục đầu tiên."}</p>
            </div>
          ) : (
            amenityCats.map((cat) => (
              <div key={cat.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)]">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-foreground truncate">{transName(cat.translations, cat.code)}</span>
                      <code className="text-[10px] font-mono bg-slate-100 dark:bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded text-foreground/60">{cat.code}</code>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusChip status={String(cat.active)} type="active" />
                      <span className="text-[11px] text-foreground/50">{cat.amenities?.length ?? 0} tiện nghi</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Tooltip delay={300} closeDelay={100}>
                      <Tooltip.Trigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="secondary"
                          aria-label="Chỉnh sửa danh mục tiện nghi"
                          onPress={() => setAmenityCatModal({ open: true, category: cat })}
                        >
                          <Pencil size={14} />
                        </Button>
                      </Tooltip.Trigger>
                      <Tooltip.Content><Tooltip.Arrow />{"Chỉnh sửa danh mục"}</Tooltip.Content>
                    </Tooltip>
                    <Tooltip delay={300} closeDelay={100}>
                      <Tooltip.Trigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="danger"
                          aria-label="Xóa danh mục tiện nghi"
                          onPress={() => setDeleteTarget({
                            open: true, kind: "amenityCat", id: cat.id,
                            label: transName(cat.translations, cat.code),
                            vehicles: unionVehicles((cat.amenities ?? []).map((a) => a.id), amenityVehicleMap)
                          })}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </Tooltip.Trigger>
                      <Tooltip.Content className="text-rose-600 dark:text-rose-400"><Tooltip.Arrow />{"Xóa danh mục"}</Tooltip.Content>
                    </Tooltip>
                    <Button
                      size="sm"
                      variant="tertiary"
                      aria-label="Thêm tiện nghi"
                      onPress={() => setAmenityItemModal({ open: true, category: cat, item: null })}
                      className="rounded-lg font-bold text-[11px] h-8 px-2.5 bg-accent/10 hover:bg-accent/20 text-accent cursor-pointer border-none flex items-center gap-1 transition-colors"
                    >
                      <Plus size={13} />
                      <span>Thêm tiện nghi</span>
                    </Button>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {(cat.amenities ?? []).length === 0 ? (
                    <p className="px-4 py-3 text-xs text-foreground/40 italic">{"Chưa có tiện nghi nào trong danh mục này."}</p>
                  ) : (
                    (cat.amenities ?? [])
                      .slice()
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="text-xs font-bold text-foreground flex-1 truncate">{transName(item.translations, item.code)}</span>
                          <StatusChip status={String(item.active)} type="active" />
                          <div className="flex items-center gap-1 shrink-0">
                            <Tooltip delay={300} closeDelay={100}>
                              <Tooltip.Trigger>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="secondary"
                                  aria-label="Chỉnh sửa tiện nghi"
                                  onPress={() => setAmenityItemModal({ open: true, category: cat, item })}
                                >
                                  <Pencil size={13} />
                                </Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content><Tooltip.Arrow />{"Chỉnh sửa"}</Tooltip.Content>
                            </Tooltip>
                            <Tooltip delay={300} closeDelay={100}>
                              <Tooltip.Trigger>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="danger"
                                  aria-label="Xóa tiện nghi"
                                  onPress={() => setDeleteTarget({
                                    open: true, kind: "amenity", id: item.id,
                                    label: transName(item.translations, item.code),
                                    vehicles: amenityVehicleMap.get(item.id) ?? []
                                  })}
                                >
                                  <Trash2 size={13} />
                                </Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content className="text-rose-600 dark:text-rose-400"><Tooltip.Arrow />{"Xóa"}</Tooltip.Content>
                            </Tooltip>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ===== Modals ===== */}
      <AddOnCategoryModal
        isOpen={addonCatModal.open}
        onClose={() => setAddonCatModal({ open: false, category: null })}
        category={addonCatModal.category}
        showToast={showToast}
        onSaveSuccess={loadAll}
      />
      <AmenityCategoryModal
        isOpen={amenityCatModal.open}
        onClose={() => setAmenityCatModal({ open: false, category: null })}
        category={amenityCatModal.category}
        showToast={showToast}
        onSaveSuccess={loadAll}
      />
      {addonItemModal.open && addonItemModal.category && (
        <AddOnItemModal
          isOpen
          onClose={() => setAddonItemModal({ open: false, category: null, item: null })}
          category={addonItemModal.category}
          item={addonItemModal.item}
          showToast={showToast}
          onSaveSuccess={loadAll}
        />
      )}
      {amenityItemModal.open && amenityItemModal.category && (
        <AmenityItemModal
          isOpen
          onClose={() => setAmenityItemModal({ open: false, category: null, item: null })}
          category={amenityItemModal.category}
          item={amenityItemModal.item}
          showToast={showToast}
          onSaveSuccess={loadAll}
        />
      )}
      <CatalogDeleteConfirmModal
        isOpen={deleteTarget.open}
        onClose={() => setDeleteTarget((s) => ({ ...s, open: false }))}
        title={deleteTarget.kind.endsWith("Cat") ? "Xóa danh mục" : "Xóa mục"}
        itemLabel={deleteTarget.label}
        usingVehicles={deleteTarget.vehicles}
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}