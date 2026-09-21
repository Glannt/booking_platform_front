"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Trash2, Eye, Edit3, RefreshCw, Coins, AlertCircle, CheckCircle, XCircle, Plus
} from "lucide-react";
import { Button, SearchField, Table, toast, Tooltip, Pagination } from "@heroui/react";
import clsx from "clsx";

import {
  getCurrencies, deleteCurrency, syncCurrencyRates,
  CurrencyDto
} from "@/lib/api/currencies";
import { CurrencyCreateModal, CurrencyDetailModal } from "@/components/admin/currencies";
import { PageSizeSelect, AppStatusChip } from "@/components/common";
import { useI18n } from "@/context/LanguageContext";
import { headerColumns } from "@/config/headerColumns";

export default function CurrenciesPage() {
  const { t } = useI18n();
  const [currencies, setCurrencies] = useState<CurrencyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedCurrencies = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );
  const startItem = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, filtered.length);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

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
            className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
          >
            <Plus size={16} />
            <span>Thêm Tiền tệ</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
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
        <PageSizeSelect
          value={pageSize}
          onChange={(val) => {
            setPageSize(val);
            setPage(1);
          }}
        />
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
                  {headerColumns.currencies(t).map((col) => (
                    <Table.Column key={col.id} id={col.id} isRowHeader={col.isRowHeader} className={col.className}>
                      {col.value}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body>
                  {paginatedCurrencies.map((c) => (
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
                        <AppStatusChip status={c.active} />
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
                                onPress={() => { setSelectedCurrency(c); setDetailsDefaultEditMode(false); setDetailsModalOpen(true); }}
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
                                onPress={() => { setSelectedCurrency(c); setDetailsDefaultEditMode(true); setDetailsModalOpen(true); }}
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
                                onPress={() => handleDelete(c.id)}
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
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
            <Table.Footer>
              <Pagination size="sm">
                <Pagination.Summary>
                  {startItem} - {endItem} / {filtered.length} kết quả
                </Pagination.Summary>
                <Pagination.Content>
                  <Pagination.Item>
                    <Pagination.Previous
                      isDisabled={page <= 1}
                      onPress={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <Pagination.PreviousIcon /> Trước
                    </Pagination.Previous>
                  </Pagination.Item>
                  {pages.map((p) => (
                    <Pagination.Item key={p}>
                      <Pagination.Link
                        isActive={p === page}
                        onPress={() => setPage(p)}
                      >
                        {p}
                      </Pagination.Link>
                    </Pagination.Item>
                  ))}
                  <Pagination.Item>
                    <Pagination.Next
                      isDisabled={page >= totalPages}
                      onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Sau <Pagination.NextIcon />
                    </Pagination.Next>
                  </Pagination.Item>
                </Pagination.Content>
              </Pagination>
            </Table.Footer>
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
        <CurrencyDetailModal
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
