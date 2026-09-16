"use client";

import React, { useState, useEffect } from "react";
import {
  Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalCloseTrigger, ModalHeader, ModalBody, ModalFooter,
  Button, TextField, Input, Label, Switch
} from "@heroui/react";
import { Save, Trash2, Edit3, RefreshCw } from "lucide-react";

import { updateCurrency, deleteCurrency, CurrencyDto, CurrencyTranslationDto } from "@/lib/api/currencies";

interface CurrencyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyDto;
  defaultEditMode?: boolean;
  onSaveSuccess: (updated?: CurrencyDto) => void;
  onDeleteSuccess: (id: number) => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

const LOCALES = ["vi", "en", "ko", "ru"];
const LOCALE_FLAGS: Record<string, string> = { vi: "🇻🇳", en: "🇬🇧", ko: "🇰🇷", ru: "🇷🇺" };

export default function CurrencyDetailModal({
  isOpen, onClose, currency, defaultEditMode = false,
  onSaveSuccess, onDeleteSuccess, showToast
}: CurrencyDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFormLocale, setActiveFormLocale] = useState("vi");

  const [code, setCode] = useState("");
  const [symbol, setSymbol] = useState("");
  const [rateToVnd, setRateToVnd] = useState("");
  const [active, setActive] = useState(true);
  const [translations, setTranslations] = useState<CurrencyTranslationDto[]>([]);

  useEffect(() => {
    if (isOpen && currency) {
      setCode(currency.code);
      setSymbol(currency.symbol);
      setRateToVnd(String(currency.rateToVnd));
      setActive(currency.active);
      // Deep copy translations, ensure all 4 locales exist
      const existing = currency.translations || [];
      const filled = LOCALES.map(loc => {
        const found = existing.find(t => t.locale === loc);
        return found ? { ...found } : { locale: loc, name: "" };
      });
      setTranslations(filled);
      setActiveFormLocale("vi");
      setIsEditMode(defaultEditMode);
    }
  }, [isOpen, currency, defaultEditMode]);

  const handleTranslationNameChange = (val: string) => {
    setTranslations(prev =>
      prev.map(t => t.locale === activeFormLocale ? { ...t, name: val } : t)
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!code.trim()) {
      showToast("Mã tiền tệ là bắt buộc!", "error");
      return;
    }
    if (!rateToVnd || isNaN(Number(rateToVnd)) || Number(rateToVnd) <= 0) {
      showToast("Tỉ giá phải là số dương!", "error");
      return;
    }

    const cleanTranslations = translations.filter(t => t.name.trim() !== "");

    setLoading(true);
    try {
      const result = await updateCurrency(currency.id, {
        ...currency,
        code: code.trim().toUpperCase(),
        symbol: symbol.trim() || code.trim().toUpperCase(),
        rateToVnd: Number(rateToVnd),
        active,
        translations: cleanTranslations,
      });
      onSaveSuccess(result);
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi cập nhật", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Xóa loại tiền tệ này?")) return;
    try {
      await deleteCurrency(currency.id);
      onDeleteSuccess(currency.id);
    } catch {
      showToast("Xóa thất bại", "error");
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  {isEditMode ? "Chỉnh sửa" : "Chi tiết"} — {currency.code}
                </h2>
                {!isEditMode && (
                  <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 cursor-pointer border-none bg-transparent"
                    title="Xóa loại tiền tệ"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </ModalHeader>
            <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
              <div className="grid grid-cols-2 gap-3">
                <TextField>
                  <Label className="text-xs font-bold">Mã tiền tệ</Label>
                  {isEditMode ? (
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="font-mono border-1 border-separator"
                    />
                  ) : (
                    <div className="h-10 px-3 flex items-center font-mono font-bold text-sm bg-slate-50 dark:bg-[var(--bg-card)] rounded-xl border border-slate-200 dark:border-slate-800">
                      {code}
                    </div>
                  )}
                </TextField>
                <TextField>
                  <Label className="text-xs font-bold">Ký hiệu</Label>
                  {isEditMode ? (
                    <Input
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      className="border-1 border-separator"
                    />
                  ) : (
                    <div className="h-10 px-3 flex items-center text-lg bg-slate-50 dark:bg-[var(--bg-card)] rounded-xl border border-slate-200 dark:border-slate-800">
                      {symbol}
                    </div>
                  )}
                </TextField>
              </div>

              <TextField>
                <Label className="text-xs font-bold">1 Đơn vị = VND</Label>
                {isEditMode ? (
                  <Input
                    type="number"
                    value={rateToVnd}
                    onChange={(e) => setRateToVnd(e.target.value)}
                    className="font-mono border-1 border-separator"
                  />
                ) : (
                  <div className="h-10 px-3 flex items-center font-mono font-bold text-sm text-amber-600 bg-slate-50 dark:bg-[var(--bg-card)] rounded-xl border border-slate-200 dark:border-slate-800">
                    {Number(rateToVnd).toLocaleString("vi-VN")} ₫
                  </div>
                )}
              </TextField>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold">Hoạt động</Label>
                {isEditMode ? (
                  <Switch isSelected={active} onChange={() => setActive(!active)} size="sm" />
                ) : (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    active ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" : "text-slate-400 bg-slate-100 dark:bg-[var(--bg-elevated)]"
                  }`}>
                    {active ? "Hoạt động" : "Tắt"}
                  </span>
                )}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <Label className="text-xs font-bold mb-2 block">Tên theo ngôn ngữ</Label>
                <div className="flex gap-1 mb-3">
                  {LOCALES.map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setActiveFormLocale(loc)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold border-none cursor-pointer transition-all ${
                        activeFormLocale === loc
                          ? "bg-accent text-accent-foreground"
                          : "bg-slate-100 dark:bg-[var(--bg-elevated)] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {LOCALE_FLAGS[loc]} {loc.toUpperCase()}
                    </button>
                  ))}
                </div>
                <TextField>
                  <Label className="text-xs font-bold">
                    Tên ({activeFormLocale.toUpperCase()})
                  </Label>
                  {isEditMode ? (
                    <Input
                      value={translations.find(t => t.locale === activeFormLocale)?.name || ""}
                      onChange={(e) => handleTranslationNameChange(e.target.value)}
                    />
                  ) : (
                    <div className="h-10 px-3 flex items-center text-sm bg-slate-50 dark:bg-[var(--bg-card)] rounded-xl border border-slate-200 dark:border-slate-800">
                      {translations.find(t => t.locale === activeFormLocale)?.name || "—"}
                    </div>
                  )}
                </TextField>
              </div>
            </ModalBody>
            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              {isEditMode ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditMode(false)}
                    className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    isDisabled={loading}
                    className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                  >
                    {loading ? (
                      <RefreshCw size={15} className="animate-spin mr-1.5" />
                    ) : (
                      <Save size={15} className="mr-1.5" />
                    )}
                    Lưu
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Đóng
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsEditMode(true)}
                    className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
                  >
                    <Edit3 size={15} className="mr-1.5" />
                    Chỉnh sửa
                  </Button>
                </>
              )}
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
