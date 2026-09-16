"use client";

import React from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Select, ListBox, Typography } from "@heroui/react";
import type {
  ComparisonComponentData,
  ComparisonItemData,
} from "@/types/routeComponents";
import { DEFAULT_COMPARISON_DATA } from "@/types/routeComponents";

function normalizeComparisonData(value: ComparisonComponentData | null | undefined): ComparisonComponentData {
  if (!value) return DEFAULT_COMPARISON_DATA;
  return {
    title: typeof value.title === "string" ? value.title : DEFAULT_COMPARISON_DATA.title,
    subtitle: typeof value.subtitle === "string" ? value.subtitle : DEFAULT_COMPARISON_DATA.subtitle,
    privateCard: Array.isArray(value.privateCard) ? value.privateCard : DEFAULT_COMPARISON_DATA.privateCard,
    sharedCard: Array.isArray(value.sharedCard) ? value.sharedCard : DEFAULT_COMPARISON_DATA.sharedCard,
  };
}

const ITEM_TYPES: { value: ComparisonItemData["type"]; label: string }[] = [
  { value: "title", label: "Tiêu đề thẻ" },
  { value: "badge", label: "Huy hiệu" },
  { value: "description", label: "Mô tả" },
  { value: "tick", label: "Điểm nổi bật" },
];

const ITEM_TYPE_STYLE: Record<ComparisonItemData["type"], string> = {
  title: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[var(--bg-card)]",
  badge: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
  description:
    "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
  tick: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
};

interface CardEditorProps {
  label: string;
  accent: "accent" | "amber";
  items: ComparisonItemData[];
  onChange: (items: ComparisonItemData[]) => void;
}

function CardEditor({ label, accent, items, onChange }: CardEditorProps) {
  const accentText = accent === "amber" ? "text-amber-600" : "text-accent";
  const accentBorder =
    accent === "amber"
      ? "border-amber-200 dark:border-amber-950/40"
      : "border-emerald-100 dark:border-emerald-950/30";

  const updateItem = (index: number, patch: Partial<ComparisonItemData>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const safeItem = (item: ComparisonItemData): ComparisonItemData => ({
    type: item?.type && ITEM_TYPE_STYLE[item.type] ? item.type : "tick",
    value: typeof item?.value === "string" ? item.value : "",
  });

  const move = (index: number, dir: -1 | 1) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...items, { type: "tick", value: "" }]);
  };

  return (
    <div className={`space-y-2 p-3.5 bg-white dark:bg-[var(--bg-surface)] rounded-xl border ${accentBorder} shadow-xs`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-wider ${accentText} block`}>
          {label}
        </span>
        <button
          type="button"
          onClick={addItem}
          className="text-[11px] font-bold text-accent hover:underline cursor-pointer border-none bg-transparent flex items-center gap-1"
        >
          <Plus size={12} /> Thêm dòng
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-[11px] italic text-slate-400">
          Chưa có dữ liệu. Nhấn “Thêm dòng” để bắt đầu.
        </p>
      )}

      {items.map((rawItem, index) => (
        <div
          key={index}
          className="flex items-center gap-2 rounded-lg border border-separator bg-slate-50/50 dark:bg-[var(--bg-card)] p-1.5"
        >
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer border-none bg-transparent"
            >
              <ChevronUp size={12} />
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === items.length - 1}
              className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer border-none bg-transparent"
            >
              <ChevronDown size={12} />
            </button>
          </div>

          <Select
            aria-label="Loại mục"
            selectedKey={safeItem(rawItem).type}
            onSelectionChange={(key) => {
              if (key) {
                updateItem(index, { type: String(key) as ComparisonItemData["type"] });
              }
            }}
            className="w-36 shrink-0"
          >
            <Select.Trigger
              className={`w-full px-2 py-1 rounded-md text-[11px] font-bold border-0 outline-none cursor-pointer flex items-center justify-between gap-1 h-[30px] ${ITEM_TYPE_STYLE[safeItem(rawItem).type]}`}
            >
              <Select.Value />
              <Select.Indicator className="shrink-0 opacity-70 text-current text-[10px]" />
            </Select.Trigger>
            <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-border-secondary rounded-xl shadow-xl p-1 min-w-[150px] z-50">
              <ListBox>
                {ITEM_TYPES.map((t) => (
                  <ListBox.Item
                    key={t.value}
                    id={t.value}
                    textValue={t.label}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] text-slate-800 dark:text-slate-200 flex items-center justify-between"
                  >
                    {t.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <input
            value={safeItem(rawItem).value}
            onChange={(e) => updateItem(index, { value: e.target.value })}
            placeholder={
              safeItem(rawItem).type === "description"
                ? "Nội dung mô tả..."
                : safeItem(rawItem).type === "title"
                  ? "Tiêu đề thẻ..."
                  : safeItem(rawItem).type === "badge"
                    ? "Ví dụ: Xe riêng 4-45 chỗ"
                    : "Điểm nổi bật... (dùng {price} để chèn giá vé)"
            }
            className="flex-1 min-w-0 bg-transparent text-xs text-slate-800 dark:text-slate-200 outline-none border-none placeholder:text-slate-400"
          />

          <button
            type="button"
            onClick={() => removeItem(index)}
            className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer border-none bg-transparent shrink-0"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

interface ComparisonKeyValueEditorProps {
  value: ComparisonComponentData;
  onChange: (data: ComparisonComponentData) => void;
}

export function ComparisonKeyValueEditor({
  value,
  onChange,
}: ComparisonKeyValueEditorProps) {
  const data = normalizeComparisonData(value);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-bold block">
            Tiêu đề khối so sánh
          </label>
          <input
            value={data.title}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            placeholder="So sánh hình thức di chuyển"
            className="w-full px-3 py-2 border-1 border-separator rounded-xl text-xs font-bold bg-slate-50/50 dark:bg-[var(--bg-card)] text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold block">
            Phụ đề lớn
          </label>
          <input
            value={data.subtitle}
            onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
            placeholder="Loại hình dịch vụ"
            className="w-full px-3 py-2 border-1 border-separator rounded-xl text-xs font-bold bg-slate-50/50 dark:bg-[var(--bg-card)] text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <Typography type="h4" className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
        Cấu hình 2 thẻ so sánh
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardEditor
          label="Thẻ Xe riêng (Private)"
          accent="accent"
          items={data.privateCard}
          onChange={(items) => onChange({ ...data, privateCard: items })}
        />
        <CardEditor
          label="Thẻ Xe ghép (Shared)"
          accent="amber"
          items={data.sharedCard}
          onChange={(items) => onChange({ ...data, sharedCard: items })}
        />
      </div>
    </div>
  );
}