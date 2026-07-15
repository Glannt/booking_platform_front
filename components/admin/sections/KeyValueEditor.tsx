"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Input, Label } from "@heroui/react";
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
} from "lucide-react";

interface KeyValueEditorProps {
  value: string;
  onChange: (json: string) => void;
  sectionType?: string;
}

// ── Hints per section type ──────────────────────────────────────
const SECTION_HINTS: Record<string, { keys: string[]; description: string }> = {
  FEATURES: { keys: ["features"], description: "Mảng features với icon và key" },
  SLIDE_CARD: { keys: ["badgeTitle", "cards"], description: "badgeTitle (đa ngôn ngữ) và cards (mảng card)" },
  SLIDE_REVIEW: { keys: ["ratingSummary", "reviews"], description: "ratingSummary (string) và reviews (mảng đánh giá)" },
  INSPIRATION: { keys: ["items", "showInstagram", "instagramHandle"], description: "items (mảng), showInstagram (boolean), instagramHandle (string)" },
};

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

function getValueType(val: unknown): "string" | "number" | "boolean" | "object" | "array" | "empty" {
  if (val === undefined || val === null) return "empty";
  if (Array.isArray(val)) return "array";
  const t = typeof val;
  if (t === "string" || t === "number" || t === "boolean" || t === "object") return t as "string" | "number" | "boolean" | "object";
  return "string";
}

// ── Main editor ─────────────────────────────────────────────────
export function KeyValueEditor({ value, onChange, sectionType }: KeyValueEditorProps) {
  const [mode, setMode] = useState<"tree" | "json">("tree");
  const [treeData, setTreeData] = useState<Record<string, unknown>>({});
  const [rawJson, setRawJson] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [copied, setCopied] = useState(false);

  const hints = sectionType ? SECTION_HINTS[sectionType] : undefined;

  // Parse value → treeData on mount / external change
  useEffect(() => {
    const parsed = parseJsonSafe(value);
    if (mode === "tree") {
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

  const addKey = (key?: string) => {
    const newKey = key || prompt("Key name:");
    if (!newKey || treeData[newKey] !== undefined) return;
    syncTree({ ...treeData, [newKey]: "" });
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
        <Label className="text-sm font-bold">Content Data</Label>
        <div className="flex items-center gap-1">
          {mode === "json" && (
            <>
              <button
                type="button"
                onClick={() => setRawJson(prettyJson(rawJson))}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-accent transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Braces size={11} /> Format
              </button>
              <button
                type="button"
                onClick={copyJson}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-accent transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                {copied ? "Đã copy" : "Copy"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={mode === "tree" ? switchToJson : switchToTree}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-accent transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mode === "tree" ? <><Braces size={12} /> JSON</> : <><List size={12} /> Tree</>}
          </button>
        </div>
      </div>

      {hints && <p className="text-[10px] text-slate-400 font-medium">{hints.description}</p>}

      {/* Tree mode */}
      {mode === "tree" && (
        <div className="space-y-1.5">
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
            <div className="flex flex-wrap gap-1.5 pl-1">
              <span className="text-[10px] text-slate-400 font-bold self-center">Thêm:</span>
              {unusedHints.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => addKey(k)}
                  className="text-[10px] font-bold text-accent bg-accent/10 hover:bg-accent/20 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  + {k}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => addKey()}
            className="flex items-center gap-1.5 w-full justify-center py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-500 hover:text-accent hover:border-accent transition-colors cursor-pointer"
          >
            <Plus size={14} /> Thêm Key
          </button>
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
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-accent"
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

// ── Recursive TreeNode ──────────────────────────────────────────
interface TreeNodeProps {
  nodeKey: string;
  value: unknown;
  onChange: (val: unknown) => void;
  onRename: (newKey: string) => void;
  onRemove: () => void;
  depth: number;
}

function TreeNode({ nodeKey, value, onChange, onRename, onRemove, depth }: TreeNodeProps) {
  const vType = getValueType(value);
  const isExpandable = vType === "object" || vType === "array";
  const [expanded, setExpanded] = useState(depth < 1);

  // Expand when value changes from empty to non-empty
  useEffect(() => {
    if (isExpandable && !expanded) {
      if (vType === "object" && typeof value === "object" && value !== null && Object.keys(value as Record<string, unknown>).length > 0) {
        setExpanded(true);
      }
      if (vType === "array" && Array.isArray(value) && value.length > 0) {
        setExpanded(true);
      }
    }
  }, [value]);

  const depthColors = [
    "border-accent/30",
    "border-blue-400/30",
    "border-emerald-400/30",
    "border-purple-400/30",
    "border-amber-400/30",
  ];
  const borderColor = depthColors[depth % depthColors.length];

  return (
    <div className={`${depth > 0 ? `ml-3 pl-3 border-l-2 ${borderColor}` : ""}`}>
      {isExpandable ? (
        <ExpandableNode
          nodeKey={nodeKey}
          value={value}
          vType={vType}
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
          vType={vType}
          onChange={onChange}
          onRename={onRename}
          onRemove={onRemove}
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

  const addChild = () => {
    if (vType === "object") {
      const obj = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
      const newKey = `key${Object.keys(obj).length + 1}`;
      onChange({ ...obj, [newKey]: "" });
    } else {
      const arr = Array.isArray(value) ? value : [];
      onChange([...arr, ""]);
    }
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
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-2.5 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <Input
          value={nodeKey}
          onChange={(e) => onRename(e.target.value)}
          className="flex-1 max-w-[160px] text-xs font-mono font-bold"
        />

        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${vType === "array" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
          {vType === "array" ? `mảng[${childCount}]` : `obj{${childCount}}`}
        </span>

        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
        >
          <X size={13} />
        </button>
      </div>

      {/* Children */}
      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-1">
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
                  onRename={() => {}}
                  onRemove={() => removeChild(String(idx))}
                  depth={depth + 1}
                />
              ))}

          <button
            type="button"
            onClick={addChild}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-accent transition-colors cursor-pointer py-1"
          >
            <Plus size={11} />
            {vType === "array" ? "Thêm item" : "Thêm key"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Leaf node (string / number / boolean / empty) ──────────────
interface LeafNodeProps {
  nodeKey: string;
  value: unknown;
  vType: "string" | "number" | "boolean" | "empty";
  onChange: (val: unknown) => void;
  onRename: (newKey: string) => void;
  onRemove: () => void;
  depth: number;
}

function LeafNode({ nodeKey, value, vType, onChange, onRename, onRemove }: LeafNodeProps) {
  const strVal = value === undefined || value === null ? "" : String(value);
  const isMultiline = strVal.length > 60 || strVal.includes("\n");
  const rows = isMultiline ? Math.min(Math.max(2, Math.ceil(strVal.length / 50)), 6) : 1;

  const typeIcon = vType === "number" ? <Hash size={10} className="text-blue-400" />
    : vType === "boolean" ? <ToggleLeft size={10} className="text-emerald-400" />
    : null;

  return (
    <div className="flex items-start gap-1.5 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900/50 group">
      {typeIcon && <span className="mt-2 shrink-0">{typeIcon}</span>}

      <Input
        value={nodeKey}
        onChange={(e) => onRename(e.target.value)}
        className="max-w-[120px] text-xs font-mono font-bold shrink-0"
      />

      <span className="text-slate-300 dark:text-slate-600 mt-2 shrink-0">:</span>

      {vType === "boolean" ? (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-md transition-colors cursor-pointer mt-0.5 ${
            value
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          <ToggleLeft size={12} />
          {value ? "Có" : "Không"}
        </button>
      ) : isMultiline ? (
        <textarea
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="flex-1 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-accent min-w-0"
        />
      ) : (
        <Input
          value={strVal}
          onChange={(e) => onChange(vType === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
          className="flex-1 text-xs font-mono min-w-0"
        />
      )}

      <button
        type="button"
        onClick={onRemove}
        className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 shrink-0"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}
