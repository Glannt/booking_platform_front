"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button, Chip } from "@heroui/react";
import { Plus, Tag, Edit, Trash2, Calendar, RefreshCw } from "lucide-react";
import { PriceDiscountDto, getAdminDiscounts, deleteDiscount } from "@/lib/api/discount";
import { DiscountModal } from "./DiscountModal";
import { useI18n } from "@/context/LanguageContext";

interface ScopedDiscountTabProps {
  scopeType: string;
  scopeRefId?: string | number;
  scopeTitle?: string;
}

export function ScopedDiscountTab({
  scopeType,
  scopeRefId,
  scopeTitle,
}: ScopedDiscountTabProps) {
  const { t } = useI18n();

  const [discounts, setDiscounts] = useState<PriceDiscountDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<PriceDiscountDto | null>(null);

  const fetchDiscounts = useCallback(async () => {
    if (!scopeRefId) return;
    setLoading(true);
    try {
      const res = await getAdminDiscounts(0, 50, scopeType, String(scopeRefId));
      if (res.data?.content) {
        setDiscounts(res.data.content);
      }
    } catch (err) {
      console.error("Failed to fetch scoped discounts:", err);
    } finally {
      setLoading(false);
    }
  }, [scopeType, scopeRefId]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const handleOpenCreate = () => {
    setEditingDiscount(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: PriceDiscountDto) => {
    setEditingDiscount(d);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t.discounts.deleteConfirm)) return;
    try {
      await deleteDiscount(id);
      fetchDiscounts();
    } catch (err) {
      console.error("Failed to delete discount:", err);
    }
  };

  const formatPeriod = (from?: string, to?: string) => {
    if (!from && !to) return "Không giới hạn thời gian";
    const f = from ? from.slice(0, 10) : "...";
    const tVal = to ? to.slice(0, 10) : "...";
    return `${f} → ${tVal}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag size={16} className="text-accent" />
            <span>{t.discounts.tabDiscounts} {scopeTitle ? `- ${scopeTitle}` : ""}</span>
          </h4>
          <p className="text-xs text-slate-500">
            {t.discounts.description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            isIconOnly
            className="rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
            onClick={fetchDiscounts}
            isDisabled={loading}
            aria-label="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-xl text-xs font-bold bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm border-none cursor-pointer flex items-center gap-1.5 transition-colors"
            onClick={handleOpenCreate}
          >
            <Plus size={14} />
            {t.discounts.addDiscount}
          </Button>
        </div>
      </div>

      {loading && discounts.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          <RefreshCw size={20} className="animate-spin mx-auto mb-2 opacity-50" />
          Đang tải khuyến mãi...
        </div>
      ) : discounts.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-[var(--bg-card)]">
          <Tag size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-xs text-slate-400 italic mb-3">{t.discounts.noDiscounts}</p>
          <Button
            type="button"
            size="sm"
            className="rounded-xl text-xs font-bold bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm border-none cursor-pointer transition-colors"
            onClick={handleOpenCreate}
          >
            <Plus size={14} className="mr-1" />
            {t.discounts.addDiscount}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {discounts.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-mono font-black rounded-lg bg-accent/10 text-accent uppercase">
                      {item.code}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${item.active ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" : "bg-slate-200 dark:bg-[var(--bg-elevated)] text-slate-500"}`}>
                      {item.active ? t.discounts.active : t.discounts.inactive}
                    </span>
                  </div>
                  {item.name && (
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {item.name}
                    </h5>
                  )}
                  {item.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 cursor-pointer border-none"
                    onClick={() => handleOpenEdit(item)}
                    aria-label={t.discounts.editDiscount}
                  >
                    <Edit size={13} />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 cursor-pointer border-none"
                    onClick={() => item.id && handleDelete(item.id)}
                    aria-label={t.discounts.deleteDiscount}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>

              {/* Discount metrics */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-400 block">{t.discounts.discountValue}</span>
                  <span className="font-extrabold text-accent">
                    {item.discountType === "PERCENT"
                      ? `Giảm ${item.discountValue}%`
                      : `Giảm ${new Intl.NumberFormat("vi-VN").format(item.discountValue || 0)} đ`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{t.discounts.maxUsage}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {item.maxUsage ? `${item.usageCount || 0} / ${item.maxUsage}` : `${item.usageCount || 0} (vô hạn)`}
                  </span>
                </div>
              </div>

              {/* Valid period */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                <Calendar size={12} className="text-slate-400" />
                <span>{formatPeriod(item.validFrom, item.validTo)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discount Sub-Modal */}
      <DiscountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDiscount(null);
        }}
        onSaveSuccess={() => {
          fetchDiscounts();
        }}
        initialData={editingDiscount}
        defaultScopeType={scopeType}
        defaultScopeRefId={scopeRefId ? String(scopeRefId) : undefined}
        lockScope={true}
      />
    </div>
  );
}
