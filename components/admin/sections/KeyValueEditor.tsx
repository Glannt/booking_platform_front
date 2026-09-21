"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Button,
  Input,
  Label,
  toast,
  Autocomplete,
  SearchField,
  ListBox,
  EmptyState,
  useFilter,
  Select,
  ColorPicker,
  ColorSwatch,
  ColorArea,
  ColorSlider,
  ColorField,
  parseColor,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { SvgIconPickerField } from "@/components/common/SvgIconPickerField";
import {
  Plus,
  X,
  Braces,
  List,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Hash,
  ToggleLeft,
  Trash2,
  Image as ImageIcon,
  FileText,
  Upload,
  Loader2,
  Sparkles,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import { uploadMedia } from "@/lib/api/media";
import { backendUrl } from "@/lib/api/client";
import {
  SECTION_HINTS,
  ITEM_SCHEMA_FACTORIES,
  ROOT_SCHEMA_FACTORIES,
  PAGE_SECTION_RECOMMENDATIONS,
  createEmptyText2,
  createEmptyText4,
  createEmptySlideCardItem,
  createEmptyFeatureItem,
  createEmptySlideReviewItem,
  createEmptyInspirationItem,
  createEmptyHeroBadge,
  createEmptyBookingStepItem,
  createEmptyPromoContent,
  createEmptyCTAContent,
  type TemplatePreset,
} from "@/lib/api/section-templates";

interface KeyValueEditorProps {
  value: string;
  onChange: (json: string) => void;
  sectionType?: string;
  pagePath?: string;
}

// ── Helpers ─────────────────────────────────────────────────────
function parseJsonSafe(json: string): unknown {
  try { return JSON.parse(json); } catch { return undefined; }
}

function toJson(val: unknown): string {
  if (val === undefined) return "";
  return JSON.stringify(val, null, 2);
}

function prettyJson(json: string): string {
  try { return JSON.stringify(JSON.parse(json), null, 2); } catch { return json; }
}

function safeParseColor(colorStr?: string, defaultHex: string = "#ffffff") {
  try {
    return parseColor(colorStr || defaultHex);
  } catch {
    return parseColor(defaultHex);
  }
}

const COLOR_KEY_LABELS: Record<string, string> = {
  iconBg: "Nền icon (Sáng)",
  iconBgDark: "Nền icon (Tối)",
  iconColor: "Màu icon (Sáng)",
  iconColorDark: "Màu icon (Tối)",
  titleColor: "Màu tiêu đề (Sáng)",
  titleColorDark: "Màu tiêu đề (Tối)",
  descColor: "Màu mô tả (Sáng)",
  descColorDark: "Màu mô tả (Tối)",
};

function isImageKey(nodeKey?: string): boolean {
  if (!nodeKey) return false;
  const k = nodeKey.toLowerCase();
  return k.includes("image") || k.includes("img") || k.includes("avatar") || k.includes("banner") || k.includes("iconurl") || k.includes("logo");
}

function isImageField(val: unknown, nodeKey?: string): boolean {
  if (isImageKey(nodeKey)) return true;
  if (typeof val !== "string") return false;
  const s = val.trim();
  if (
    (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) &&
    (/\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(s) ||
      s.includes("images.unsplash.com") ||
      s.includes("res.cloudinary.com") ||
      s.includes("/uploads/"))
  ) {
    return true;
  }
  return false;
}

function getValueType(val: unknown, nodeKey?: string): "string" | "number" | "boolean" | "image" | "object" | "array" | "empty" {
  if (val === undefined || val === null) {
    return isImageKey(nodeKey) ? "image" : "empty";
  }
  if (Array.isArray(val)) return "array";
  const t = typeof val;
  if (t === "number" || t === "boolean" || t === "object") return t as "number" | "boolean" | "object";
  if (t === "string") {
    if (isImageField(val, nodeKey)) return "image";
    return "string";
  }
  return "string";
}

interface DebouncedInputProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}

function DebouncedInput({ value, onChange, className, placeholder }: DebouncedInputProps) {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  useEffect(() => {
    if (localVal === value) return;
    const timer = setTimeout(() => {
      onChange(localVal);
    }, 100);
    return () => clearTimeout(timer);
  }, [localVal, onChange, value]);

  const handleBlur = () => {
    if (localVal !== value) {
      onChange(localVal);
    }
  };

  return (
    <Input
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
    />
  );
}

interface DebouncedTextareaProps {
  value: string;
  onChange: (val: string) => void;
  rows?: number;
  className?: string;
}

function DebouncedTextarea({ value, onChange, rows, className }: DebouncedTextareaProps) {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  useEffect(() => {
    if (localVal === value) return;
    const timer = setTimeout(() => {
      onChange(localVal);
    }, 300);
    return () => clearTimeout(timer);
  }, [localVal, onChange, value]);

  const handleBlur = () => {
    if (localVal !== value) {
      onChange(localVal);
    }
  };

  return (
    <textarea
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={handleBlur}
      rows={rows}
      className={className}
    />
  );
}

// ── Main editor ─────────────────────────────────────────────────
export function KeyValueEditor({ value, onChange, sectionType, pagePath }: KeyValueEditorProps) {
  const [mode, setMode] = useState<"tree" | "json">("tree");
  const [treeData, setTreeData] = useState<Record<string, unknown>>({});
  const [rawJson, setRawJson] = useState(value ? prettyJson(value) : "");
  const [jsonError, setJsonError] = useState("");
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [copied, setCopied] = useState(false);

  const hints = sectionType ? SECTION_HINTS[sectionType] : undefined;

  // Sync parent → local
  useEffect(() => {
    if (mode === "tree") {
      const parsed = parseJsonSafe(value);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        setTreeData(parsed as Record<string, unknown>);
      } else {
        setTreeData({});
      }
    } else {
      setRawJson(value ? prettyJson(value) : "");
    }
  }, [value, mode]);

  // Sync tree → parent
  const syncTree = useCallback(
    (data: Record<string, unknown>) => {
      setTreeData(data);
      const keys = Object.keys(data).filter((k) => k.trim());
      if (keys.length === 0) {
        onChange("");
      } else {
        const clean: Record<string, unknown> = {};
        for (const k of keys) clean[k] = data[k];
        onChange(toJson(clean));
      }
    },
    [onChange]
  );

  const updateKey = (oldKey: string, newKey: string) => {
    const entries = Object.entries(treeData);
    const idx = entries.findIndex(([k]) => k === oldKey);
    if (idx === -1) return;
    entries[idx] = [newKey, entries[idx][1]];
    const obj: Record<string, unknown> = {};
    for (const [k, v] of entries) obj[k] = v;
    syncTree(obj);
  };

  const updateValue = (key: string, val: unknown) => {
    syncTree({ ...treeData, [key]: val });
  };

  const removeKey = (key: string) => {
    const { [key]: _, ...rest } = treeData;
    syncTree(rest);
  };

  const addKeyWithTemplate = (key: string) => {
    if (treeData[key] !== undefined) {
      toast.danger("Key đã tồn tại!");
      return;
    }
    const factory = ROOT_SCHEMA_FACTORIES[key];
    const defaultVal = factory ? factory() : "";
    syncTree({ ...treeData, [key]: defaultVal });
    setNewKeyName("");
    setShowAddKey(false);
  };

  const addKey = (key?: string) => {
    const newKey = key || newKeyName.trim();
    if (!newKey) return;
    if (treeData[newKey] !== undefined) {
      toast.danger("Key đã tồn tại!");
      return;
    }
    const factory = ROOT_SCHEMA_FACTORIES[newKey];
    const defaultVal = factory ? factory() : "";
    syncTree({ ...treeData, [newKey]: defaultVal });
    setNewKeyName("");
    setShowAddKey(false);
  };

  // ── JSON mode ──
  const switchToJson = () => {
    setRawJson(toJson(treeData));
    setJsonError("");
    setMode("json");
  };

  const switchToTree = () => {
    const parsed = parseJsonSafe(rawJson);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      setJsonError("Phải là JSON object { key: value }");
      return;
    }
    setTreeData(parsed as Record<string, unknown>);
    setJsonError("");
    onChange(rawJson);
    setMode("tree");
  };

  const handleJsonChange = (newRaw: string) => {
    setRawJson(newRaw);
    setJsonError("");
    const parsed = parseJsonSafe(newRaw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      onChange(newRaw);
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(rawJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const keys = Object.keys(treeData).filter((k) => k.trim() !== "");
  const unusedHints = hints?.keys.filter((k) => !keys.includes(k)) || [];

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-bold">Dữ liệu nội dung</Label>
        <div className="flex items-center gap-1">
          {mode === "json" && (
            <>
              <button
                type="button"
                onClick={() => setRawJson(prettyJson(rawJson))}
                className="flex items-center gap-1 text-[10px] font-bold text-foreground/70 hover:text-accent transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-default-100 dark:hover:bg-[var(--bg-card)]"
              >
                <Braces size={11} /> Format
              </button>
              <button
                type="button"
                onClick={copyJson}
                className="flex items-center gap-1 text-[10px] font-bold text-foreground/70 hover:text-accent transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-default-100 dark:hover:bg-[var(--bg-card)]"
              >
                {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                {copied ? "Đã copy" : "Copy"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={mode === "tree" ? switchToJson : switchToTree}
            className="flex items-center gap-1 text-[10px] font-bold text-foreground/70 hover:text-accent transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-default-100 dark:hover:bg-[var(--bg-card)]"
          >
            {mode === "tree" ? <><Braces size={12} /> JSON</> : <><List size={12} /> Tree</>}
          </button>
        </div>
      </div>

      {hints && <p className="text-[10px] text-foreground/60 font-medium">{hints.description}</p>}

      {/* Tree mode */}
      {mode === "tree" && (
        <div className="space-y-2">
          {keys.map((key) => (
            <TreeNode
              key={key}
              nodeKey={key}
              value={treeData[key]}
              onChange={(val) => updateValue(key, val)}
              onRename={(newKey) => updateKey(key, newKey)}
              onRemove={() => removeKey(key)}
              depth={0}
            />
          ))}

          {unusedHints.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-default-50 dark:bg-[var(--bg-card)]/50 rounded-md border border-divider">
              <span className="text-[10px] text-foreground/60 font-bold self-center">Gợi ý schema chuẩn:</span>
              {unusedHints.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => addKeyWithTemplate(k)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/10 hover:bg-accent hover:text-accent-foreground px-2.5 py-1 rounded-md transition-all cursor-pointer border border-accent/20"
                >
                  <Sparkles size={11} /> + {k} (Schema)
                </button>
              ))}
            </div>
          )}

          {showAddKey ? (
            <div className="flex items-center gap-2 p-2 bg-default-50 dark:bg-[var(--bg-muted)] rounded-md border border-divider">
              <Input
                placeholder="Tên key mới..."
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addKey();
                  if (e.key === "Escape") { setShowAddKey(false); setNewKeyName(""); }
                }}
                autoFocus
                className="flex-1 rounded-md"
              />
              <Button
                size="sm"
                className="bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs rounded-xl border-none shadow-sm cursor-pointer"
                onClick={() => addKey()}
              >
                Thêm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs rounded-md"
                onClick={() => { setShowAddKey(false); setNewKeyName(""); }}
              >
                Hủy
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddKey(true)}
              className="flex items-center gap-1.5 w-full justify-center py-2 rounded-md border border-dashed border-divider text-xs font-bold text-foreground/70 hover:text-accent hover:border-accent transition-colors cursor-pointer bg-transparent"
            >
              <Plus size={14} /> Thêm Key tùy chỉnh
            </button>
          )}
        </div>
      )}

      {/* JSON mode */}
      {mode === "json" && (
        <div className="space-y-1">
          <textarea
            value={rawJson}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={12}
            placeholder='{ "key": "value" }'
            className="w-full px-3 py-2 rounded-md border-1 border-separator bg-white dark:bg-[var(--bg-surface)] text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {jsonError && (
            <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
              <AlertTriangle size={11} /> {jsonError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface TypeSelectorProps {
  value: string;
  onChange: (type: string) => void;
  className?: string;
}

function TypeSelector({ value, onChange, className = "" }: TypeSelectorProps) {
  const types = [
    { value: "string", label: "Text", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" },
    { value: "image", label: "Ảnh", color: "text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400" },
    { value: "number", label: "Số", color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400" },
    { value: "boolean", label: "Boolean", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { value: "object", label: "Object", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400" },
    { value: "array", label: "Mảng", color: "text-pink-600 bg-pink-50 dark:bg-pink-900/30 dark:text-pink-400" },
  ];

  const current = types.find((t) => t.value === value) || types[0];

  return (
    <Popover>
      <PopoverTrigger>
        <button
          type="button"
          className={`text-[9px] font-black px-2 py-0.5 rounded-md cursor-pointer border-none flex items-center gap-1 transition-all ${current.color} hover:opacity-85 select-none`}
        >
          {current.label.toUpperCase()}
          <span className="text-[6px] opacity-70">▼</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-1 w-24 bg-white dark:bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-md shadow-xl">
        <div className="flex flex-col gap-0.5">
          {types.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange(t.value)}
              className={`text-[10px] font-bold px-2 py-1 rounded text-left transition-colors cursor-pointer border-none ${value === t.value
                  ? `${t.color} font-black`
                  : "text-foreground/70 hover:bg-default-100 dark:hover:bg-[var(--bg-card)]"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Tree node (recursive) ──────────────────────────────────────
interface TreeNodeProps {
  nodeKey: string;
  value: unknown;
  onChange: (val: unknown) => void;
  onRename: (newKey: string) => void;
  onRemove: () => void;
  depth: number;
}

function TreeNode({ nodeKey, value, onChange, onRename, onRemove, depth }: TreeNodeProps) {
  const [explicitType, setExplicitType] = useState<string | null>(null);
  const detectedType = getValueType(value, nodeKey);
  const vType = explicitType || detectedType;
  const isExpandable = vType === "object" || vType === "array";
  const [expanded, setExpanded] = useState(true);

  const depthColors = [
    "border-accent/30",
    "border-blue-400/30",
    "border-emerald-400/30",
    "border-purple-400/30",
    "border-amber-400/30",
  ];
  const borderColor = depthColors[depth % depthColors.length];

  const handleTypeChange = (newType: string) => {
    setExplicitType(newType);
    if (newType === "string" || newType === "image") {
      onChange(typeof value === "string" ? value : String(value ?? ""));
    } else if (newType === "number") {
      const num = Number(value);
      onChange(!isNaN(num) ? num : 0);
    } else if (newType === "boolean") {
      onChange(Boolean(value));
    } else if (newType === "object") {
      onChange(typeof value === "object" && value !== null && !Array.isArray(value) ? value : {});
    } else if (newType === "array") {
      onChange(Array.isArray(value) ? value : []);
    }
  };

  return (
    <div className={`${depth > 0 ? `ml-3 pl-3 border-l-2 ${borderColor}` : ""}`}>
      {isExpandable ? (
        <ExpandableNode
          nodeKey={nodeKey}
          value={value}
          vType={vType as "object" | "array"}
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
          onChange={onChange}
          onRename={onRename}
          onRemove={onRemove}
          depth={depth}
        />
      ) : (
        <LeafNode
          nodeKey={nodeKey}
          value={value}
          vType={vType as "string" | "number" | "boolean" | "image" | "empty"}
          onChange={onChange}
          onRename={onRename}
          onRemove={onRemove}
          onTypeChange={handleTypeChange}
          depth={depth}
        />
      )}
    </div>
  );
}

// ── Expandable node (object / array) ───────────────────────────
interface ExpandableNodeProps {
  nodeKey: string;
  value: unknown;
  vType: "object" | "array";
  expanded: boolean;
  onToggle: () => void;
  onChange: (val: unknown) => void;
  onRename: (newKey: string) => void;
  onRemove: () => void;
  depth: number;
}

function ExpandableNode({ nodeKey, value, vType, expanded, onToggle, onChange, onRename, onRemove, depth }: ExpandableNodeProps) {
  const entries = vType === "object" && typeof value === "object" && value !== null
    ? Object.entries(value as Record<string, unknown>)
    : [];
  const arrItems = vType === "array" && Array.isArray(value) ? value : [];

  const itemPresets = ITEM_SCHEMA_FACTORIES[nodeKey] || [];

  const addChild = () => {
    if (vType === "object") {
      const obj = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
      const newKey = `key${Object.keys(obj).length + 1}`;
      onChange({ ...obj, [newKey]: "" });
    } else {
      const arr = Array.isArray(value) ? value : [];
      let newItem: any = "";
      if (itemPresets.length > 0) {
        newItem = itemPresets[0].factory();
      }
      onChange([...arr, newItem]);
    }
    if (!expanded) onToggle();
  };

  const addPresetItem = (factory: () => any) => {
    const arr = Array.isArray(value) ? value : [];
    onChange([...arr, factory()]);
    if (!expanded) onToggle();
  };

  const addPresetKey = (newKey: string, defaultValue: any) => {
    const obj = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
    const copy = typeof defaultValue === "object" && defaultValue !== null ? JSON.parse(JSON.stringify(defaultValue)) : defaultValue;
    onChange({ ...obj, [newKey]: copy });
    if (!expanded) onToggle();
  };

  const removeChild = (childKey: string) => {
    if (vType === "object") {
      const obj = (value as Record<string, unknown>) || {};
      const { [childKey]: _, ...rest } = obj;
      onChange(rest);
    } else {
      const idx = parseInt(childKey);
      const arr = [...(Array.isArray(value) ? value : [])];
      arr.splice(idx, 1);
      onChange(arr);
    }
  };

  const updateChild = (childKey: string, childVal: unknown) => {
    if (vType === "object") {
      onChange({ ...(value as Record<string, unknown>), [childKey]: childVal });
    } else {
      const idx = parseInt(childKey);
      const arr = [...(Array.isArray(value) ? value : [])];
      arr[idx] = childVal;
      onChange(arr);
    }
  };

  const renameChild = (oldKey: string, newKey: string) => {
    if (vType === "object") {
      const obj = value as Record<string, unknown>;
      const entries = Object.entries(obj);
      const idx = entries.findIndex(([k]) => k === oldKey);
      if (idx === -1) return;
      entries[idx] = [newKey, entries[idx][1]];
      const result: Record<string, unknown> = {};
      for (const [k, v] of entries) result[k] = v;
      onChange(result);
    }
  };

  const childCount = vType === "object" ? entries.length : arrItems.length;

  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[var(--bg-card)]/30 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-2.5 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="p-0.5 rounded text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <Input
          value={nodeKey}
          onChange={(e) => onRename(e.target.value)}
          className="flex-1 max-w-[160px] text-xs font-mono font-bold rounded-md"
        />

        <TypeSelector
          value={vType}
          onChange={(t) => {
            if (t === "string" || t === "image") onChange("");
            else if (t === "number") onChange(0);
            else if (t === "boolean") onChange(true);
            else if (t === "object") onChange({});
            else if (t === "array") onChange([]);
          }}
        />

        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${vType === "array" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
          {vType === "array" ? `mảng[${childCount}]` : `obj{${childCount}}`}
        </span>

        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded text-foreground/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
        >
          <X size={13} />
        </button>
      </div>

      {/* Children */}
      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-1.5">
          {vType === "object"
            ? entries.map(([k, v]) => (
              <TreeNode
                key={k}
                nodeKey={k}
                value={v}
                onChange={(val) => updateChild(k, val)}
                onRename={(newKey) => renameChild(k, newKey)}
                onRemove={() => removeChild(k)}
                depth={depth + 1}
              />
            ))
            : arrItems.map((item, idx) => (
              <TreeNode
                key={idx}
                nodeKey={String(idx)}
                value={item}
                onChange={(val) => updateChild(String(idx), val)}
                onRename={() => { }}
                onRemove={() => removeChild(String(idx))}
                depth={depth + 1}
              />
            ))}

          {/* Template Badges & Add buttons */}
          {vType === "array" ? (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400">Gợi ý schema:</span>
                {itemPresets.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => addPresetItem(preset.factory)}
                    title={preset.description}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer border border-accent/20"
                  >
                    <Sparkles size={10} />
                    + {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => addPresetItem(createEmptyText4)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition-all cursor-pointer border border-purple-200 dark:border-purple-800"
                >
                  <Sparkles size={10} />
                  + Đa ngữ (4 ngôn ngữ: VI/EN/KO/RU)
                </button>
                <button
                  type="button"
                  onClick={addChild}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-default-100 text-foreground/80 dark:bg-[var(--bg-card)] hover:bg-default-200 transition-all cursor-pointer"
                >
                  <Plus size={10} /> Item trống
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-divider space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    let defaultVal: any = "";
                    ["vi", "en", "ko", "ru"].forEach(lang => addPresetKey(lang, defaultVal));
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition-all cursor-pointer border border-purple-200 dark:border-purple-800"
                >
                  <Sparkles size={10} />
                  + Đa ngữ (4 ngôn ngữ: VI/EN/KO/RU)
                </button>
                <button
                  type="button"
                  onClick={addChild}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-default-100 text-foreground/80 dark:bg-[var(--bg-card)] hover:bg-default-200 transition-all cursor-pointer"
                >
                  <Plus size={10} /> Thêm key
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Leaf node (string / number / boolean / image / empty) ──────
interface LeafNodeProps {
  nodeKey: string;
  value: unknown;
  vType: "string" | "number" | "boolean" | "image" | "empty";
  onChange: (val: unknown) => void;
  onRename: (newKey: string) => void;
  onRemove: () => void;
  onTypeChange: (newType: string) => void;
  depth: number;
}

function LeafNode({ nodeKey, value, vType, onChange, onRename, onRemove, onTypeChange }: LeafNodeProps) {
  const { contains } = useFilter({ sensitivity: "base" });
  const rawStr = value === undefined || value === null ? "" : String(value);
  const [tmpVal, setTmpVal] = useState<string>(rawStr);
  const [uploading, setUploading] = useState(false);
  const [previewZoomOpen, setPreviewZoomOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync external value when changed outside
  useEffect(() => {
    setTmpVal(value === undefined || value === null ? "" : String(value));
  }, [value]);

  const commitValue = (valToCommit?: string) => {
    const val = valToCommit !== undefined ? valToCommit : tmpVal;
    if (vType === "number") {
      const num = Number(val);
      onChange(isNaN(num) ? 0 : num);
    } else {
      onChange(val);
    }
  };

  const isMultiline = tmpVal.length > 60 || tmpVal.includes("\n");
  const rows = isMultiline ? Math.min(Math.max(2, Math.ceil(tmpVal.length / 50)), 6) : 1;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      try {
        const file = e.target.files[0];
        const result = await uploadMedia(file, nodeKey || "Section Image");
        const mediaObj = result.data?.media || (result as any).media;
        const filePath = mediaObj?.filePath;
        if (filePath) {
          const url = filePath.startsWith("http") ? filePath : `${backendUrl}${filePath}`;
          setTmpVal(url);
          commitValue(url);
          toast.success("Tải ảnh lên thành công");
        } else {
          toast.danger("Tải lên thất bại");
        }
      } catch (err) {
        console.error("Upload error:", err);
        toast.danger("Có lỗi xảy ra khi tải ảnh lên");
      } finally {
        setUploading(false);
      }
    }
  };

  const isColorKey = !!COLOR_KEY_LABELS[nodeKey];
  const typeIcon = vType === "number" ? <Hash size={10} className="text-purple-400" />
    : vType === "boolean" ? <ToggleLeft size={10} className="text-emerald-400" />
      : vType === "image" ? <ImageIcon size={10} className="text-rose-400" />
        : null;

  const fullImageUrl = tmpVal.startsWith("http") ? tmpVal : `${backendUrl}${tmpVal}`;

  return (
    <div className="flex items-start gap-1.5 p-2 rounded-md border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-[var(--bg-surface)]/50 group">
      {typeIcon && !isColorKey && <span className="mt-2 shrink-0">{typeIcon}</span>}

      {isColorKey ? (
        <span className="text-xs font-bold text-slate-700 dark:text-slate-350 min-w-[120px] shrink-0 mt-2 select-none">
          {COLOR_KEY_LABELS[nodeKey]}
        </span>
      ) : (
        <DebouncedInput
          value={nodeKey}
          onChange={onRename}
          className="max-w-[120px] text-xs font-mono font-bold shrink-0 rounded-md"
        />
      )}

      {!isColorKey && (
        <TypeSelector
          value={vType}
          onChange={onTypeChange}
          className="mt-1"
        />
      )}

      <span className="text-foreground/30 mt-2 shrink-0">:</span>

      {isColorKey ? (
        <div className="flex-grow max-w-[200px] mt-0.5">
          <ColorPicker
            value={safeParseColor(tmpVal, "#ffffff")}
            onChange={(color) => {
              const hex = color.toString("css");
              setTmpVal(hex);
              commitValue(hex);
            }}
          >
            <ColorPicker.Trigger className="flex items-center gap-1.5 px-2.5 h-7 rounded-md border border-divider bg-white dark:bg-black cursor-pointer w-full justify-between">
              <div className="flex items-center gap-1.5">
                <ColorSwatch size="xs" color={safeParseColor(tmpVal, "#ffffff")} />
                <span className="text-[10px] font-bold text-foreground/80">{tmpVal || "#ffffff"}</span>
              </div>
            </ColorPicker.Trigger>
            <ColorPicker.Popover className="gap-2 p-3 bg-white dark:bg-black border border-divider shadow-xl rounded-md z-50">
              <ColorArea aria-label="Vùng chọn màu" className="max-w-full h-32 rounded-md" colorSpace="hsb" xChannel="saturation" yChannel="brightness">
                <ColorArea.Thumb />
              </ColorArea>
              <ColorSlider aria-label="Tông màu (Hue)" channel="hue" className="w-full" colorSpace="hsb">
                <Label className="text-[10px] font-bold">Tông màu (Hue)</Label>
                <ColorSlider.Track>
                  <ColorSlider.Thumb />
                </ColorSlider.Track>
              </ColorSlider>
              <ColorSlider aria-label="Độ mờ (Opacity)" channel="alpha" className="w-full">
                <Label className="text-[10px] font-bold">Độ mờ (Opacity)</Label>
                <ColorSlider.Track>
                  <ColorSlider.Thumb />
                </ColorSlider.Track>
              </ColorSlider>
              <ColorField aria-label="Trực tiếp" className="w-full">
                <ColorField.Group variant="secondary">
                  <ColorField.Prefix>
                    <ColorSwatch size="xs" />
                  </ColorField.Prefix>
                  <ColorField.Input className="text-xs rounded-md" />
                </ColorField.Group>
              </ColorField>
            </ColorPicker.Popover>
          </ColorPicker>
        </div>
      ) : vType === "boolean" ? (
        <button
          type="button"
          onClick={() => {
            const next = !value;
            onChange(next);
          }}
          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-md transition-colors cursor-pointer mt-0.5 ${value
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-slate-100 text-slate-500 dark:bg-[var(--bg-card)] dark:text-slate-400"
            }`}
        >
          <ToggleLeft size={12} />
          {value ? "Có" : "Không"}
        </button>
      ) : nodeKey === "icon" && (vType === "string" || vType === "empty") ? (
        <div className="flex-1 min-w-[240px]">
          <SvgIconPickerField
            value={tmpVal}
            onChange={(val) => {
              setTmpVal(val);
              commitValue(val);
            }}
            compact={true}
            label="Biểu tượng (Raw SVG text)"
            placeholder="Dán mã SVG (<svg ...>...</svg>) vào đây..."
          />
        </div>
      ) : vType === "image" ? (
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {tmpVal && (tmpVal.startsWith("http") || tmpVal.startsWith("/")) ? (
              <div className="relative group/thumb shrink-0">
                <div
                  onClick={() => setPreviewZoomOpen(true)}
                  className="w-12 h-12 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[var(--bg-card)] cursor-zoom-in relative"
                  title="Nhấn để phóng to hình ảnh"
                >
                  <img src={fullImageUrl} alt={nodeKey} className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-200" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                    <Maximize2 size={12} className="text-white drop-shadow" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTmpVal("");
                    commitValue("");
                  }}
                  className="absolute -top-1 -right-1 p-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition-colors"
                  title="Xóa ảnh"
                >
                  <X size={8} />
                </button>
              </div>
            ) : null}

            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <Input
                value={tmpVal}
                onChange={(e) => setTmpVal(e.target.value)}
                onBlur={() => commitValue()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitValue();
                }}
                className="flex-1 text-xs font-mono min-w-0 rounded-md"
                placeholder="Dán URL hình ảnh..."
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-2.5 h-8 rounded-md bg-default-100 dark:bg-[var(--bg-card)] hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground text-foreground text-xs font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer border border-divider"
                title="Tải ảnh từ máy tính"
              >
                {uploading ? <Loader2 size={12} className="animate-spin text-accent" /> : <Upload size={12} />}
                <span>{uploading ? "Tải lên..." : "Tải ảnh"}</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Lightbox Modal phóng to ảnh */}
          {previewZoomOpen && (
            <div
              className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setPreviewZoomOpen(false)}
            >
              <div
                className="relative max-w-4xl max-h-[90vh] bg-zinc-900 border border-zinc-700 rounded-md overflow-hidden shadow-2xl flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-950 text-white">
                  <div className="flex items-center gap-2 truncate max-w-[600px]">
                    <ImageIcon size={14} className="text-rose-400 shrink-0" />
                    <span className="text-xs font-mono font-bold truncate">{nodeKey}: {fullImageUrl}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={fullImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Mở tab mới"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => setPreviewZoomOpen(false)}
                      className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Đóng"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4 max-h-[75vh] overflow-auto flex items-center justify-center bg-black/40">
                  <img
                    src={fullImageUrl}
                    alt={nodeKey}
                    className="max-w-full max-h-[70vh] object-contain rounded-md shadow-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : isMultiline ? (
        <textarea
          value={tmpVal}
          onChange={(e) => setTmpVal(e.target.value)}
          onBlur={() => commitValue()}
          rows={rows}
          className="flex-1 px-2 py-1 rounded-md border-1 border-separator bg-transparent text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-accent min-w-0"
        />
      ) : (
        <Input
          value={tmpVal}
          onChange={(e) => setTmpVal(e.target.value)}
          onBlur={() => commitValue()}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitValue();
          }}
          className="flex-1 text-xs font-mono min-w-0 rounded-md"
        />
      )}

      {!isColorKey && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 shrink-0"
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}
