"use client";

import React, { useState, useEffect } from "react";
import {
  Trash2, Eye, Edit3, RefreshCw, Coins, AlertCircle, CheckCircle, XCircle, Plus
} from "lucide-react";
import { Button, SearchField, Table, toast } from "@heroui/react";
import clsx from "clsx";

import {
  getCurrencies, deleteCurrency, syncCurrencyRates,
  CurrencyDto
} from "@/lib/api/currencies";
import CurrencyCreateModal from "@/components/admin/currencies/CurrencyCreateModal";
import CurrencyDetailsModal from "@/components/admin/currencies/CurrencyDetailsModal";

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<CurrencyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [syncing, setSyncing] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyDto | null>(null);
  const [detailsDefaultEditMode, setDetailsDefaultEditMode] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    if (type === "success") toast.success(message);
    else toast.danger(message);
  };

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const data = await getCurrencies();
      setCurrencies(data);
    } catch (err) {
      console.error("Error loading currencies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCurrencies(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa loại tiền tệ này?")) return;
    try {
      await deleteCurrency(id);
      setCurrencies(prev => prev.filter(c => c.id !== id));
      showToast("Đã xóa!", "success");
    } catch {
      showToast("Xóa thất bại", "error");
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const updated = await syncCurrencyRates();
      if (Array.isArray(updated)) {
        setCurrencies(updated);
      } else {
        await fetchCurrencies();
      }
      showToast("Đã đồng bộ tỉ giá!", "success");
    } catch {
      showToast("Đồng bộ thất bại", "error");
    } finally {
      setSyncing(false);
    }
  };

  const filtered = currencies.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q) ||
      c.translations.some(t => t.name.toLowerCase().includes(q))
    );
  });

  const getLocalizedName = (c: CurrencyDto) => {
    const trans = c.translations.find(t => t.locale === "vi") || c.translations[0];
    return trans?.name || c.code;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Coins size={24} /> Loại Tiền Tệ
          </h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý tỉ giá và hiển thị giá theo ngôn ngữ</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSync}
            isDisabled={syncing}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 border-none cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Đang đồng bộ..." : "Đồng bộ tỉ giá"}
          </Button>
          <Button
            onClick={() => { setSelectedCurrency(null); setCreateModalOpen(true); }}
            className="bg-accent hover:bg-accent-hover text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 border-none cursor-pointer"
          >
            <Plus size={14} /> Thêm mới
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-md">
          <SearchField
            name="search_currency"
            value={searchTerm}
            onChange={(e: string) => setSearchTerm(e)}
            fullWidth
            className="min-w-[200px]"
          >
            <SearchField.Group className="rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-transparent text-slate-805 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold">
              <SearchField.SearchIcon />
              <SearchField.Input className="w-full" placeholder="Tìm mã, ký hiệu, tên..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 text-sm">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
          <AlertCircle size={32} />
          <span>Không tìm thấy loại tiền tệ nào</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Currencies table">
                <Table.Header>
                  <Table.Column id="code" isRowHeader>Mã</Table.Column>
                  <Table.Column id="symbol">Ký hiệu</Table.Column>
                  <Table.Column id="name">Tên (VI)</Table.Column>
                  <Table.Column id="rate">1 Đơn vị = VND</Table.Column>
                  <Table.Column id="status">Trạng thái</Table.Column>
                  <Table.Column id="actions" width={120}>Thao tác</Table.Column>
                </Table.Header>
                <Table.Body>
                  {filtered.map((c) => (
                    <Table.Row key={c.id} id={String(c.id)}>
                      <Table.Cell>
                        <span className="font-mono font-bold text-sm">{c.code}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-lg">{c.symbol}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{getLocalizedName(c)}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="font-mono text-sm font-bold text-amber-600">
                          {c.rateToVnd.toLocaleString("vi-VN")} ₫
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        {c.active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                            <CheckCircle size={10} /> Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            <XCircle size={10} /> Tắt
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setSelectedCurrency(c); setDetailsDefaultEditMode(false); setDetailsModalOpen(true); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 cursor-pointer border-none bg-transparent"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => { setSelectedCurrency(c); setDetailsDefaultEditMode(true); setDetailsModalOpen(true); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 cursor-pointer border-none bg-transparent"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 cursor-pointer border-none bg-transparent"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>
      )}

      <CurrencyCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSaveSuccess={(newCurrency) => {
          if (newCurrency) setCurrencies(prev => [...prev, newCurrency]);
          setCreateModalOpen(false);
          showToast("Tạo thành công!", "success");
        }}
        showToast={showToast}
      />

      {selectedCurrency && (
        <CurrencyDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => { setDetailsModalOpen(false); setSelectedCurrency(null); }}
          currency={selectedCurrency}
          defaultEditMode={detailsDefaultEditMode}
          onSaveSuccess={(updated) => {
            if (updated) setCurrencies(prev => prev.map(c => c.id === updated.id ? updated : c));
            setDetailsModalOpen(false);
            setSelectedCurrency(null);
            showToast("Cập nhật thành công!", "success");
          }}
          onDeleteSuccess={(id) => {
            setCurrencies(prev => prev.filter(c => c.id !== id));
            setDetailsModalOpen(false);
            setSelectedCurrency(null);
            showToast("Đã xóa!", "success");
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
